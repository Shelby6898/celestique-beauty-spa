import { useCallback, useEffect, useState } from "react"
import { supabase } from "./lib/supabase"

const emptyForm = {
  name: "",
  category: "",
  description: "",
  price_min: "",
  price_max: "",
  price: "",
  price_label: "",
  is_active: true
}

export default function CatalogManager({ type }) {
  const table = type === "services" ? "services" : "packages"
  const title = type === "services" ? "Services" : "Packages"
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const loadItems = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("display_order", { ascending: true })
    if (error) setMessage("Could not load " + title.toLowerCase() + ": " + error.message)
    else setItems(data || [])
    setLoading(false)
  }, [table, title])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadItems])

  const change = (key, value) => {
    setForm(current => ({ ...current, [key]: value }))
  }

  const editItem = item => {
    setEditing(item.id)
    setForm({
      name: item.name || "",
      category: item.category || "",
      description: item.description || "",
      price_min: item.price_min ?? "",
      price_max: item.price_max ?? "",
      price: item.price ?? "",
      price_label: item.price_label || "",
      is_active: item.is_active
    })
    setMessage("")
  }

  const resetForm = () => {
    setEditing(null)
    setForm(emptyForm)
  }

  const saveItem = async event => {
    event.preventDefault()
    setSaving(true)
    setMessage("")

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price_label: form.price_label.trim(),
      is_active: form.is_active
    }

    if (type === "services") {
      payload.category = form.category.trim()
      payload.price_min = form.price_min === "" ? null : Number(form.price_min)
      payload.price_max = form.price_max === "" ? null : Number(form.price_max)
    } else {
      payload.price = form.price === "" ? null : Number(form.price)
    }

    const request = editing
      ? supabase.from(table).update(payload).eq("id", editing)
      : supabase.from(table).insert({
          ...payload,
          display_order: items.length + 1
        })

    const { error } = await request
    if (error) setMessage("Save failed: " + error.message)
    else {
      setMessage(editing ? "Changes saved successfully." : title + " added successfully.")
      resetForm()
      await loadItems()
    }
    setSaving(false)
  }

  const toggleActive = async item => {
    setMessage("")
    const { error } = await supabase
      .from(table)
      .update({ is_active: !item.is_active })
      .eq("id", item.id)

    if (error) setMessage("Status update failed: " + error.message)
    else {
      setItems(current => current.map(row =>
        row.id === item.id ? { ...row, is_active: !item.is_active } : row
      ))
    }
  }

  return (
    <section className="admin-content-card catalog-manager">
      <div className="admin-section-heading">
        <div><h2>{title}</h2><p>Manage salon {title.toLowerCase()} and pricing</p></div>
        <button onClick={loadItems}>↻ Refresh</button>
      </div>

      {message && <p className="admin-message" role="status">{message}</p>}

      <form className="catalog-form" onSubmit={saveItem}>
        <h3>{editing ? "Edit " + title.slice(0, -1) : "Add a new " + title.slice(0, -1)}</h3>

        <label>Name</label>
        <input value={form.name} onChange={e => change("name", e.target.value)} required />

        {type === "services" && <>
          <label>Category</label>
          <input value={form.category} onChange={e => change("category", e.target.value)} placeholder="e.g. Nails, Beauty" />
        </>}

        <label>Description</label>
        <textarea value={form.description} onChange={e => change("description", e.target.value)} rows="3" />

        {type === "services" ? <>
          <div className="catalog-fields">
            <div><label>Minimum price (KSh)</label><input type="number" min="0" step="0.01" value={form.price_min} onChange={e => change("price_min", e.target.value)} /></div>
            <div><label>Maximum price (KSh)</label><input type="number" min="0" step="0.01" value={form.price_max} onChange={e => change("price_max", e.target.value)} /></div>
          </div>
        </> : <>
          <label>Price (KSh)</label>
          <input type="number" min="0" step="0.01" value={form.price} onChange={e => change("price", e.target.value)} />
        </>}

        <label>Price display label</label>
        <input value={form.price_label} onChange={e => change("price_label", e.target.value)} placeholder="e.g. KSh 500 or KSh 500–800" />

        <label className="catalog-checkbox">
          <input type="checkbox" checked={form.is_active} onChange={e => change("is_active", e.target.checked)} />
          Active — visible on the public website
        </label>

        <div className="catalog-form-actions">
          <button className="admin-primary" type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Add " + title.slice(0, -1)}</button>
          {editing && <button type="button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="catalog-list">
        <h3>Existing {title.toLowerCase()} ({items.length})</h3>
        {loading ? <p className="admin-empty">Loading {title.toLowerCase()}...</p> :
          !items.length ? <p className="admin-empty">No records found.</p> :
          items.map(item => <article className="catalog-item" key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <span>{type === "services" ? item.category : item.description}</span>
              <small>{item.price_label || (type === "services" ? "KSh " + (item.price_min ?? "—") : "KSh " + (item.price ?? "—"))}</small>
              <small className={item.is_active ? "catalog-active" : "catalog-inactive"}>{item.is_active ? "Active" : "Inactive"}</small>
            </div>
            <div className="catalog-item-actions">
              <button onClick={() => editItem(item)}>Edit</button>
              <button onClick={() => toggleActive(item)}>{item.is_active ? "Deactivate" : "Activate"}</button>
            </div>
          </article>)
        }
      </div>
    </section>
  )
}
