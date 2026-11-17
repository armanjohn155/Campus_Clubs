import type { ReactNode } from 'react'
import { Link } from 'react-router'

export function AuthFrame({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
  return <main className="auth-screen"><section className="auth-card">
    <Link className="brand auth-brand" to="/auth/login"><span className="brand-mark">c<span>.</span></span><span>campus<span className="brand-light">clubs</span></span></Link>
    <span className="eyebrow">STUDENT PORTAL</span><h1>{title}<span className="heading-period">.</span></h1><p className="auth-description">{description}</p>
    {children}<div className="auth-footer">{footer}</div>
  </section></main>
}
