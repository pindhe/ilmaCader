import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { requestPasswordReset } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getErrorMessage } from '@/lib/utils'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
      toast.success('If that email exists, a reset link was sent.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not request reset'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send reset instructions.
      </p>
      {sent ? (
        <div className="mt-8 space-y-4">
          <p className="rounded-xl border border-border bg-muted/50 p-4 text-sm">
            Check your inbox for a reset link. You can also continue to the reset page if you already
            have a token.
          </p>
          <Button asChild className="w-full">
            <Link to="/reset-password">Enter reset token</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
