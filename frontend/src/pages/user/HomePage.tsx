import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/components/context/useAuth'
import { getAnnouncements } from '@/services/announcements'
import { getMyClubs } from '@/services/clubs'
import type { Announcement, Club } from '@/types'

export default function HomePage() {
  const { user } = useAuth()
  const [clubs, setClubs] = useState<Club[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      await Promise.resolve()
      setLoading(true)
      setError('')
      try {
        const [myClubs, feed] = await Promise.all([getMyClubs(), getAnnouncements()])
        if (active) { setClubs(myClubs); setAnnouncements(feed.slice(0, 4)) }
      } catch { if (active) setError('Your home feed could not be loaded. Check your connection and retry.') }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [retryKey])

  return <div className="page-content">
    <section className="welcome-row"><div><span className="eyebrow">YOUR CAMPUS</span><h1>Welcome, {user?.full_name.split(' ')[0]}<span className="heading-period">.</span></h1><p>Pick up where your campus community left off.</p></div><Link to="/profile"><Button variant="outline">View profile</Button></Link></section>
    <section className="profile-card-home">
      <div className="avatar profile-avatar-home" aria-hidden="true">{user?.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
      <div><span className="eyebrow">YOUR PROFILE</span><h2>{user?.full_name}</h2><p>{user?.course || 'Course not added'}{user?.year_level ? ` · Year ${user.year_level}` : ''}{user?.section ? ` · Section ${user.section}` : ''}</p></div>
      <Link className="text-link" to="/profile/edit">Edit details <span aria-hidden="true">→</span></Link>
    </section>
    <section className="content-section quick-access-section"><div className="section-heading"><div><span className="eyebrow">PROFILE TOOLS</span><h2>Quick access<span className="heading-period">.</span></h2></div></div><div className="quick-access-grid"><Link className="quick-access-card" to="/profile/academic"><span aria-hidden="true">⌂</span><strong>Academic details</strong><small>Update your course, year, and section.</small></Link><Link className="quick-access-card" to="/profile/skills"><span aria-hidden="true">✳</span><strong>Skills & interests</strong><small>Choose skills and add new interests.</small></Link></div></section>
    {error && <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} />}
    <section className="content-section"><div className="section-heading"><div><span className="eyebrow">YOUR COMMUNITY</span><h2>My clubs<span className="heading-period">.</span></h2></div><Link className="text-link" to="/my-clubs">View all →</Link></div>
      {loading && <div className="club-grid">{Array.from({ length: 2 }, (_, index) => <LoadingState key={index} label="Loading your clubs" />)}</div>}
      {!loading && !error && clubs.length === 0 && <EmptyState title="You haven’t joined a club yet" description="Explore the directory and send a membership request." />}
      {!loading && !error && clubs.length > 0 && <div className="compact-card-grid">{clubs.slice(0, 3).map((club) => <Link className="compact-club-card" key={club.id} to={`/clubs/${club.id}`}><span className="club-category">{club.category}</span><strong>{club.name}</strong><small>{club.my_membership?.status === 'pending' ? 'Request pending' : 'Approved member'} · {club.member_count} members</small></Link>)}</div>}
    </section>
    <section className="content-section"><div className="section-heading"><div><span className="eyebrow">CAMPUS UPDATES</span><h2>Latest announcements<span className="heading-period">.</span></h2></div><Link className="text-link" to="/announcements">View feed →</Link></div>
      {loading && <LoadingState label="Loading announcements" />}
      {!loading && !error && announcements.length === 0 && <EmptyState title="No announcements yet" description="Club updates will appear here when they’re posted." />}
      {!loading && !error && announcements.length > 0 && <div className="announcement-board">{announcements.map((item) => <article className="announcement-card" key={item.id}><span className="announcement-tag">{item.club_name}</span><time className="announcement-date" dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString()}</time><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>}
    </section>
  </div>
}
