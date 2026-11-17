import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { NotificationBell } from '@/components/common/NotificationBell'
import { useAuth } from '@/components/context/useAuth'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'

const mainLinks = [
  { to: '/home', label: 'Home', icon: '⌂' },
  { to: '/', label: 'Explore clubs', icon: '⌕' },
  { to: '/my-clubs', label: 'My clubs', icon: '◫' },
  { to: '/announcements', label: 'Announcements', icon: '▤' },
  { to: '/profile', label: 'Profile', icon: '○' },
]

const titles: Record<string, string> = {
  '/': 'Explore clubs', '/home': 'Home', '/my-clubs': 'My clubs', '/announcements': 'Announcements',
  '/profile': 'Profile', '/profile/edit': 'Edit profile', '/admin': 'Administration',
}

export function AppLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const title = titles[location.pathname] ?? (location.pathname.includes('/officer') ? 'Club officers' : 'Club details')

  async function handleSignOut() {
    await signOut()
    navigate('/auth/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/home" aria-label="CampusClubs home">
          <span className="brand-mark">c<span>.</span></span><span>campus<span className="brand-light">clubs</span></span>
        </Link>
        <div className="campus-picker" aria-label="CampusClubs portal"><span className="campus-symbol">C</span><span><strong>CampusClubs</strong><small>Student portal</small></span></div>
        <span className="nav-label">YOUR CAMPUS</span>
        <nav className="side-nav" aria-label="Main navigation">
          {mainLinks.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => cn('nav-item', isActive && 'active')}>
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}
          </NavLink>)}
          {user?.role === 'ADMIN' && <NavLink to="/admin" className={({ isActive }) => cn('nav-item', isActive && 'active')}><span className="nav-icon" aria-hidden="true">⌘</span>Admin</NavLink>}
        </nav>
        <div className="sidebar-spacer" />
        <div className="help-card"><strong>Find your people</strong><p>Discover groups and campus updates.</p><Link to="/">Browse clubs <span aria-hidden="true">→</span></Link></div>
        <div className="sidebar-profile">
          <span className="avatar" aria-hidden="true">{user?.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
          <span><strong>{user?.full_name}</strong><small>{user?.role === 'ADMIN' ? 'Administrator' : user?.course || 'Student'}</small></span>
          <Button variant="quiet" size="small" aria-label="Log out" onClick={() => void handleSignOut()}>↪</Button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">CampusClubs <span>/</span> <strong>{title}</strong></div>
          <div className="topbar-actions"><NotificationBell /><span className="topbar-name">{user?.full_name}</span></div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
