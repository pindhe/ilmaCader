import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteMember, getMember, updateMember } from '@/api/members'
import { listDocuments } from '@/api/documents'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState, LoadingState } from '@/components/shared/StateBlocks'
import { Badge } from '@/components/ui/badge'
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

export function MemberDetailPage() {
  const { id = '' } = useParams()
  const familyId = useFamilyId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const query = useQuery({
    queryKey: ['member', id],
    queryFn: () => getMember(id),
    enabled: Boolean(id),
  })

  const docsQuery = useQuery({
    queryKey: ['documents', familyId, id],
    queryFn: () => listDocuments(familyId!),
    enabled: Boolean(familyId),
  })

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    occupation: '',
    education: '',
    biography: '',
    city: '',
    country: '',
    gender: '',
    date_of_birth: '',
    marital_status: '',
    blood_type: '',
    emergency_contact: '',
    family_role: '',
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
  const steps = member.profile_steps || {}
  const memberDocs = (docsQuery.data || []).filter((d) => d.member === member.id)

  function startEdit() {
    setForm({
      full_name: member.full_name || '',
      email: member.email || '',
      phone: member.phone || '',
      occupation: member.occupation || '',
      education: member.education || '',
      biography: member.biography || '',
      city: member.city || '',
      country: member.country || '',
      gender: member.gender || '',
      date_of_birth: member.date_of_birth || '',
      marital_status: member.marital_status || '',
      blood_type: member.blood_type || '',
      emergency_contact: member.emergency_contact || '',
      family_role: member.family_role || '',
    })
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={member.full_name}
        description={`${member.family_role || 'Member'} · Update all profile data`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/app/members">Back</Link>
            </Button>
            <Dialog
              open={open}
              onOpenChange={(next) => {
                setOpen(next)
                if (next) startEdit()
              }}
            >
              <DialogTrigger asChild>
                <Button>Update member</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Update member</DialogTitle>
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
                    <Input
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Family role</Label>
                      <Input
                        value={form.family_role}
                        onChange={(e) => setForm({ ...form, family_role: e.target.value })}
                        placeholder="father, mother, son…"
                      />
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
                      <Label>Marital status</Label>
                      <Input
                        value={form.marital_status}
                        onChange={(e) => setForm({ ...form, marital_status: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input
                        value={form.occupation}
                        onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Education</Label>
                      <Input
                        value={form.education}
                        onChange={(e) => setForm({ ...form, education: e.target.value })}
                      />
                    </div>
                  </div>
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Blood type</Label>
                      <Input
                        value={form.blood_type}
                        onChange={(e) => setForm({ ...form, blood_type: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency contact</Label>
                      <Input
                        value={form.emergency_contact}
                        onChange={(e) =>
                          setForm({ ...form, emergency_contact: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Biography</Label>
                    <Textarea
                      value={form.biography}
                      onChange={(e) => setForm({ ...form, biography: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
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
            <CardTitle>Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span> {member.email || '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span> {member.phone || '—'}
            </p>
            <p>
              <span className="text-muted-foreground">DOB:</span>{' '}
              {member.date_of_birth ? formatDate(member.date_of_birth) : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Gender:</span> {member.gender || '—'}
            </p>
            <p>
              <span className="text-muted-foreground">City / Country:</span>{' '}
              {[member.city, member.country].filter(Boolean).join(', ') || '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Occupation:</span>{' '}
              {member.occupation || '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Education & health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Education:</span>{' '}
              {member.education || '—'}
            </p>
            {steps.education ? (
              <p className="text-muted-foreground">
                {[
                  steps.education.level,
                  steps.education.institution,
                  steps.education.field_of_study,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">Blood type:</span>{' '}
              {member.blood_type || '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Emergency:</span>{' '}
              {member.emergency_contact || '—'}
            </p>
            {steps.health?.allergies ? (
              <p>
                <span className="text-muted-foreground">Allergies:</span>{' '}
                {steps.health.allergies}
              </p>
            ) : null}
            {steps.health?.conditions ? (
              <p>
                <span className="text-muted-foreground">Conditions:</span>{' '}
                {steps.health.conditions}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marriage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Status:</span>{' '}
              {member.marital_status || '—'}
            </p>
            {steps.marriage?.has_spouse === true ? (
              <>
                <p>
                  <span className="text-muted-foreground">Spouse:</span>{' '}
                  {steps.marriage.spouse_name || '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">Date:</span>{' '}
                  {steps.marriage.marriage_date
                    ? formatDate(steps.marriage.marriage_date)
                    : '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">Place:</span>{' '}
                  {steps.marriage.marriage_place || '—'}
                </p>
              </>
            ) : steps.marriage?.has_spouse === false ? (
              <p className="text-muted-foreground">Not married</p>
            ) : (
              <p className="text-muted-foreground">Not filled in My Info yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Children</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {steps.children?.has_children === true && steps.children.items?.length ? (
              <ul className="space-y-2">
                {steps.children.items.map((child, i) => (
                  <li key={i} className="rounded-lg border border-border px-3 py-2">
                    <p className="font-medium">{child.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[child.gender, child.date_of_birth ? formatDate(child.date_of_birth) : null]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                  </li>
                ))}
              </ul>
            ) : steps.children?.has_children === false ? (
              <p className="text-muted-foreground">No children</p>
            ) : (
              <p className="text-muted-foreground">Not filled in My Info yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {memberDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents for this member yet.</p>
          ) : (
            <ul className="space-y-2">
              {memberDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span>{doc.title}</span>
                  <Badge variant="outline">{doc.category || 'file'}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {member.biography ? (
        <Card>
          <CardHeader>
            <CardTitle>Biography</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {member.biography}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
