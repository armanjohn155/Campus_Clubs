import { useCallback, useEffect, useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States'
import { getAnnouncements } from '@/services/announcements'
import type { Announcement } from '@/types'

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const load = useCallback(async () => { await Promise.resolve(); setLoading(true); setError(''); try { setItems(await getAnnouncements()) } catch { setError('Announcements could not be loaded. Try again.') } finally { setLoading(false) } }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load, retryKey])

  return <div className="page-content"><section className="welcome-row"><div><span className="eyebrow">CAMPUS UPDATES</span><h1>Announcements<span className="heading-period">.</span></h1><p>Updates from your clubs and campus administrators.</p></div></section>
    {loading && <LoadingState label="Loading announcements" />}
    {!loading && error && <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} />}
    {!loading && !error && items.length === 0 && <EmptyState title="No announcements yet" description="Updates from your approved clubs will appear here." />}
    {!loading && !error && items.length > 0 && <div className="announcement-board">{items.map((item) => <article className="announcement-card" key={item.id}><span className="announcement-tag">{item.club_name}</span><time className="announcement-date" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time><h2>{item.title}</h2><p className="announcement-body">{item.body}</p></article>)}</div>}
  </div>
}
