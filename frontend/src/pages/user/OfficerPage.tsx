import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { getErrorDetails } from '@/lib/errors'
import { createAnnouncement, deleteAnnouncement, getAnnouncements, updateAnnouncement } from '@/services/announcements'
import { getClub, updateClub } from '@/services/clubs'
import { getClubMembers, getClubRequests, updateMembership } from '@/services/memberships'
import type { Announcement, Club, FieldErrors, Membership } from '@/types'

const officerRoles = ['member', 'secretary', 'treasurer', 'vice_president', 'president']

export default function OfficerPage() {
  const { id = '' } = useParams()
  const clubId = Number(id)
  const [club, setClub] = useState<Club | null>(null)
  const [requests, setRequests] = useState<Membership[]>([])
  const [members, setMembers] = useState<Membership[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formErrors, setFormErrors] = useState<FieldErrors>({})
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  const load = useCallback(async () => {
    await Promise.resolve()
    setLoading(true); setError('')
    try {
      const [clubData, pending, roster, feed] = await Promise.all([getClub(clubId), getClubRequests(clubId), getClubMembers(clubId), getAnnouncements()])
      setClub(clubData); setRequests(pending); setMembers(roster); setAnnouncements(feed.filter((item) => item.club_id === clubId))
    } catch (reason) { setError(getErrorDetails(reason).message || 'Officer tools could not be loaded.') }
    finally { setLoading(false) }
  }, [clubId])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load, retryKey])

  async function decide(item: Membership, status: 'approved' | 'rejected') {
    setBusyId(item.id); setActionError('')
    try { await updateMembership(item.id, { status }); await load() }
    catch (reason) { setActionError(getErrorDetails(reason).message) }
    finally { setBusyId(null) }
  }

  async function changeRole(item: Membership, role: string) {
    const previous = item.role
    setActionError(''); setMembers((current) => current.map((member) => member.id === item.id ? { ...member, role } : member))
    try { await updateMembership(item.id, { role }) }
    catch (reason) { setMembers((current) => current.map((member) => member.id === item.id ? { ...member, role: previous } : member)); setActionError(getErrorDetails(reason).message) }
  }

  async function removeMember(item: Membership) {
    setBusyId(item.id); setActionError('')
    try { await updateMembership(item.id, { status: 'removed' }); setMembers((current) => current.filter((member) => member.id !== item.id)) }
    catch (reason) { setActionError(getErrorDetails(reason).message) }
    finally { setBusyId(null) }
  }

  async function submitAnnouncement(event: FormEvent) {
    event.preventDefault(); setSavingAnnouncement(true); setFormErrors({}); setActionError('')
    try {
      const payload = { title, body }
      const result = editingId ? await updateAnnouncement(editingId, payload) : await createAnnouncement(clubId, payload)
      setAnnouncements((current) => editingId ? current.map((item) => item.id === editingId ? result : item) : [result, ...current])
      setTitle(''); setBody(''); setEditingId(null)
    } catch (reason) { const details = getErrorDetails(reason); setFormErrors(details.fields); setActionError(details.message) }
    finally { setSavingAnnouncement(false) }
  }

  function beginEdit(item: Announcement) { setEditingId(item.id); setTitle(item.title); setBody(item.body); setFormErrors({}) }

  async function removeAnnouncement(item: Announcement) {
    setActionError('')
    try { await deleteAnnouncement(item.id); setAnnouncements((current) => current.filter((entry) => entry.id !== item.id)) }
    catch (reason) { setActionError(getErrorDetails(reason).message) }
  }

  if (loading) return <div className="page-content"><LoadingState label="Loading officer tools" /></div>
  if (error || !club) return <div className="page-content"><ErrorState message={error || 'Club not found.'} onRetry={() => setRetryKey((key) => key + 1)} /></div>

  return <div className="page-content"><section className="welcome-row"><div><Link className="text-link" to={`/clubs/${club.id}`}>← {club.name}</Link><span className="eyebrow">OFFICER TOOLS</span><h1>Manage your club<span className="heading-period">.</span></h1><p>Review requests, manage members, and publish updates.</p></div></section>
    {actionError && <p className="form-error" role="alert">{actionError}</p>}
    <ClubSettingsForm club={club} onSaved={setClub} />
    <section className="content-section"><div className="section-heading"><div><span className="eyebrow">MEMBERSHIP</span><h2>Pending requests<span className="heading-period">.</span></h2></div></div>
      {requests.length === 0 ? <EmptyState title="No pending requests" description="New requests will appear here." /> : <div className="table-wrap" role="region" aria-label="Scrollable pending join requests" tabIndex={0}><table aria-label="Pending join requests"><thead><tr><th>Student</th><th>Program</th><th>Message</th><th>Requested</th><th>Actions</th></tr></thead><tbody>{requests.map((item) => <tr key={item.id}><td><strong>{item.user.full_name}</strong><small>{item.user.student_id}</small></td><td>{item.user.course} · Year {item.user.year_level}</td><td>{item.message || '—'}</td><td>{item.requested_at ? new Date(item.requested_at).toLocaleDateString() : '—'}</td><td className="table-actions"><Button size="small" disabled={busyId === item.id} onClick={() => void decide(item, 'approved')}>Approve</Button><Button size="small" variant="outline" disabled={busyId === item.id} onClick={() => void decide(item, 'rejected')}>Reject</Button></td></tr>)}</tbody></table></div>}
    </section>
    <section className="content-section"><div className="section-heading"><div><span className="eyebrow">ROSTER</span><h2>Club members<span className="heading-period">.</span></h2></div></div>
      {members.length === 0 ? <EmptyState title="No members yet" description="Approved members will appear here." /> : <div className="table-wrap" role="region" aria-label="Scrollable club roster" tabIndex={0}><table aria-label="Approved club members"><thead><tr><th>Student</th><th>Program</th><th>Role</th><th>Actions</th></tr></thead><tbody>{members.map((item) => <tr key={item.id}><td><strong>{item.user.full_name}</strong><small>{item.user.student_id}</small></td><td>{item.user.course} · Year {item.user.year_level}</td><td><label className="sr-only" htmlFor={`role-${item.id}`}>Role for {item.user.full_name}</label><select id={`role-${item.id}`} value={item.role} onChange={(event) => void changeRole(item, event.target.value)}>{officerRoles.map((role) => <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>)}</select></td><td><Button variant="danger" size="small" disabled={busyId === item.id} onClick={() => void removeMember(item)}>Remove</Button></td></tr>)}</tbody></table></div>}
    </section>
    <section className="content-section"><div className="section-heading"><div><span className="eyebrow">COMMUNICATION</span><h2>Announcements<span className="heading-period">.</span></h2></div></div>
      <form className="form-card announcement-form" onSubmit={submitAnnouncement}>
        <h3>{editingId ? 'Edit announcement' : 'Post an announcement'}</h3>
        <Field label="Title" name="announcement_title" error={formErrors.title?.[0]}><input id="announcement_title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={100} /></Field>
        <Field label="Message" name="announcement_body" error={formErrors.body?.[0]}><textarea id="announcement_body" rows={4} value={body} onChange={(event) => setBody(event.target.value)} required maxLength={1000} /></Field>
        <div className="form-actions"><Button type="submit" disabled={savingAnnouncement}>{savingAnnouncement ? 'Saving…' : editingId ? 'Save changes' : 'Post announcement'}</Button>{editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setTitle(''); setBody('') }}>Cancel edit</Button>}</div>
      </form>
      {announcements.length === 0 ? <EmptyState title="No announcements yet" description="Your club updates will be shown here." /> : <div className="announcement-board">{announcements.map((item) => <article className="announcement-card" key={item.id}><time className="announcement-date" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time><h3>{item.title}</h3><p>{item.body}</p><div className="card-actions"><Button variant="quiet" size="small" onClick={() => beginEdit(item)}>Edit</Button><Button variant="danger" size="small" onClick={() => void removeAnnouncement(item)}>Delete</Button></div></article>)}</div>}
    </section>
  </div>
}

function ClubSettingsForm({ club, onSaved }: { club: Club; onSaved: (club: Club) => void }) {
  const [description, setDescription] = useState(club.description)
  const [adviser, setAdviser] = useState(club.adviser_name ?? '')
  const [schedule, setSchedule] = useState(club.meeting_schedule ?? '')
  const [contactEmail, setContactEmail] = useState(club.contact_email ?? '')
  const [tags, setTags] = useState(club.tags.join(', '))
  const [accepting, setAccepting] = useState(club.is_accepting_members)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true); setErrors({}); setMessage('')
    const normalizedTags = [...new Set(tags.split(',').map((tag) => tag.trim()).filter(Boolean))]
    if (normalizedTags.length > 6) {
      setErrors({ tags: ['Add no more than six tags.'] }); setSaving(false); return
    }
    try {
      const updated = await updateClub(club.id, {
        description,
        adviser_name: adviser,
        meeting_schedule: schedule,
        contact_email: contactEmail,
        is_accepting_members: accepting,
        tags: normalizedTags,
      })
      onSaved(updated)
      setMessage('Club settings saved.')
    } catch (reason) {
      const details = getErrorDetails(reason)
      setErrors(details.fields); setMessage(details.message)
    } finally { setSaving(false) }
  }

  return <section className="content-section"><div className="section-heading"><div><span className="eyebrow">CLUB PROFILE</span><h2>Club settings<span className="heading-period">.</span></h2></div></div>
    <form className="form-card club-settings-form" onSubmit={submit}>
      <Field label="Description" name="club_settings_description" error={errors.description?.[0]}><textarea id="club_settings_description" rows={4} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} required aria-invalid={Boolean(errors.description)} /></Field>
      <Field label="Adviser" name="club_settings_adviser" error={errors.adviser_name?.[0]}><input id="club_settings_adviser" maxLength={120} value={adviser} onChange={(event) => setAdviser(event.target.value)} aria-invalid={Boolean(errors.adviser_name)} /></Field>
      <Field label="Meeting schedule" name="club_settings_schedule" error={errors.meeting_schedule?.[0]}><input id="club_settings_schedule" maxLength={120} value={schedule} onChange={(event) => setSchedule(event.target.value)} aria-invalid={Boolean(errors.meeting_schedule)} /></Field>
      <Field label="Contact email" name="club_settings_contact" error={errors.contact_email?.[0]}><input id="club_settings_contact" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} aria-invalid={Boolean(errors.contact_email)} /></Field>
      <Field label="Tags" name="club_settings_tags" error={errors.tags?.[0]} hint="Separate tags with commas. Up to six."><input id="club_settings_tags" value={tags} onChange={(event) => setTags(event.target.value)} aria-invalid={Boolean(errors.tags)} /></Field>
      <label className="toggle-field" htmlFor="club_accepting_members"><input id="club_accepting_members" type="checkbox" checked={accepting} onChange={(event) => setAccepting(event.target.checked)} />Accepting new members</label>
      {message && <p className={errors.description || errors.adviser_name || errors.meeting_schedule || errors.contact_email || errors.tags ? 'form-error' : 'form-success'} role="status">{message}</p>}
      <div className="form-actions"><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save club settings'}</Button></div>
    </form>
  </section>
}
