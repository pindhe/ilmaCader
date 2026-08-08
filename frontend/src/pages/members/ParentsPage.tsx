import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createMember, deleteMember, listMembers, updateMember } from '@/api/members'
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
import { formatDate, getErrorMessage } from '@/lib/utils'
import type { FamilyMember } from '@/types'

const PARENT_ROLES = ['father', 'mother', 'grandfather', 'grandmother'] as const

type ParentForm = {
  full_name: string
  email: string
  phone: string
  family_role: string
  gender: string
  date_of_birth: string
  occupation: string
  city: string
  country: string
  biography: string
  password: string
}

const emptyForm = (): ParentForm => ({
  full_name: '',
  email: '',
  phone: '',
  family_role: 'father',
  gender: 'male',
  date_of_birth: '',
  occupation: '',
  city: '',
  country: '',
  biography: '',
  password: '',
})

function roleToGender(role: string) {
  return role === 'mother' || role === 'grandmother' ? 'female' : 'male'
}

function formFromParent(parent: FamilyMember): ParentForm {
  return {
    full_name: parent.full_name || '',
    email: parent.email || '',
    phone: parent.phone || '',
    family_role: parent.family_role || 'father',
    gender: parent.gender || roleToGender(parent.family_role || 'father'),
    date_of_birth: parent.date_of_birth || '',
    occupation: parent.occupation || '',
    city: parent.city || '',
    country: parent.country || '',
    biography: parent.biography || '',
    password: '',
  }
}

export function ParentsPage() {
  const familyId = useFamilyId()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FamilyMember | null>(null)
  const [form, setForm] = useState<ParentForm>(emptyForm())

  const query = useQuery({
    queryKey: ['members', familyId],
    queryFn: () => listMembers(familyId!),
    enabled: Boolean(familyId),
  })

  const parents = (query.data || []).filter((m) =>
    PARENT_ROLES.includes((m.family_role || '') as (typeof PARENT_ROLES)[number]),
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setOpen(true)
  }

  function openEdit(parent: FamilyMember) {
    setEditing(parent)
    setForm(formFromParent(parent))
    setOpen(true)
  }

  function closeDialog() {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm())
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        family_role: form.family_role,
        gender: form.gender,
        date_of_birth: form.date_of_birth || null,
        occupation: form.occupation,
        city: form.city,
        country: form.country,
        biography: form.biography,
      }

      if (editing) {
        return updateMember(editing.id, payload)
      }

      return createMember({
        family: familyId!,
        ...payload,
        password: form.password,
        access_role: 'member',
        create_login: Boolean(form.email && form.password),
      })
    },
    onSuccess: () => {
      toast.success(editing ? 'Parent updated' : 'Parent created')
      closeDialog()
      queryClient.invalidateQueries({ queryKey: ['members', familyId] })
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, editing ? 'Could not update' : 'Could not create')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => {
      toast.success('Parent removed')
      queryClient.invalidateQueries({ queryKey: ['members', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not delete parent')),
  })

  if (!familyId) {
    return <EmptyState title="No family selected" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parents"
        description="Create, update, and remove father, mother, and grandparents"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create parent
          </Button>
        }
      />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : parents.length === 0 ? (
        <EmptyState
          title="No parents yet"
          description="Create father or mother profiles for this family."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Create parent
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {parents.map((parent) => (
            <Card key={parent.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/app/members/${parent.id}`}
                      className="font-semibold hover:text-primary"
                    >
                      {parent.full_name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground capitalize">
                      {parent.gender || '—'}
                      {parent.date_of_birth
                        ? ` · ${formatDate(parent.date_of_birth)}`
                        : ''}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {parent.family_role}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{parent.email || 'No login email'}</p>
                  <p>{parent.phone || 'No phone'}</p>
                  <p>
                    {[parent.city, parent.country].filter(Boolean).join(', ') || 'No location'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => openEdit(parent)}>
                    <Pencil className="h-3.5 w-3.5" /> Update
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (
                        confirm(
                          `Remove “${parent.full_name}”? This cannot be undone easily.`,
                        )
                      ) {
                        deleteMutation.mutate(parent.id)
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
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
          if (!next) closeDialog()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Update parent' : 'Create parent'}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.full_name.trim()) {
                toast.error('Full name is required')
                return
              }
              if (!editing && form.email && !form.password) {
                toast.error('Password is required when email is set')
                return
              }
              saveMutation.mutate()
            }}
          >
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Parent role</Label>
                <Select
                  value={form.family_role}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      family_role: v,
                      gender: roleToGender(v),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="grandfather">Grandfather</SelectItem>
                    <SelectItem value="grandmother">Grandmother</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={form.gender || undefined}
                  onValueChange={(v) => setForm({ ...form, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date of birth</Label>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email {editing ? '' : '(login)'}</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              {!editing ? (
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Occupation</Label>
                  <Input
                    value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                  />
                </div>
              )}
            </div>

            {!editing ? (
              <div className="space-y-2">
                <Label>Occupation</Label>
                <Input
                  value={form.occupation}
                  onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                />
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes / biography</Label>
              <Textarea
                rows={3}
                value={form.biography}
                onChange={(e) => setForm({ ...form, biography: e.target.value })}
              />
            </div>

            {!editing ? (
              <p className="text-xs text-muted-foreground">
                Optional: email + password creates a login so they can use My Info.
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? 'Saving…'
                  : editing
                    ? 'Save changes'
                    : 'Create parent'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
