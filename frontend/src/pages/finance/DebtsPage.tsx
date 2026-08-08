import { createDebt, listDebts } from '@/api/finance'
import { ResourceListPage } from '@/features/finance/ResourceListPage'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Debt } from '@/types'

export function DebtsPage() {
  return (
    <ResourceListPage<Debt>
      title="Debts"
      description="Loans and outstanding balances"
      queryKey="debts"
      queryFn={listDebts}
      createLabel="Add debt"
      onCreate={(familyId, form) =>
        createDebt({
          family: familyId,
          name: form.name,
          creditor: form.creditor,
          amount: form.amount,
          remaining_balance: form.remaining_balance || form.amount,
          interest: form.interest || 0,
          due_date: form.due_date || null,
          notes: form.notes,
        })
      }
      formFields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'creditor', label: 'Creditor' },
        { name: 'amount', label: 'Original amount', type: 'number', required: true },
        { name: 'remaining_balance', label: 'Remaining balance', type: 'number' },
        { name: 'interest', label: 'Interest %', type: 'number' },
        { name: 'due_date', label: 'Due date', type: 'date' },
        { name: 'notes', label: 'Notes' },
      ]}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => r.name },
        { key: 'creditor', header: 'Creditor', cell: (r) => r.creditor || '—' },
        { key: 'remaining', header: 'Remaining', cell: (r) => formatCurrency(r.remaining_balance) },
        { key: 'due', header: 'Due', cell: (r) => formatDate(r.due_date) },
      ]}
    />
  )
}
