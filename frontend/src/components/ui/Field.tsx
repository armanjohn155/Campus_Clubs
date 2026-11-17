import { cn } from '@/lib/cn'
import { cloneElement, isValidElement, type ReactNode } from 'react'

type Props = {
  label: string
  name: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, name, error, hint, children, className }: Props) {
  const descriptionId = error ? `${name}-error` : hint ? `${name}-hint` : undefined
  const control = isValidElement<{ 'aria-describedby'?: string; 'aria-invalid'?: boolean }>(children)
    ? cloneElement(children, {
      'aria-describedby': [children.props['aria-describedby'], descriptionId].filter(Boolean).join(' ') || undefined,
      'aria-invalid': Boolean(error) || children.props['aria-invalid'] || undefined,
    })
    : children

  return (
    <div className={cn('form-field', className)}>
      <label htmlFor={name}>{label}</label>
      {control}
      {error && <span className="field-error" id={`${name}-error`}>{error}</span>}
      {!error && hint && <span className="field-hint" id={`${name}-hint`}>{hint}</span>}
    </div>
  )
}
