import { Link } from 'react-router-dom'
import { UserPlus, Users, HeartHandshake } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { useFamily } from '@/hooks/useFamilyId'
import { useAuthStore } from '@/stores/authStore'

const ACTIONS = [
  {
    to: '/app/members',
    label: 'Members',
    description: 'Create new members and update all their information',
    icon: Users,
  },
  {
    to: '/app/parents',
    label: 'Parents',
    description: 'Create father and mother profiles for the family',
    icon: HeartHandshake,
  },
  {
    to: '/app/members',
    label: 'Create member',
    description: 'Add a member with login email and password',
    icon: UserPlus,
    hash: 'create',
  },
]

export function AdminHomePage() {
  const user = useAuthStore((s) => s.user)
  const family = useFamily()
  const firstName = user?.full_name?.split(' ')[0] || 'Admin'

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome, ${firstName}`}
        description={`${family?.name || 'Family'} · Admin workspace`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {ACTIONS.map((item) => {
          const Icon = item.icon
          const to = item.hash ? `${item.to}?${item.hash}=1` : item.to
          return (
            <Link key={item.label} to={to} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
