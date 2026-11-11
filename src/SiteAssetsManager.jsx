import { useCallback, useEffect, useState } from "react"
import { supabase } from "./lib/supabase"

const MAX_SIZE = 5 * 1024 * 1024
const TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
}
const BUCKET_PRIVATE = "site-assets-private"
const BUCKET_PUBLIC = "site-assets-public"

const mimeFromPath = path => {
  const extension = path.split(".").pop().toLowerCase()
  return {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp"
  }[extension] || "application/octet-stream"
}

const emptyForm = {
  asset_type: "hero",
  service_id: "",
  alt_text: "",
  caption: "",
  display_order: "0"
}

export default function SiteAssetsManager() {
  const [assets, setAssets] = useState([])
  const [services, setServices] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    const [assetResult, serviceResult] = await Promise.all([
      supabase.from("site_assets").select("*")
        .order("asset_type", { ascending: true })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("services").select("id, name")
        .order("display_order", { ascending: true })
    ])

    if (assetResult.error) {
      setMessage("Could not load website images: " + assetResult.error.message)
      setLoading(false)
      return
    }

    if (serviceResult.error) {
      setMessage("Could not load services: " + serviceResult.error.message)
      setLoading(false)
      return
    }

    const rows = await Promise.all((assetResult.data || []).map(async asset => {
      const { data } = await supabase.storage
        .from(BUCKET_PRIVATE)
        .createSignedUrl(asset.private_path, 3600)
      return { ...asset, preview_url: data?.signedUrl || "" }
    }))

    setAssets(rows)
    setServices(serviceResult.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(loadData, 0)
    return () => clearTimeout(timer)
  }, [loadData])

  const change = (key, value) => {
    setForm(current => ({ ...current, [key]: value }))
  }

  const uploadAsset = async event => {
    event.preventDefault()
    setMessage("")

    if (!file) {
      setMessage("Choose an image to upload.")
      return
    }
    if (!TYPES[file.type]) {
      setMessage("Use a JPEG, PNG or WebP image.")
      return
    }
    if (file.size > MAX_SIZE) {
      setMessage("The image must be 5 MB or smaller.")
      return
    }
    if (form.asset_type === "service" && !form.service_id) {
      setMessage("Choose the service this image belongs to.")
      return
    }

    setUploading(true)
    const extension = TYPES[file.type]
    const folder = form.asset_type === "service"
      ? `assets/service/${form.service_id}`
      : `assets/${form.asset_type}`
    const privatePath = `${folder}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_PRIVATE)
      .upload(privatePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      setMessage("Upload failed: " + uploadError.message)
      setUploading(false)
      return
    }

    const { error: insertError } = await supabase.from("site_assets").insert({
      asset_type: form.asset_type,
      service_id: form.asset_type === "service" ? form.service_id : null,
      private_path: privatePath,
      alt_text: form.alt_text.trim() || null,
      caption: form.caption.trim() || null,
      display_order: Math.max(0, Number(form.display_order) || 0),
      is_published: false,
      public_path: null
    })

    if (insertError) {
      const { error: cleanupError } = await supabase.storage
        .from(BUCKET_PRIVATE).remove([privatePath])
      setMessage(
        "Could not save the image: " + insertError.message +
        (cleanupError ? " The uploaded private file may need manual cleanup." : "")
      )
    } else {
      setMessage("Image uploaded as a private draft.")
      setForm(emptyForm)
      setFile(null)
      const input = document.getElementById("site-asset-file")
      if (input) input.value = ""
      await loadData()
    }
    setUploading(false)
  }

  const updateDetails = async asset => {
    setBusyId(asset.id)
    setMessage("")
    const { error } = await supabase.from("site_assets")
      .update({
        alt_text: asset.alt_text || null,
        caption: asset.caption || null,
        display_order: Math.max(0, Number(asset.display_order) || 0)
      })
      .eq("id", asset.id)

    setMessage(error ? "Could not save image details: " + error.message : "Image details saved.")
    setBusyId(null)
    if (!error) await loadData()
  }

  const publishAsset = async asset => {
    setBusyId(asset.id)
    setMessage("")

    if (asset.is_published) {
      setMessage("This image is already published.")
      setBusyId(null)
      return
    }

    const slotQuery = supabase.from("site_assets")
      .select("id")
      .eq("asset_type", asset.asset_type)
      .eq("is_published", true)

    const { data: existing, error: checkError } = asset.asset_type === "service"
      ? await slotQuery.eq("service_id", asset.service_id)
      : ["hero", "about", "logo"].includes(asset.asset_type)
        ? await slotQuery
        : { data: [], error: null }

    if (checkError) {
      setMessage("Could not check the publishing slot: " + checkError.message)
      setBusyId(null)
      return
    }
    if (existing?.some(row => row.id !== asset.id)) {
      setMessage("Another image is already published in this slot. Unpublish it before publishing this replacement.")
      setBusyId(null)
      return
    }

    const { data: privateFile, error: downloadError } = await supabase.storage
      .from(BUCKET_PRIVATE).download(asset.private_path)

    if (downloadError) {
      setMessage("Could not read the private image: " + downloadError.message)
      setBusyId(null)
      return
    }

    const extension = asset.private_path.split(".").pop()
    const publicPath = `assets/${asset.asset_type}/${asset.id}-${crypto.randomUUID()}.${extension}`

    const { error: publicUploadError } = await supabase.storage
      .from(BUCKET_PUBLIC)
      .upload(publicPath, privateFile, {
        contentType: privateFile.type || mimeFromPath(asset.private_path),
        upsert: false
      })

    if (publicUploadError) {
      setMessage("Publishing failed: " + publicUploadError.message)
      setBusyId(null)
      return
    }

    const { error: updateError } = await supabase.from("site_assets")
      .update({ public_path: publicPath, is_published: true })
      .eq("id", asset.id)

    if (updateError) {
      await supabase.storage.from(BUCKET_PUBLIC).remove([publicPath])
      setMessage("Could not publish the image: " + updateError.message)
      setBusyId(null)
      return
    }

    if (asset.asset_type === "service") {
      const { error: serviceError } = await supabase.from("services")
        .update({ image_path: publicPath })
        .eq("id", asset.service_id)

      if (serviceError) {
        const { error: rollbackError } = await supabase.from("site_assets")
          .update({ public_path: null, is_published: false })
          .eq("id", asset.id)
        const { error: cleanupError } = await supabase.storage
          .from(BUCKET_PUBLIC).remove([publicPath])

        setMessage(
          "The service image could not be linked: " + serviceError.message +
          (rollbackError
            ? " WARNING: database rollback failed: " + rollbackError.message
            : " The image record rollback succeeded.") +
          (cleanupError
            ? " WARNING: public file cleanup failed: " + cleanupError.message
            : " Public file cleanup succeeded.")
        )
        setBusyId(null)
        await loadData()
        return
      }
    }

    setMessage("Image published successfully.")
    setBusyId(null)
    await loadData()
  }

  const unpublishAsset = async asset => {
    if (!asset.is_published || !asset.public_path) return

    setBusyId(asset.id)
    setMessage("")

    const { data: privateFile, error: privateDownloadError } = await supabase.storage
      .from(BUCKET_PRIVATE).download(asset.private_path)

    if (privateDownloadError || !privateFile) {
      setMessage("Could not prepare a safe rollback: " + (privateDownloadError?.message || "Private image unavailable."))
      setBusyId(null)
      return
    }

    if (asset.asset_type === "service") {
      const { error } = await supabase.from("services")
        .update({ image_path: null })
        .eq("id", asset.service_id)
        .eq("image_path", asset.public_path)
      if (error) {
        setMessage("Could not detach the service image: " + error.message)
        setBusyId(null)
        return
      }
    }

    const { error: removeError } = await supabase.storage
      .from(BUCKET_PUBLIC).remove([asset.public_path])

    if (removeError) {
      let reattachError = null

      if (asset.asset_type === "service") {
        const { error } = await supabase.from("services")
          .update({ image_path: asset.public_path })
          .eq("id", asset.service_id)
        reattachError = error
      }

      setMessage(
        "Could not remove the public image: " + removeError.message +
        (reattachError
          ? " WARNING: restoring the service image link also failed: " + reattachError.message
          : asset.asset_type === "service"
            ? " The service image link was restored."
            : "")
      )
      setBusyId(null)
      return
    }

    const { error: updateError } = await supabase.from("site_assets")
      .update({ public_path: null, is_published: false })
      .eq("id", asset.id)

    if (updateError) {
      const { error: restoreError } = await supabase.storage
        .from(BUCKET_PUBLIC)
        .upload(asset.public_path, privateFile, {
          contentType: privateFile.type || mimeFromPath(asset.private_path),
          upsert: false
        })

      let serviceRestoreError = null

      if (asset.asset_type === "service" && !restoreError) {
        const { error } = await supabase.from("services")
          .update({ image_path: asset.public_path })
          .eq("id", asset.service_id)
        serviceRestoreError = error
      }

      setMessage(
        "Could not update the image record: " + updateError.message +
        (restoreError
          ? " WARNING: public image restoration failed: " + restoreError.message
          : " The public image was restored.") +
        (asset.asset_type === "service"
          ? serviceRestoreError
            ? " WARNING: restoring the service image link also failed: " + serviceRestoreError.message
            : restoreError
              ? " The service image link remains detached."
              : " The service image link was restored."
          : "")
      )
      setBusyId(null)
      await loadData()
      return
    }

    setMessage("Image unpublished. Previously cached public copies may take a short time to expire.")
    setBusyId(null)
    await loadData()
  }

  const deleteDraft = async asset => {
    if (asset.is_published) {
      setMessage("Unpublish this image before deleting it.")
      return
    }
    if (!window.confirm("Permanently delete this image and its private original?")) return

    setBusyId(asset.id)
    setMessage("")
    const { error } = await supabase.from("site_assets")
      .delete().eq("id", asset.id)

    if (error) {
      setMessage("Could not delete image record: " + error.message)
      setBusyId(null)
      return
    }

    const { error: storageError } = await supabase.storage
      .from(BUCKET_PRIVATE).remove([asset.private_path])

    setMessage(storageError
      ? "Image record deleted, but the private file could not be removed: " + storageError.message
      : "Image and private original deleted.")
    setBusyId(null)
    await loadData()
  }

  return (
    <div className="catalog-manager site-assets-manager">
      <div className="admin-section-heading">
        <div>
          <h2>Website Images</h2>
          <p>Manage the images used across the public website.</p>
        </div>
      </div>

      <form className="gallery-upload-form" onSubmit={uploadAsset}>
        <h3>Upload a website image</h3>
        <p className="gallery-upload-hint">
          New uploads stay private drafts until you publish them. JPEG, PNG or WebP; maximum 5 MB.
        </p>

        <div className="site-asset-form-grid">
          <label>
            Image location
            <select
              value={form.asset_type}
              onChange={event => change("asset_type", event.target.value)}
            >
              <option value="hero">Hero / Splash</option>
              <option value="about">About section</option>
              <option value="logo">Website logo</option>
              <option value="service">Individual service</option>
              <option value="other">Other website image</option>
            </select>
          </label>

          {form.asset_type === "service" && (
            <label>
              Service
              <select
                value={form.service_id}
                onChange={event => change("service_id", event.target.value)}
                required
              >
                <option value="">Choose a service</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </label>
          )}

          <label>
            Image file
            <input
              id="site-asset-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={event => setFile(event.target.files?.[0] || null)}
              required
            />
          </label>

          <label>
            Alternative text
            <input
              value={form.alt_text}
              onChange={event => change("alt_text", event.target.value)}
              placeholder="Describe the image"
              maxLength={250}
            />
          </label>

          <label>
            Caption (optional)
            <input
              value={form.caption}
              onChange={event => change("caption", event.target.value)}
              placeholder="Image caption"
              maxLength={250}
            />
          </label>

          <label>
            Display order
            <input
              type="number"
              min="0"
              value={form.display_order}
              onChange={event => change("display_order", event.target.value)}
            />
          </label>
        </div>

        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload private draft"}
        </button>
      </form>

      {message && <p className="admin-message">{message}</p>}

      <div className="gallery-list-heading">
        <h3>Image library</h3>
        <button type="button" className="admin-refresh" onClick={loadData}>Refresh</button>
      </div>

      {loading ? (
        <p>Loading website images...</p>
      ) : assets.length === 0 ? (
        <p>No website images uploaded yet.</p>
      ) : (
        <div className="gallery-admin-grid">
          {assets.map(asset => (
            <article className="gallery-admin-item site-asset-item" key={asset.id}>
              {asset.preview_url ? (
                <img src={asset.preview_url} alt={asset.alt_text || "Private image preview"} />
              ) : (
                <div className="site-asset-no-preview">Private preview unavailable</div>
              )}

              <div className="gallery-admin-details">
                <div className="site-asset-title-row">
                  <strong>{asset.asset_type === "hero" ? "Hero / Splash" :
                    asset.asset_type === "about" ? "About section" :
                    asset.asset_type === "logo" ? "Website logo" :
                    asset.asset_type === "service" ? "Service image" : "Other image"}</strong>
                  <span className={asset.is_published ? "gallery-published" : "gallery-draft"}>
                    {asset.is_published ? "Published" : "Private draft"}
                  </span>
                </div>

                {asset.asset_type === "service" && (
                  <small>{services.find(service => service.id === asset.service_id)?.name || "Service"}</small>
                )}

                <label>
                  Alternative text
                  <input
                    value={asset.alt_text || ""}
                    maxLength={250}
                    onChange={event => setAssets(current => current.map(row =>
                      row.id === asset.id ? { ...row, alt_text: event.target.value } : row
                    ))}
                  />
                </label>

                <label>
                  Caption
                  <input
                    value={asset.caption || ""}
                    maxLength={250}
                    onChange={event => setAssets(current => current.map(row =>
                      row.id === asset.id ? { ...row, caption: event.target.value } : row
                    ))}
                  />
                </label>

                <label>
                  Display order
                  <input
                    type="number"
                    min="0"
                    value={asset.display_order}
                    onChange={event => setAssets(current => current.map(row =>
                      row.id === asset.id ? { ...row, display_order: event.target.value } : row
                    ))}
                  />
                </label>

                <div className="gallery-admin-actions">
                  <button
                    type="button"
                    disabled={busyId === asset.id}
                    onClick={() => updateDetails(asset)}
                  >
                    Save details
                  </button>
                  {asset.is_published ? (
                    <button
                      type="button"
                      disabled={busyId === asset.id}
                      onClick={() => unpublishAsset(asset)}
                    >
                      {busyId === asset.id ? "Please wait..." : "Unpublish"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === asset.id}
                      onClick={() => publishAsset(asset)}
                    >
                      {busyId === asset.id ? "Please wait..." : "Publish"}
                    </button>
                  )}
                  {!asset.is_published && (
                    <button
                      type="button"
                      className="gallery-delete-button"
                      disabled={busyId === asset.id}
                      onClick={() => deleteDraft(asset)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
