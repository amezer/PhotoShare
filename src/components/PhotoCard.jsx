import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import CommentSection from './CommentSection'
import './PhotoCard.css'

export default function PhotoCard({ photo, session, compact = false, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [caption, setCaption] = useState(photo.caption || '')
  const [saving, setSaving] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const isOwner = session.user.id === photo.profiles.id

  useEffect(() => {
    if (compact) return
    async function fetchLikes() {
      const [{ count }, { data: myLike }] = await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('photo_id', photo.id),
        supabase.from('likes').select('*').eq('photo_id', photo.id).eq('user_id', session.user.id).maybeSingle()
      ])
      setLikeCount(count || 0)
      setLiked(!!myLike)
    }
    fetchLikes()
  }, [photo.id])

  if (compact) {
    return (
      <div className="photo-thumb">
        <img src={photo.image_url} alt={photo.caption} />
      </div>
    )
  }

  // Skip rendering if profile data is missing
  if (!photo.profiles) return null

  async function handleDelete() {
    if (!photo.id) return
    if (!confirm('Delete this post?')) return
    const { error } = await supabase.from('photos').delete().eq('id', photo.id)
    if (error) {
      alert('Could not delete post: ' + error.message)
      return
    }
    setMenuOpen(false)
    if (onDelete) onDelete(photo.id)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('photos').update({ caption }).eq('id', photo.id)
    setSaving(false)
    setEditing(false)
  }

  async function handleLike() {
    if (liked) {
      await supabase.from('likes').delete().eq('photo_id', photo.id).eq('user_id', session.user.id)
      setLiked(false)
      setLikeCount(c => c - 1)
    } else {
      await supabase.from('likes').insert({ photo_id: photo.id, user_id: session.user.id })
      setLiked(true)
      setLikeCount(c => c + 1)
    }
  }

  return (
    <article className="photo-card">
      <div className="photo-card-header">
        <Link to={`/profile/${photo.profiles.id}`} className="photo-card-user">
          <div className="photo-card-avatar">
            {photo.profiles.avatar_url
              ? <img src={photo.profiles.avatar_url} alt={photo.profiles.username} />
              : <div className="photo-card-avatar-placeholder">{photo.profiles.username[0].toUpperCase()}</div>
            }
          </div>
          <span className="photo-card-username">{photo.profiles.username}</span>
        </Link>

        {isOwner && (
          <div className="photo-card-menu-wrap">
            <button className="photo-card-menu-btn" onClick={() => setMenuOpen(o => !o)}>⋯</button>
            {menuOpen && (
              <div className="photo-card-menu">
                <button onClick={() => { setEditing(true); setMenuOpen(false) }}>Edit caption</button>
                <button className="danger" onClick={handleDelete}>Delete post</button>
              </div>
            )}
          </div>
        )}
      </div>

      <img src={photo.image_url} alt={photo.caption} className="photo-card-image" />

      <div className="photo-card-actions">
        <button className="like-btn" onClick={handleLike}>
          {liked ? '❤️' : '🤍'}
        </button>
        {likeCount > 0 && <span className="like-count">{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>}
      </div>

      {editing ? (
        <div className="photo-card-edit">
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={2}
            autoFocus
          />
          <div className="photo-card-edit-actions">
            <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-follow" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        caption && (
          <div className="photo-card-caption">
            <Link to={`/profile/${photo.profiles.id}`} className="photo-card-caption-user">
              {photo.profiles.username}
            </Link>{' '}
            {caption}
          </div>
        )
      )}

      <CommentSection photoId={photo.id} session={session} />
    </article>
  )
}
