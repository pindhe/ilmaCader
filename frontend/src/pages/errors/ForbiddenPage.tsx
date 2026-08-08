import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-extrabold text-accent">403</p>
      <h1 className="text-2xl font-bold">Access forbidden</h1>
      <p className="max-w-md text-muted-foreground">
        You do not have permission to view this page.
      </p>
      <Button asChild>
        <Link to="/app">Go to dashboard</Link>
      </Button>
    </div>
  )
}
