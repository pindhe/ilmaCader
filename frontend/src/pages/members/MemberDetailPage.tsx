import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteMember, getMember, updateMember } from '@/api/members'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState, LoadingState } from '@/components/shared/StateBlocks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatDate, getErrorMessage } from '@/lib/utils'

export function MemberDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const query = useQuery({
    queryKey: ['member', id],
    queryFn: () => getMember(id),
    enabled: Boolean(id),
  })

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    occupation: '',
    biography: '',
    city: '',
    country: '',
  })

  const updateMutation = useMutation({
    mutationFn: () => updateMember(id, form),
    onSuccess: () => {
      toast.success('Member updated')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['member', id] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteMember(id),
    onSuccess: () => {
      toast.success('Member removed')
      navigate('/app/members')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (query.isLoading) return <LoadingState />
  if (query.isError || !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
  }

  const member = query.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={member.full_name}
        description={member.family_role || 'Family member'}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/app/members">Back</Link>
            </Button>
            <Dialog
              open={open}
              onOpenChange={(next) => {
                setOpen(next)
                if (next) {
                  setForm({
                    full_name: member.full_name || '',
                    email: member.email || '',
                    phone: member.phone || '',
                    occupation: member.occupation || '',
                    biography: member.biography || '',
                    city: member.city || '',
                    country: member.country || '',
                  })
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>Edit profile</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit member</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    updateMutation.mutate()
                  }}
                >
                  <div className="space-y-2">
                    <Label>Full name</Label>
                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Occupation</Label>
                    <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Biography</Label>
                    <Textarea value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={updateMutation.isPending}>Save changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Remove this member?')) deleteMutation.mutate()
              }}
            >
              Remove
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Email:</span> {member.email || '—'}</p>
            <p><span className="text-muted-foreground">Phone:</span> {member.phone || '—'}</p>
            <p><span className="text-muted-foreground">City:</span> {member.city || '—'}</p>
            <p><span className="text-muted-foreground">Country:</span> {member.country || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Gender:</span> {member.gender || '—'}</p>
            <p><span className="text-muted-foreground">Date of birth:</span> {formatDate(member.date_of_birth)}</p>
            <p><span className="text-muted-foreground">Age:</span> {member.age ?? '—'}</p>
            <p><span className="text-muted-foreground">Marital status:</span> {member.marital_status || '—'}</p>
            <p><span className="text-muted-foreground">Blood type:</span> {member.blood_type || '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Biography</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{member.biography || 'No biography added yet.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
