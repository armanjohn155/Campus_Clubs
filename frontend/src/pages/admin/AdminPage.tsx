import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States'
import { Button } from '@/components/ui/Button'
import { getErrorDetails } from '@/lib/errors'
import { getAdminClubs, getAdminReports, getAdminUsers, toggleUser, updateClubStatus } from '@/services/admin'
import { useAuth } from '@/components/context/useAuth'
import type { AdminReport, Club, User } from '@/types'

export default function AdminPage() {
  const { user: currentUser } = useAuth()
  const [clubs, setClubs] = useState<Club[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [reports, setReports] = useState<AdminReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyKey, setBusyKey] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  const load = useCallback(async () => {
    await Promise.resolve()
    setLoading(true); setError('')
    try {
      const [clubRows, userRows, reportData] = await Promise.all([getAdminClubs(), getAdminUsers(), getAdminReports()])
      setClubs(clubRows); setUsers(userRows); setReports(reportData)
    } catch (reason) { setError(getErrorDetails(reason).message || 'Administration data could not be loaded.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load, retryKey])

  async function setStatus(club: Club, status: 'active' | 'rejected') {
    setBusyKey(`club-${club.id}`); setActionError('')
    try { await updateClubStatus(club.id, status); setClubs((current) => current.map((item) => item.id === club.id ? { ...item, status } : item)) }
    catch (reason) { setActionError(getErrorDetails(reason).message) }
    finally { setBusyKey('') }
  }

  async function toggle(user: User) {
    setBusyKey(`user-${user.id}`); setActionError('')
    try { const result = await toggleUser(user.id); setUsers((current) => current.map((item) => item.id === user.id ? { ...item, is_active: result.is_active } : item)) }
    catch (reason) { setActionError(getErrorDetails(reason).message) }
    finally { setBusyKey('') }
  }

  if (loading) return <div className="page-content"><LoadingState label="Loading administration" /></div>
  if (error || !reports) return <div className="page-content"><ErrorState message={error || 'Reports could not be loaded.'} onRetry={() => setRetryKey((key) => key + 1)} /></div>
  const pendingClubs = clubs.filter((club) => club.status === 'pending')

  return <div className="page-content"><section className="welcome-row"><div><span className="eyebrow">CAMPUS OPERATIONS</span><h1>Administration<span className="heading-period">.</span></h1><p>Review club proposals and manage student accounts.</p></div></section>
    {actionError && <p className="form-error" role="alert">{actionError}</p>}
    <section className="admin-stat-grid" aria-label="Campus report totals"><article><span>Students</span><strong>{reports.totals.students}</strong></article><article><span>Active clubs</span><strong>{reports.totals.clubs}</strong></article><article><span>Approved memberships</span><strong>{reports.totals.memberships}</strong></article><article><span>Pending clubs</span><strong>{reports.totals.pending_clubs}</strong></article></section>
    <section className="content-section"><div className="section-heading"><div><span className="eyebrow">REVIEW QUEUE</span><h2>Club approvals<span className="heading-period">.</span></h2></div></div>
      {pendingClubs.length === 0 ? <EmptyState title="No club proposals to review" description="New student proposals will appear here." /> : <div className="table-wrap"><table><thead><tr><th>Club</th><th>Category</th><th>Members</th><th>Actions</th></tr></thead><tbody>{pendingClubs.map((club) => <tr key={club.id}><td><Link to={`/clubs/${club.id}`}><strong>{club.name}</strong></Link><small>{club.description}</small></td><td>{club.category}</td><td>{club.member_count} members</td><td className="table-actions"><Button size="small" disabled={busyKey === `club-${club.id}`} onClick={() => void setStatus(club, 'active')}>Approve</Button><Button size="small" variant="outline" disabled={busyKey === `club-${club.id}`} onClick={() => void setStatus(club, 'rejected')}>Reject</Button></td></tr>)}</tbody></table></div>}
    </section>
    <section className="content-section"><div className="section-heading"><div><span className="eyebrow">ACCOUNT ACCESS</span><h2>Students<span className="heading-period">.</span></h2></div></div>
      {users.length === 0 ? <EmptyState title="No student accounts found" description="Registered students will appear here." /> : <div className="table-wrap"><table><thead><tr><th>Student</th><th>Program</th><th>Status</th><th>Action</th></tr></thead><tbody>{users.map((account) => <tr key={account.id}><td><strong>{account.full_name}</strong><small>{account.student_id} · {account.email}</small></td><td>{account.course || '—'}</td><td>{account.is_active ? 'Active' : 'Disabled'}</td><td><Button variant="outline" size="small" disabled={busyKey === `user-${account.id}` || account.id === currentUser?.id} onClick={() => void toggle(account)}>{account.is_active ? 'Disable' : 'Enable'}</Button></td></tr>)}</tbody></table></div>}
      <p className="field-hint">Your own account cannot be disabled.</p>
    </section>
    <section className="content-section"><div className="section-heading"><div><span className="eyebrow">REPORTS</span><h2>Membership overview<span className="heading-period">.</span></h2></div></div>
      <div className="report-panel"><p><strong>{reports.students_without_club}</strong> students have no approved club membership.</p><h3>Members per active club</h3>{reports.members_per_club.length === 0 ? <EmptyState title="No active clubs" description="Reports will update as clubs are approved." /> : <ul className="report-list">{reports.members_per_club.map((item) => <li key={item.id}><span>{item.name}</span><strong>{item.members}</strong></li>)}</ul>}<h3>Membership growth</h3>{reports.membership_growth.length === 0 ? <p>No approved membership activity yet.</p> : <ul className="report-list">{reports.membership_growth.map((item) => <li key={item.month}><span>{item.month}</span><strong>{item.total}</strong></li>)}</ul>}</div>
    </section>
  </div>
}
