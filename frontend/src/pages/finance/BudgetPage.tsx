import { createBudget, listBudgets } from '@/api/finance'
import { ResourceListPage } from '@/features/finance/ResourceListPage'
import { formatCurrency } from '@/lib/utils'
import type { Budget } from '@/types'

export function BudgetPage() {
  return (
    <ResourceListPage<Budget>
      title="Budget"
      description="Plan monthly and yearly category budgets"
      queryKey="budgets"
      queryFn={listBudgets}
      createLabel="Add budget"
      onCreate={(familyId, form) =>
        createBudget({
          family: familyId,
          category: form.category,
          amount: form.amount,
          period: form.period || 'monthly',
          year: Number(form.year),
          month: form.month ? Number(form.month) : null,
        })
      }
      formFields={[
        { name: 'category', label: 'Category', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'period', label: 'Period', placeholder: 'monthly or yearly' },
        { name: 'year', label: 'Year', type: 'number', required: true },
        { name: 'month', label: 'Month', type: 'number', placeholder: '1-12' },
      ]}
      columns={[
        { key: 'category', header: 'Category', cell: (r) => r.category },
        { key: 'amount', header: 'Amount', cell: (r) => formatCurrency(r.amount) },
        { key: 'period', header: 'Period', cell: (r) => r.period },
        { key: 'year', header: 'Year', cell: (r) => `${r.year}${r.month ? ` / ${r.month}` : ''}` },
      ]}
    />
  )
}
