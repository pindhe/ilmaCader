import { createContribution, listContributions } from '@/api/finance'
import { ResourceListPage } from '@/features/finance/ResourceListPage'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Contribution } from '@/types'

export function ContributionsPage() {
  const isAdmin = useIsAdmin()
  return (
    <ResourceListPage<Contribution>
      title={isAdmin ? 'Contributions' : 'My Contributions'}
      description={
        isAdmin
          ? 'All family contributions (full admin view)'
          : 'Record your contributions — admin can see them'
      }
      queryKey="contributions"
      queryFn={listContributions}
      createLabel="Add contribution"
      onCreate={(familyId, form) =>
        createContribution({
          family: familyId,
          amount: form.amount,
          date: form.date,
          contribution_type: form.contribution_type,
          purpose: form.purpose,
          payment_method: form.payment_method || 'cash',
          notes: form.notes,
        })
      }
      formFields={[
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'contribution_type', label: 'Type' },
        { name: 'purpose', label: 'Purpose' },
        { name: 'payment_method', label: 'Payment method', placeholder: 'cash, bank…' },
        { name: 'notes', label: 'Notes' },
      ]}
      columns={[
        { key: 'amount', header: 'Amount', cell: (r) => formatCurrency(r.amount) },
        { key: 'type', header: 'Type', cell: (r) => r.contribution_type || '—' },
        { key: 'purpose', header: 'Purpose', cell: (r) => r.purpose || '—' },
        { key: 'date', header: 'Date', cell: (r) => formatDate(r.date) },
      ]}
    />
  )
}
