import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import loginBg from '@/assets/WhatsApp Image 2026-07-26 at 14.23.39.jpeg'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login(email, password, remember)
      toast.success('Welcome back')
      const from = (location.state as { from?: string } | null)?.from || '/app'
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed'))
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/45" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-[400px]"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo to={undefined} size="xl" showText={false} className="justify-center" />
          <p className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Family Data Center
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@family.com"
              className="h-11 border-0 bg-white text-foreground shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border-0 bg-white text-foreground shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <Label htmlFor="remember" className="text-sm font-normal text-white">
              Remember me
            </Label>
            <Switch id="remember" checked={remember} onCheckedChange={setRemember} />
          </div>

          <Button type="submit" className="h-11 w-full text-base" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-white/70">
          Accounts are created by an admin only.
        </p>
      </motion.div>
    </div>
  )
}
