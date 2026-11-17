import { useEffect, useRef, useState } from 'react'
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
  '/profile': 'Profile', '/profile/edit': 'Edit profile', '/profile/academic': 'Academic details',
  '/profile/skills': 'Skills & interests', '/admin': 'Administration',
}

export function AppLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const title = titles[location.pathname] ?? (location.pathname.includes('/officer') ? 'Club officers' : 'Club details')

  useEffect(() => {
    if (!mobileNavOpen) return
    const menuButton = menuButtonRef.current
    sidebarRef.current?.querySelector<HTMLElement>('.nav-item')?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      menuButton?.focus()
    }
  }, [mobileNavOpen])

  async function handleSignOut() {
    await signOut()
    navigate('/auth/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside ref={sidebarRef} id="primary-navigation" className={cn('sidebar', mobileNavOpen && 'sidebar-open')} aria-label="CampusClubs navigation">
        <div className="sidebar-brand-row">
          <Link className="brand" to="/home" aria-label="CampusClubs home" onClick={() => setMobileNavOpen(false)}>
            <span className="brand-mark">c<span>.</span></span><span>campus<span className="brand-light">clubs</span></span>
          </Link>
          <Button className="mobile-menu-close" variant="quiet" aria-label="Close navigation menu" onClick={() => setMobileNavOpen(false)}>×</Button>
        </div>
        <div className="campus-picker" aria-label="CampusClubs portal"><span className="campus-symbol">C</span><span><strong>CampusClubs</strong><small>Student portal</small></span></div>
        <span className="nav-label">YOUR CAMPUS</span>
        <nav className="side-nav" aria-label="Main navigation">
          {mainLinks.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileNavOpen(false)} className={({ isActive }) => cn('nav-item', isActive && 'active')}>
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}
          </NavLink>)}
          {user?.role === 'ADMIN' && <NavLink to="/admin" onClick={() => setMobileNavOpen(false)} className={({ isActive }) => cn('nav-item', isActive && 'active')}><span className="nav-icon" aria-hidden="true">⌘</span>Admin</NavLink>}
        </nav>
        <div className="sidebar-spacer" />
        <div className="help-card"><strong>Find your people</strong><p>Discover groups and campus updates.</p><Link to="/">Browse clubs <span aria-hidden="true">→</span></Link></div>
        <div className="sidebar-profile">
          <span className="avatar" aria-hidden="true">{user?.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
          <span><strong>{user?.full_name}</strong><small>{user?.role === 'ADMIN' ? 'Administrator' : user?.course || 'Student'}</small></span>
          <Button variant="quiet" size="small" aria-label="Log out" onClick={() => void handleSignOut()}>↪</Button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb">CampusClubs <span>/</span> <strong>{title}</strong></div>
          <div className="topbar-actions">
            <Button ref={menuButtonRef} className="mobile-menu-trigger" variant="outline" aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-controls="primary-navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}>
              <span aria-hidden="true">☰</span><span className="mobile-menu-label">Menu</span>
            </Button>
            <NotificationBell />
            <div className="topbar-user"><span className="avatar top-avatar" aria-hidden="true">{user?.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><span className="topbar-name">{user?.full_name}</span></div>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}><Outlet /></main>
      </div>
      {mobileNavOpen && <button className="mobile-nav-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setMobileNavOpen(false)} />}
    </div>
  )
}
