import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router'
import { AppLayout } from '@/components/common/AppLayout'
import { LoadingState } from '@/components/common/States'
import { useAuth } from '@/components/context/useAuth'
import AdminPage from '@/pages/admin/AdminPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import LoginPage from '@/pages/auth/LoginPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import SignupPage from '@/pages/auth/SignupPage'
import AnnouncementsPage from '@/pages/user/AnnouncementsPage'
import ClubDetailsPage from '@/pages/user/ClubDetailsPage'
import EditProfilePage from '@/pages/user/EditProfilePage'
import ExplorePage from '@/pages/user/ExplorePage'
import HomePage from '@/pages/user/HomePage'
import MyClubsPage from '@/pages/user/MyClubsPage'
import OfficerPage from '@/pages/user/OfficerPage'
import ProfilePage from '@/pages/user/ProfilePage'
import { getClub } from '@/services/clubs'

function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="auth-loading"><LoadingState label="Restoring session" /></div>
  if (!user) return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

function RequireAdmin() {
  const { user } = useAuth()
  if (user?.role !== 'ADMIN') return <Navigate to="/home" replace />
  return <Outlet />
}

function RequireOfficer() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [access, setAccess] = useState<{ clubId: string; state: 'allowed' | 'denied' | 'error' } | null>(null)

  useEffect(() => {
    let active = true
    getClub(id).then((club) => {
      if (!active) return
      const membership = club.my_membership
      setAccess({ clubId: id, state: membership?.status === 'approved' && membership.role !== 'member' ? 'allowed' : 'denied' })
    }).catch(() => { if (active) setAccess({ clubId: id, state: 'error' }) })
    return () => { active = false }
  }, [id, user?.id])

  if (!access || access.clubId !== id) return <div className="page-content"><LoadingState label="Checking officer access" /></div>
  if (access.state === 'denied') return <Navigate to={`/clubs/${id}`} replace />
  if (access.state === 'error') return <Navigate to="/home" replace />
  return <Outlet />
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-loading"><LoadingState label="Restoring session" /></div>
  if (user) return <Navigate to="/home" replace />
  return children
}

export default function App() {
  return <Routes>
    <Route path="/auth/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
    <Route path="/auth/signup" element={<GuestOnly><SignupPage /></GuestOnly>} />
    <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
    <Route element={<RequireAuth />}>
      <Route element={<AppLayout />}>
        <Route index element={<ExplorePage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="clubs/:id" element={<ClubDetailsPage />} />
        <Route path="my-clubs" element={<MyClubsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/edit" element={<EditProfilePage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route element={<RequireOfficer />}><Route path="clubs/:id/officer" element={<OfficerPage />} /></Route>
        <Route element={<RequireAdmin />}>
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/users" element={<AdminPage />} />
          <Route path="admin/reports" element={<AdminPage />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/home" replace />} />
  </Routes>
}
