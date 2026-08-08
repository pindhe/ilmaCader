import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createAnnouncement, listAnnouncements } from '@/api/events'
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
import { formatDate, getErrorMessage } from '@/lib/utils'

export function AnnouncementsPage() {
  const familyId = useFamilyId()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', priority: 'normal' })

  const query = useQuery({
    queryKey: ['announcements', familyId],
    queryFn: () => listAnnouncements(familyId!),
    enabled: Boolean(familyId),
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: () => createAnnouncement({ family: familyId!, ...form }),
    onSuccess: () => {
      toast.success('Announcement published')
      setOpen(false)
      setForm({ title: '', message: '', priority: 'normal' })
      queryClient.invalidateQueries({ queryKey: ['announcements', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (!familyId) return <EmptyState title="No family selected" />

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Broadcast updates to the family"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New announcement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Publish announcement</DialogTitle></DialogHeader>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  mutation.mutate()
                }}
              >
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={mutation.isPending}>Publish</Button>
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
          <EmptyState title="Announcements unavailable" description="Endpoint not ready yet." action={<Button onClick={() => setOpen(true)}>New announcement</Button>} />
          <div className="mt-4"><ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} /></div>
        </>
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="No announcements" description="Share the first family update." action={<Button onClick={() => setOpen(true)}>New announcement</Button>} />
      ) : (
        <div className="space-y-4">
          {query.data?.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <Badge variant={item.priority === 'urgent' ? 'default' : 'muted'}>{item.priority}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(item.created_at)}</p>
                <p className="text-sm leading-relaxed">{item.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
