import { Link } from 'react-router'
import { useAuth } from '@/components/context/useAuth'
import { Button } from '@/components/ui/Button'

export default function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null
  return <div className="page-content"><section className="welcome-row"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>Profile<span className="heading-period">.</span></h1><p>Your personal and academic details.</p></div><Link to="/profile/edit"><Button variant="outline">Edit profile</Button></Link></section>
    <article className="profile-panel"><div className="profile-cover" /><div className="profile-details"><div><h2>{user.full_name}</h2><p>{user.email}</p></div>{user.photo_url ? <img className="avatar profile-avatar" src={user.photo_url} alt={`${user.full_name} profile`} /> : <div className="avatar profile-avatar" aria-hidden="true">{user.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>}</div>
      <dl className="profile-facts"><div><dt>Student ID</dt><dd>{user.student_id}</dd></div><div><dt>Course</dt><dd>{user.course || 'Not provided'}</dd></div><div><dt>Year level</dt><dd>{user.year_level || 'Not provided'}</dd></div><div><dt>Section</dt><dd>{user.section || 'Not provided'}</dd></div><div><dt>Phone</dt><dd>{user.phone || 'Not provided'}</dd></div><div><dt>Address</dt><dd>{user.address || 'Not provided'}</dd></div></dl>
      <div className="profile-skills"><span className="eyebrow">SKILLS</span>{user.skills.length > 0 ? <div className="club-skills">{user.skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <p>No skills added yet.</p>}</div>
    </article>
  </div>
}
