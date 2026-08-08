import { useQuery } from '@tanstack/react-query'
import { listActivityLogs } from '@/api/notifications'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/StateBlocks'
import { Card, CardContent } from '@/components/ui/card'
import { useFamilyId } from '@/hooks/useFamilyId'
import { formatDate, getErrorMessage } from '@/lib/utils'

export function ActivityLogsPage() {
  const familyId = useFamilyId()

  const query = useQuery({
    queryKey: ['activity', familyId],
    queryFn: () => listActivityLogs(familyId!),
    enabled: Boolean(familyId),
    retry: false,
  })

  if (!familyId) return <EmptyState title="No family selected" />

  return (
    <div>
      <PageHeader title="Activity Logs" description="Audit trail of important family workspace actions" />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <EmptyState
          title="No activity logs yet"
          description="Activity logging endpoint is not available, or there is nothing recorded."
        />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="No activity yet" description="Actions across the workspace will appear here." />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {query.data?.map((log) => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(log.created_at)}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {log.actor ? `${log.actor} · ` : ''}
                  {log.details || 'No details'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {query.isError ? (
        <div className="mt-4">
          <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
        </div>
      ) : null}
    </div>
  )
}
