import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/api/families'
import { getFinanceSummary, getMemberSummary } from '@/api/reports'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/StateBlocks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFamily, useFamilyId } from '@/hooks/useFamilyId'
import { formatCurrency, getErrorMessage } from '@/lib/utils'

export function ReportsPage() {
  const familyId = useFamilyId()
  const family = useFamily()
  const currency = family?.currency || 'USD'

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', familyId],
    queryFn: () => getDashboardStats(familyId!),
    enabled: Boolean(familyId),
  })

  const financeQuery = useQuery({
    queryKey: ['finance-summary', familyId],
    queryFn: () => getFinanceSummary(familyId!),
    enabled: Boolean(familyId),
    retry: false,
  })

  const memberQuery = useQuery({
    queryKey: ['member-summary', familyId],
    queryFn: () => getMemberSummary(familyId!),
    enabled: Boolean(familyId),
    retry: false,
  })

  if (!familyId) return <EmptyState title="No family selected" />
  if (statsQuery.isLoading) return <LoadingState />
  if (statsQuery.isError) {
    return <ErrorState message={getErrorMessage(statsQuery.error)} onRetry={() => statsQuery.refetch()} />
  }

  const stats = statsQuery.data

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Summaries across members and finances" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Members</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{stats?.member_count ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Monthly net</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">
            {formatCurrency(Number(stats?.monthly_income || 0) - Number(stats?.monthly_expenses || 0), currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active goals</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{stats?.active_goals ?? 0}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Finance summary API</CardTitle></CardHeader>
          <CardContent>
            {financeQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : financeQuery.isError ? (
              <p className="text-sm text-muted-foreground">Finance report endpoint not available yet.</p>
            ) : (
              <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
                {JSON.stringify(financeQuery.data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Member summary API</CardTitle></CardHeader>
          <CardContent>
            {memberQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : memberQuery.isError ? (
              <p className="text-sm text-muted-foreground">Member report endpoint not available yet.</p>
            ) : (
              <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
                {JSON.stringify(memberQuery.data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
