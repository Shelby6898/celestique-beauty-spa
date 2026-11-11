import { useState } from "react"

const STATUSES = ["pending", "confirmed", "completed", "cancelled"]

const validDate = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)

const parseQuotedAmount = (value) => {
  if (typeof value !== "string") return null

  const match = value.trim().match(/^(?:KSh|KES)\s*([0-9]+(?:,[0-9]{3})*(?:\.\d{1,2})?)$/i)
  if (!match) return null

  const amount = Number(match[1].replace(/,/g, ""))
  return Number.isFinite(amount) ? amount : null
}

const formatAmount = (amount) =>
  `KSh ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`

const csvCell = (value) => {
  let text = String(value ?? "")

  // Prevent spreadsheet formula execution from imported service names.
  let firstMeaningful = 0
  while (firstMeaningful < text.length) {
    const code = text.charCodeAt(firstMeaningful)
    if (code <= 0x20 || code === 0x7f) firstMeaningful += 1
    else break
  }
  if (
    firstMeaningful < text.length &&
    "=+-@".includes(text[firstMeaningful])
  ) {
    text = "'" + text
  }

  return `"${text.replace(/"/g, '""')}"`
}

const downloadCsv = (rows, filename) => {
  const csv = "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const getServiceName = (item) =>
  String(item.service_name_snapshot || "Unspecified service").trim() || "Unspecified service"

export default function Reports({ appointments = [], loading = false }) {
  const [period, setPeriod] = useState("monthly")
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"))

  const years = [
    ...new Set([
      String(new Date().getFullYear()),
      ...appointments
        .filter(item => validDate(item.booking_date))
        .map(item => item.booking_date.slice(0, 4))
    ])
  ].sort((a, b) => b.localeCompare(a))

  const filtered = appointments.filter(item => {
    if (!validDate(item.booking_date)) return false
    if (item.booking_date.slice(0, 4) !== year) return false

    return period === "annual" || item.booking_date.slice(5, 7) === month
  })

  const summary = (() => {
    const statusCounts = Object.fromEntries(
      STATUSES.map(status => [
        status,
        filtered.filter(item => item.status === status).length
      ])
    )

    const serviceMap = new Map()
    const monthlyMap = new Map()
    const valueByStatus = Object.fromEntries(STATUSES.map(status => [status, 0]))
    let validPriceCount = 0
    let missingPriceCount = 0
    let invalidPriceCount = 0
    let totalQuoted = 0

    filtered.forEach(item => {
      const amount = parseQuotedAmount(item.price_snapshot)

      if (amount === null) {
        const rawPrice = item.price_snapshot == null ? "" : String(item.price_snapshot).trim()
        if (rawPrice) invalidPriceCount += 1
        else missingPriceCount += 1
      } else {
        validPriceCount += 1
        totalQuoted += amount
        if (STATUSES.includes(item.status)) valueByStatus[item.status] += amount
      }

      const name = getServiceName(item)
      const existing = serviceMap.get(name) || {
        name,
        count: 0,
        quoted: 0,
        validPrices: 0
      }

      existing.count += 1
      if (amount !== null) {
        existing.quoted += amount
        existing.validPrices += 1
      }
      serviceMap.set(name, existing)

      const monthKey = item.booking_date.slice(5, 7)
      const monthEntry = monthlyMap.get(monthKey) || {
        month: monthKey,
        count: 0,
        completed: 0,
        cancelled: 0,
        quoted: 0
      }

      monthEntry.count += 1
      if (item.status === "completed") monthEntry.completed += 1
      if (item.status === "cancelled") monthEntry.cancelled += 1
      if (amount !== null) monthEntry.quoted += amount
      monthlyMap.set(monthKey, monthEntry)
    })

    return {
      total: filtered.length,
      statusCounts,
      services: [...serviceMap.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      monthly: [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month)),
      valueByStatus,
      totalQuoted,
      validPriceCount,
      missingPriceCount,
      invalidPriceCount
    }
  })()

  const periodLabel = period === "monthly"
    ? `${year}-${month}`
    : year

  if (loading) {
    return (
      <section className="admin-content-card reports-page">
        <div className="admin-section-heading">
          <div>
            <h2>Business reports</h2>
            <p>Loading appointment data...</p>
          </div>
        </div>
      </section>
    )
  }

  const exportReport = () => {
    const rows = [
      ["Celestique Beauty Spa", period === "monthly" ? "Monthly report" : "Annual report"],
      ["Reporting period", periodLabel],
      ["Date basis", "Appointment date (booking_date)"],
      [],
      ["Appointment summary"],
      ["Metric", "Appointments"]
    ]

    rows.push(["All appointments", summary.total])

    STATUSES.forEach(status => {
      rows.push([
        status[0].toUpperCase() + status.slice(1),
        summary.statusCounts[status]
      ])
    })

    rows.push(
      [],
      ["Quoted-value summary (KSh; not revenue or payments received)"],
      ["Metric", "Quoted amount (KSh)"]
    )

    rows.push(["All valid price snapshots", summary.totalQuoted.toFixed(2)])

    STATUSES.forEach(status => {
      rows.push([
        `${status[0].toUpperCase() + status.slice(1)} quoted amounts`,
        summary.valueByStatus[status].toFixed(2)
      ])
    })

    rows.push(
      ["Bookings with valid price snapshots", summary.validPriceCount],
      ["Bookings with missing price snapshots", summary.missingPriceCount],
      ["Bookings with unrecognised non-empty price formats", summary.invalidPriceCount],
      [],
      ["Service popularity"],
      ["Service", "Appointments", "Valid quoted amount (KSh)", "Valid price snapshots"]
    )

    summary.services.forEach(service => {
      rows.push([
        service.name,
        service.count,
        service.quoted.toFixed(2),
        service.validPrices
      ])
    })

    if (period === "annual") {
      rows.push(
        [],
        ["Monthly appointment trend"],
        ["Month", "All appointments", "Completed", "Cancelled", "Quoted amount (KSh)"]
      )

      summary.monthly.forEach(entry => {
        rows.push([
          entry.month,
          entry.count,
          entry.completed,
          entry.cancelled,
          entry.quoted.toFixed(2)
        ])
      })
    }

    downloadCsv(
      rows,
      `celestique-${period}-report-${periodLabel}.csv`
    )
  }

  return (
    <section className="admin-content-card reports-page">
      <div className="reports-heading-row">
        <div className="reports-heading-copy">
          <span>REPORTING OVERVIEW</span>
          <p>Appointment summaries based on scheduled service dates</p>
        </div>
        <button className="reports-export" type="button" onClick={exportReport} disabled={!filtered.length}>
          <span aria-hidden="true">↓</span> Export CSV
        </button>
      </div>

      <div className="reports-controls">
        <div className="reports-period-toggle" aria-label="Report period">
          <button
            type="button"
            className={period === "monthly" ? "active" : ""}
            aria-pressed={period === "monthly"}
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={period === "annual" ? "active" : ""}
            aria-pressed={period === "annual"}
            onClick={() => setPeriod("annual")}
          >
            Annual
          </button>
        </div>

        <label>
          Year
          <select value={year} onChange={event => setYear(event.target.value)}>
            {years.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>

        {period === "monthly" && (
          <label>
            Month
            <select value={month} onChange={event => setMonth(event.target.value)}>
              {Array.from({ length: 12 }, (_, index) => {
                const value = String(index + 1).padStart(2, "0")
                return (
                  <option key={value} value={value}>
                    {new Date(2000, index, 1).toLocaleDateString("en-KE", { month: "long" })}
                  </option>
                )
              })}
            </select>
          </label>
        )}
      </div>

      <div className="reports-period-caption">
        Showing {period === "monthly" ? "monthly" : "annual"} results for {periodLabel}
      </div>

      <div className="admin-stat-grid reports-stat-grid">
        <article className="admin-stat">
          <span>Total appointments</span>
          <strong>{summary.total}</strong>
          <small>Scheduled in this period</small>
        </article>
        <article className="admin-stat">
          <span>Completed</span>
          <strong>{summary.statusCounts.completed}</strong>
          <small>Marked as completed</small>
        </article>
        <article className="admin-stat">
          <span>Cancelled</span>
          <strong>{summary.statusCounts.cancelled}</strong>
          <small>Cancelled appointments</small>
        </article>
        <article className="admin-stat">
          <span>Quoted amounts</span>
          <strong>{formatAmount(summary.totalQuoted)}</strong>
          <small>Valid price snapshots only</small>
        </article>
      </div>

      <div className="reports-section">
        <h3>Appointment status</h3>
        <div className="reports-table-wrap">
          <table className="reports-table">
            <thead>
              <tr><th>Status</th><th>Appointments</th><th>Quoted amount</th></tr>
            </thead>
            <tbody>
              {STATUSES.map(status => (
                <tr key={status}>
                  <td>{status[0].toUpperCase() + status.slice(1)}</td>
                  <td>{summary.statusCounts[status]}</td>
                  <td>{formatAmount(summary.valueByStatus[status])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="reports-section">
        <h3>Popular services and packages</h3>
        {summary.services.length ? (
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr><th>Service or package</th><th>Appointments</th><th>Quoted amount</th></tr>
              </thead>
              <tbody>
                {summary.services.map(service => (
                  <tr key={service.name}>
                    <td>{service.name}</td>
                    <td>{service.count}</td>
                    <td>{formatAmount(service.quoted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">No appointments recorded for this period.</p>
        )}
      </div>

      {period === "annual" && (
        <div className="reports-section">
          <h3>Monthly appointment trend</h3>
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr><th>Month</th><th>All</th><th>Completed</th><th>Cancelled</th><th>Quoted amount</th></tr>
              </thead>
              <tbody>
                {summary.monthly.map(entry => (
                  <tr key={entry.month}>
                    <td>{new Date(Number(year), Number(entry.month) - 1, 1).toLocaleDateString("en-KE", { month: "long" })}</td>
                    <td>{entry.count}</td>
                    <td>{entry.completed}</td>
                    <td>{entry.cancelled}</td>
                    <td>{formatAmount(entry.quoted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="reports-disclaimer">
        Quoted amounts use valid price snapshots only; they are not evidence of
        payment, collected revenue or profit. Of {summary.total} appointments,
        {summary.validPriceCount} have valid prices, {summary.missingPriceCount} are
        missing prices and {summary.invalidPriceCount} have unrecognised price formats.
        Missing and unrecognised prices are excluded from quoted-value calculations.
        CSV exports contain aggregate summaries only, without customer contact details or booking IDs.
      </p>
    </section>
  )
}
