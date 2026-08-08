import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { ProtectedRoute, SuperAdminRoute } from '@/components/auth/ProtectedRoute'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { LandingLayout } from '@/layouts/LandingLayout'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { AnnouncementsPage } from '@/pages/announcements/AnnouncementsPage'
import { ActivityLogsPage } from '@/pages/activity/ActivityLogsPage'
import { RoleHomePage } from '@/pages/dashboard/RoleHomePage'
import { DocumentsPage } from '@/pages/documents/DocumentsPage'
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage'
import { NotFoundPage } from '@/pages/errors/NotFoundPage'
import { ServerErrorPage } from '@/pages/errors/ServerErrorPage'
import { EventsPage } from '@/pages/events/EventsPage'
import { FamilyProfilePage } from '@/pages/family/FamilyProfilePage'
import { AssetsPage } from '@/pages/finance/AssetsPage'
import { BudgetPage } from '@/pages/finance/BudgetPage'
import { ContributionsPage } from '@/pages/finance/ContributionsPage'
import { DebtsPage } from '@/pages/finance/DebtsPage'
import { ExpensesPage } from '@/pages/finance/ExpensesPage'
import { FinancesHubPage } from '@/pages/finance/FinancesHubPage'
import { GoalsPage } from '@/pages/finance/GoalsPage'
import { IncomePage } from '@/pages/finance/IncomePage'
import { SavingsPage } from '@/pages/finance/SavingsPage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { FamilyTreePage } from '@/pages/members/FamilyTreePage'
import { MemberDetailPage } from '@/pages/members/MemberDetailPage'
import { MembersPage } from '@/pages/members/MembersPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { TasksPage } from '@/pages/tasks/TasksPage'
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

              <Route element={<AuthLayout />}>
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
              </Route>
              <Route path="register" element={<Navigate to="/" replace />} />

              <Route element={<LandingLayout />}>
                <Route path="welcome" element={<LandingPage />} />
              </Route>

              <Route path="app" element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route index element={<RoleHomePage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="announcements" element={<AnnouncementsPage />} />
                  <Route path="settings" element={<SettingsPage />} />

                  <Route element={<AdminRoute />}>
                    <Route path="members" element={<MembersPage />} />
                    <Route path="members/:id" element={<MemberDetailPage />} />
                    <Route path="family-tree" element={<FamilyTreePage />} />
                    <Route path="finances" element={<FinancesHubPage />} />
                    <Route path="finances/income" element={<IncomePage />} />
                    <Route path="finances/expenses" element={<ExpensesPage />} />
                    <Route path="finances/contributions" element={<ContributionsPage />} />
                    <Route path="finances/savings" element={<SavingsPage />} />
                    <Route path="finances/budget" element={<BudgetPage />} />
                    <Route path="finances/assets" element={<AssetsPage />} />
                    <Route path="finances/debts" element={<DebtsPage />} />
                    <Route path="finances/goals" element={<GoalsPage />} />
                    <Route path="documents" element={<DocumentsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="activity" element={<ActivityLogsPage />} />
                    <Route path="family" element={<FamilyProfilePage />} />
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
