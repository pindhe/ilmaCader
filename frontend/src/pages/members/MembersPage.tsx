import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createMember,
  createRelationship,
  deleteMember,
  listMembers,
  listRelationships,
  updateMember,
} from '@/api/members'
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
import { useAuthStore } from '@/stores/authStore'
import type { FamilyMember, Relationship } from '@/types'

const FAMILY_ROLES = [
  'son',
  'daughter',
  'father',
  'mother',
  'grandfather',
  'grandmother',
  'uncle',
  'aunt',
  'cousin',
  'guardian',
  'other',
]

type MemberForm = {
  full_name: string
  email: string
  phone: string
  password: string
  access_role: 'admin' | 'member'
  family_role: string
  gender: string
  date_of_birth: string
  occupation: string
  education: string
  city: string
  country: string
  blood_type: string
  emergency_contact: string
  biography: string
  father_id: string
  mother_id: string
}

const emptyForm = (): MemberForm => ({
  full_name: '',
  email: '',
  phone: '',
  password: '',
  access_role: 'member',
  family_role: 'son',
  gender: '',
  date_of_birth: '',
  occupation: '',
  education: '',
  city: '',
  country: '',
  blood_type: '',
  emergency_contact: '',
  biography: '',
  father_id: 'none',
  mother_id: 'none',
})

function isFatherCandidate(m: FamilyMember) {
  const role = (m.family_role || '').toLowerCase()
  return role === 'father' || role === 'grandfather' || role === 'uncle' || m.gender === 'male'
}

function isMotherCandidate(m: FamilyMember) {
  const role = (m.family_role || '').toLowerCase()
  return role === 'mother' || role === 'grandmother' || role === 'aunt' || m.gender === 'female'
}

function parentsOf(
  memberId: string,
  relationships: Relationship[],
  membersById: Map<string, FamilyMember>,
) {
  let father: FamilyMember | undefined
  let mother: FamilyMember | undefined

  for (const rel of relationships) {
    if (rel.relation_type !== 'child' || rel.to_member !== memberId) continue
    const parent = membersById.get(rel.from_member)
    if (!parent) continue
    const role = (parent.family_role || '').toLowerCase()
    if (!father && (role === 'father' || role === 'grandfather' || parent.gender === 'male')) {
      father = parent
    } else if (
      !mother &&
      (role === 'mother' || role === 'grandmother' || parent.gender === 'female')
    ) {
      mother = parent
    } else if (!father) {
      father = parent
    } else if (!mother) {
      mother = parent
    }
  }

  return { father, mother }
}

function formFromMember(
  member: FamilyMember,
  fatherId?: string,
  motherId?: string,
): MemberForm {
  return {
    full_name: member.full_name || '',
    email: member.email || '',
    phone: member.phone || '',
    password: '',
    access_role: 'member',
    family_role: member.family_role || 'other',
    gender: member.gender || '',
    date_of_birth: member.date_of_birth || '',
    occupation: member.occupation || '',
    education: member.education || '',
    city: member.city || '',
    country: member.country || '',
    blood_type: member.blood_type || '',
    emergency_contact: member.emergency_contact || '',
    biography: member.biography || '',
    father_id: fatherId || 'none',
    mother_id: motherId || 'none',
  }
}

export function MembersPage() {
  const familyId = useFamilyId()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin' || user?.is_superuser

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FamilyMember | null>(null)
  const [form, setForm] = useState<MemberForm>(emptyForm())
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    if (searchParams.get('create') === '1' && isAdmin) {
      setEditing(null)
      setForm(emptyForm())
      setOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, isAdmin, setSearchParams])

  const query = useQuery({
    queryKey: ['members', familyId],
    queryFn: () => listMembers(familyId!),
    enabled: Boolean(familyId),
  })

  const relQuery = useQuery({
    queryKey: ['relationships', familyId],
    queryFn: () => listRelationships(familyId!),
    enabled: Boolean(familyId),
  })

  const membersById = useMemo(() => {
    const map = new Map<string, FamilyMember>()
    for (const m of query.data || []) map.set(m.id, m)
    return map
  }, [query.data])

  const fathers = useMemo(() => {
    const all = query.data || []
    const preferred = all.filter(isFatherCandidate)
    return preferred.length > 0 ? preferred : all
  }, [query.data])

  const mothers = useMemo(() => {
    const all = query.data || []
    const preferred = all.filter(isMotherCandidate)
    return preferred.length > 0 ? preferred : all
  }, [query.data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (query.data || []).filter((m) => {
      if (roleFilter !== 'all' && (m.family_role || '') !== roleFilter) return false
      if (!q) return true
      return (
        m.full_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q) ||
        m.family_role?.toLowerCase().includes(q)
      )
    })
  }, [query.data, search, roleFilter])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setOpen(true)
  }

  function openEdit(member: FamilyMember) {
    const { father, mother } = parentsOf(
      member.id,
      relQuery.data || [],
      membersById,
    )
    setEditing(member)
    setForm(formFromMember(member, father?.id, mother?.id))
    setOpen(true)
  }

  function closeDialog() {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm())
  }

  async function linkParents(memberId: string) {
    const links: Promise<unknown>[] = []
    const existing = (relQuery.data || []).filter(
      (r) => r.relation_type === 'child' && r.to_member === memberId,
    )
    const existingFrom = new Set(existing.map((r) => r.from_member))

    if (form.father_id !== 'none' && !existingFrom.has(form.father_id)) {
      links.push(
        createRelationship({
          family: familyId!,
          from_member: form.father_id,
          to_member: memberId,
          relation_type: 'child',
          notes: 'Father → child',
        }),
      )
    }
    if (form.mother_id !== 'none' && !existingFrom.has(form.mother_id)) {
      links.push(
        createRelationship({
          family: familyId!,
          from_member: form.mother_id,
          to_member: memberId,
          relation_type: 'child',
          notes: 'Mother → child',
        }),
      )
    }
    if (links.length) await Promise.all(links)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        family_role: form.family_role,
        gender: form.gender || undefined,
        date_of_birth: form.date_of_birth || null,
        occupation: form.occupation,
        education: form.education,
        city: form.city,
        country: form.country,
        blood_type: form.blood_type,
        emergency_contact: form.emergency_contact,
        biography: form.biography,
      }

      if (editing) {
        const member = await updateMember(editing.id, payload)
        await linkParents(member.id)
        return member
      }

      if (!form.email || !form.password) {
        throw new Error('Email and password are required for new members')
      }

      const member = await createMember({
        family: familyId!,
        ...payload,
        password: form.password,
        access_role: form.access_role,
        create_login: true,
      })
      await linkParents(member.id)
      return member
    },
    onSuccess: () => {
      toast.success(editing ? 'Member updated' : 'Member created')
      closeDialog()
      queryClient.invalidateQueries({ queryKey: ['members', familyId] })
      queryClient.invalidateQueries({ queryKey: ['relationships', familyId] })
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, editing ? 'Could not update' : 'Could not create')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => {
      toast.success('Member removed')
      queryClient.invalidateQueries({ queryKey: ['members', familyId] })
      queryClient.invalidateQueries({ queryKey: ['relationships', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not delete member')),
  })

  if (!familyId) {
    return (
      <EmptyState title="No family selected" description="Select a family to manage members." />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Create, update, and delete family members — link father and mother"
        actions={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Create member
            </Button>
          ) : null
        }
      />

      {(query.data?.length ?? 0) > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {FAMILY_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No members yet"
          description={
            isAdmin
              ? 'Create the first member, or add parents first then link them here.'
              : 'Ask an admin to add family members.'
          }
          action={
            isAdmin ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Create member
              </Button>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try another search or role filter."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setRoleFilter('all')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((member) => {
            const { father, mother } = parentsOf(
              member.id,
              relQuery.data || [],
              membersById,
            )
            return (
              <Card key={member.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/app/members/${member.id}`}
                        className="text-lg font-semibold hover:text-primary"
                      >
                        {member.full_name}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {member.occupation || 'No occupation'}
                        {member.date_of_birth
                          ? ` · ${formatDate(member.date_of_birth)}`
                          : ''}
                      </p>
                    </div>
                    <Badge variant="muted" className="capitalize shrink-0">
                      {member.family_role || 'member'}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{member.email || 'No email'}</p>
                    <p>{member.phone || 'No phone'}</p>
                    <p>
                      Father: <span className="text-foreground">{father?.full_name || '—'}</span>
                    </p>
                    <p>
                      Mother: <span className="text-foreground">{mother?.full_name || '—'}</span>
                    </p>
                  </div>

                  {isAdmin ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/app/members/${member.id}`}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(member)}>
                        <Pencil className="h-3.5 w-3.5" /> Update
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Remove “${member.full_name}”?`)) {
                            deleteMutation.mutate(member.id)
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeDialog()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Update member' : 'Create member'}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              saveMutation.mutate()
            }}
          >
            <section className="space-y-3">
              <p className="text-sm font-semibold">Login & contact</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Full name</Label>
                  <Input
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email {editing ? '' : '(login)'}</Label>
                  <Input
                    type="email"
                    required={!editing}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                {!editing ? (
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
                ) : (
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                )}
                {!editing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : null}
              </div>
            </section>

            <section className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-semibold">Personal information</p>
              <div className="grid gap-3 sm:grid-cols-2">
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
                  <Label>Gender</Label>
                  <Select
                    value={form.gender || undefined}
                    onValueChange={(v) => setForm({ ...form, gender: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label>Blood type</Label>
                  <Input
                    value={form.blood_type}
                    onChange={(e) => setForm({ ...form, blood_type: e.target.value })}
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
                <div className="space-y-2 sm:col-span-2">
                  <Label>Emergency contact</Label>
                  <Input
                    value={form.emergency_contact}
                    onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Biography / notes</Label>
                  <Textarea
                    rows={3}
                    value={form.biography}
                    onChange={(e) => setForm({ ...form, biography: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-semibold">Parents</p>
              <p className="text-xs text-muted-foreground">
                Select father and mother. Create them under Parents if missing.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Father</Label>
                  <Select
                    value={form.father_id}
                    onValueChange={(v) => setForm({ ...form, father_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select father" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No father selected</SelectItem>
                      {fathers
                        .filter((m) => m.id !== editing?.id)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.full_name}
                            {m.family_role ? ` (${m.family_role})` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mother</Label>
                  <Select
                    value={form.mother_id}
                    onValueChange={(v) => setForm({ ...form, mother_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mother" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No mother selected</SelectItem>
                      {mothers
                        .filter((m) => m.id !== editing?.id)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.full_name}
                            {m.family_role ? ` (${m.family_role})` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? 'Saving…'
                  : editing
                    ? 'Save changes'
                    : 'Create member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
