import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRelationship, getFamilyTree, listMembers } from '@/api/members'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/StateBlocks'
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

const RELATION_TYPES = ['parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'uncle_aunt', 'niece_nephew', 'cousin', 'guardian', 'other']

export function FamilyTreePage() {
  const familyId = useFamilyId()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    from_member: '',
    to_member: '',
    relation_type: 'parent',
  })

  const treeQuery = useQuery({
    queryKey: ['family-tree', familyId],
    queryFn: () => getFamilyTree(familyId!),
    enabled: Boolean(familyId),
  })

  const membersQuery = useQuery({
    queryKey: ['members', familyId],
    queryFn: () => listMembers(familyId!),
    enabled: Boolean(familyId),
  })

  const mutation = useMutation({
    mutationFn: () =>
      createRelationship({
        family: familyId!,
        ...form,
      }),
    onSuccess: () => {
      toast.success('Relationship added')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['family-tree', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (!familyId) return <EmptyState title="No family selected" />

  if (treeQuery.isLoading) return <LoadingState label="Loading family tree…" />
  if (treeQuery.isError) {
    return <ErrorState message={getErrorMessage(treeQuery.error)} onRetry={() => treeQuery.refetch()} />
  }

  const members = treeQuery.data?.members ?? membersQuery.data ?? []
  const relationships = treeQuery.data?.relationships ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family Tree"
        description="Visualize relationships across your family"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add relationship</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add relationship</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  mutation.mutate()
                }}
              >
                <div className="space-y-2">
                  <Label>From member</Label>
                  <Select value={form.from_member} onValueChange={(v) => setForm({ ...form, from_member: v })}>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To member</Label>
                  <Select value={form.to_member} onValueChange={(v) => setForm({ ...form, to_member: v })}>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Relation type</Label>
                  <Select value={form.relation_type} onValueChange={(v) => setForm({ ...form, relation_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RELATION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={mutation.isPending}>Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {members.length === 0 ? (
        <EmptyState title="No members to map" description="Add members first, then connect relationships." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <p className="font-semibold">{member.full_name}</p>
                  <Badge variant="muted" className="mt-2">{member.family_role || 'member'}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Relationships</CardTitle>
            </CardHeader>
            <CardContent>
              {relationships.length === 0 ? (
                <p className="text-sm text-muted-foreground">No relationships recorded yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {relationships.map((rel) => (
                    <li key={rel.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
                      <span className="font-medium">{rel.from_member_name || rel.from_member}</span>
                      <Badge variant="outline">{rel.relation_type}</Badge>
                      <span className="font-medium">{rel.to_member_name || rel.to_member}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
