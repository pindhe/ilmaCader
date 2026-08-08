import { createExpense, listExpenses } from '@/api/finance'
import { ResourceListPage } from '@/features/finance/ResourceListPage'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Expense } from '@/types'

export function ExpensesPage() {
  const isAdmin = useIsAdmin()
  return (
    <ResourceListPage<Expense>
      title={isAdmin ? 'Expenses' : 'My Expenses'}
      description={
        isAdmin
          ? 'All family expenses (full admin view)'
          : 'Enter and track your own expenses — admin can see it'
      }
      queryKey="expenses"
      queryFn={listExpenses}
      createLabel="Add expense"
      onCreate={(familyId, form) =>
        createExpense({
          family: familyId,
          title: form.title,
          amount: form.amount,
          date: form.date,
          category: form.category || 'other',
          description: form.description,
        })
      }
      formFields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'category', label: 'Category', placeholder: 'food, rent…' },
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
