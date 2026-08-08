import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getFamilyProfile, updateFamily } from '@/api/families'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/StateBlocks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFamilyId } from '@/hooks/useFamilyId'
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function FamilyProfilePage() {
  const familyId = useFamilyId()
  const setFamily = useAuthStore((s) => s.setFamily)
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    motto: '',
    description: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    currency: 'USD',
  })

  const query = useQuery({
    queryKey: ['family-profile', familyId],
    queryFn: () => getFamilyProfile(familyId!),
    enabled: Boolean(familyId),
  })

  useEffect(() => {
    if (query.data) {
      setForm({
        name: query.data.name || '',
        motto: query.data.motto || '',
        description: query.data.description || '',
        email: query.data.email || '',
        phone: query.data.phone || '',
        country: query.data.country || '',
        city: query.data.city || '',
        address: query.data.address || '',
        currency: query.data.currency || 'USD',
      })
    }
  }, [query.data])

  const mutation = useMutation({
    mutationFn: () => updateFamily(familyId!, form),
    onSuccess: (updated) => {
      toast.success('Family profile updated')
      setFamily(updated)
      queryClient.invalidateQueries({ queryKey: ['family-profile', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (!familyId) return <EmptyState title="No family selected" />
  if (query.isLoading) return <LoadingState />
  if (query.isError || !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
  }

  const family = query.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family Profile"
        description={`${family.family_id} · Established ${formatDate(family.date_established)}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Members</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{family.member_count ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{formatCurrency(family.total_assets, family.currency)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Savings</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{formatCurrency(family.total_savings, family.currency)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Edit family details</CardTitle></CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              mutation.mutate()
            }}
          >
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Motto</Label>
              <Input value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
            <div className="flex items-end md:col-span-2">
              <Button type="submit" disabled={mutation.isPending}>Save family profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
