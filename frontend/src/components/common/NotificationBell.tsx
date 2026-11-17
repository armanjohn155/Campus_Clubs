import { useCallback, useEffect, useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States'
import { Button } from '@/components/ui/Button'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/notifications'
import type { NotificationList } from '@/types'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<NotificationList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    await Promise.resolve()
    setLoading(true)
    setError('')
    try {
      setList(await getNotifications())
    } catch {
      setError('Notifications could not be loaded. Check your connection and retry.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function markRead(id: number) {
    try {
      await markNotificationRead(id)
      setList((current) => current ? {
        ...current,
        unread_count: Math.max(0, current.unread_count - Number(!current.data.find((item) => item.id === id)?.is_read)),
        data: current.data.map((item) => item.id === id ? { ...item, is_read: true } : item),
      } : current)
    } catch {
      setError('This notification could not be marked as read. Try again.')
    }
  }

  async function markAllRead() {
    try {
      await markAllNotificationsRead()
      setList((current) => current ? {
        unread_count: 0,
        data: current.data.map((item) => ({ ...item, is_read: true })),
      } : current)
    } catch {
      setError('Notifications could not be marked as read. Try again.')
    }
  }

  return (
    <div className="notification-wrap">
      <Button
        variant="outline"
        className="notification-trigger"
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">♧</span>
        {Boolean(list?.unread_count) && <i className="unread-dot" aria-label={`${list?.unread_count} unread notifications`} />}
      </Button>
      {open && <section className="notification-popover" role="dialog" aria-label="Notifications">
        <header className="popover-header"><strong>Notifications</strong><Button variant="quiet" size="small" onClick={() => void markAllRead()} disabled={!list?.unread_count}>Mark all read</Button></header>
        {loading && <LoadingState label="Loading notifications" />}
        {error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && list?.data.length === 0 && <EmptyState title="You’re all caught up" description="New club updates will appear here." />}
        {!loading && !error && list && list.data.length > 0 && <ul className="notification-list">
          {list.data.map((item) => <li className={item.is_read ? 'notification-read' : 'notification-unread'} key={item.id}>
            <span className="notification-type">{item.type.replaceAll('_', ' ')}</span>
            <p>{item.message}</p>
            <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
            {!item.is_read && <Button variant="quiet" size="small" onClick={() => void markRead(item.id)}>Mark read</Button>}
          </li>)}
        </ul>}
      </section>}
    </div>
  )
}
