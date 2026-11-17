import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { AuthFrame } from '@/pages/auth/AuthFrame'
import { useAuth } from '@/components/context/useAuth'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { getErrorDetails } from '@/lib/errors'
import type { FieldErrors } from '@/types'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setErrors({}); setMessage('')
    try {
      await signIn(identifier, password)
      const destination = (location.state as { from?: string } | null)?.from ?? '/home'
      navigate(destination, { replace: true })
    } catch (error) { const details = getErrorDetails(error); setErrors(details.fields); setMessage(details.message) } finally { setBusy(false) }
  }

  return <AuthFrame title="Welcome back" description="Sign in with your student email or ID." footer={<>New to CampusClubs? <Link to="/auth/signup">Create an account</Link></>}>
    <form className="auth-form" onSubmit={submit}>
      {searchParams.get('reset') === 'success' && <p className="form-success" role="status">Your password has been updated. Sign in with your new password.</p>}
      <Field label="Student email or ID" name="identifier" error={errors.identifier?.[0]}><input id="identifier" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required aria-invalid={Boolean(errors.identifier)} /></Field>
      <Field label="Password" name="password" error={errors.password?.[0]}><input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required aria-invalid={Boolean(errors.password)} /></Field>
      {message && <p className="form-error" role="alert">{message}</p>}
      <div className="auth-form-actions"><Link to="/auth/forgot-password">Forgot password?</Link></div>
      <Button type="submit" className="button-wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
    </form>
  </AuthFrame>
}
