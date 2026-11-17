import { useEffect, useMemo, useState } from 'react'
import { ClubCard } from '@/components/features/clubs/ClubCard'
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States'
import { Button } from '@/components/ui/Button'
import { getClubCategories, getClubs, type ClubFilters } from '@/services/clubs'
import type { Club, ClubCategory } from '@/types'

export default function ExplorePage() {
  const [categories, setCategories] = useState<ClubCategory[]>([])
  const [categoryError, setCategoryError] = useState('')
  const [clubs, setClubs] = useState<Club[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<ClubFilters['sort']>('recommended')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true
    getClubCategories().then((items) => {
      if (active) { setCategories(items); setCategoryError('') }
    }).catch(() => {
      if (active) setCategoryError('Categories could not be loaded. Try again.')
    })
    return () => { active = false }
  }, [retryKey])

  useEffect(() => {
    let active = true
    const load = async () => {
      await Promise.resolve()
      setLoading(true)
      setError('')
      try {
        const items = await getClubs({ search: debouncedSearch || undefined, category: category || undefined, sort })
        if (active) setClubs(items)
      } catch { if (active) setError('The club directory could not be loaded. Check your connection and retry.') }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [debouncedSearch, category, sort, retryKey])

  const tabs = useMemo(() => [{ id: '', name: 'All clubs' }, ...categories], [categories])

  return <div className="page-content">
    <section className="welcome-row"><div><span className="eyebrow">CAMPUS DIRECTORY</span><h1>Explore clubs<span className="heading-period">.</span></h1><p>Search real student organizations and request to join.</p></div></section>
    <section className="clubs-section" aria-labelledby="clubs-heading">
      <div className="section-heading"><div><span className="eyebrow">STUDENT ORGANIZATIONS</span><h2 id="clubs-heading">Club directory<span className="heading-period">.</span></h2></div></div>
      <div className="filter-row">
        <label className="top-search explore-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search clubs</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clubs…" /></label>
        <div className="category-tabs" role="group" aria-label="Filter clubs by category">
          {tabs.map((item) => <Button key={item.id} variant="quiet" size="small" className={`category-tab ${category === String(item.id) ? 'selected' : ''}`} aria-pressed={category === String(item.id)} onClick={() => setCategory(String(item.id))}>{item.name}</Button>)}
        </div>
        <label className="sort-select">Sort by <select value={sort} onChange={(event) => setSort(event.target.value as ClubFilters['sort'])}><option value="recommended">Recommended</option><option value="popular">Most members</option><option value="name">Name A–Z</option></select></label>
      </div>
      {categoryError && <ErrorState message={categoryError} onRetry={() => setRetryKey((key) => key + 1)} />}
      {loading && <div className="club-grid" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <LoadingState key={index} label="Loading club" />)}</div>}
      {!loading && error && <ErrorState message={error} onRetry={() => setRetryKey((key) => key + 1)} />}
      {!loading && !error && clubs.length === 0 && <EmptyState title="No clubs match your search" description="Try a different name or choose another category." />}
      {!loading && !error && clubs.length > 0 && <div className="club-grid">{clubs.map((club) => <ClubCard key={club.id} club={club} />)}</div>}
      <div className="sr-only" aria-live="polite">{loading ? 'Loading clubs' : `${clubs.length} clubs found`}</div>
    </section>
  </div>
}
