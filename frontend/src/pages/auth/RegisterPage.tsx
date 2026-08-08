import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const isLoading = useAuthStore((s) => s.isLoading)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    family_name: '',
    password: '',
    confirm_password: '',
  })

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    try {
      await register(form)
      toast.success('Account created. Please verify your email, then sign in.')
      navigate('/login')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Registration failed'))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Create your family space</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Register as the family admin and start organizing records.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="family_name">Family name</Label>
          <Input id="family_name" required value={form.family_name} onChange={(e) => update('family_name', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm</Label>
            <Input id="confirm_password" type="password" required minLength={8} value={form.confirm_password} onChange={(e) => update('confirm_password', e.target.value)} />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
