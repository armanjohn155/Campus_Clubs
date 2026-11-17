import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { getErrorDetails } from '@/lib/errors'
import { cancelJoinRequest, requestToJoin } from '@/services/clubs'
import type { Club, MembershipSummary } from '@/types'

function MembershipButton({ club }: { club: Club }) {
  const [membership, setMembership] = useState<MembershipSummary | null>(club.my_membership)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function toggleRequest() {
    const previous = membership
    setError('')
    setBusy(true)
    if (membership?.status === 'pending') {
      setMembership(null)
      try {
        await cancelJoinRequest(club.id)
      } catch (reason) {
        setMembership(previous)
        setError(getErrorDetails(reason).message)
      } finally {
        setBusy(false)
      }
      return
    }

    setMembership({ id: -1, status: 'pending', role: 'member' })
    try {
      await requestToJoin(club.id)
    } catch (reason) {
      setMembership(previous)
      setError(getErrorDetails(reason).message)
    } finally {
      setBusy(false)
    }
  }

  const approved = membership?.status === 'approved'
  const pending = membership?.status === 'pending'
  return <div className="membership-action">
    <Button
      size="small"
      variant={approved ? 'quiet' : pending ? 'outline' : 'primary'}
      disabled={busy || approved || !club.is_accepting_members}
      onClick={() => void toggleRequest()}
      aria-label={approved ? `Member of ${club.name}` : pending ? `Cancel request to join ${club.name}` : `Request to join ${club.name}`}
    >
      {busy ? 'Saving…' : approved ? 'Member' : pending ? 'Request sent · Cancel' : club.is_accepting_members ? 'Join club' : 'Membership closed'}
    </Button>
    {error && <span className="field-error" role="alert">{error}</span>}
  </div>
}

export function ClubCard({ club }: { club: Club }) {
  return (
    <article className="club-card">
      <div className="club-card-top">
        {club.logo_url ? <img className="club-mark club-logo" src={club.logo_url} alt="" /> : <div className="club-mark mint" aria-hidden="true">{club.name.slice(0, 2).toUpperCase()}</div>}
        <span className="club-category">{club.category}</span>
      </div>
      <h3>{club.name}</h3>
      <p className="club-description">{club.description}</p>
      <div className="club-skills" aria-label="Club tags">{club.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="club-card-bottom"><span className="member-count">{club.member_count} members</span><MembershipButton club={club} /></div>
      <Link className="club-details-link" to={`/clubs/${club.id}`}>View details <span aria-hidden="true">→</span></Link>
    </article>
  )
}
