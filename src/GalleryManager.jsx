import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"

const MAX_SIZE = 5 * 1024 * 1024
const TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
}

export default function GalleryManager() {
  const [photos, setPhotos] = useState([])
  const [file, setFile] = useState(null)
  const [caption, setCaption] = useState("")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState("")

  async function loadPhotos() {
    const { data, error } = await supabase
      .from("gallery_photos")
      .select("id, storage_path, caption, is_published, display_order, created_at")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      setMessage(error.message)
    } else {
      setPhotos(data || [])
    }
    setLoading(false)
  }

  async function handleRefresh() {
    setLoading(true)
    await loadPhotos()
  }

  useEffect(() => {
    Promise.resolve().then(() => loadPhotos())
  }, [])

  function imageUrl(path) {
    return supabase.storage.from("gallery-photos").getPublicUrl(path).data.publicUrl
  }


  async function handleUpload(event) {
    event.preventDefault()
    setMessage("")

    if (!file) {
      setMessage("Please choose an image first.")
      return
    }

    if (!TYPES[file.type] || file.size > MAX_SIZE) {
      setMessage("Use a JPG, PNG or WebP image up to 5 MB.")
      return
    }

    setUploading(true)
    const path = `photos/${crypto.randomUUID()}.${TYPES[file.type]}`

    const { error: uploadError } = await supabase.storage
      .from("gallery-photos")
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      setMessage(uploadError.message)
      setUploading(false)
      return
    }

    const { error: insertError } = await supabase
      .from("gallery_photos")
      .insert({ storage_path: path, caption: caption.trim() || null })

    if (insertError) {
      await supabase.storage.from("gallery-photos").remove([path])
      setMessage(insertError.message)
    } else {
      setFile(null)
      setCaption("")
      setMessage("Photo uploaded as a draft. Publish it when ready.")
      await loadPhotos()
    }

    setUploading(false)
  }


  async function updatePhoto(id, changes) {
    setBusyId(id)
    setMessage("")

    const { error } = await supabase
      .from("gallery_photos")
      .update(changes)
      .eq("id", id)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Photo updated successfully.")
      await loadPhotos()
    }

    setBusyId(null)
  }

  async function deletePhoto(photo) {
    if (!window.confirm("Permanently delete this gallery photo?")) return

    setBusyId(photo.id)
    setMessage("")

    const { error } = await supabase
      .from("gallery_photos")
      .delete()
      .eq("id", photo.id)

    if (error) {
      setMessage(error.message)
    } else {
      const { error: storageError } = await supabase.storage
        .from("gallery-photos")
        .remove([photo.storage_path])

      if (storageError) {
        setMessage("Photo record deleted, but image cleanup failed: " + storageError.message)
      } else {
        setMessage("Photo deleted successfully.")
      }

      await loadPhotos()
    }

    setBusyId(null)
  }


  return (
    <div className="catalog-manager gallery-manager">
      <div className="admin-section-heading">
        <div>
          <span className="admin-eyebrow">CLIENT GALLERY</span>
          <h2>Happy Clients</h2>
          <p>Upload, organize and publish client photos on your website.</p>
        </div>
          <button type="button" onClick={handleRefresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
      </div>

      {message && <div className="admin-message">{message}</div>}

      <form className="gallery-upload-form" onSubmit={handleUpload}>
        <h3>Add a gallery photo</h3>
        <label htmlFor="gallery-photo-file">Choose photo</label>
        <input
          id="gallery-photo-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={event => setFile(event.target.files?.[0] || null)}
        />
        <p className="gallery-upload-hint">JPG, PNG or WebP. Maximum file size: 5 MB.</p>

        <label htmlFor="gallery-photo-caption">Photo caption (optional)</label>
        <input
          id="gallery-photo-caption"
          type="text"
          maxLength={160}
          value={caption}
          onChange={event => setCaption(event.target.value)}
          placeholder="e.g. Elegant gel nails"
        />

        <button type="submit" disabled={uploading || !file}>
          {uploading ? "Uploading..." : "Upload photo"}
        </button>
      </form>

      <div className="admin-section-heading gallery-list-heading">
        <div>
          <h2>Uploaded photos</h2>
          <p>{photos.length} photo{photos.length === 1 ? "" : "s"} in your gallery library</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading gallery photos...</div>
      ) : photos.length === 0 ? (
        <div className="admin-empty">No uploaded photos yet. Add your first client photo above.</div>
      ) : (
        <div className="gallery-admin-grid">
          {photos.map(photo => (
            <article className="gallery-admin-item" key={photo.id}>
              <img src={imageUrl(photo.storage_path)} alt={photo.caption || "Client gallery photo"} />
              <div className="gallery-admin-details">
                <span className={photo.is_published ? "gallery-published" : "gallery-draft"}>
                  {photo.is_published ? "Published" : "Draft"}
                </span>
                <label>Caption</label>
                <input
                  key={photo.id + "-" + (photo.caption || "")}
                  type="text"
                  maxLength={160}
                  defaultValue={photo.caption || ""}
                  onBlur={event => {
                    const value = event.target.value.trim()
                    if (value !== (photo.caption || "")) {
                      updatePhoto(photo.id, { caption: value || null })
                    }
                  }}
                />
                <label>Display order</label>
                <input
                  key={photo.id + "-order-" + photo.display_order}
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={photo.display_order}
                  onBlur={event => {
                    const value = Math.max(0, parseInt(event.target.value, 10) || 0)
                    if (value !== photo.display_order) {
                      updatePhoto(photo.id, { display_order: value })
                    }
                  }}
                />
                <div className="gallery-admin-actions">
                  <button
                    type="button"
                    disabled={busyId === photo.id}
                    onClick={() => updatePhoto(photo.id, { is_published: !photo.is_published })}
                  >
                    {busyId === photo.id ? "Saving..." : photo.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    className="gallery-delete-button"
                    disabled={busyId === photo.id}
                    onClick={() => deletePhoto(photo)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
