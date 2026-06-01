import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './Upload.css'

export default function Upload({ session }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    function handlePaste(e) {
      const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
      if (item) loadFile(item.getAsFile())
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  function loadFile(selected) {
    if (!selected || !selected.type.startsWith('image/')) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  function handleFileChange(e) {
    loadFile(e.target.files[0])
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  async function handleDrop(e) {
    e.preventDefault()
    setDragging(false)

    // Dragged from desktop or file manager
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadFile(e.dataTransfer.files[0])
      return
    }

    // Dragged from a browser (comes as a URL)
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (url && url.startsWith('http')) {
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const ext = blob.type.split('/')[1] || 'jpg'
        const syntheticFile = new File([blob], `dragged.${ext}`, { type: blob.type })
        loadFile(syntheticFile)
      } catch {
        setError('Could not load image from URL. Try saving it to your computer first.')
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return setError('Please select a photo.')
    setLoading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const fileName = `${session.user.id}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, file)

    if (uploadError) {
      setError(uploadError.message)
      setLoading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName)

    const { error: insertError } = await supabase
      .from('photos')
      .insert({ user_id: session.user.id, image_url: publicUrl, caption })

    if (insertError) {
      setError(insertError.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="page upload-page">
      <h2 className="upload-title">New Post</h2>
      <form onSubmit={handleSubmit}>
        <label
          className={`upload-drop-zone ${dragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {preview
            ? <img src={preview} alt="preview" className="upload-preview" />
            : <span>{dragging ? 'Drop it!' : 'Click, drag, or paste a photo here'}</span>
          }
          <input type="file" accept="image/*" onChange={handleFileChange} hidden />
        </label>
        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={e => setCaption(e.target.value)}
          rows={3}
          className="upload-caption"
        />
        {error && <p className="error">{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Posting...' : 'Share'}
        </button>
      </form>
    </div>
  )
}
