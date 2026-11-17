import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ErrorState, LoadingState } from '@/components/common/States'
import { useAuth } from '@/components/context/useAuth'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { getErrorDetails } from '@/lib/errors'
import { getSkills, updateProfile, uploadProfilePhoto } from '@/services/profile'
import type { FieldErrors } from '@/types'

export default function EditProfilePage() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [skills, setSkills] = useState<string[]>([])
  const [skillsError, setSkillsError] = useState('')
  const [loadingSkills, setLoadingSkills] = useState(true)
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [values, setValues] = useState({ full_name: user?.full_name ?? '', student_id: user?.student_id ?? '', email: user?.email ?? '', phone: user?.phone ?? '', address: user?.address ?? '', course: user?.course ?? '', year_level: String(user?.year_level ?? 1), section: user?.section ?? '', selectedSkills: user?.skills ?? [] as string[] })

  useEffect(() => { let active = true; getSkills().then((items) => { if (active) { setSkills(items); setSkillsError('') } }).catch(() => { if (active) setSkillsError('Skills could not be loaded. Retry to edit your profile.') }).finally(() => { if (active) setLoadingSkills(false) }); return () => { active = false } }, [])

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) { setValues((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })) }
  function fieldError(key: string) { return errors[key]?.[0] }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setErrors({}); setMessage('')
    try {
      const updated = await updateProfile({ full_name: values.full_name, email: values.email, phone: values.phone || undefined, address: values.address || undefined, course: values.course || undefined, year_level: Number(values.year_level), section: values.section || undefined, skills: values.selectedSkills })
      setUser(updated); setMessage('Profile saved.');
    } catch (reason) { const details = getErrorDetails(reason); setErrors(details.fields); setMessage(details.message) } finally { setBusy(false) }
  }

  async function uploadPhoto(file?: File) {
    if (!file || !user) return
    setPhotoBusy(true); setPhotoError('')
    try { const result = await uploadProfilePhoto(file); setUser({ ...user, photo_url: result.photo_url }) }
    catch (reason) { setPhotoError(getErrorDetails(reason).message) } finally { setPhotoBusy(false) }
  }

  if (!user) return <div className="page-content"><LoadingState label="Loading profile" /></div>
  return <div className="page-content"><section className="welcome-row"><div><span className="eyebrow">ACCOUNT SETTINGS</span><h1>Edit profile<span className="heading-period">.</span></h1><p>Keep your student profile up to date.</p></div></section>
    <form className="form-card profile-form" onSubmit={submit}>
      <div className="form-grid">
        <Field label="Full name" name="full_name" error={fieldError('full_name')}><input id="full_name" value={values.full_name} onChange={(event) => update('full_name', event.target.value)} autoComplete="name" required aria-invalid={Boolean(fieldError('full_name'))} /></Field>
        <Field label="Student ID" name="student_id" hint="Student ID cannot be changed."><input id="student_id" value={values.student_id} readOnly aria-readonly="true" /></Field>
        <Field label="Email" name="email" error={fieldError('email')}><input id="email" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" required aria-invalid={Boolean(fieldError('email'))} /></Field>
        <Field label="Phone" name="phone" error={fieldError('phone')} hint="Use a Philippine number, for example +63 912 345 6789."><input id="phone" value={values.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" aria-invalid={Boolean(fieldError('phone'))} /></Field>
        <Field label="Course" name="course" error={fieldError('course')}><input id="course" value={values.course} onChange={(event) => update('course', event.target.value)} /></Field>
        <Field label="Year level" name="year_level" error={fieldError('year_level')}><select id="year_level" value={values.year_level} onChange={(event) => update('year_level', event.target.value)} required>{[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>{year}</option>)}</select></Field>
        <Field label="Section" name="section" error={fieldError('section')}><input id="section" value={values.section} onChange={(event) => update('section', event.target.value)} /></Field>
        <Field label="Address" name="address" error={fieldError('address')}><input id="address" value={values.address} onChange={(event) => update('address', event.target.value)} autoComplete="street-address" /></Field>
      </div>
      <Field label="Skills" name="skills" error={fieldError('skills')}>
        {loadingSkills ? <LoadingState label="Loading skills" /> : skillsError ? <ErrorState message={skillsError} onRetry={() => { setLoadingSkills(true); getSkills().then(setSkills).catch(() => setSkillsError('Skills could not be loaded. Retry.')).finally(() => setLoadingSkills(false)) }} /> : <select id="skills" multiple value={values.selectedSkills} onChange={(event) => update('selectedSkills', Array.from(event.target.selectedOptions, (option) => option.value))}>{skills.map((skill) => <option key={skill} value={skill}>{skill}</option>)}</select>}
      </Field>
      <Field label="Profile photo" name="photo" hint="JPG or PNG, up to 2 MB."><input id="photo" type="file" accept="image/jpeg,image/png" onChange={(event) => void uploadPhoto(event.target.files?.[0])} disabled={photoBusy} /></Field>
      {photoBusy && <p role="status">Uploading photo…</p>}{photoError && <p className="field-error" role="alert">{photoError}</p>}
      {message && <p className={Object.keys(errors).length ? 'form-error' : 'form-success'} role="status">{message}</p>}
      <div className="form-actions"><Button type="submit" disabled={busy || loadingSkills || Boolean(skillsError)}>{busy ? 'Saving…' : 'Save profile'}</Button><Button type="button" variant="outline" onClick={() => navigate('/profile')}>Cancel</Button></div>
    </form>
  </div>
}
