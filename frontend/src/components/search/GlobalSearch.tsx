import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  FileText,
  LayoutDashboard,
  Search,
  Users,
  Wallet,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const SEARCH_ITEMS = [
  { label: 'Dashboard', path: '/app', icon: LayoutDashboard, keywords: 'home overview' },
  { label: 'Family Members', path: '/app/members', icon: Users, keywords: 'people profiles' },
  { label: 'Family Tree', path: '/app/family-tree', icon: Users, keywords: 'relationships genealogy' },
  { label: 'Finances', path: '/app/finances', icon: Wallet, keywords: 'money hub' },
  { label: 'Income', path: '/app/finances/income', icon: Wallet, keywords: 'salary earnings' },
  { label: 'Expenses', path: '/app/finances/expenses', icon: Wallet, keywords: 'spending bills' },
  { label: 'Savings', path: '/app/finances/savings', icon: Wallet, keywords: 'save goals' },
  { label: 'Contributions', path: '/app/finances/contributions', icon: Wallet, keywords: 'dues' },
  { label: 'Budget', path: '/app/finances/budget', icon: Wallet, keywords: 'plan categories' },
  { label: 'Assets', path: '/app/finances/assets', icon: Wallet, keywords: 'property' },
  { label: 'Debts', path: '/app/finances/debts', icon: Wallet, keywords: 'loans balances' },
  { label: 'Goals', path: '/app/finances/goals', icon: Wallet, keywords: 'targets' },
  { label: 'Events', path: '/app/events', icon: Calendar, keywords: 'calendar' },
  { label: 'Documents', path: '/app/documents', icon: FileText, keywords: 'files uploads' },
  { label: 'Tasks', path: '/app/tasks', icon: FileText, keywords: 'todo kanban' },
  { label: 'Announcements', path: '/app/announcements', icon: FileText, keywords: 'news' },
  { label: 'Reports', path: '/app/reports', icon: FileText, keywords: 'analytics' },
  { label: 'Activity Logs', path: '/app/activity', icon: FileText, keywords: 'audit history' },
  { label: 'Settings', path: '/app/settings', icon: FileText, keywords: 'preferences profile' },
  { label: 'Family Profile', path: '/app/family', icon: Users, keywords: 'family info' },
]

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SEARCH_ITEMS
    return SEARCH_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.keywords.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">Jump to any page in Family Data Center</DialogDescription>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, members, finances…"
              className="border-0 shadow-none focus-visible:ring-0"
            />
            <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">No matches found.</p>
          ) : (
            results.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-muted',
                  )}
                  onClick={() => {
                    navigate(item.path)
                    onOpenChange(false)
                  }}
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
