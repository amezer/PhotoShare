import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './Navbar.css'

export default function Navbar({ session }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">PhotoShare</Link>
      <div className="navbar-actions">
        <Link to="/upload" className="navbar-link">+ Post</Link>
        <Link to="/search" className="navbar-link">Search</Link>
        <Link to={`/profile/${session.user.id}`} className="navbar-link">Profile</Link>
        <button onClick={handleLogout} className="navbar-logout">Log out</button>
      </div>
    </nav>
  )
}
