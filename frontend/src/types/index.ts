export type User = {
  id: number
  student_id: string
  email: string
  role: 'USER' | 'ADMIN'
  is_active: boolean
  full_name: string
  course: string
  year_level: number
  section: string
  phone: string | null
  address: string | null
  photo_url: string | null
  skills: string[]
}

export type MembershipStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'left' | 'removed'

export type MembershipSummary = {
  id: number
  status: MembershipStatus
  role: string
}

export type Club = {
  id: number
  name: string
  slug?: string
  category: string | null
  category_id?: number
  description: string
  logo_url: string | null
  adviser_name: string | null
  meeting_schedule: string | null
  contact_email: string | null
  member_count: number
  is_accepting_members: boolean
  status?: 'pending' | 'active' | 'inactive' | 'rejected'
  tags: string[]
  my_membership: MembershipSummary | null
}

export type ClubCategory = { id: number; name: string }

export type Paginated<T> = {
  data: T[]
  links?: Record<string, string | null>
  meta?: { current_page: number; last_page: number; total: number }
}

export type Session = { token: string; user: User }

export type Membership = {
  id: number
  status: MembershipStatus
  role: string
  message: string | null
  requested_at: string | null
  user: Pick<User, 'id' | 'student_id' | 'full_name' | 'course' | 'year_level'>
}

export type Announcement = {
  id: number
  club_id: number | null
  club_name: string
  title: string
  body: string
  created_at: string
}

export type AppNotification = {
  id: number
  type: string
  message: string
  reference_id: number | null
  is_read: boolean
  created_at: string
}

export type NotificationList = { unread_count: number; data: AppNotification[] }

export type AdminReport = {
  totals: { students: number; clubs: number; memberships: number; pending_clubs: number }
  members_per_club: Array<{ id: number; name: string; members: number }>
  students_without_club: number
  membership_growth: Array<{ month: string; total: number }>
}

export type FieldErrors = Record<string, string[] | undefined>
