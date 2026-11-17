import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ErrorState, LoadingState } from '@/components/common/States'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { getErrorDetails } from '@/lib/errors'
import { createClub, getClubCategories } from '@/services/clubs'
import type { Club, ClubCategory, FieldErrors } from '@/types'

export default function ProposeClubPage() {
  const [categories, setCategories] = useState<ClubCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [proposal, setProposal] = useState<Club | null>(null)
  const [busy, setBusy] = useState(false)
  const [values, setValues] = useState({ name: '', category_id: '', description: '', adviser_name: '', meeting_schedule: '', contact_email: '', tags: '' })

  useEffect(() => {
    let active = true
    getClubCategories().then((items) => { if (active) { setCategories(items); setLoadError('') } })
      .catch(() => { if (active) setLoadError('Categories could not be loaded. Try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setErrors({}); setMessage('')
    const tags = [...new Set(values.tags.split(',').map((tag) => tag.trim()).filter(Boolean))]
    if (tags.length > 6) {
      setErrors({ tags: ['Add no more than six tags.'] }); setBusy(false); return
    }
    try {
      const result = await createClub({
        name: values.name,
        category_id: Number(values.category_id),
        description: values.description,
        adviser_name: values.adviser_name || undefined,
        meeting_schedule: values.meeting_schedule || undefined,
        contact_email: values.contact_email || undefined,
        tags,
      })
      setProposal(result)
    } catch (reason) {
      const details = getErrorDetails(reason)
      setErrors(details.fields); setMessage(details.message)
    } finally { setBusy(false) }
  }

  if (loading) return <div className="page-content"><LoadingState label="Loading club categories" /></div>
  if (loadError) return <div className="page-content"><ErrorState message={loadError} onRetry={() => { setLoading(true); setLoadError(''); void getClubCategories().then(setCategories).catch(() => setLoadError('Categories could not be loaded. Try again.')).finally(() => setLoading(false)) }} /></div>
  if (proposal) return <div className="page-content"><section className="content-section"><span className="eyebrow">PROPOSAL SUBMITTED</span><h1>{proposal.name}<span className="heading-period">.</span></h1><p className="club-status-badge">Pending admin approval</p><p>Your club proposal is in the review queue.</p><div className="form-actions"><Link to="/my-clubs"><Button>View my clubs</Button></Link><Link to="/"><Button variant="outline">Explore clubs</Button></Link></div></section></div>

  return <div className="page-content"><section className="welcome-row"><div><span className="eyebrow">START A COMMUNITY</span><h1>Propose a club<span className="heading-period">.</span></h1><p>Share the details with campus administrators for approval.</p></div><Link className="text-link" to="/my-clubs">← My clubs</Link></section>
    {message && <p className="form-error" role="alert">{message}</p>}
    <form className="form-card proposal-form" onSubmit={submit}>
      <Field label="Club name" name="club_name" error={errors.name?.[0]}><input id="club_name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} required minLength={3} maxLength={60} aria-invalid={Boolean(errors.name)} /></Field>
      <Field label="Category" name="club_category" error={errors.category_id?.[0]}><select id="club_category" value={values.category_id} onChange={(event) => setValues({ ...values, category_id: event.target.value })} required aria-invalid={Boolean(errors.category_id)}><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
      <Field label="Description" name="club_description" error={errors.description?.[0]} hint={`${values.description.length}/500 characters`}><textarea id="club_description" value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} required maxLength={500} rows={5} aria-invalid={Boolean(errors.description)} /></Field>
      <Field label="Adviser" name="club_adviser" error={errors.adviser_name?.[0]}><input id="club_adviser" value={values.adviser_name} onChange={(event) => setValues({ ...values, adviser_name: event.target.value })} maxLength={120} aria-invalid={Boolean(errors.adviser_name)} /></Field>
      <Field label="Meeting schedule" name="club_schedule" error={errors.meeting_schedule?.[0]}><input id="club_schedule" value={values.meeting_schedule} onChange={(event) => setValues({ ...values, meeting_schedule: event.target.value })} maxLength={120} aria-invalid={Boolean(errors.meeting_schedule)} /></Field>
      <Field label="Contact email" name="club_contact_email" error={errors.contact_email?.[0]}><input id="club_contact_email" type="email" value={values.contact_email} onChange={(event) => setValues({ ...values, contact_email: event.target.value })} aria-invalid={Boolean(errors.contact_email)} /></Field>
      <Field label="Tags" name="club_tags" error={errors.tags?.[0]} hint="Separate tags with commas. Up to six."><input id="club_tags" value={values.tags} onChange={(event) => setValues({ ...values, tags: event.target.value })} aria-invalid={Boolean(errors.tags)} /></Field>
      <div className="form-actions"><Button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit proposal'}</Button><Link to="/my-clubs"><Button type="button" variant="outline">Cancel</Button></Link></div>
    </form>
  </div>
}
