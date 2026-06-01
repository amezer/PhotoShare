import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PhotoCard from '../components/PhotoCard'
import PhotoModal from '../components/PhotoModal'
import './Profile.css'

export default function Profile({ session }) {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [photos, setPhotos] = useState([])
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  const userId = id || session.user.id
  const isOwnProfile = userId === session.user.id

  async function fetchProfile() {
    const [
      { data: profileData },
      { data: photoData },
      { count: followers },
      { count: following },
      { data: followData }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('photos')
        .select(`*, profiles!photos_user_id_fkey (id, username, avatar_url)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      supabase.from('follows')
        .select('*')
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
        .maybeSingle()
    ])

    setProfile(profileData)
    setPhotos(photoData || [])
    setFollowerCount(followers || 0)
    setFollowingCount(following || 0)
    setIsFollowing(!!followData)
    setLoading(false)
  }

  useEffect(() => { fetchProfile() }, [userId])

  function startEditing() {
    setEditUsername(profile.username)
    setEditBio(profile.bio || '')
    setAvatarFile(null)
    setAvatarPreview(null)
    setEditError('')
    setEditing(true)
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setSaving(true)
    setEditError('')
    let avatar_url = profile.avatar_url

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const fileName = `avatar-${session.user.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, avatarFile, { upsert: true })
      if (uploadError) {
        setEditError(uploadError.message)
        setSaving(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName)
      avatar_url = publicUrl
    }

    const { error } = await supabase.from('profiles').update({
      username: editUsername,
      bio: editBio,
      avatar_url
    }).eq('id', session.user.id)

    if (error) {
      setEditError(error.message)
    } else {
      setProfile(p => ({ ...p, username: editUsername, bio: editBio, avatar_url }))
      setEditing(false)
    }
    setSaving(false)
  }

  async function handleFollow() {
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
      setIsFollowing(false)
      setFollowerCount(c => c - 1)
    } else {
      await supabase.from('follows').insert({
        follower_id: session.user.id,
        following_id: userId
      })
      setIsFollowing(true)
      setFollowerCount(c => c + 1)
    }
    setFollowLoading(false)
  }

  if (loading) return <div className="loading">Loading profile...</div>
  if (!profile) return <div className="loading">User not found.</div>

  const avatarSrc = avatarPreview || profile.avatar_url

  return (
    <div className="page profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {editing ? (
            <label className="avatar-edit-label">
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" />
                : <div className="profile-avatar-placeholder">{profile.username[0].toUpperCase()}</div>
              }
              <span className="avatar-edit-overlay">Change</span>
              <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
            </label>
          ) : (
            avatarSrc
              ? <img src={avatarSrc} alt={profile.username} />
              : <div className="profile-avatar-placeholder">{profile.username[0].toUpperCase()}</div>
          )}
        </div>

        <div className="profile-info">
          {editing ? (
            <div className="profile-edit-form">
              <input
                type="text"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                placeholder="Username"
              />
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="Bio"
                rows={2}
              />
              {editError && <p className="error">{editError}</p>}
              <div className="profile-edit-actions">
                <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn-follow" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-top-row">
                <h2 className="profile-username">{profile.username}</h2>
                {isOwnProfile
                  ? <button className="btn-secondary" onClick={startEditing}>Edit profile</button>
                  : <button
                      className={isFollowing ? 'btn-secondary' : 'btn-follow'}
                      onClick={handleFollow}
                      disabled={followLoading}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                }
              </div>
              <div className="profile-stats">
                <span><strong>{photos.length}</strong> posts</span>
                <span><strong>{followerCount}</strong> followers</span>
                <span><strong>{followingCount}</strong> following</span>
              </div>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            </>
          )}
        </div>
      </div>

      <div className="profile-grid">
        {photos.map(photo => (
          <div key={photo.id} onClick={() => setSelectedPhoto(photo)} style={{ cursor: 'pointer' }}>
            <PhotoCard photo={photo} session={session} compact />
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          session={session}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  )
}
