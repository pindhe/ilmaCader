import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { createDocument, listDocuments } from '@/api/documents'
import { getMyMemberProfile, updateMyMemberProfile } from '@/api/members'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/StateBlocks'
import { Badge } from '@/components/ui/badge'
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
import { cn, formatDate, getErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { MemberChildInfo, MemberProfileSteps } from '@/types'

type StepKey =
  | 'personal'
  | 'education'
  | 'health'
  | 'documents'
  | 'marriage'
  | 'children'

type PersonalForm = {
  full_name: string
  phone: string
  email: string
  occupation: string
  city: string
  country: string
  gender: string
  date_of_birth: string
  biography: string
}

type EducationForm = NonNullable<MemberProfileSteps['education']>
type HealthExtra = NonNullable<MemberProfileSteps['health']>
type MarriageForm = NonNullable<MemberProfileSteps['marriage']>
type ChildrenForm = NonNullable<MemberProfileSteps['children']>

const emptyChild = (): MemberChildInfo => ({
  name: '',
  date_of_birth: '',
  gender: '',
})

/** No → auto Done at 6. Yes → Marriage form then Children (step 6). */
function getIndicatorSteps(hasSpouse: boolean | null) {
  const base = [
    { key: 'personal' as StepKey, label: 'Personal', id: 1 },
    { key: 'education' as StepKey, label: 'Education', id: 2 },
    { key: 'health' as StepKey, label: 'Health', id: 3 },
    { key: 'documents' as StepKey, label: 'Documents', id: 4 },
    { key: 'marriage' as StepKey, label: 'Marriage', id: 5 },
  ]
  if (hasSpouse === true) {
    return [...base, { key: 'children' as StepKey, label: 'Children', id: 6 }]
  }
  return [...base, { key: 'marriage' as StepKey, label: 'Done', id: 6 }]
}

export function MemberHomePage() {
  const familyId = useFamilyId()
  const family = useFamily()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [stepKey, setStepKey] = useState<StepKey>('personal')
  const [done, setDone] = useState(false)

  const [personal, setPersonal] = useState<PersonalForm>({
    full_name: '',
    phone: '',
    email: '',
    occupation: '',
    city: '',
    country: '',
    gender: '',
    date_of_birth: '',
    biography: '',
  })
  const [education, setEducation] = useState<EducationForm>({
    level: '',
    institution: '',
    field_of_study: '',
    graduation_year: '',
    notes: '',
  })
  const [bloodType, setBloodType] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [healthExtra, setHealthExtra] = useState<HealthExtra>({
    allergies: '',
    conditions: '',
    medications: '',
    emergency_phone: '',
  })
  const [marriage, setMarriage] = useState<MarriageForm>({
    has_spouse: null,
    spouse_name: '',
    marriage_date: '',
    marriage_place: '',
    notes: '',
  })
  const [children, setChildren] = useState<ChildrenForm>({
    has_children: null,
    items: [emptyChild()],
  })

  const [docTitle, setDocTitle] = useState('')
  const [docCategory, setDocCategory] = useState('other')
  const [docFile, setDocFile] = useState<File | null>(null)
  const didInitStep = useRef(false)

  const indicatorSteps = getIndicatorSteps(marriage.has_spouse ?? null)
  const totalSteps = 6

  const stepNumber =
    stepKey === 'personal'
      ? 1
      : stepKey === 'education'
        ? 2
        : stepKey === 'health'
          ? 3
          : stepKey === 'documents'
            ? 4
            : stepKey === 'marriage'
              ? 5
              : 6

  const stepLabel =
    stepKey === 'personal'
      ? 'Personal'
      : stepKey === 'education'
        ? 'Education'
        : stepKey === 'health'
          ? 'Health'
          : stepKey === 'documents'
            ? 'Documents'
            : stepKey === 'marriage'
              ? 'Marriage'
              : 'Children'

  const profileQuery = useQuery({
    queryKey: ['my-member-profile', familyId],
    queryFn: () => getMyMemberProfile(familyId),
    enabled: Boolean(familyId),
  })

  const docsQuery = useQuery({
    queryKey: ['documents', familyId],
    queryFn: () => listDocuments(familyId!),
    enabled: Boolean(familyId) && stepKey === 'documents',
  })

  const profile = profileQuery.data

  useEffect(() => {
    if (!profile) return
    const saved = profile.profile_steps || {}
    setPersonal({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      email: profile.email || '',
      occupation: profile.occupation || '',
      city: profile.city || '',
      country: profile.country || '',
      gender: profile.gender || '',
      date_of_birth: profile.date_of_birth || '',
      biography: profile.biography || '',
    })
    setEducation({
      level: saved.education?.level || '',
      institution: saved.education?.institution || '',
      field_of_study: saved.education?.field_of_study || '',
      graduation_year: saved.education?.graduation_year || '',
      notes: saved.education?.notes || profile.education || '',
    })
    setBloodType(profile.blood_type || '')
    setEmergencyContact(profile.emergency_contact || '')
    setHealthExtra({
      allergies: saved.health?.allergies || '',
      conditions: saved.health?.conditions || '',
      medications: saved.health?.medications || '',
      emergency_phone: saved.health?.emergency_phone || '',
    })
    setMarriage({
      has_spouse: saved.marriage?.has_spouse ?? null,
      spouse_name: saved.marriage?.spouse_name || '',
      marriage_date: saved.marriage?.marriage_date || '',
      marriage_place: saved.marriage?.marriage_place || '',
      notes: saved.marriage?.notes || '',
    })
    setChildren({
      has_children: saved.children?.has_children ?? null,
      items:
        saved.children?.items && saved.children.items.length > 0
          ? saved.children.items
          : [emptyChild()],
    })

    if (!didInitStep.current) {
      didInitStep.current = true
      const last = saved.last_completed_step || 0
      const married = saved.marriage?.has_spouse === true
      if (last >= 6) {
        setDone(true)
        setStepKey(married ? 'children' : 'marriage')
      } else if (married && last >= 5) setStepKey('children')
      else if (last >= 4) setStepKey('marriage')
      else if (last >= 3) setStepKey('documents')
      else if (last >= 2) setStepKey('health')
      else if (last >= 1) setStepKey('education')
    }
  }, [profile])

  function buildPayload(
    completedStep: number,
    marriageOverride?: MarriageForm,
    childrenOverride?: ChildrenForm,
  ) {
    const m = marriageOverride || marriage
    const c = childrenOverride || children
    const profile_steps: MemberProfileSteps = {
      education,
      health: healthExtra,
      marriage: { ...m },
      children: {
        has_children: m.has_spouse === true ? c.has_children : false,
        items:
          m.has_spouse === true && c.has_children === true
            ? (c.items || []).filter((item) => item.name.trim())
            : [],
      },
      last_completed_step: completedStep,
    }

    const educationSummary =
      [education.level, education.institution, education.field_of_study]
        .filter(Boolean)
        .join(' · ') ||
      education.notes ||
      ''

    return {
      ...personal,
      education: educationSummary,
      blood_type: bloodType,
      emergency_contact: emergencyContact,
      marital_status:
        m.has_spouse === true
          ? 'married'
          : m.has_spouse === false
            ? 'single'
            : profile?.marital_status || '',
      profile_steps,
    }
  }

  const saveMutation = useMutation({
    mutationFn: ({
      completedStep,
      marriageOverride,
      childrenOverride,
      finish,
    }: {
      completedStep: number
      marriageOverride?: MarriageForm
      childrenOverride?: ChildrenForm
      finish?: boolean
    }) =>
      updateMyMemberProfile(
        buildPayload(completedStep, marriageOverride, childrenOverride),
        familyId,
      ).then((data) => ({ data, finish: Boolean(finish) || completedStep >= 6 })),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['my-member-profile', familyId] })
      if (result.finish) {
        setDone(true)
        toast.success('All steps completed')
      } else {
        toast.success('Saved')
      }
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not save')),
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('family', familyId!)
      formData.append('title', docTitle)
      formData.append('category', docCategory)
      if (docFile) formData.append('file', docFile)
      return createDocument(formData)
    },
    onSuccess: () => {
      toast.success('Document uploaded')
      setDocTitle('')
      setDocFile(null)
      queryClient.invalidateQueries({ queryKey: ['documents', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  async function finishAsSingle(nextMarriage: MarriageForm) {
    const nextChildren: ChildrenForm = { has_children: false, items: [] }
    setChildren(nextChildren)
    try {
      await saveMutation.mutateAsync({
        completedStep: 6,
        marriageOverride: nextMarriage,
        childrenOverride: nextChildren,
        finish: true,
      })
    } catch {
      /* toast handled */
    }
  }

  async function goNext() {
    if (stepKey === 'marriage') {
      if (marriage.has_spouse !== true) {
        toast.error('Please choose Yes to enter marriage info, or No to finish')
        return
      }
      if (!marriage.spouse_name?.trim()) {
        toast.error('Please enter spouse name')
        return
      }
      try {
        await saveMutation.mutateAsync({ completedStep: 5 })
        setStepKey('children')
      } catch {
        /* toast handled */
      }
      return
    }

    if (stepKey === 'children') {
      if (children.has_children === null) {
        toast.error('Please choose Yes or No for children')
        return
      }
      if (
        children.has_children === true &&
        !(children.items || []).some((c) => c.name.trim())
      ) {
        toast.error('Please add at least one child, or choose No')
        return
      }
      try {
        await saveMutation.mutateAsync({ completedStep: 6, finish: true })
      } catch {
        /* toast handled */
      }
      return
    }

    const order: StepKey[] = ['personal', 'education', 'health', 'documents', 'marriage']
    const idx = order.indexOf(stepKey)
    try {
      await saveMutation.mutateAsync({ completedStep: idx + 1 })
      if (idx < order.length - 1) setStepKey(order[idx + 1])
    } catch {
      /* toast handled */
    }
  }

  function goBack() {
    setDone(false)
    if (stepKey === 'children') {
      setStepKey('marriage')
      return
    }
    const order: StepKey[] = ['personal', 'education', 'health', 'documents', 'marriage']
    const idx = order.indexOf(stepKey)
    if (idx > 0) setStepKey(order[idx - 1])
  }

  const isFinish = stepKey === 'children'

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
        title="My Info"
        description={`${user?.full_name || 'Member'} · ${family?.name || 'Family'} · ${totalSteps} steps`}
      />

      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-max items-center gap-2 sm:min-w-0 sm:justify-between">
          {indicatorSteps.map((s, index) => {
            const isDonePill = s.label === 'Done'
            const active = isDonePill ? done : stepKey === s.key && !done
            const completed = done || (!isDonePill && stepNumber > s.id)

            return (
              <li key={`${s.id}-${s.label}`} className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDonePill}
                  onClick={() => {
                    if (isDonePill) return
                    if (s.key === 'children' && marriage.has_spouse !== true) return
                    setDone(false)
                    setStepKey(s.key)
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition',
                    active && 'bg-primary text-primary-foreground shadow-sm',
                    completed && !active && 'bg-primary/15 text-primary',
                    !active && !completed && 'bg-muted text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      active
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : completed
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background',
                    )}
                  >
                    {completed && !active ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {index < indicatorSteps.length - 1 ? (
                  <span className="hidden h-px w-4 bg-border sm:block md:w-8" aria-hidden />
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>

      {done ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Check className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">All steps done</h2>
              <p className="mt-2 text-muted-foreground">
                Completed {totalSteps} steps for {family?.name || 'your family'}.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setDone(false)
                setStepKey('personal')
              }}
            >
              Review / edit again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Step {stepNumber} — {stepLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {stepKey === 'personal' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <Input
                    value={personal.full_name}
                    onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={personal.email}
                    onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={personal.phone}
                    onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                  />
                </Field>
                <Field label="Date of birth">
                  <Input
                    type="date"
                    value={personal.date_of_birth}
                    onChange={(e) => setPersonal({ ...personal, date_of_birth: e.target.value })}
                  />
                </Field>
                <Field label="Gender">
                  <Select
                    value={personal.gender || undefined}
                    onValueChange={(v) => setPersonal({ ...personal, gender: v })}
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
                </Field>
                <Field label="Occupation">
                  <Input
                    value={personal.occupation}
                    onChange={(e) => setPersonal({ ...personal, occupation: e.target.value })}
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={personal.city}
                    onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                  />
                </Field>
                <Field label="Country">
                  <Input
                    value={personal.country}
                    onChange={(e) => setPersonal({ ...personal, country: e.target.value })}
                  />
                </Field>
                <Field label="Biography" className="sm:col-span-2">
                  <Textarea
                    rows={3}
                    value={personal.biography}
                    onChange={(e) => setPersonal({ ...personal, biography: e.target.value })}
                  />
                </Field>
              </div>
            ) : null}

            {stepKey === 'education' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Education level">
                  <Input
                    placeholder="e.g. Bachelor, High school"
                    value={education.level || ''}
                    onChange={(e) => setEducation({ ...education, level: e.target.value })}
                  />
                </Field>
                <Field label="Institution / School">
                  <Input
                    value={education.institution || ''}
                    onChange={(e) => setEducation({ ...education, institution: e.target.value })}
                  />
                </Field>
                <Field label="Field of study">
                  <Input
                    value={education.field_of_study || ''}
                    onChange={(e) => setEducation({ ...education, field_of_study: e.target.value })}
                  />
                </Field>
                <Field label="Graduation year">
                  <Input
                    value={education.graduation_year || ''}
                    onChange={(e) =>
                      setEducation({ ...education, graduation_year: e.target.value })
                    }
                  />
                </Field>
                <Field label="Notes" className="sm:col-span-2">
                  <Textarea
                    rows={3}
                    value={education.notes || ''}
                    onChange={(e) => setEducation({ ...education, notes: e.target.value })}
                  />
                </Field>
              </div>
            ) : null}

            {stepKey === 'health' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Blood type">
                  <Input
                    placeholder="e.g. O+"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                  />
                </Field>
                <Field label="Emergency contact name">
                  <Input
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                  />
                </Field>
                <Field label="Emergency phone">
                  <Input
                    value={healthExtra.emergency_phone || ''}
                    onChange={(e) =>
                      setHealthExtra({ ...healthExtra, emergency_phone: e.target.value })
                    }
                  />
                </Field>
                <Field label="Allergies">
                  <Input
                    value={healthExtra.allergies || ''}
                    onChange={(e) => setHealthExtra({ ...healthExtra, allergies: e.target.value })}
                  />
                </Field>
                <Field label="Medical conditions" className="sm:col-span-2">
                  <Textarea
                    rows={2}
                    value={healthExtra.conditions || ''}
                    onChange={(e) =>
                      setHealthExtra({ ...healthExtra, conditions: e.target.value })
                    }
                  />
                </Field>
                <Field label="Medications" className="sm:col-span-2">
                  <Textarea
                    rows={2}
                    value={healthExtra.medications || ''}
                    onChange={(e) =>
                      setHealthExtra({ ...healthExtra, medications: e.target.value })
                    }
                  />
                </Field>
              </div>
            ) : null}

            {stepKey === 'documents' ? (
              <div className="space-y-6">
                <form
                  className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!docTitle.trim() || !docFile) {
                      toast.error('Title and file are required')
                      return
                    }
                    uploadMutation.mutate()
                  }}
                >
                  <Field label="Document title">
                    <Input
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                    />
                  </Field>
                  <Field label="Category">
                    <Input
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      placeholder="id, education, medical…"
                    />
                  </Field>
                  <Field label="File" className="sm:col-span-2">
                    <Input
                      type="file"
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={uploadMutation.isPending}>
                      <Upload className="h-4 w-4" />
                      {uploadMutation.isPending ? 'Uploading…' : 'Upload document'}
                    </Button>
                  </div>
                </form>

                {docsQuery.isLoading ? (
                  <LoadingState label="Loading documents…" />
                ) : (docsQuery.data?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No documents yet. Upload one above, or continue to the next step.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {docsQuery.data?.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                      >
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.category}
                            {doc.created_at ? ` · ${formatDate(doc.created_at)}` : ''}
                          </p>
                        </div>
                        <Badge variant="muted">{doc.category || 'file'}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {stepKey === 'marriage' ? (
              <div className="space-y-6">
                {marriage.has_spouse !== true ? (
                  <YesNoPrompt
                    question="Are you married / do you have a spouse?"
                    value={marriage.has_spouse}
                    onChange={(has_spouse) => {
                      const next = { ...marriage, has_spouse }
                      setMarriage(next)
                      if (has_spouse === false) {
                        void finishAsSingle(next)
                      }
                    }}
                  />
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                      <p className="text-sm font-medium">Married — enter spouse details</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setMarriage({
                            has_spouse: null,
                            spouse_name: '',
                            marriage_date: '',
                            marriage_place: '',
                            notes: '',
                          })
                        }
                      >
                        Change answer
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Spouse full name">
                        <Input
                          value={marriage.spouse_name || ''}
                          onChange={(e) =>
                            setMarriage({ ...marriage, spouse_name: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Marriage date">
                        <Input
                          type="date"
                          value={marriage.marriage_date || ''}
                          onChange={(e) =>
                            setMarriage({ ...marriage, marriage_date: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Marriage place" className="sm:col-span-2">
                        <Input
                          value={marriage.marriage_place || ''}
                          onChange={(e) =>
                            setMarriage({ ...marriage, marriage_place: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Notes" className="sm:col-span-2">
                        <Textarea
                          rows={2}
                          value={marriage.notes || ''}
                          onChange={(e) =>
                            setMarriage({ ...marriage, notes: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Next step: Children
                    </p>
                  </>
                )}
              </div>
            ) : null}

            {stepKey === 'children' ? (
              <div className="space-y-6">
                <YesNoPrompt
                  question="Do you have children?"
                  value={children.has_children}
                  onChange={(has_children) =>
                    setChildren({
                      ...children,
                      has_children,
                      items:
                        has_children === true
                          ? children.items?.length
                            ? children.items
                            : [emptyChild()]
                          : [],
                    })
                  }
                />

                {children.has_children === true ? (
                  <div className="space-y-4">
                    {(children.items || []).map((child, index) => (
                      <div
                        key={index}
                        className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-3"
                      >
                        <Field label={`Child ${index + 1} name`}>
                          <Input
                            value={child.name}
                            onChange={(e) => {
                              const items = [...(children.items || [])]
                              items[index] = { ...items[index], name: e.target.value }
                              setChildren({ ...children, items })
                            }}
                          />
                        </Field>
                        <Field label="Date of birth">
                          <Input
                            type="date"
                            value={child.date_of_birth || ''}
                            onChange={(e) => {
                              const items = [...(children.items || [])]
                              items[index] = {
                                ...items[index],
                                date_of_birth: e.target.value,
                              }
                              setChildren({ ...children, items })
                            }}
                          />
                        </Field>
                        <Field label="Gender">
                          <div className="flex gap-2">
                            <Select
                              value={child.gender || undefined}
                              onValueChange={(v) => {
                                const items = [...(children.items || [])]
                                items[index] = { ...items[index], gender: v }
                                setChildren({ ...children, items })
                              }}
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
                            {(children.items || []).length > 1 ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const items = (children.items || []).filter(
                                    (_, i) => i !== index,
                                  )
                                  setChildren({ ...children, items })
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        </Field>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setChildren({
                          ...children,
                          items: [...(children.items || []), emptyChild()],
                        })
                      }
                    >
                      <Plus className="h-4 w-4" /> Add another child
                    </Button>
                  </div>
                ) : null}

                {children.has_children === false ? (
                  <p className="text-sm text-muted-foreground">
                    No children details needed. Finish to complete your profile.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={stepKey === 'personal'}
                onClick={goBack}
              >
                Back
              </Button>
              {stepKey === 'marriage' && marriage.has_spouse !== true ? null : (
                <Button type="button" onClick={goNext} disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? 'Saving…'
                    : isFinish
                      ? 'Finish'
                      : stepKey === 'marriage'
                        ? 'Save & continue to Children'
                        : 'Save & continue'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function YesNoPrompt({
  question,
  value,
  onChange,
}: {
  question: string
  value?: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5">
      <p className="text-base font-semibold">{question}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          variant={value === true ? 'default' : 'outline'}
          className="min-w-24"
          onClick={() => onChange(true)}
        >
          Yes
        </Button>
        <Button
          type="button"
          variant={value === false ? 'default' : 'outline'}
          className="min-w-24"
          onClick={() => onChange(false)}
        >
          No
        </Button>
      </div>
    </div>
  )
}
