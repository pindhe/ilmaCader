import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { createDocument, deleteDocument, listDocuments, updateDocument } from '@/api/documents'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/StateBlocks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFamilyId } from '@/hooks/useFamilyId'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { formatDate, getErrorMessage } from '@/lib/utils'
import type { DocumentItem } from '@/types'

const CATEGORIES = [
  { value: 'id', label: 'ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'birth_certificate', label: 'Birth certificate' },
  { value: 'marriage_certificate', label: 'Marriage certificate' },
  { value: 'education', label: 'Education' },
  { value: 'medical', label: 'Medical' },
  { value: 'financial', label: 'Financial' },
  { value: 'legal', label: 'Legal' },
  { value: 'property', label: 'Property' },
  { value: 'other', label: 'Other' },
]

type FormState = {
  title: string
  category: string
  notes: string
  expiration_date: string
  file: File | null
}

const emptyForm = (): FormState => ({
  title: '',
  category: 'other',
  notes: '',
  expiration_date: '',
  file: null,
})

export function DocumentsPage() {
  const familyId = useFamilyId()
  const isAdmin = useIsAdmin()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DocumentItem | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())

  const query = useQuery({
    queryKey: ['documents', familyId],
    queryFn: () => listDocuments(familyId!),
    enabled: Boolean(familyId),
    retry: false,
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setOpen(true)
  }

  function openEdit(doc: DocumentItem) {
    setEditing(doc)
    setForm({
      title: doc.title || '',
      category: doc.category || 'other',
      notes: doc.notes || '',
      expiration_date: doc.expiration_date || '',
      file: null,
    })
    setOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('family', familyId!)
      formData.append('title', form.title)
      formData.append('category', form.category)
      formData.append('notes', form.notes)
      if (form.expiration_date) formData.append('expiration_date', form.expiration_date)
      if (form.file) formData.append('file', form.file)

      if (editing) {
        return updateDocument(editing.id, formData)
      }
      if (!form.file) throw new Error('File is required for new documents')
      return createDocument(formData)
    },
    onSuccess: () => {
      toast.success(editing ? 'Document updated' : 'Document uploaded')
      setOpen(false)
      setEditing(null)
      setForm(emptyForm())
      queryClient.invalidateQueries({ queryKey: ['documents', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id, familyId!),
    onSuccess: () => {
      toast.success('Document removed')
      queryClient.invalidateQueries({ queryKey: ['documents', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (!familyId) return <EmptyState title="No family selected" />

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? 'Documents' : 'My Documents'}
        description={
          isAdmin
            ? 'All family documents (full admin view)'
            : 'Documents from My Info and uploads here — add or update anytime'
        }
        actions={
          <Button onClick={openCreate}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
        }
      />

      {!isAdmin ? (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Files you add in{' '}
          <Link to="/app/my-info" className="font-medium text-primary underline-offset-2 hover:underline">
            My Info → Documents
          </Link>{' '}
          also appear here. You can upload more or update existing ones below.
        </p>
      ) : null}

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <>
          <EmptyState
            title="Documents unavailable"
            description="Could not load documents. Try again or upload a new file."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Upload
              </Button>
            }
          />
          <div className="mt-4">
            <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
          </div>
        </>
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No documents yet"
          description={
            isAdmin
              ? 'No documents uploaded for this family.'
              : 'Upload from here or from My Info (step 4).'
          }
          action={<Button onClick={openCreate}>Upload document</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data?.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{doc.title}</h3>
                  <Badge variant="outline">{doc.status || 'valid'}</Badge>
                </div>
                <p className="text-sm capitalize text-muted-foreground">
                  {(doc.category || 'other').replaceAll('_', ' ')}
                </p>
                {isAdmin && doc.member_name ? (
                  <p className="text-xs text-muted-foreground">Member: {doc.member_name}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Added: {doc.created_at ? formatDate(doc.created_at) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expires: {doc.expiration_date ? formatDate(doc.expiration_date) : '—'}
                </p>
                {doc.notes ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{doc.notes}</p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  {doc.file_url || doc.file ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.file_url || doc.file} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </a>
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" onClick={() => openEdit(doc)}>
                    <Pencil className="h-3.5 w-3.5" /> Update
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Remove “${doc.title}”?`)) {
                        deleteMutation.mutate(doc.id)
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setEditing(null)
            setForm(emptyForm())
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Update document' : 'Upload document'}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.title.trim()) {
                toast.error('Title is required')
                return
              }
              if (!editing && !form.file) {
                toast.error('Please choose a file')
                return
              }
              saveMutation.mutate()
            }}
          >
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{editing ? 'Replace file (optional)' : 'File'}</Label>
              <Input
                type="file"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
              />
              {editing && (editing.file_url || editing.file) ? (
                <a
                  href={editing.file_url || editing.file}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Current file
                </a>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Expiration date</Label>
              <Input
                type="date"
                value={form.expiration_date}
                onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? 'Saving…'
                  : editing
                    ? 'Save changes'
                    : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
