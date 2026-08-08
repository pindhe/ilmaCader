import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, LoadingState } from '@/components/shared/StateBlocks'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFamilyId } from '@/hooks/useFamilyId'
import { getErrorMessage } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
}

interface ResourceListPageProps<T> {
  title: string
  description: string
  queryKey: string
  queryFn: (familyId: string) => Promise<T[]>
  columns: Column<T>[]
  createLabel?: string
  onCreate: (familyId: string, form: Record<string, string>) => Promise<unknown>
  formFields: Array<{
    name: string
    label: string
    type?: string
    required?: boolean
    placeholder?: string
  }>
  emptyTitle?: string
  emptyDescription?: string
}

export function ResourceListPage<T extends { id: string }>({
  title,
  description,
  queryKey,
  queryFn,
  columns,
  createLabel = 'Add record',
  onCreate,
  formFields,
  emptyTitle = 'No records yet',
  emptyDescription = 'Create your first record to start tracking.',
}: ResourceListPageProps<T>) {
  const familyId = useFamilyId()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(formFields.map((f) => [f.name, ''])),
  )

  const query = useQuery({
    queryKey: [queryKey, familyId],
    queryFn: () => queryFn(familyId!),
    enabled: Boolean(familyId),
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: () => onCreate(familyId!, form),
    onSuccess: () => {
      toast.success('Saved successfully')
      setOpen(false)
      setForm(Object.fromEntries(formFields.map((f) => [f.name, ''])))
      queryClient.invalidateQueries({ queryKey: [queryKey, familyId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not save')),
  })

  if (!familyId) {
    return <EmptyState title="No family selected" description="Select a family to continue." />
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> {createLabel}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{createLabel}</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  mutation.mutate()
                }}
              >
                {formFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="text-sm font-medium" htmlFor={field.name}>
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      type={field.type || 'text'}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={form[field.name] || ''}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                ))}
                <DialogFooter>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Saving…' : 'Save'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError || (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={
            query.isError
              ? 'No data yet (API may be unavailable). You can still try adding a record.'
              : emptyDescription
          }
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> {createLabel}
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>{col.cell(row)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
