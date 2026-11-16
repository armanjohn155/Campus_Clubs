export type Club = {
  id: number
  name: string
  slug: string
  category: string
  description: string
  logo_url: string | null
  adviser_name: string | null
  meeting_schedule: string | null
  contact_email: string | null
  member_count: number
  is_accepting_members: boolean
  status?: string
  tags?: string[]
  my_membership?: { id: number; status: string; role: string } | null
}

export type ClubCategory = { id: number; name: string }

export type Paginated<T> = {
  data: T[]
  links: Record<string, string | null>
  meta: { current_page: number; last_page: number; total: number }
}
