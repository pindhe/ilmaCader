import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The page you requested does not exist or may have moved.
      </p>
      <Button asChild>
        <Link to="/">Back home</Link>
      </Button>
    </div>
  )
}
