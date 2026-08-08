import { createGoal, listGoals } from '@/api/finance'
import { ResourceListPage } from '@/features/finance/ResourceListPage'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { FinancialGoal } from '@/types'

export function GoalsPage() {
  return (
    <ResourceListPage<FinancialGoal>
      title="Financial Goals"
      description="Set and track shared money goals"
      queryKey="goals"
      queryFn={listGoals}
      createLabel="Add goal"
      onCreate={(familyId, form) =>
        createGoal({
          family: familyId,
          name: form.name,
          target_amount: form.target_amount,
          current_amount: form.current_amount || 0,
          deadline: form.deadline || null,
          priority: form.priority || 'medium',
          description: form.description,
        })
      }
      formFields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'target_amount', label: 'Target amount', type: 'number', required: true },
        { name: 'current_amount', label: 'Current amount', type: 'number' },
        { name: 'deadline', label: 'Deadline', type: 'date' },
        { name: 'priority', label: 'Priority', placeholder: 'low, medium, high' },
        { name: 'description', label: 'Description' },
      ]}
      columns={[
        { key: 'name', header: 'Goal', cell: (r) => r.name },
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
        { key: 'priority', header: 'Priority', cell: (r) => r.priority || '—' },
        { key: 'deadline', header: 'Deadline', cell: (r) => formatDate(r.deadline) },
      ]}
    />
  )
}
