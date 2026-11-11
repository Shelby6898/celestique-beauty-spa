import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import Admin from "./Admin.jsx"
import { PrivacyPage, CookiePage } from "./LegalPage.jsx"

const path = window.location.pathname.replace(/\/+$/, "") || "/"
const Root = path === "/admin"
  ? Admin
  : path === "/privacy"
    ? PrivacyPage
    : path === "/cookies"
      ? CookiePage
      : App

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
