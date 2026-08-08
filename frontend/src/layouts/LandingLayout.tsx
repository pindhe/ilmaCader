import { Link, Outlet } from 'react-router-dom'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'

export function LandingLayout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B3D91]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <BrandLogo to="/welcome" size="sm" textClassName="text-lg text-white" />
          <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how-it-works" className="hover:text-white">How it works</a>
            <a href="#security" className="hover:text-white">Security</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link to="/">Sign in</Link>
            </Button>
            <Button asChild variant="accent">
              <Link to="/">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <BrandLogo to="/" size="sm" textClassName="text-sm text-foreground" />
          <p>© {new Date().getFullYear()} IlmaCader</p>
        </div>
      </footer>
    </div>
  )
}
