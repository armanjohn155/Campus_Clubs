import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getClub } from '@/services/clubs'
import type { Club } from '@/types/club'

export default function ClubDetailsPage() {
  const { id = '' } = useParams()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
    setLoading(true)
    setError(false)
    getClub(id)
      .then((item) => { if (!cancelled) setClub(item) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    }, 0)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [id, retry])

  return (
    <main className="detail-page">
      <header className="detail-topbar"><Link className="brand" to="/"><span className="brand-mark">c<span>.</span></span><span>campus<span className="brand-light">clubs</span></span></Link><Link className="text-link" to="/">← Back to clubs</Link></header>
      <div className="detail-content">
        {loading && <section className="detail-panel detail-skeleton" aria-label="Loading club details" aria-busy="true"><span /><span /><span /><span /></section>}
        {error && <section className="empty-state" role="alert"><h1>Club details couldn’t be loaded</h1><p>Check your connection and try again.</p><button className="text-link" type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button></section>}
        {!loading && !error && club && <article className="detail-panel">
          <span className="club-category">{club.category}</span>
          <h1>{club.name}</h1>
          <p className="detail-description">{club.description}</p>
          <dl className="detail-facts">
            <div><dt>Members</dt><dd>{club.member_count}</dd></div>
            <div><dt>Membership</dt><dd>{club.is_accepting_members ? 'Open' : 'Closed'}</dd></div>
            <div><dt>Adviser</dt><dd>{club.adviser_name || 'Not provided'}</dd></div>
            <div><dt>Meeting schedule</dt><dd>{club.meeting_schedule || 'Not provided'}</dd></div>
            <div><dt>Contact</dt><dd>{club.contact_email || 'Not provided'}</dd></div>
          </dl>
          {(club.tags?.length ?? 0) > 0 && <div className="club-skills">{club.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        </article>}
      </div>
    </main>
  )
}
