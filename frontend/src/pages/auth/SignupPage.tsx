import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthFrame } from '@/pages/auth/AuthFrame'
import { useAuth } from '@/components/context/useAuth'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { getErrorDetails } from '@/lib/errors'
import type { FieldErrors } from '@/types'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ student_id: '', full_name: '', email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function update(key: keyof typeof values, value: string) { setValues((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })) }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setErrors({}); setMessage('')
    try { await signUp(values); navigate('/home', { replace: true }) }
    catch (error) { const details = getErrorDetails(error); setErrors(details.fields); setMessage(details.message) }
    finally { setBusy(false) }
  }

  return <AuthFrame title="Create your account" description="Use your school details to join campus clubs." footer={<>Already registered? <Link to="/auth/login">Sign in</Link></>}>
    <form className="auth-form" onSubmit={submit}>
      <Field label="Student ID" name="student_id" error={errors.student_id?.[0]} hint="Format: 2026-12345"><input id="student_id" value={values.student_id} onChange={(event) => update('student_id', event.target.value)} autoComplete="off" required aria-invalid={Boolean(errors.student_id)} /></Field>
      <Field label="Full name" name="full_name" error={errors.full_name?.[0]}><input id="full_name" value={values.full_name} onChange={(event) => update('full_name', event.target.value)} autoComplete="name" required aria-invalid={Boolean(errors.full_name)} /></Field>
      <Field label="Student email" name="email" error={errors.email?.[0]}><input id="email" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" required aria-invalid={Boolean(errors.email)} /></Field>
      <Field label="Password" name="password" error={errors.password?.[0]} hint="At least 8 characters, including letters and numbers."><input id="password" type="password" value={values.password} onChange={(event) => update('password', event.target.value)} autoComplete="new-password" required aria-invalid={Boolean(errors.password)} /></Field>
      <Field label="Confirm password" name="password_confirmation" error={errors.password_confirmation?.[0]}><input id="password_confirmation" type="password" value={values.password_confirmation} onChange={(event) => update('password_confirmation', event.target.value)} autoComplete="new-password" required aria-invalid={Boolean(errors.password_confirmation)} /></Field>
      {message && <p className="form-error" role="alert">{message}</p>}
      <Button type="submit" className="button-wide" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
    </form>
  </AuthFrame>
}
