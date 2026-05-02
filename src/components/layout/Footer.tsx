"use client"
import { useEffect, useState } from "react"

export default function Footer() {
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        const map: Record<string, string> = {}
        if (Array.isArray(data.settings)) {
          data.settings.forEach((item: any) => {
            if (item.key) map[item.key] = item.value
          })
        }
        setSettings(map)
      })
      .catch(() => {})
  }, [])

  const email = settings.store_email || ""
  const phone = settings.store_phone || ""
  const tagline = settings.footer_tagline || "Push Harder. Look Sharper."

  function fix(url: string) {
    if (!url || !url.trim()) return ""
    const t = url.trim()
    return t.startsWith("http") ? t : "https://" + t
  }

  const socials = [
    {
  name: "Instagram",
  url: fix(settings.instagram_url || ""),
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 4a6 6 0 100 12 6 6 0 000-12zm0 2a4 4 0 110 8 4 4 0 010-8zm5.5-2.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
    </svg>
  ) },

  { name: "Facebook", url: fix(settings.facebook_url || ""), icon: (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12a10 10 0 10-11.5 9.87v-6.99H8v-2.88h2.5V9.41c0-2.47 1.47-3.84 3.73-3.84 1.08 0 2.2.19 2.2.19v2.42h-1.24c-1.22 0-1.6.76-1.6 1.54v1.85H16l-.4 2.88h-2.2v6.99A10 10 0 0022 12z"/>
  </svg>
  ) },

  { name: "TikTok", url: fix(settings.tiktok_url || ""), icon: (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 3c.3 2.1 1.9 3.7 4 4v3c-1.6 0-3.1-.5-4-1.3V14a6 6 0 11-6-6c.3 0 .7 0 1 .1v3.1a3 3 0 102 2.8V3h3z"/>
  </svg>
  ) },

  { name: "YouTube", url: fix(settings.youtube_url || ""), icon: (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.8zM9.8 15.5v-7l6.2 3.5-6.2 3.5z"/>
  </svg>
  ) },

  { name: "Twitter", url: fix(settings.twitter_url || ""), icon: (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 5.9c-.7.3-1.5.5-2.3.6a4 4 0 001.7-2.2 8 8 0 01-2.5 1A4 4 0 0012 8.5c0 .3 0 .6.1.9A11.3 11.3 0 013 4.9a4 4 0 001.2 5.4 4 4 0 01-1.8-.5v.1a4 4 0 003.2 3.9 4 4 0 01-1.8.1 4 4 0 003.7 2.8A8.1 8.1 0 012 19.5a11.4 11.4 0 006.2 1.8c7.5 0 11.6-6.2 11.6-11.6v-.5A8.3 8.3 0 0022 5.9z"/>
  </svg>
  ) },
  ].filter(s => s.url !== "")

  return (
    <footer style={{ backgroundColor: "#111", color: "white", paddingTop: "3rem", paddingBottom: "2rem", marginTop: "4rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", paddingLeft: "1.5rem", paddingRight: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem", paddingBottom: "2rem", borderBottom: "1px solid #333" }}>

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "1rem" }}>
              <img src="/logo-transparent.png" alt="Flextreme" style={{ width: "46px", height: "46px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
              <h3 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0, textTransform: "uppercase" }}>FLEXTREME</h3>
            </div>
            <p style={{ color: "#999", fontSize: "0.9rem", lineHeight: 1.6 }}>{tagline}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Quick Links</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <li><a href="/products" style={{ color: "#999", textDecoration: "none", fontSize: "0.9rem" }}>Products</a></li>
              <li><a href="/about" style={{ color: "#999", textDecoration: "none", fontSize: "0.9rem" }}>About Us</a></li>
              <li><a href="/contact" style={{ color: "#999", textDecoration: "none", fontSize: "0.9rem" }}>Contact</a></li>
            </ul>
          </div>

          {/* Contact - from settings only, no hardcode */}
          <div>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Contact</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {email ? (
                <li><a href={`mailto:${email}`} style={{ color: "#999", textDecoration: "none", fontSize: "0.9rem" }}>Email: {email}</a></li>
              ) : null}
              {phone ? (
                <li><a href={`tel:${phone}`} style={{ color: "#999", textDecoration: "none", fontSize: "0.9rem" }}>Phone: {phone}</a></li>
              ) : null}
              {!email && !phone ? (
                <li style={{ color: "#555", fontSize: "0.85rem", fontStyle: "italic" }}>Set contact info in Admin → Social</li>
              ) : null}
            </ul>
          </div>

          {/* Follow Us - from settings */}
          {socials.length > 0 && (
            <div>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Follow Us</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {socials.map(s => (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: "#999", textDecoration: "none", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>{s.icon}</span> {s.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ paddingTop: "2rem", textAlign: "center" }}>
          <p style={{ color: "#666", fontSize: "0.85rem" }}>© {new Date().getFullYear()} Flextreme. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
