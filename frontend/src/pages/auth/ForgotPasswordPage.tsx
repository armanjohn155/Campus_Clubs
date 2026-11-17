import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthFrame } from '@/pages/auth/AuthFrame'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { getErrorDetails } from '@/lib/errors'
import { sendPasswordReset } from '@/services/auth'
import type { FieldErrors } from '@/types'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setErrors({}); setMessage('')
    try { const result = await sendPasswordReset(email); setMessage(result.message); setSent(true) }
    catch (error) { const details = getErrorDetails(error); setErrors(details.fields); setMessage(details.message) }
    finally { setBusy(false) }
  }

  return <AuthFrame title="Reset your password" description="Enter the email on your account. If it exists, the reset instructions will be sent." footer={<Link to="/auth/login">Back to sign in</Link>}>
    <form className="auth-form" onSubmit={submit}>
      <Field label="Student email" name="email" error={errors.email?.[0]}><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required aria-invalid={Boolean(errors.email)} /></Field>
      {message && <p className={sent ? 'form-success' : 'form-error'} role="status">{message}</p>}
      <Button type="submit" className="button-wide" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</Button>
    </form>
  </AuthFrame>
}
