import { createIncome, listIncome } from '@/api/finance'
import { ResourceListPage } from '@/features/finance/ResourceListPage'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Income } from '@/types'

export function IncomePage() {
  return (
    <ResourceListPage<Income>
      title="Income"
      description="Record family earnings and revenue sources"
      queryKey="income"
      queryFn={listIncome}
      createLabel="Add income"
      emptyTitle="No income recorded"
      emptyDescription="Log salaries, business income, and other earnings."
      onCreate={(familyId, form) =>
        createIncome({
          family: familyId,
          title: form.title,
          amount: form.amount,
          date: form.date,
          category: form.category || 'other',
          source: form.source,
          description: form.description,
        })
      }
      formFields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'category', label: 'Category', placeholder: 'salary, business…' },
        { name: 'source', label: 'Source' },
        { name: 'description', label: 'Description' },
      ]}
      columns={[
        { key: 'title', header: 'Title', cell: (r) => r.title },
        { key: 'amount', header: 'Amount', cell: (r) => formatCurrency(r.amount, r.currency) },
        { key: 'category', header: 'Category', cell: (r) => r.category || '—' },
        { key: 'date', header: 'Date', cell: (r) => formatDate(r.date) },
      ]}
    />
  )
}
