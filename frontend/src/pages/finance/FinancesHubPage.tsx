import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Landmark,
  PiggyBank,
  Receipt,
  Scale,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { getDashboardStats } from '@/api/families'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, SkeletonCards } from '@/components/shared/StateBlocks'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFamily, useFamilyId } from '@/hooks/useFamilyId'
import { formatCurrency, getErrorMessage } from '@/lib/utils'

const LINKS = [
  { to: '/app/finances/income', label: 'Income', icon: TrendingUp },
  { to: '/app/finances/expenses', label: 'Expenses', icon: Receipt },
  { to: '/app/finances/contributions', label: 'Contributions', icon: Landmark },
  { to: '/app/finances/savings', label: 'Savings', icon: PiggyBank },
  { to: '/app/finances/budget', label: 'Budget', icon: Wallet },
  { to: '/app/finances/assets', label: 'Assets', icon: Landmark },
  { to: '/app/finances/debts', label: 'Debts', icon: Scale },
  { to: '/app/finances/goals', label: 'Goals', icon: Target },
]

export function FinancesHubPage() {
  const familyId = useFamilyId()
  const family = useFamily()
  const currency = family?.currency || 'USD'

  const query = useQuery({
    queryKey: ['dashboard-stats', familyId],
    queryFn: () => getDashboardStats(familyId!),
    enabled: Boolean(familyId),
  })

  if (!familyId) return <EmptyState title="No family selected" />
  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Finances" description="Family money hub" />
        <SkeletonCards />
      </div>
    )
  }
  if (query.isError) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
  }

  const stats = query.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finances"
        description="Track income, spending, savings, and long-term goals"
        actions={
          <Button asChild>
            <Link to="/app/finances/income">Add income</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Income" value={formatCurrency(stats?.monthly_income, currency)} icon={TrendingUp} tone="secondary" />
        <StatCard title="Expenses" value={formatCurrency(stats?.monthly_expenses, currency)} icon={Receipt} tone="accent" />
        <StatCard title="Savings" value={formatCurrency(stats?.savings, currency)} icon={PiggyBank} tone="primary" />
        <StatCard title="Assets" value={formatCurrency(stats?.assets, currency)} icon={Wallet} tone="muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {LINKS.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.to} className="transition hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-primary" />
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link to={item.to}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
