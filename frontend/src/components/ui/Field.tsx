import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

type Props = {
  label: string
  name: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, name, error, hint, children, className }: Props) {
  return (
    <div className={cn('form-field', className)}>
      <label htmlFor={name}>{label}</label>
      {children}
      {error && <span className="field-error" id={`${name}-error`}>{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  )
}
