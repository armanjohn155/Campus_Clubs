import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { getClubCategories, getClubs, type ClubFilters } from '@/services/clubs'
import type { Club, ClubCategory } from '@/types/club'

type LoadState = 'loading' | 'ready' | 'error'

function Icon({ name, size = 18 }: { name: 'search' | 'users' | 'arrow'; size?: number }) {
  const shapes = {
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  }

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>
}

function ClubCard({ club }: { club: Club }) {
  const mark = club.name.slice(0, 2).toUpperCase()

  return (
    <article className="club-card">
      <div className="club-card-top">
        {club.logo_url
          ? <img className="club-mark club-logo" src={club.logo_url} alt="" />
          : <div className="club-mark mint" aria-hidden="true">{mark}</div>}
        <span className="club-category">{club.category}</span>
      </div>
      <h3>{club.name}</h3>
      <p className="club-description">{club.description}</p>
      <div className="club-skills" aria-label="Club tags">
        {(club.tags ?? []).map((tag) => <span key={tag}>{tag}</span>)}
      </div>
      <div className="club-card-bottom">
        <span className="member-count"><Icon name="users" size={16} /> {club.member_count} members</span>
        <span className="club-availability">{club.is_accepting_members ? 'Open to members' : 'Membership closed'}</span>
      </div>
      <Link className="club-details-link" to={`/clubs/${club.id}`}>View club details <Icon name="arrow" size={15} /></Link>
    </article>
  )
}

export default function HomePage() {
  const [categories, setCategories] = useState<ClubCategory[]>([])
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<ClubFilters['sort']>('name')
  const [clubs, setClubs] = useState<Club[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false
    getClubCategories()
      .then((items) => { if (!cancelled) setCategories(items) })
      .catch(() => { if (!cancelled) setCategories([]) })
    return () => { cancelled = true }
  }, [retryKey])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
    setState('loading')
    getClubs({ search: debouncedSearch || undefined, category: category || undefined, sort })
      .then((result) => {
        if (cancelled) return
        setClubs(result)
        setState('ready')
        setErrorMessage('')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState('error')
        setErrorMessage(error instanceof Error ? error.message : 'The club directory could not be loaded.')
      })
    }, 0)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [categories, category, debouncedSearch, retryKey, sort])

  const filterTabs = useMemo(() => [{ id: '', name: 'All clubs' }, ...categories], [categories])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="CampusClubs home"><span className="brand-mark">c<span>.</span></span><span>campus<span className="brand-light">clubs</span></span></a>
        <span className="nav-label">DISCOVER</span>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#clubs"><Icon name="search" />Explore clubs</a>
        </nav>
        <div className="sidebar-spacer" />
        <div className="help-card"><strong>CampusClubs</strong><p>Explore student organizations at your campus.</p></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Campus <span>/</span> <strong>Explore clubs</strong></div>
          <label className="top-search"><Icon name="search" size={17} /><span className="sr-only">Search clubs</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clubs..." /></label>
        </header>
        <div className="page-content">
          <section className="welcome-row">
            <div><span className="eyebrow section-eyebrow">CAMPUS DIRECTORY</span><h1>Explore clubs<span className="heading-period">.</span></h1><p>Find a student organization that matches your interests.</p></div>
          </section>
          <section className="clubs-section" id="clubs" aria-labelledby="clubs-heading">
            <div className="section-heading"><div><span className="eyebrow section-eyebrow">STUDENT ORGANIZATIONS</span><h2 id="clubs-heading">Club directory<span className="heading-period">.</span></h2><p>Search and browse the organizations in the directory.</p></div></div>
            <div className="filter-row">
              <div className="category-tabs" role="group" aria-label="Filter clubs by category">
                {filterTabs.map((item) => <button key={item.id} type="button" className={`category-tab ${category === String(item.id) ? 'selected' : ''}`} onClick={() => setCategory(String(item.id))} aria-pressed={category === String(item.id)}>{item.name}</button>)}
              </div>
              <label className="sort-select">Sort by <select value={sort} onChange={(event) => setSort(event.target.value as ClubFilters['sort'])}><option value="popular">Most members</option><option value="name">Name A–Z</option></select></label>
            </div>
            {state === 'loading' && <div className="club-grid" aria-label="Loading clubs" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div className="club-card club-skeleton" key={index}><span /><span /><span /></div>)}</div>}
            {state === 'error' && <div className="empty-state" role="alert"><h3>We couldn’t load the club directory</h3><p>{errorMessage}</p><button className="text-link" type="button" onClick={() => setRetryKey((key) => key + 1)}>Try again <Icon name="arrow" size={15} /></button></div>}
            {state === 'ready' && clubs.length === 0 && <div className="empty-state"><h3>No clubs match your search</h3><p>Try a different name or choose another category.</p><button className="text-link" type="button" onClick={() => { setSearch(''); setCategory('') }}>Clear filters</button></div>}
            {state === 'ready' && clubs.length > 0 && <div className="club-grid">{clubs.map((club) => <ClubCard key={club.id} club={club} />)}</div>}
          </section>
          <footer className="page-footer"><span>CampusClubs</span><span>Student organization directory</span></footer>
        </div>
      </main>
    </div>
  )
}
