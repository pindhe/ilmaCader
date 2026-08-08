import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Landmark, Receipt, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { getMyMemberProfile, updateMyMemberProfile } from '@/api/members'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/StateBlocks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useFamily, useFamilyId } from '@/hooks/useFamilyId'
import { formatDate, getErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function MemberHomePage() {
  const familyId = useFamilyId()
  const family = useFamily()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['my-member-profile', familyId],
    queryFn: () => getMyMemberProfile(familyId),
    enabled: Boolean(familyId),
  })

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    occupation: '',
    education: '',
    city: '',
    country: '',
    gender: '',
    marital_status: '',
    blood_type: '',
    emergency_contact: '',
    biography: '',
    date_of_birth: '',
  })

  const profile = profileQuery.data

  function startEdit() {
    if (!profile) return
    setForm({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      email: profile.email || '',
      occupation: profile.occupation || '',
      education: profile.education || '',
      city: profile.city || '',
      country: profile.country || '',
      gender: profile.gender || '',
      marital_status: profile.marital_status || '',
      blood_type: profile.blood_type || '',
      emergency_contact: profile.emergency_contact || '',
      biography: profile.biography || '',
      date_of_birth: profile.date_of_birth || '',
    })
    setEditing(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => updateMyMemberProfile(form, familyId),
    onSuccess: () => {
      toast.success('Your information was updated')
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ['my-member-profile', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not update profile')),
  })

  if (!familyId) {
    return (
      <EmptyState
        title="No family linked"
        description="Ask an admin to add you as a family member."
      />
    )
  }

  if (profileQuery.isLoading) {
    return <LoadingState label="Loading your information…" />
  }

  if (profileQuery.isError || !profile) {
    return (
      <ErrorState
        message={getErrorMessage(profileQuery.error, 'Your member profile was not found.')}
        onRetry={() => profileQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.full_name?.split(' ')[0] || 'Member'}`}
        description={`${family?.name || 'Family'} · Enter your data · Admin can view all`}
        actions={
          editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </>
          ) : (
            <Button onClick={startEdit}>Edit my info</Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Enter income', to: '/app/finances/income', icon: TrendingUp },
          { label: 'Enter expenses', to: '/app/finances/expenses', icon: Receipt },
          { label: 'My contributions', to: '/app/finances/contributions', icon: Landmark },
          { label: 'My documents', to: '/app/documents', icon: FileText },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to}>
              <Card className="transition hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My information</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                saveMutation.mutate()
              }}
            >
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
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
              <div className="space-y-2">
                <Label>Date of birth</Label>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
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
              <div className="space-y-2">
                <Label>Blood type</Label>
                <Input
                  value={form.blood_type}
                  onChange={(e) => setForm({ ...form, blood_type: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Emergency contact</Label>
                <Input
                  value={form.emergency_contact}
                  onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Biography</Label>
                <Textarea
                  value={form.biography}
                  onChange={(e) => setForm({ ...form, biography: e.target.value })}
                  rows={4}
                />
              </div>
            </form>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ['Full name', profile.full_name],
                ['Family role', profile.family_role],
                ['Email', profile.email],
                ['Phone', profile.phone],
                ['Date of birth', profile.date_of_birth ? formatDate(profile.date_of_birth) : '—'],
                ['Age', profile.age != null ? String(profile.age) : '—'],
                ['Gender', profile.gender || '—'],
                ['Occupation', profile.occupation || '—'],
                ['Education', profile.education || '—'],
                ['City', profile.city || '—'],
                ['Country', profile.country || '—'],
                ['Blood type', profile.blood_type || '—'],
                ['Emergency contact', profile.emergency_contact || '—'],
                ['Joined', profile.joined_date ? formatDate(profile.joined_date) : '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border/70 bg-muted/30 p-4">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium capitalize">{value || '—'}</dd>
                </div>
              ))}
              {profile.biography ? (
                <div className="rounded-xl border border-border/70 bg-muted/30 p-4 sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Biography</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm">{profile.biography}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
