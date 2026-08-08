import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  CheckSquare,
  FileText,
  Landmark,
  Megaphone,
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
  Cell,
  Pie,
  PieChart,
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFamily, useFamilyId } from '@/hooks/useFamilyId'
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils'

const QUICK_ACTIONS = [
  { label: 'Add Family Member', path: '/app/members', tone: 'primary' },
  { label: 'Add Income', path: '/app/finances/income' },
  { label: 'Add Expense', path: '/app/finances/expenses' },
  { label: 'Add Contribution', path: '/app/finances/contributions' },
  { label: 'Create Goal', path: '/app/finances/goals' },
  { label: 'Add Event', path: '/app/events' },
  { label: 'Upload Document', path: '/app/documents' },
  { label: 'Create Task', path: '/app/tasks' },
  { label: 'Announcement', path: '/app/announcements' },
  { label: 'View Reports', path: '/app/reports' },
  { label: 'Family Tree', path: '/app/family-tree' },
  { label: 'Activity Logs', path: '/app/activity' },
]

const PIE_COLORS = ['#0B3D91', '#059669', '#D4A017', '#64748b']

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
        description="Select a family workspace to open the admin dashboard."
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
        <PageHeader title="Admin Dashboard" description="Full family management overview" />
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

  const stats = statsQuery.data!
  const currency = family?.currency || 'USD'
  const chartData = [
    { name: 'Income', value: Number(stats.monthly_income || 0) },
    { name: 'Expenses', value: Number(stats.monthly_expenses || 0) },
    { name: 'Savings', value: Number(stats.savings || 0) },
    { name: 'Assets', value: Number(stats.assets || 0) },
  ]
  const pieData = [
    { name: 'Income', value: Number(stats.monthly_income || 0) },
    { name: 'Expenses', value: Number(stats.monthly_expenses || 0) },
    { name: 'Contributions', value: Number(stats.monthly_contributions || 0) },
    { name: 'Debts', value: Number(stats.debts || 0) },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description={`${family?.name || stats.family_name || 'Family'} · ${family?.family_id || stats.family_code || ''} · Full access`}
        actions={
          <>
            <Badge className="bg-primary text-primary-foreground">Admin</Badge>
            <Button asChild variant="outline">
              <Link to="/app/members">Manage members</Link>
            </Button>
            <Button asChild>
              <Link to="/app/finances">Finance center</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Members" value={String(stats.member_count ?? 0)} icon={Users} tone="primary" />
        <StatCard
          title="Monthly income"
          value={formatCurrency(stats.monthly_income, currency)}
          icon={TrendingUp}
          tone="secondary"
        />
        <StatCard
          title="Monthly expenses"
          value={formatCurrency(stats.monthly_expenses, currency)}
          icon={TrendingDown}
          tone="accent"
        />
        <StatCard
          title="Net cash flow"
          value={formatCurrency(stats.net_cashflow, currency)}
          icon={Landmark}
          tone="secondary"
        />
        <StatCard
          title="Savings"
          value={formatCurrency(stats.savings, currency)}
          icon={PiggyBank}
          tone="secondary"
        />
        <StatCard
          title="Assets"
          value={formatCurrency(stats.assets, currency)}
          icon={Wallet}
          tone="primary"
        />
        <StatCard
          title="Net worth"
          value={formatCurrency(stats.net_worth, currency)}
          icon={Landmark}
          tone="primary"
        />
        <StatCard
          title="Active goals"
          value={String(stats.active_goals ?? 0)}
          icon={Target}
          tone="muted"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/app/tasks">
          <Card className="transition hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-5">
              <CheckSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.pending_tasks ?? 0}</p>
                <p className="text-sm text-muted-foreground">Pending tasks</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/events">
          <Card className="transition hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-5">
              <Calendar className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-2xl font-bold">{stats.upcoming_events ?? 0}</p>
                <p className="text-sm text-muted-foreground">Upcoming events</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/documents">
          <Card className="transition hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-5">
              <FileText className="h-5 w-5 text-accent" />
              <div>
                <p className="text-2xl font-bold">{stats.documents_count ?? 0}</p>
                <p className="text-sm text-muted-foreground">Documents</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/announcements">
          <Card className="transition hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-5">
              <Megaphone className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.announcements_count ?? 0}</p>
                <p className="text-sm text-muted-foreground">Announcements</p>
              </div>
            </CardContent>
          </Card>
        </Link>
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
            <CardTitle>Money mix</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {pieData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No finance data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin quick actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {QUICK_ACTIONS.map((item) => (
            <Button key={item.path} asChild variant="outline" className="justify-start">
              <Link to={item.path}>{item.label}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Members</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link to="/app/members">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {membersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (membersQuery.data?.length ?? 0) === 0 ? (
              <EmptyState
                title="No members yet"
                description="Add family members to get started."
                action={
                  <Button asChild size="sm">
                    <Link to="/app/members">Add member</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {membersQuery.data?.slice(0, 6).map((member) => (
                  <li key={member.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {member.family_role || 'member'}
                      </p>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link to="/app/tasks">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(stats.recent_tasks?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              <ul className="space-y-3">
                {stats.recent_tasks?.map((task) => (
                  <li key={task.id} className="rounded-lg border border-border/70 p-3">
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.assigned_member__full_name || 'Unassigned'} · {task.status} ·{' '}
                      {task.due_date ? formatDate(task.due_date) : 'No due date'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming events</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link to="/app/events">Calendar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(stats.upcoming_events_list?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            ) : (
              <ul className="space-y-3">
                {stats.upcoming_events_list?.map((event) => (
                  <li key={event.id} className="rounded-lg border border-border/70 p-3">
                    <p className="font-medium">{event.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(event.date)} · {event.location || event.event_type || 'Event'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link to="/app/activity">Full log</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {(stats.recent_activity?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recent_activity?.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.user__full_name || 'System'} · {item.module || 'general'}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(item.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
