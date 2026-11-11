import { useState } from "react"
import { supabase } from "./lib/supabase"

export default function AdminSettings({ user }) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackType, setFeedbackType] = useState("")

  const updatePassword = async (event) => {
    event.preventDefault()
    setFeedback("")
    setFeedbackType("")

    if (newPassword.length < 8) {
      setFeedback("Your new password must contain at least 8 characters.")
      setFeedbackType("error")
      return
    }

    if (newPassword !== confirmPassword) {
      setFeedback("The passwords do not match.")
      setFeedbackType("error")
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setNewPassword("")
      setConfirmPassword("")
      setFeedback("Your password has been updated successfully.")
      setFeedbackType("success")
    } catch (error) {
      setFeedback(error.message || "We could not update your password.")
      setFeedbackType("error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-settings-grid">
      <section className="admin-settings-card">
        <span className="admin-settings-eyebrow">ADMINISTRATOR ACCOUNT</span>
        <h2>Account details</h2>
        <p>These details identify the account currently managing the spa website.</p>

        <div className="admin-settings-detail">
          <span>Account role</span>
          <strong>Authorized administrator</strong>
        </div>

        <div className="admin-settings-detail">
          <span>Email address</span>
          <strong>{user?.email || "Not available"}</strong>
        </div>
      </section>

      <section className="admin-settings-card">
        <span className="admin-settings-eyebrow">ACCOUNT SECURITY</span>
        <h2>Change password</h2>
        <p>Choose a strong password with at least eight characters. You will remain signed in after a successful update.</p>

        <form onSubmit={updatePassword}>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
              placeholder="Enter a new password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={saving}
            />
          </label>

          <label>
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              placeholder="Enter the password again"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={saving}
            />
          </label>

          <button className="admin-primary" type="submit" disabled={saving}>
            {saving ? "Updating password..." : "Update password"}
          </button>

          {feedback && (
            <p className={`admin-settings-feedback ${feedbackType}`} role="status">
              {feedback}
            </p>
          )}
        </form>
      </section>

      <section className="admin-settings-card">
        <span className="admin-settings-eyebrow">CUSTOMER PRIVACY</span>
        <h2>Privacy information</h2>
        <p>Customers can review how appointment information and browser storage are handled.</p>

        <div className="admin-settings-links">
          <a href="/privacy">Privacy Notice ↗</a>
          <a href="/cookies">Cookie &amp; Browser Storage Notice ↗</a>
        </div>

        <div className="admin-settings-detail">
          <span>Privacy enquiries</span>
          <a href="mailto:andayitimothy48@gmail.com">andayitimothy48@gmail.com</a>
        </div>
      </section>
    </div>
  )
}
