import { createSaving, listSavings } from '@/api/finance'
import { ResourceListPage } from '@/features/finance/ResourceListPage'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { SavingGoal } from '@/types'

export function SavingsPage() {
  return (
    <ResourceListPage<SavingGoal>
      title="Savings"
      description="Family saving goals and progress"
      queryKey="savings"
      queryFn={listSavings}
      createLabel="Add saving goal"
      onCreate={(familyId, form) =>
        createSaving({
          family: familyId,
          title: form.title,
          target_amount: form.target_amount,
          current_amount: form.current_amount || 0,
          deadline: form.deadline || null,
          description: form.description,
        })
      }
      formFields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'target_amount', label: 'Target amount', type: 'number', required: true },
        { name: 'current_amount', label: 'Current amount', type: 'number' },
        { name: 'deadline', label: 'Deadline', type: 'date' },
        { name: 'description', label: 'Description' },
      ]}
      columns={[
        { key: 'title', header: 'Goal', cell: (r) => r.title },
        {
          key: 'progress',
          header: 'Progress',
          cell: (r) => {
            const progress =
              r.progress ??
              Math.min(100, (Number(r.current_amount) / Math.max(Number(r.target_amount), 1)) * 100)
            return (
              <div className="min-w-[140px] space-y-1">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(r.current_amount)} / {formatCurrency(r.target_amount)}
                </p>
              </div>
            )
          },
        },
        { key: 'deadline', header: 'Deadline', cell: (r) => formatDate(r.deadline) },
      ]}
    />
  )
}
