import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ErrorState, LoadingState } from '@/components/common/States'
import { useAuth } from '@/components/context/useAuth'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { getErrorDetails } from '@/lib/errors'
import { getSkills, updateProfile } from '@/services/profile'
import type { FieldErrors } from '@/types'

export default function SkillsInterestsPage() {
  const { user, setUser } = useAuth()
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>(user?.skills ?? [])
  const [newSkill, setNewSkill] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    getSkills().then((skills) => {
      if (active) { setAvailableSkills(skills); setLoadError('') }
    }).catch(() => {
      if (active) setLoadError('Skills could not be loaded. Try again.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function addSkill() {
    const skill = newSkill.trim()
    if (!skill || selectedSkills.some((selected) => selected.toLowerCase() === skill.toLowerCase())) return
    setSelectedSkills((current) => [...current, skill])
    setAvailableSkills((current) => current.includes(skill) ? current : [...current, skill].sort((left, right) => left.localeCompare(right)))
    setNewSkill('')
  }

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
        course: user.course || undefined,
        year_level: user.year_level,
        section: user.section || undefined,
        skills: selectedSkills,
      })
      setUser(updated); setSelectedSkills(updated.skills); setMessage('Skills and interests saved.')
    } catch (reason) {
      const details = getErrorDetails(reason)
      setErrors(details.fields); setMessage(details.message)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="page-content"><LoadingState label="Loading skills" /></div>
  if (loadError) return <div className="page-content"><ErrorState message={loadError} onRetry={() => { setLoading(true); void getSkills().then(setAvailableSkills).catch(() => setLoadError('Skills could not be loaded. Try again.')).finally(() => setLoading(false)) }} /></div>

  return <div className="page-content"><section className="welcome-row"><div><span className="eyebrow">YOUR PROFILE</span><h1>Skills & interests<span className="heading-period">.</span></h1><p>Select your strengths and add skills that are not listed yet.</p></div><Link className="text-link" to="/home">← Home</Link></section>
    <form className="form-card profile-tool-form" onSubmit={submit}>
      <Field label="Skills and interests" name="profile_skills" error={errors.skills?.[0]} hint="Use Ctrl or Command to select multiple items."><select id="profile_skills" multiple size={8} value={selectedSkills} onChange={(event) => setSelectedSkills(Array.from(event.currentTarget.selectedOptions, (option) => option.value))} aria-invalid={Boolean(errors.skills)}>{availableSkills.map((skill) => <option key={skill} value={skill}>{skill}</option>)}</select></Field>
      <div className="add-skill-row"><Field label="Add a skill" name="new_skill"><input id="new_skill" maxLength={40} value={newSkill} onChange={(event) => setNewSkill(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSkill() } }} /></Field><Button type="button" variant="outline" onClick={addSkill} disabled={!newSkill.trim()}>Add skill</Button></div>
      {message && <p className={errors.skills ? 'form-error' : 'form-success'} role="status">{message}</p>}
      <div className="form-actions"><Button type="submit" disabled={saving || !user}>{saving ? 'Saving…' : 'Save skills'}</Button></div>
    </form>
  </div>
}
