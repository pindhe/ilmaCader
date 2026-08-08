import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { createDocument, listDocuments } from '@/api/documents'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFamilyId } from '@/hooks/useFamilyId'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { formatDate, getErrorMessage } from '@/lib/utils'

export function DocumentsPage() {
  const familyId = useFamilyId()
  const isAdmin = useIsAdmin()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('other')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const query = useQuery({
    queryKey: ['documents', familyId],
    queryFn: () => listDocuments(familyId!),
    enabled: Boolean(familyId),
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('family', familyId!)
      formData.append('title', title)
      formData.append('category', category)
      formData.append('notes', notes)
      if (file) formData.append('file', file)
      return createDocument(formData)
    },
    onSuccess: () => {
      toast.success('Document uploaded')
      setOpen(false)
      setTitle('')
      setNotes('')
      setFile(null)
      queryClient.invalidateQueries({ queryKey: ['documents', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (!familyId) return <EmptyState title="No family selected" />

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Secure vault for certificates, IDs, and family files"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Upload className="h-4 w-4" /> Upload</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  mutation.mutate()
                }}
              >
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>File</Label>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Uploading…' : 'Upload'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <>
          <EmptyState
            title="Documents unavailable"
            description="The documents API is not ready yet. Try uploading once the endpoint is live."
            action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Upload</Button>}
          />
          <div className="mt-4">
            <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
          </div>
        </>
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="No documents yet" description="Upload IDs, certificates, and shared files." action={<Button onClick={() => setOpen(true)}>Upload</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data?.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{doc.title}</h3>
                  <Badge variant="outline">{doc.status || 'valid'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{doc.category || 'other'}</p>
                <p className="text-xs text-muted-foreground">Expires: {formatDate(doc.expiration_date)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
