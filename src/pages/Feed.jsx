import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import PhotoCard from '../components/PhotoCard'
import './Feed.css'

export default function Feed({ session }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPhotos() {
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', session.user.id)

      const followingIds = new Set((followData || []).map(f => f.following_id))
      followingIds.add(session.user.id) // always include own posts at top

      const { data, error } = await supabase
        .from('photos')
        .select(`*, profiles!photos_user_id_fkey (id, username, avatar_url)`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error || !data) { setLoading(false); return }

      // Sort: followed/own posts first, then suggested
      const followed = data.filter(p => followingIds.has(p.user_id))
      const suggested = data.filter(p => !followingIds.has(p.user_id))

      // Interleave a suggested post every 4 followed posts
      const merged = []
      let si = 0
      followed.forEach((post, i) => {
        merged.push({ ...post, isSuggested: false })
        if ((i + 1) % 4 === 0 && si < suggested.length) {
          merged.push({ ...suggested[si++], isSuggested: true })
        }
      })
      while (si < suggested.length) {
        merged.push({ ...suggested[si++], isSuggested: true })
      }

      setPhotos(merged)
      setLoading(false)
    }
    fetchPhotos()
  }, [])

  if (loading) return <div className="loading">Loading feed...</div>

  return (
    <div className="page feed">
      {photos.length === 0 ? (
        <p className="feed-empty">No posts yet. Be the first to share something!</p>
      ) : (
        photos.map(photo => (
          <div key={photo.id}>
            {photo.isSuggested && (
              <p className="feed-suggested-label">Suggested for you</p>
            )}
            <PhotoCard
              photo={photo}
              session={session}
              onDelete={id => setPhotos(prev => prev.filter(p => p.id !== id))}
            />
          </div>
        ))
      )}
    </div>
  )
}
