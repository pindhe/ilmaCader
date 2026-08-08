import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import {
  Activity,
  Bell,
  Calendar,
  FileText,
  Flag,
  FolderKanban,
  GitBranch,
  Landmark,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  PiggyBank,
  Receipt,
  Search,
  Settings,
  Shield,
  Sun,
  Target,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { listNotifications } from '@/api/notifications'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { NotificationItem } from '@/types'

const ADMIN_NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/members', label: 'Family Members', icon: Users },
  { to: '/app/family-tree', label: 'Family Tree', icon: GitBranch },
  { to: '/app/finances', label: 'Finances', icon: Wallet },
  { to: '/app/finances/income', label: 'Income', icon: TrendingUp },
  { to: '/app/finances/expenses', label: 'Expenses', icon: Receipt },
  { to: '/app/finances/savings', label: 'Savings', icon: PiggyBank },
  { to: '/app/finances/contributions', label: 'Contributions', icon: Landmark },
  { to: '/app/finances/assets', label: 'Assets', icon: Landmark },
  { to: '/app/finances/goals', label: 'Goals', icon: Target },
  { to: '/app/events', label: 'Events', icon: Calendar },
  { to: '/app/documents', label: 'Documents', icon: FileText },
  { to: '/app/tasks', label: 'Tasks', icon: FolderKanban },
  { to: '/app/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/app/reports', label: 'Reports', icon: Flag },
  { to: '/app/activity', label: 'Activity Logs', icon: Activity },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {ADMIN_NAV.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-sidebar-accent text-white'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export function DashboardLayout() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const user = useAuthStore((s) => s.user)
  const family = useAuthStore((s) => s.family)
  const families = useAuthStore((s) => s.families)
  const setFamily = useAuthStore((s) => s.setFamily)
  const logout = useAuthStore((s) => s.logout)
  const isAdmin = useIsAdmin()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    listNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]))
  }, [])

  const unread = notifications.filter((n) => !n.is_read).length
  const initials =
    user?.full_name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <BrandLogo
            to="/app"
            size="md"
            textClassName="text-base text-white"
            className="items-center"
          />
          <p className="mt-2 truncate text-xs text-white/60">{family?.name || 'No family selected'}</p>
        </div>
        <SidebarNav />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground shadow-xl">
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
              <BrandLogo to="/app" size="sm" textClassName="text-sm text-white" />
              <Button variant="ghost" size="icon" className="text-white" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{family?.name || 'Select a family'}</p>
              <p className="truncate text-xs text-muted-foreground">
                {family?.family_id || 'Your family workspace'}
              </p>
            </div>

            <Badge
              variant={isAdmin ? 'default' : 'muted'}
              className="hidden sm:inline-flex"
            >
              {isAdmin ? 'Admin' : 'Member'}
            </Badge>
            {isAdmin ? (
              <>
                <Button
                  variant="outline"
                  className="hidden max-w-xs flex-1 justify-start gap-2 text-muted-foreground md:flex"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                  <span className="flex-1 text-left text-sm">Search…</span>
                  <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">Ctrl+K</kbd>
                </Button>
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)}>
                  <Search className="h-5 w-5" />
                </Button>
              </>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unread > 0 ? (
                    <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]">
                      {unread}
                    </Badge>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1">
                      <span className="font-medium">{n.title}</span>
                      <span className="text-xs text-muted-foreground">{n.message}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span className="hidden text-xs uppercase text-muted-foreground sm:inline">
                    {user?.preferred_language || 'EN'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>English</DropdownMenuItem>
                <DropdownMenuItem>Somali</DropdownMenuItem>
                <DropdownMenuItem>Arabic</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[120px] truncate text-sm font-medium md:inline">
                    {user?.full_name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.full_name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {families.map((f) => (
                  <DropdownMenuItem key={f.id} onClick={() => setFamily(f)}>
                    {f.name}
                    {family?.id === f.id ? ' ✓' : ''}
                  </DropdownMenuItem>
                ))}
                {families.length > 0 ? <DropdownMenuSeparator /> : null}
                {isAdmin ? (
                  <DropdownMenuItem onClick={() => navigate('/app/family')}>Family profile</DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={() => navigate('/app/settings')}>Settings</DropdownMenuItem>
                {user?.is_superuser ? (
                  <DropdownMenuItem onClick={() => navigate('/app/admin')}>
                    <Shield className="mr-2 h-4 w-4" /> Admin
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout()
                    navigate('/login')
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {isAdmin ? <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} /> : null}
    </div>
  )
}
