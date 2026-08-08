import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getDashboardStats } from '@/api/families'
import { listMembers } from '@/api/members'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, SkeletonCards } from '@/components/shared/StateBlocks'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFamily, useFamilyId } from '@/hooks/useFamilyId'
import { formatCurrency, getErrorMessage } from '@/lib/utils'

export function DashboardPage() {
  const familyId = useFamilyId()
  const family = useFamily()

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', familyId],
    queryFn: () => getDashboardStats(familyId!),
    enabled: Boolean(familyId),
  })

  const membersQuery = useQuery({
    queryKey: ['members', familyId],
    queryFn: () => listMembers(familyId!),
    enabled: Boolean(familyId),
  })

  if (!familyId) {
    return (
      <EmptyState
        title="No family selected"
        description="Create or join a family to see your dashboard."
        action={
          <Button asChild>
            <Link to="/app/family">Open family profile</Link>
          </Button>
        }
      />
    )
  }

  if (statsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Overview of your family workspace" />
        <SkeletonCards />
      </div>
    )
  }

  if (statsQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(statsQuery.error)}
        onRetry={() => statsQuery.refetch()}
      />
    )
  }

  const stats = statsQuery.data
  const currency = family?.currency || 'USD'
  const chartData = [
    { name: 'Income', value: Number(stats?.monthly_income || 0) },
    { name: 'Expenses', value: Number(stats?.monthly_expenses || 0) },
    { name: 'Savings', value: Number(stats?.savings || 0) },
    { name: 'Assets', value: Number(stats?.assets || 0) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back to ${family?.name || 'your family'}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/app/members">Add member</Link>
            </Button>
            <Button asChild>
              <Link to="/app/finances/income">Record income</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Members" value={String(stats?.member_count ?? 0)} icon={Users} tone="primary" />
        <StatCard
          title="Monthly income"
          value={formatCurrency(stats?.monthly_income, currency)}
          icon={TrendingUp}
          tone="secondary"
        />
        <StatCard
          title="Monthly expenses"
          value={formatCurrency(stats?.monthly_expenses, currency)}
          icon={TrendingDown}
          tone="accent"
        />
        <StatCard
          title="Savings"
          value={formatCurrency(stats?.savings, currency)}
          icon={PiggyBank}
          tone="secondary"
        />
        <StatCard
          title="Assets"
          value={formatCurrency(stats?.assets, currency)}
          icon={Wallet}
          tone="primary"
        />
        <StatCard
          title="Active goals"
          value={String(stats?.active_goals ?? 0)}
          icon={Target}
          tone="muted"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Financial snapshot</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0B3D91" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              ['Add Family Member', '/app/members'],
              ['Add Income', '/app/finances/income'],
              ['Add Expense', '/app/finances/expenses'],
              ['Add Contribution', '/app/finances/contributions'],
              ['Create Goal', '/app/finances/goals'],
              ['Add Event', '/app/events'],
              ['Upload Document', '/app/documents'],
              ['Create Task', '/app/tasks'],
            ].map(([label, path]) => (
              <Button key={path} asChild variant="outline" className="justify-start">
                <Link to={path}>{label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent members</CardTitle>
        </CardHeader>
        <CardContent>
          {membersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading members…</p>
          ) : (membersQuery.data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No members yet"
              description="Add your first family member to populate the directory."
              action={
                <Button asChild>
                  <Link to="/app/members">Add member</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {membersQuery.data?.slice(0, 5).map((member) => (
                <li key={member.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">{member.family_role || 'Member'}</p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/app/members/${member.id}`}>View</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
