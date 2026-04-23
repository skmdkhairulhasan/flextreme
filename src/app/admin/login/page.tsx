"use client"
import { useState } from "react"
import { apiFetchClient, setAdminToken } from "@/lib/api/client"
import { useRouter } from "next/navigation"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  function getLoginErrorMessage(err: unknown) {
    const message = err instanceof Error ? err.message : String(err || "")
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("invalid email or password") || lowerMessage.includes("invalid login credentials")) {
      return "Invalid email or password. Please try again."
    }

    return "Unable to sign in right now. Please try again in a moment."
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) { setError("Please enter email and password"); return }
    setLoading(true)
    setError("")
    try {
      const data = await apiFetchClient<{ token: string }>("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      setAdminToken(data.token)
      router.push("/admin/dashboard")
    } catch (err: any) {
      setError(getLoginErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "black", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>FLEXTREME</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>Admin Panel</p>
        </div>
        <div style={{ backgroundColor: "white", padding: "2.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "1.5rem" }}>Sign In</h2>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@flextremefit.com" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 1rem", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 1rem", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }} />
          </div>
          {error && <div style={{ backgroundColor: "#fff0f0", border: "1px solid #ffcccc", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#cc0000" }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", backgroundColor: loading ? "#333" : "black", color: "white", padding: "1rem", fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.15em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </div>
        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>Flextreme Admin — Authorized Access Only</p>
      </div>
    </div>
  )
}
