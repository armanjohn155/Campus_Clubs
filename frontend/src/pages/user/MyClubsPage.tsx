import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States'
import { Button } from '@/components/ui/Button'
import { getErrorDetails } from '@/lib/errors'
import { cancelJoinRequest, getMyClubs, leaveClub } from '@/services/clubs'
import type { Club } from '@/types'

export default function MyClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const load = useCallback(async () => {
    await Promise.resolve()
    setLoading(true); setError('')
    try { setClubs(await getMyClubs()) } catch { setError('Your clubs could not be loaded. Try again.') } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load, retryKey])

  async function handleExit(club: Club) {
    setBusyId(club.id); setActionError('')
    try {
      if (club.my_membership?.status === 'pending') await cancelJoinRequest(club.id)
      else await leaveClub(club.id)
      setClubs((current) => current.filter((item) => item.id !== club.id))
    } catch (reason) { setActionError(getErrorDetails(reason).message) } finally { setBusyId(null) }
  }

  return <div className="page-content"><section className="welcome-row"><div><span className="eyebrow">YOUR COMMUNITY</span><h1>My clubs<span className="heading-period">.</span></h1><p>Track requests and manage your memberships.</p></div><Link to="/"><Button variant="outline">Explore clubs</Button></Link></section>
    {actionError && <p className="form-error" role="alert">{actionError}</p>}
    {loading && <div className="compact-card-grid">{Array.from({ length: 3 }, (_, index) => <LoadingState key={index} label="Loading clubs" />)}</div>}
    {!loading && error && <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} />}
    {!loading && !error && clubs.length === 0 && <EmptyState title="No clubs yet" description="Join a club or send a request from Explore clubs." />}
    {!loading && !error && clubs.length > 0 && <div className="compact-card-grid">{clubs.map((club) => <article className="compact-club-card" key={club.id}><span className="club-category">{club.category}</span><Link to={`/clubs/${club.id}`}><strong>{club.name}</strong></Link><small>{club.my_membership?.status === 'pending' ? 'Request pending' : `${club.my_membership?.role ?? 'member'} · ${club.member_count} members`}</small><div className="card-actions"><Link className="text-link" to={`/clubs/${club.id}`}>Details</Link>{club.my_membership?.status === 'approved' && club.my_membership.role !== 'member' && <Link className="text-link" to={`/clubs/${club.id}/officer`}>Officer tools</Link>}<Button variant="quiet" size="small" disabled={busyId === club.id} onClick={() => void handleExit(club)}>{busyId === club.id ? 'Saving…' : club.my_membership?.status === 'pending' ? 'Cancel request' : 'Leave club'}</Button></div></article>)}</div>}
  </div>
}
