import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { useAuth } from '@/components/context/useAuth'
import { getErrorDetails } from '@/lib/errors'
import { updateProfile } from '@/services/profile'
import type { FieldErrors } from '@/types'

export default function AcademicDetailsPage() {
  const { user, setUser } = useAuth()
  const [course, setCourse] = useState(user?.course ?? '')
  const [yearLevel, setYearLevel] = useState(String(user?.year_level ?? 1))
  const [section, setSection] = useState(user?.section ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setSaving(true); setErrors({}); setMessage('')
    try {
      const updated = await updateProfile({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone ?? undefined,
        address: user.address ?? undefined,
        course: course || undefined,
        year_level: Number(yearLevel),
        section: section || undefined,
        skills: user.skills,
      })
      setUser(updated); setMessage('Academic details saved.')
    } catch (reason) {
      const details = getErrorDetails(reason)
      setErrors(details.fields); setMessage(details.message)
    } finally { setSaving(false) }
  }

  return <div className="page-content"><section className="welcome-row"><div><span className="eyebrow">YOUR PROFILE</span><h1>Academic details<span className="heading-period">.</span></h1><p>Keep your program information current.</p></div><Link className="text-link" to="/home">← Home</Link></section>
    <form className="form-card profile-tool-form" onSubmit={submit}>
      <Field label="Course or program" name="academic_course" error={errors.course?.[0]}><input id="academic_course" maxLength={60} value={course} onChange={(event) => setCourse(event.target.value)} aria-invalid={Boolean(errors.course)} /></Field>
      <Field label="Year level" name="academic_year_level" error={errors.year_level?.[0]}><select id="academic_year_level" value={yearLevel} onChange={(event) => setYearLevel(event.target.value)} required aria-invalid={Boolean(errors.year_level)}>{[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>Year {year}</option>)}</select></Field>
      <Field label="Section" name="academic_section" error={errors.section?.[0]}><input id="academic_section" maxLength={10} value={section} onChange={(event) => setSection(event.target.value)} aria-invalid={Boolean(errors.section)} /></Field>
      {message && <p className={Object.values(errors).some(Boolean) ? 'form-error' : 'form-success'} role="status">{message}</p>}
      <div className="form-actions"><Button type="submit" disabled={saving || !user}>{saving ? 'Saving…' : 'Save academic details'}</Button></div>
    </form>
  </div>
}
