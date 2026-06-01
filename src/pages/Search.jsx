import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './Search.css'

export default function Search({ session }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [following, setFollowing] = useState({}) // { [userId]: bool }

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    const { data: users } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .ilike('username', `%${query.trim()}%`)
      .neq('id', session.user.id)
      .limit(20)

    if (!users) { setLoading(false); return }

    // Check which results we already follow
    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id)
      .in('following_id', users.map(u => u.id))

    const followSet = new Set((followData || []).map(f => f.following_id))
    const followMap = {}
    users.forEach(u => { followMap[u.id] = followSet.has(u.id) })

    setResults(users)
    setFollowing(followMap)
    setLoading(false)
  }

  async function handleFollow(userId) {
    const isFollowing = following[userId]
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
    } else {
      await supabase.from('follows').insert({
        follower_id: session.user.id,
        following_id: userId
      })
    }
    setFollowing(prev => ({ ...prev, [userId]: !isFollowing }))
  }

  return (
    <div className="page search-page">
      <h2 className="search-title">Search</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn-follow" disabled={loading}>
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {searched && results.length === 0 && !loading && (
        <p className="search-empty">No users found for "{query}".</p>
      )}

      <div className="search-results">
        {results.map(user => (
          <div key={user.id} className="search-result">
            <Link to={`/profile/${user.id}`} className="search-result-user">
              <div className="search-avatar">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.username} />
                  : <div className="search-avatar-placeholder">{user.username[0].toUpperCase()}</div>
                }
              </div>
              <div className="search-result-info">
                <span className="search-result-username">{user.username}</span>
                {user.bio && <span className="search-result-bio">{user.bio}</span>}
              </div>
            </Link>
            <button
              className={following[user.id] ? 'btn-secondary' : 'btn-follow'}
              onClick={() => handleFollow(user.id)}
            >
              {following[user.id] ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
