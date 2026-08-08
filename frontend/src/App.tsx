import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { ProtectedRoute, SuperAdminRoute } from '@/components/auth/ProtectedRoute'
import { LandingLayout } from '@/layouts/LandingLayout'
import { RoleLayout } from '@/layouts/RoleLayout'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RoleHomePage } from '@/pages/dashboard/RoleHomePage'
import { DocumentsPage } from '@/pages/documents/DocumentsPage'
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage'
import { NotFoundPage } from '@/pages/errors/NotFoundPage'
import { ServerErrorPage } from '@/pages/errors/ServerErrorPage'
import { EventsPage } from '@/pages/events/EventsPage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { MemberDetailPage } from '@/pages/members/MemberDetailPage'
import { MemberHomePage } from '@/pages/members/MemberHomePage'
import { MembersPage } from '@/pages/members/MembersPage'
import { ParentsPage } from '@/pages/members/ParentsPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { useAuthStore } from '@/stores/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function AuthHydrator({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrowserRouter>
          <AuthHydrator>
            <Routes>
              <Route index element={<LoginPage />} />
              <Route path="login" element={<LoginPage />} />

              <Route path="forgot-password" element={<Navigate to="/" replace />} />
              <Route path="reset-password" element={<Navigate to="/" replace />} />
              <Route path="register" element={<Navigate to="/" replace />} />

              <Route element={<LandingLayout />}>
                <Route path="welcome" element={<LandingPage />} />
              </Route>

              <Route path="app" element={<ProtectedRoute />}>
                <Route element={<RoleLayout />}>
                  <Route index element={<RoleHomePage />} />
                  <Route path="my-info" element={<MemberHomePage />} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="settings" element={<SettingsPage />} />

                  {/* Admin-only: members, parents, update */}
                  <Route element={<AdminRoute />}>
                    <Route path="members" element={<MembersPage />} />
                    <Route path="members/:id" element={<MemberDetailPage />} />
                    <Route path="parents" element={<ParentsPage />} />
                  </Route>

                  <Route element={<SuperAdminRoute />}>
                    <Route path="admin" element={<AdminDashboardPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="forbidden" element={<ForbiddenPage />} />
              <Route path="server-error" element={<ServerErrorPage />} />
              <Route path="dashboard" element={<Navigate to="/app" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthHydrator>
        </BrowserRouter>
        <Toaster richColors position="top-right" closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
