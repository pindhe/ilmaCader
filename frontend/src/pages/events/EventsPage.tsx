import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createEvent, listEvents } from '@/api/events'
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

export function EventsPage() {
  const familyId = useFamilyId()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    event_type: 'meeting',
    description: '',
  })

  const query = useQuery({
    queryKey: ['events', familyId],
    queryFn: () => listEvents(familyId!),
    enabled: Boolean(familyId),
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: () => createEvent({ family: familyId!, ...form }),
    onSuccess: () => {
      toast.success('Event created')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['events', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (!familyId) return <EmptyState title="No family selected" />

  return (
    <div>
      <PageHeader
        title="Events"
        description="Family gatherings, milestones, and meetings"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> Add event</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create event</DialogTitle></DialogHeader>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  mutation.mutate()
                }}
              >
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={mutation.isPending}>Save event</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <EmptyState
          title="No events available"
          description="Events API is not ready yet, or returned an error. You can still try adding one."
          action={<Button onClick={() => setOpen(true)}>Add event</Button>}
        />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="No events yet" description="Schedule your first family event." action={<Button onClick={() => setOpen(true)}>Add event</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data?.map((event) => (
            <Card key={event.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{event.name}</h3>
                  <Badge variant="muted">{event.event_type || 'event'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}</p>
                <p className="text-sm">{event.location || 'No location'}</p>
                <p className="text-sm text-muted-foreground">{event.description || 'No description'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {query.isError ? <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} /> : null}
    </div>
  )
}
