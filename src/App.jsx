import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Navbar from './components/Navbar'
import Feed from './pages/Feed'
import Login from './pages/Login'
import Register from './pages/Register'
import Upload from './pages/Upload'
import Profile from './pages/Profile'
import Search from './pages/Search'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="loading">Loading...</div>

  return (
    <>
      {session && <Navbar session={session} />}
      <Routes>
        <Route path="/" element={session ? <Feed session={session} /> : <Navigate to="/login" />} />
        <Route path="/upload" element={session ? <Upload session={session} /> : <Navigate to="/login" />} />
        <Route path="/profile/:id" element={session ? <Profile session={session} /> : <Navigate to="/login" />} />
        <Route path="/search" element={session ? <Search session={session} /> : <Navigate to="/login" />} />
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/" />} />
      </Routes>
    </>
  )
}
