import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States'
import { Button } from '@/components/ui/Button'
import { getErrorDetails } from '@/lib/errors'
import { cancelJoinRequest, getClub, leaveClub, requestToJoin } from '@/services/clubs'
import type { Club } from '@/types'

export default function ClubDetailsPage() {
  const { id = '' } = useParams()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const load = useCallback(async () => {
    await Promise.resolve()
    setLoading(true); setError('')
    try { setClub(await getClub(id)) } catch { setError('Club details could not be loaded. Check your connection and retry.') } finally { setLoading(false) }
  }, [id])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load, retryKey])

  async function changeMembership() {
    if (!club) return
    const previous = club.my_membership
    setBusy(true); setActionError('')
    const pending = previous?.status === 'pending'
    const approved = previous?.status === 'approved'
    if (!pending && !approved) setClub({ ...club, my_membership: { id: -1, status: 'pending', role: 'member' } })
    try {
      if (pending) { await cancelJoinRequest(club.id); setClub({ ...club, my_membership: null }) }
      else if (approved) { await leaveClub(club.id); setClub({ ...club, my_membership: null }) }
      else { await requestToJoin(club.id) }
    } catch (reason) { setClub({ ...club, my_membership: previous }); setActionError(getErrorDetails(reason).message) }
    finally { setBusy(false) }
  }

  if (loading) return <div className="page-content"><LoadingState label="Loading club details" /></div>
  if (error || !club) return <div className="page-content"><ErrorState message={error || 'Club not found.'} onRetry={() => setRetryKey((key) => key + 1)} /></div>
  const membership = club.my_membership
  const isOfficer = membership?.status === 'approved' && membership.role !== 'member'
  const actionLabel = membership?.status === 'pending' ? 'Cancel request' : membership?.status === 'approved' ? 'Leave club' : club.is_accepting_members ? 'Request to join' : 'Membership closed'

  return <div className="page-content"><section className="welcome-row"><div><Link className="text-link" to="/">← Explore clubs</Link><span className="eyebrow club-details-eyebrow">{club.category}</span><h1>{club.name}<span className="heading-period">.</span></h1><p>{club.description}</p></div></section>
    <article className="detail-panel">
      <div className="club-card-top">{club.logo_url ? <img className="club-mark club-logo" src={club.logo_url} alt="" /> : <div className="club-mark mint" aria-hidden="true">{club.name.slice(0, 2).toUpperCase()}</div>}<span className="club-availability">{club.is_accepting_members ? 'Accepting members' : 'Membership closed'}</span></div>
      <dl className="detail-facts"><div><dt>Members</dt><dd>{club.member_count}</dd></div><div><dt>Membership</dt><dd>{membership?.status ?? 'Not a member'}</dd></div><div><dt>Adviser</dt><dd>{club.adviser_name || 'Not provided'}</dd></div><div><dt>Meeting schedule</dt><dd>{club.meeting_schedule || 'Not provided'}</dd></div><div><dt>Contact</dt><dd>{club.contact_email || 'Not provided'}</dd></div></dl>
      <section className="details-tags"><h2>Club tags</h2>{club.tags.length ? <div className="club-skills">{club.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : <EmptyState title="No tags added" description="This club has not added any interest tags yet." />}</section>
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      <div className="form-actions"><Button onClick={() => void changeMembership()} disabled={busy || (!membership && !club.is_accepting_members) || (membership?.status === 'approved' && membership.role === 'president' && club.member_count <= 1)} variant={membership?.status === 'approved' ? 'outline' : 'primary'}>{busy ? 'Saving…' : actionLabel}</Button>{isOfficer && <Link to={`/clubs/${club.id}/officer`}><Button variant="outline">Officer tools</Button></Link>}</div>
      {membership?.status === 'approved' && membership.role === 'president' && club.member_count <= 1 && <p className="field-hint">Assign another president before leaving.</p>}
    </article>
  </div>
}
