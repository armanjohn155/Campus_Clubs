import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AuthFrame } from '@/pages/auth/AuthFrame'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { getErrorDetails } from '@/lib/errors'
import { resetPassword } from '@/services/auth'
import type { FieldErrors } from '@/types'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setErrors({}); setMessage('')
    try {
      await resetPassword({ token, email, password, password_confirmation: confirmation })
      navigate('/auth/login?reset=success', { replace: true })
    } catch (error) {
      const details = getErrorDetails(error)
      setErrors(details.fields)
      setMessage(details.fields.email?.[0] ?? details.message)
    }
    finally { setBusy(false) }
  }

  return <AuthFrame title="Choose a new password" description="Set a new password for your student account." footer={<Link to="/auth/login">Back to sign in</Link>}>
    {!token || !email ? <p className="form-error" role="alert">This reset link is incomplete. Request a new link to continue.</p> : <form className="auth-form" onSubmit={submit}>
      <Field label="New password" name="password" error={errors.password?.[0]}><input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required aria-invalid={Boolean(errors.password)} /></Field>
      <Field label="Confirm new password" name="password_confirmation" error={errors.password_confirmation?.[0]}><input id="password_confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required aria-invalid={Boolean(errors.password_confirmation)} /></Field>
      {message && <p className="form-error" role="alert">{message}</p>}
      <Button type="submit" className="button-wide" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</Button>
    </form>}
  </AuthFrame>
}
