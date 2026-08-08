import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createTask, listTasks, updateTask } from '@/api/tasks'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useFamilyId } from '@/hooks/useFamilyId'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { cn, formatDate, getErrorMessage } from '@/lib/utils'
import type { TaskItem } from '@/types'

const COLUMNS: Array<{ key: TaskItem['status']; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export function TasksPage() {
  const familyId = useFamilyId()
  const isAdmin = useIsAdmin()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    status: 'pending',
  })

  const query = useQuery({
    queryKey: ['tasks', familyId],
    queryFn: () => listTasks(familyId!),
    enabled: Boolean(familyId),
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: () => createTask({ family: familyId!, ...form }),
    onSuccess: () => {
      toast.success('Task created')
      setOpen(false)
      setForm({ title: '', description: '', priority: 'medium', due_date: '', status: 'pending' })
      queryClient.invalidateQueries({ queryKey: ['tasks', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTask(id, { status }),
    onSuccess: () => {
      toast.success('Task updated')
      queryClient.invalidateQueries({ queryKey: ['tasks', familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (!familyId) return <EmptyState title="No family selected" />

  const tasks = query.data ?? []

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Tasks' : 'My Tasks'}
        description={
          isAdmin
            ? 'Kanban and list views for family to-dos'
            : 'Tasks assigned to you'
        }
        actions={
          isAdmin ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> Add task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  createMutation.mutate()
                }}
              >
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Input value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Due date</Label>
                    <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>Save task</Button>
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
        <>
          <EmptyState title="Tasks unavailable" description="Could not load tasks." />
          <div className="mt-4"><ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} /></div>
        </>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description={isAdmin ? 'Create the first shared task.' : 'No tasks are assigned to you yet.'}
          action={
            isAdmin ? (
              <Button onClick={() => setOpen(true)}>Add task</Button>
            ) : undefined
          }
        />
      ) : (
        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
          <TabsContent value="kanban">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {COLUMNS.map((col) => (
                <Card key={col.key} className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{col.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tasks
                      .filter((t) => (t.status || 'pending') === col.key)
                      .map((task) => (
                        <div key={task.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                          <p className="font-medium">{task.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(task.due_date)}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {COLUMNS.filter((c) => c.key !== task.status).map((c) => (
                              <Button
                                key={c.key}
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => statusMutation.mutate({ id: task.id, status: c.key || 'pending' })}
                              >
                                → {c.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="list">
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(task.priority === 'urgent' && 'bg-destructive')}>{task.priority}</Badge>
                      <Badge variant="outline">{task.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
