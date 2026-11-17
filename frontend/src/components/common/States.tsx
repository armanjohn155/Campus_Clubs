import { Button } from '@/components/ui/Button'

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return <div className="state-card loading-state" role="status" aria-busy="true" aria-label={label}>
    <span className="loading-bar loading-bar-short" /><span className="loading-bar" /><span className="loading-bar loading-bar-medium" />
  </div>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <section className="state-card error-state" role="alert">
    <strong>We couldn’t load this information</strong>
    <p>{message}</p>
    <Button variant="outline" size="small" onClick={onRetry}>Try again</Button>
  </section>
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <section className="state-card empty-state"><strong>{title}</strong><p>{description}</p></section>
}

export function InlineError({ message }: { message: string }) {
  return <p className="form-error" role="alert">{message}</p>
}
