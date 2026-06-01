import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './CommentSection.css'

function Comment({ comment, session, onReply }) {
  return (
    <div className="comment">
      <Link to={`/profile/${comment.profiles.id}`} className="comment-user">
        {comment.profiles.username}
      </Link>{' '}
      <span className="comment-body">{comment.body}</span>
      <button className="comment-reply-btn" onClick={() => onReply(comment.id, comment.profiles.username)}>
        Reply
      </button>
      {comment.replies && comment.replies.map(reply => (
        <div key={reply.id} className="comment comment-reply">
          <Link to={`/profile/${reply.profiles.id}`} className="comment-user">
            {reply.profiles.username}
          </Link>{' '}
          <span className="comment-body">{reply.body}</span>
        </div>
      ))}
    </div>
  )
}

export default function CommentSection({ photoId, session }) {
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState(null) // { id, username }
  const [loading, setLoading] = useState(false)

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select(`*, profiles (id, username)`)
      .eq('photo_id', photoId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })

    const { data: replies } = await supabase
      .from('comments')
      .select(`*, profiles (id, username)`)
      .eq('photo_id', photoId)
      .not('parent_id', 'is', null)
      .order('created_at', { ascending: true })

    const withReplies = (data || []).map(c => ({
      ...c,
      replies: (replies || []).filter(r => r.parent_id === c.id)
    }))
    setComments(withReplies)
  }

  useEffect(() => { fetchComments() }, [photoId])

  function handleReply(id, username) {
    setReplyTo({ id, username })
    setBody(`@${username} `)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    await supabase.from('comments').insert({
      photo_id: photoId,
      user_id: session.user.id,
      body: body.trim(),
      parent_id: replyTo?.id || null
    })
    setBody('')
    setReplyTo(null)
    await fetchComments()
    setLoading(false)
  }

  return (
    <div className="comment-section">
      <div className="comments-list">
        {comments.map(c => (
          <Comment key={c.id} comment={c} session={session} onReply={handleReply} />
        ))}
      </div>
      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={replyTo ? `Replying to @${replyTo.username}...` : 'Add a comment...'}
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        <button type="submit" disabled={!body.trim() || loading} className="comment-post-btn">
          Post
        </button>
      </form>
    </div>
  )
}
