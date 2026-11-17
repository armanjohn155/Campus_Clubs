import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'quiet' | 'danger'
  size?: 'normal' | 'small'
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'normal', className, ...props },
  ref,
) {
  return <button ref={ref} className={cn('button', `button-${variant}`, size === 'small' && 'button-small', className)} {...props} />
})
