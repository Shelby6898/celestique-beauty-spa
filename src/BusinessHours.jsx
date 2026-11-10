import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function BusinessHours() {
  const [hours, setHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [message, setMessage] = useState("")

  const loadHours = async () => {
    setLoading(true)
    setMessage("")
    const { data, error } = await supabase
      .from("business_hours")
      .select("id, day_of_week, opening_time, closing_time, is_closed")
      .order("day_of_week")

    if (error) setMessage("Could not load business hours: " + error.message)
    else setHours(data || [])
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHours()
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  const changeDay = (id, field, value) => {
    setHours(current => current.map(day =>
      day.id === id ? { ...day, [field]: value } : day
    ))
    setMessage("")
  }

  const saveDay = async (day) => {
    if (!day.is_closed && (!day.opening_time || !day.closing_time || day.closing_time <= day.opening_time)) {
      setMessage("Please enter valid opening and closing times for " + days[day.day_of_week] + ".")
      return
    }

    setSaving(day.id)
    setMessage("")

    const { error } = await supabase
      .from("business_hours")
      .update({
        opening_time: day.is_closed ? null : day.opening_time,
        closing_time: day.is_closed ? null : day.closing_time,
        is_closed: day.is_closed
      })
      .eq("id", day.id)

    if (error) setMessage("Could not save changes: " + error.message)
    else setMessage(days[day.day_of_week] + " hours saved successfully.")

    setSaving(null)

  }

  return (
    <section className="admin-content-card business-hours">
      <div className="admin-section-heading">
        <div>
          <h2>Business hours</h2>
          <p>Manage when customers can book appointments</p>
        </div>
        <button onClick={loadHours} disabled={loading}>↻ Refresh</button>
      </div>

      {message && <p role="status" className="business-hours-message">{message}</p>}

      {loading ? <p>Loading business hours...</p> : hours.map(day => (
        <div className="business-hours-row" key={day.id}>
          <div className="business-hours-day">
            <strong>{days[day.day_of_week]}</strong>
            <label>
              <input
                type="checkbox"
                checked={day.is_closed}
                onChange={e => changeDay(day.id, "is_closed", e.target.checked)}
              />
              Closed
            </label>
          </div>

          {!day.is_closed ? (
            <div className="business-hours-times">
              <label>
                <span>Opens</span>
                <input
                  type="time"
                  value={(day.opening_time || "").slice(0, 5)}
                  onChange={e => changeDay(day.id, "opening_time", e.target.value)}
                />
              </label>
              <label>
                <span>Closes</span>
                <input
                  type="time"
                  value={(day.closing_time || "").slice(0, 5)}
                  onChange={e => changeDay(day.id, "closing_time", e.target.value)}
                />
              </label>
            </div>
          ) : <span className="business-hours-closed">Closed all day</span>}

          <button
            className="business-hours-save"
            onClick={() => saveDay(day)}
            disabled={saving !== null || loading}
          >
            {saving === day.id ? "Saving..." : "Save"}
          </button>
        </div>
      ))}

      {!loading && hours.length !== 7 && (
        <p role="alert">Expected 7 business-hour records, but found {hours.length}. Please check the database.</p>
      )}
    </section>
  )
}
