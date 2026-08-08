import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createMember, listMembers } from '@/api/members'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFamilyId } from '@/hooks/useFamilyId'
import { getErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const FAMILY_ROLES = [
  'father',
  'mother',
  'son',
  'daughter',
  'grandfather',
  'grandmother',
  'uncle',
  'aunt',
  'cousin',
  'guardian',
  'other',
]

const emptyForm = {
  full_name: '',
  email: '',
  phone: '',
  family_role: 'other',
  gender: '',
  occupation: '',
  password: '',
  access_role: 'member' as 'admin' | 'member',
}

export function MembersPage() {
  const familyId = useFamilyId()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin' || user?.is_superuser
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const query = useQuery({
    queryKey: ['members', familyId],
    queryFn: () => listMembers(familyId!),
    enabled: Boolean(familyId),
  })

  const mutation = useMutation({
    mutationFn: () =>
      createMember({
        family: familyId!,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        family_role: form.family_role,
        gender: form.gender,
        occupation: form.occupation,
        password: form.password,
        access_role: form.access_role,
        create_login: true,
      }),
    onSuccess: () => {
      toast.success('Member created with login access')
      setOpen(false)
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['members', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not add member')),
  })

  if (!familyId) {
    return <EmptyState title="No family selected" description="Select a family to manage members." />
  }

  return (
    <div>
      <PageHeader
        title="Family Members"
        description="Directory of everyone in your family workspace"
        actions={
          isAdmin ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" /> Add member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add family member</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    mutation.mutate()
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email (login)</Label>
                      <Input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        required
                        minLength={8}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Access role</Label>
                      <Select
                        value={form.access_role}
                        onValueChange={(v) =>
                          setForm({ ...form, access_role: v as 'admin' | 'member' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Family role</Label>
                      <Select
                        value={form.family_role}
                        onValueChange={(v) => setForm({ ...form, family_role: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FAMILY_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input
                        value={form.occupation}
                        onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? 'Saving…' : 'Save member'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No members yet"
          description={
            isAdmin
              ? 'Add the first person to your family directory.'
              : 'Ask an admin to add family members.'
          }
          action={
            isAdmin ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Add member
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {query.data?.map((member) => (
            <Card key={member.id} className="transition hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/app/members/${member.id}`}
                      className="text-lg font-semibold hover:text-primary"
                    >
                      {member.full_name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {member.occupation || 'No occupation listed'}
                    </p>
                  </div>
                  <Badge variant="muted">{member.family_role || 'member'}</Badge>
                </div>
                <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <p>{member.email || 'No email'}</p>
                  <p>{member.phone || 'No phone'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
