import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'

export function ServerErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <BrandLogo to="/" size="lg" textClassName="text-primary" />
      <p className="text-6xl font-extrabold text-destructive">500</p>
      <h1 className="text-2xl font-bold">Server error</h1>
      <p className="max-w-md text-muted-foreground">
        Something went wrong on our side. Please try again shortly.
      </p>
      <Button asChild>
        <Link to="/app">Return to dashboard</Link>
      </Button>
    </div>
  )
}
