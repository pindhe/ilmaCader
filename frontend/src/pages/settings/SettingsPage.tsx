import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { changePassword, updateMe } from '@/api/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    preferred_language: user?.preferred_language || 'en',
    preferred_currency: user?.preferred_currency || 'USD',
  })
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const profileMutation = useMutation({
    mutationFn: () => updateMe(profile),
    onSuccess: (updated) => {
      setUser(updated)
      toast.success('Profile updated')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const passwordMutation = useMutation({
    mutationFn: () => changePassword(passwords),
    onSuccess: () => {
      toast.success('Password changed')
      setPasswords({ current_password: '', new_password: '', confirm_password: '' })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account preferences" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                profileMutation.mutate()
              }}
            >
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={profile.preferred_language} onValueChange={(v) => setProfile({ ...profile, preferred_language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="so">Somali</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={profile.preferred_currency} onChange={(e) => setProfile({ ...profile, preferred_currency: e.target.value })} />
                </div>
              </div>
              <Button type="submit" disabled={profileMutation.isPending}>Save profile</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Label>Theme</Label>
            <Select value={theme || 'system'} onValueChange={setTheme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
          <CardContent>
            <form
              className="grid gap-3 md:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault()
                passwordMutation.mutate()
              }}
            >
              <div className="space-y-2">
                <Label>Current password</Label>
                <Input type="password" required value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>New password</Label>
                <Input type="password" required minLength={8} value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Confirm password</Label>
                <Input type="password" required minLength={8} value={passwords.confirm_password} onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })} />
              </div>
              <div className="md:col-span-3">
                <Button type="submit" disabled={passwordMutation.isPending}>Update password</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
