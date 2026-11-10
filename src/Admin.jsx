import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import CatalogManager from "./CatalogManager"
import BusinessHours from "./BusinessHours"

const statuses = ["all", "pending", "confirmed", "completed", "cancelled"]

const moneyDate = (value) => value
  ? new Date(value + "T00:00:00").toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric"
    })
  : "—"

export default function Admin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState("")
  const [appointments, setAppointments] = useState([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [view, setView] = useState("overview")
  const [updating, setUpdating] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  const loadAppointments = async () => {
    setAppointmentsLoading(true)
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: false })
      .order("time_slot", { ascending: true })

    if (error) setMessage("Could not load appointments: " + error.message)
    else setAppointments(data || [])
    setAppointmentsLoading(false)
  }

  const verifyAdmin = async (session) => {
    if (!session) {
      setUser(null)
      setLoading(false)
      return
    }

    const { data, error } = await supabase.rpc("is_salon_admin")

    if (error || data !== true) {
      await supabase.auth.signOut()
      setUser(null)
      setMessage("Access denied. This account is not an authorized administrator.")
    } else {
      setUser(session.user)
      setMessage("")
    }
    setLoading(false)
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (active) verifyAdmin(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) setTimeout(() => {
          if (active) verifyAdmin(session)
        }, 0)
      }
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const timer = setTimeout(() => {
      loadAppointments()
    }, 0)

    return () => clearTimeout(timer)
  }, [user])

  const signIn = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage("")
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else await verifyAdmin(data.session)
    setSubmitting(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAppointments([])
    setMessage("You have signed out.")
  }

  const updateStatus = async (id, status) => {
    setUpdating(id)
    setMessage("")
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)

    if (error) setMessage("Update failed: " + error.message)
    else {
      setAppointments(current => current.map(item =>
        item.id === id ? { ...item, status } : item
      ))
    }
    setUpdating(null)
  }

  const counts = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === "pending").length,
    confirmed: appointments.filter(a => a.status === "confirmed").length,
    completed: appointments.filter(a => a.status === "completed").length
  }

  const visibleAppointments = appointments.filter(item => {
    const matchesStatus = filter === "all" || item.status === filter
    const term = search.toLowerCase()
    const matchesSearch = [
      item.customer_name, item.customer_phone, item.service_name_snapshot
    ].some(value => (value || "").toLowerCase().includes(term))
    return matchesStatus && matchesSearch
  })

  if (loading) return <main className="admin-loading">Loading administrator access...</main>

  if (!user) return (
    <main className="admin-login-page">
      <form className="admin-login" onSubmit={signIn}>
        <div className="admin-brand-mark">C</div>
        <p className="admin-eyebrow">CELESTIQUE BEAUTY SPA</p>
        <h1>Welcome back</h1>
        <p className="admin-muted">Sign in to manage your salon.</p>
        <label htmlFor="admin-email">Email address</label>
        <input id="admin-email" type="email" value={email}
          onChange={e => setEmail(e.target.value)} autoComplete="username" required />
        <label htmlFor="admin-password">Password</label>
        <input id="admin-password" type="password" value={password}
          onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
        <button className="admin-primary" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in to dashboard"}
        </button>
        {message && <p className="admin-message" role="alert">{message}</p>}
        <a href="/">Return to website</a>
      </form>
    </main>
  )

  return (
    <main className="salon-admin">
      <aside className="admin-sidebar">
        <a className="admin-logo" href="/"><span>C</span><div>CELESTIQUE<small>BEAUTY SPA</small></div></a>
        <p className="admin-nav-label">WORKSPACE</p>
        <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}>◫ <span>Overview</span></button>
        <button className={view === "appointments" ? "active" : ""} onClick={() => setView("appointments")}>▤ <span>Appointments</span><b>{counts.pending}</b></button>
        <p className="admin-nav-label">CATALOG</p>
        <button className={view === "services" ? "active" : ""} onClick={() => setView("services")}>✦ <span>Services</span></button>
        <button className={view === "packages" ? "active" : ""} onClick={() => setView("packages")}>◇ <span>Packages</span></button>
        <button className={view === "hours" ? "active" : ""} onClick={() => setView("hours")}>◷ <span>Business Hours</span></button>
        <p className="admin-nav-label">GENERAL</p>
        <a href="/" className="admin-side-link">↗ <span>View website</span></a>
        <div className="admin-side-bottom">
          <div className="admin-avatar">{(user.email || "A")[0].toUpperCase()}</div>
          <div className="admin-user"><strong>Administrator</strong><small>{user.email}</small></div>
          <button className="admin-signout" onClick={signOut} title="Sign out">↪</button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-eyebrow">SALON MANAGEMENT</span><h1>{{ overview: "Dashboard overview", appointments: "Appointments", services: "Services", packages: "Packages", hours: "Business Hours" }[view]}</h1></div>
          {!['services', 'packages', 'hours'].includes(view) && <button className="admin-refresh" onClick={loadAppointments}>↻ <span>Refresh</span></button>}
        </header>

        {message && <p className="admin-message" role="alert">{message}</p>}

        {view === "overview" && <>
          <div className="admin-welcome">
            <div><span>YOUR SALON AT A GLANCE</span><h2>Good to see you.</h2><p>Here is what is happening at Celestique today.</p></div>
            <div className="admin-welcome-icon">✦</div>
          </div>
          <div className="admin-stat-grid">
            <article className="admin-stat"><span>Total appointments</span><strong>{counts.total}</strong><small>All recorded bookings</small></article>
            <article className="admin-stat"><span>Pending</span><strong>{counts.pending}</strong><small>Awaiting your attention</small></article>
            <article className="admin-stat"><span>Confirmed</span><strong>{counts.confirmed}</strong><small>Scheduled appointments</small></article>
            <article className="admin-stat"><span>Completed</span><strong>{counts.completed}</strong><small>Finished appointments</small></article>
          </div>
          <section className="admin-content-card">
            <div className="admin-section-heading"><div><h2>Recent appointments</h2><p>Your latest customer bookings</p></div><button onClick={() => setView("appointments")}>View all →</button></div>
            <AppointmentList items={appointments.slice(0, 5)} loading={appointmentsLoading} updateStatus={updateStatus} updating={updating} onView={setSelectedAppointment} />
          </section>
        </>}

        {view === "services" && <CatalogManager type="services" />}
        {view === "packages" && <CatalogManager type="packages" />}
        {view === "hours" && <BusinessHours />}

        {view === "appointments" && <section className="admin-content-card">
          <div className="admin-section-heading"><div><h2>All appointments</h2><p>Review and manage customer bookings</p></div></div>
          <div className="admin-toolbar">
            <input aria-label="Search appointments" placeholder="Search customer, phone or service..." value={search} onChange={e => setSearch(e.target.value)} />
            <select aria-label="Filter by status" value={filter} onChange={e => setFilter(e.target.value)}>
              {statuses.map(status => <option key={status} value={status}>{status === "all" ? "All statuses" : status[0].toUpperCase() + status.slice(1)}</option>)}
            </select>
          </div>
          <AppointmentList items={visibleAppointments} loading={appointmentsLoading} updateStatus={updateStatus} updating={updating} onView={setSelectedAppointment} />
        </section>}
        {selectedAppointment && (() => {
          const item = selectedAppointment
          const digits = String(item.customer_phone || "").replace(/\D/g, "")
          const number = digits.startsWith("254") ? digits : digits.startsWith("0") ? "254" + digits.slice(1) : "254" + digits
          const message = `Hello ${item.customer_name}, regarding your ${item.service_name_snapshot || "appointment"} booking at Celestique Beauty Spa.`
          return (
            <div className="admin-detail-overlay">
              <section className="admin-detail-panel" role="dialog" aria-modal="true" aria-labelledby="appointment-detail-title">
                <header>
                  <div>
                    <span className="admin-eyebrow">BOOKING INFORMATION</span>
                    <h2 id="appointment-detail-title">Appointment details</h2>
                  </div>
                  <button type="button" onClick={() => setSelectedAppointment(null)} aria-label="Close details">×</button>
                </header>
                <div className="admin-detail-grid">
                  <div><small>Customer name</small><strong>{item.customer_name}</strong></div>
                  <div><small>Phone number</small><strong>{item.customer_phone}</strong></div>
                  <div><small>Service or package</small><strong>{item.service_name_snapshot || "—"}</strong></div>
                  <div><small>Service option</small><strong>{item.service_option || "—"}</strong></div>
                  <div><small>Appointment date</small><strong>{moneyDate(item.booking_date)}</strong></div>
                  <div><small>Appointment time</small><strong>{String(item.time_slot || "").slice(0, 5)}</strong></div>
                  <div><small>Price snapshot</small><strong>{item.price_snapshot || "Not recorded"}</strong></div>
                  <div><small>Booking status</small><strong className={"admin-status status-" + item.status}>{item.status}</strong></div>
                  <div><small>Booking source</small><strong>{item.source || "—"}</strong></div>
                  <div><small>Submitted</small><strong>{item.created_at ? new Date(item.created_at).toLocaleString("en-KE") : "—"}</strong></div>
                </div>
                <div className="admin-detail-notes">
                  <small>Customer message / notes</small>
                  <p>{item.notes || "No additional notes provided."}</p>
                </div>
                <div className="admin-detail-actions">
                  <a href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">WhatsApp customer</a>
                  <a href={`tel:${item.customer_phone}`}>Call customer</a>
                  <button type="button" onClick={() => setSelectedAppointment(null)}>Close</button>
                </div>
              </section>
            </div>
          )
        })()}

        <footer className="admin-footer">Celestique Beauty Spa <span>•</span> Management portal</footer>
      </section>
    </main>
  )
}

function AppointmentList({ items, loading, updateStatus, updating, onView }) {
  if (loading) return <p className="admin-empty">Loading appointments...</p>
  if (!items.length) return <p className="admin-empty">No appointments found.</p>

  return <div className="admin-appointment-list">
    {items.map(item => <article className="admin-appointment" key={item.id}>
      <div className="admin-date-tile"><strong>{new Date(item.booking_date + "T00:00:00").getDate()}</strong><span>{new Date(item.booking_date + "T00:00:00").toLocaleDateString("en-KE", { month: "short" })}</span></div>
      <div className="admin-appointment-info">
        <strong>{item.customer_name}</strong>
        <span>{item.service_name_snapshot || "Service"}{item.service_option ? " · " + item.service_option : ""}</span>
        <small>{item.customer_phone} · {moneyDate(item.booking_date)} · {String(item.time_slot || "").slice(0, 5)}</small>
      </div>
      <div className="admin-appointment-actions">
        <button className="admin-view" onClick={() => onView(item)}>View details</button>
        <span className={"admin-status status-" + item.status}>{item.status}</span>
        {item.status === "pending" && <>
          <button disabled={updating === item.id} onClick={() => updateStatus(item.id, "confirmed")}>Confirm</button>
          <button className="admin-cancel" disabled={updating === item.id} onClick={() => updateStatus(item.id, "cancelled")}>Cancel</button>
        </>}
        {item.status === "confirmed" && <>
          <button disabled={updating === item.id} onClick={() => updateStatus(item.id, "completed")}>Complete</button>
          <button className="admin-cancel" disabled={updating === item.id} onClick={() => updateStatus(item.id, "cancelled")}>Cancel</button>
        </>}
      </div>
    </article>)}
  </div>
}
