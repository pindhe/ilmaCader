import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import {
  Calendar,
  ChevronDown,
  FileText,
  Home,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const NAV = [
  { to: '/app', label: 'Home', end: true, icon: Home },
  { to: '/app/my-info', label: 'My Info', icon: UserRound },
  { to: '/app/documents', label: 'Documents', icon: FileText },
  { to: '/app/events', label: 'Events', icon: Calendar },
]

function NavItems({
  onNavigate,
  className,
}: {
  onNavigate?: () => void
  className?: string
}) {
  return (
    <nav className={cn('flex items-center gap-1', className)}>
      {NAV.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

export function MemberLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const family = useAuthStore((s) => s.family)
  const logout = useAuthStore((s) => s.logout)
  const isHome = location.pathname === '/app' || location.pathname === '/app/'

  const initials =
    user?.full_name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 shadow-sm backdrop-blur-md">
        <div className="relative mx-auto flex h-[4.25rem] max-w-6xl items-center px-4">
          {/* Left — brand */}
          <div className="z-10 flex min-w-0 items-center gap-3">
            <BrandLogo
              to="/app"
              size="sm"
              textClassName="hidden text-sm text-primary sm:inline sm:text-base"
            />
            {family?.name ? (
              <>
                <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
                <p className="hidden max-w-[140px] truncate text-xs font-medium text-muted-foreground lg:block">
                  {family.name}
                </p>
              </>
            ) : null}
          </div>

          {/* Center — main nav */}
          <div className="pointer-events-none absolute inset-x-0 hidden justify-center md:flex">
            <div className="pointer-events-auto rounded-full border border-border/70 bg-muted/40 p-1 shadow-sm">
              <NavItems />
            </div>
          </div>

          {/* Right — theme + profile */}
          <div className="z-10 ml-auto flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle dark mode"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 gap-2 rounded-full border border-transparent px-1.5 hover:border-border hover:bg-muted/60 sm:px-2"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-primary/15">
                    <AvatarImage src={user?.avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[130px] truncate text-sm font-medium md:inline">
                    {user?.full_name}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">{user?.full_name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user?.email}
                    </span>
                    {family?.name ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        {family.name}
                      </span>
                    ) : null}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/app/my-info')}>
                  <UserRound className="mr-2 h-4 w-4" /> My Info
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout()
                    navigate('/')
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-border bg-card px-4 py-4 md:hidden">
            <NavItems
              className="flex-col items-stretch gap-1"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        ) : null}
      </header>

      <main
        className={cn(
          'flex-1',
          isHome ? 'w-full' : 'mx-auto w-full max-w-6xl px-4 py-8',
        )}
      >
        <Outlet />
      </main>

      {!isHome ? (
        <footer className="mt-auto border-t border-border bg-card">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <BrandLogo to="/app" size="sm" textClassName="text-sm text-foreground" />
              <p className="text-xs">Your family workspace — info, documents & events.</p>
            </div>
            <div className="flex flex-col gap-1 sm:items-end">
              <p className="text-xs font-medium text-foreground/80">
                © {new Date().getFullYear()} IlmaCader
              </p>
              <p className="text-xs">{family?.name || 'Member portal'}</p>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  )
}
