import { useQuery } from '@tanstack/react-query'
import { getAdminStats, listAllFamilies, listAllUsers } from '@/api/admin'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/StateBlocks'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getErrorMessage } from '@/lib/utils'

export function AdminDashboardPage() {
  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    retry: false,
  })
  const familiesQuery = useQuery({
    queryKey: ['admin-families'],
    queryFn: listAllFamilies,
    retry: false,
  })
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: listAllUsers,
    retry: false,
  })

  if (statsQuery.isLoading || familiesQuery.isLoading || usersQuery.isLoading) {
    return <LoadingState label="Loading admin console…" />
  }

  const unavailable = statsQuery.isError && familiesQuery.isError && usersQuery.isError

  if (unavailable) {
    return (
      <div className="space-y-4">
        <PageHeader title="Admin Dashboard" description="Platform-wide oversight for super admins" />
        <EmptyState
          title="Admin APIs not available yet"
          description="Connect /api/admin/* endpoints to populate platform metrics."
        />
        <ErrorState message={getErrorMessage(statsQuery.error)} onRetry={() => statsQuery.refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="Platform-wide oversight for super admins" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Families</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{statsQuery.data?.families ?? familiesQuery.data?.length ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Users</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{statsQuery.data?.users ?? usersQuery.data?.length ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Members</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{statsQuery.data?.members ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active families</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{statsQuery.data?.active_families ?? '—'}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Families</CardTitle></CardHeader>
          <CardContent className="p-0">
            {(familiesQuery.data?.length ?? 0) === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No families loaded.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {familiesQuery.data?.map((family) => (
                    <TableRow key={family.id}>
                      <TableCell>{family.name}</TableCell>
                      <TableCell>{family.family_id}</TableCell>
                      <TableCell>
                        <Badge variant={family.is_active ? 'secondary' : 'muted'}>
                          {family.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Users</CardTitle></CardHeader>
          <CardContent className="p-0">
            {(usersQuery.data?.length ?? 0) === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No users loaded.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.data?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
