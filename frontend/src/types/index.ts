export type UserRole = 'super_admin' | 'family_admin' | 'family_member' | 'viewer'

export interface User {
  id: string
  email: string
  username: string
  full_name: string
  phone?: string
  role: UserRole
  avatar?: string | null
  preferred_language?: string
  preferred_currency?: string
  theme?: string
  email_verified?: boolean
  is_suspended?: boolean
  two_factor_enabled?: boolean
  date_joined?: string
  last_login?: string | null
}

export interface Family {
  id: string
  family_id: string
  name: string
  description?: string
  logo?: string | null
  country?: string
  city?: string
  address?: string
  phone?: string
  email?: string
  motto?: string
  date_established?: string | null
  currency?: string
  created_by?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
  member_count?: number
  total_assets?: number | string
  total_savings?: number | string
  active_goals?: number
}

export interface FamilyMembership {
  id: string
  family: string
  family_name?: string
  user: User
  role: UserRole | 'family_admin' | 'family_member' | 'viewer'
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface FamilyMember {
  id: string
  family: string
  user?: string | null
  full_name: string
  profile_photo?: string | null
  gender?: string
  date_of_birth?: string | null
  age?: number | null
  phone?: string
  email?: string
  occupation?: string
  education?: string
  city?: string
  country?: string
  marital_status?: string
  blood_type?: string
  emergency_contact?: string
  biography?: string
  joined_date?: string | null
  family_role?: string
  is_archived?: boolean
  is_deleted?: boolean
  created_at?: string
  updated_at?: string
}

export interface Relationship {
  id: string
  family: string
  from_member: string
  from_member_name?: string
  to_member: string
  to_member_name?: string
  relation_type: string
  notes?: string
}

export interface DashboardStats {
  family_id: string
  member_count: number
  monthly_income: number | string
  monthly_expenses: number | string
  savings: number | string
  assets: number | string
  active_goals: number
}

export interface Income {
  id: string
  family: string
  title: string
  amount: number | string
  currency?: string
  source?: string
  person?: string | null
  category?: string
  date: string
  description?: string
}

export interface Expense {
  id: string
  family: string
  title: string
  amount: number | string
  currency?: string
  category?: string
  paid_by?: string | null
  date: string
  description?: string
}

export interface Contribution {
  id: string
  family: string
  member?: string | null
  amount: number | string
  date: string
  contribution_type?: string
  purpose?: string
  payment_method?: string
  reference_number?: string
  notes?: string
}

export interface SavingGoal {
  id: string
  family: string
  title: string
  target_amount: number | string
  current_amount: number | string
  deadline?: string | null
  responsible_member?: string | null
  description?: string
  is_active?: boolean
  progress?: number
}

export interface Budget {
  id: string
  family: string
  category: string
  amount: number | string
  period: string
  year: number
  month?: number | null
}

export interface Asset {
  id: string
  family: string
  name: string
  asset_type: string
  owner?: string | null
  purchase_date?: string | null
  purchase_price?: number | string
  current_value: number | string
  location?: string
  description?: string
  status?: string
}

export interface Debt {
  id: string
  family: string
  name: string
  creditor?: string
  amount: number | string
  remaining_balance: number | string
  interest?: number | string
  due_date?: string | null
  responsible_member?: string | null
  status?: string
  notes?: string
}

export interface FinancialGoal {
  id: string
  family: string
  name: string
  description?: string
  target_amount: number | string
  current_amount: number | string
  deadline?: string | null
  priority?: string
  status?: string
  progress?: number
}

export interface EventItem {
  id: string
  family: string
  name: string
  event_type?: string
  date: string
  time?: string | null
  location?: string
  organizer?: string | null
  description?: string
}

export interface DocumentItem {
  id: string
  family: string
  title: string
  category?: string
  file?: string
  member?: string | null
  expiration_date?: string | null
  notes?: string
  status?: string
}

export interface TaskItem {
  id: string
  family: string
  title: string
  description?: string
  assigned_member?: string | null
  priority?: string
  due_date?: string | null
  status?: string
}

export interface Announcement {
  id: string
  family: string
  title: string
  message: string
  priority?: string
  audience?: string
  is_published?: boolean
  created_at?: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  notification_type?: string
  link?: string
  is_read: boolean
  created_at?: string
}

export interface ActivityLog {
  id: string
  action: string
  actor?: string
  details?: string
  created_at: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: unknown
}

export interface AuthTokens {
  access: string
  refresh: string
}
