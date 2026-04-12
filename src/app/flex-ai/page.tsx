"use client"
import { useState, useEffect, useRef } from "react"
import ChatBot from "@/components/ui/ChatBot"

export default function FlexAIPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/reviews", label: "Reviews" },
    { href: "/about", label: "About" },
    { href: "/size-guide", label: "Size Guide" },
    { href: "/delivery", label: "Delivery" },
    { href: "/contact", label: "Contact" },
  ]

  const suggestions = [
    "Find my order 🚚",
    "Workout plan 💪",
    "Diet chart 🥗",
    "My BMI 📊",
    "What size fits me? 📏",
    "Supplements 💊",
    "Delivery charges 🚛",
    "Show products 👕",
    "Gym gear guide 🏋️",
    "Recovery tips 😴",
    "Injury advice 🩹",
    "Motivate me 🔥",
  ]

  function sendSuggestion(text: string) {
    const input = document.querySelector(".cinput") as HTMLInputElement
    if (!input) return
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set
    setter?.call(input, text)
    input.dispatchEvent(new Event("input", { bubbles: true }))
    setTimeout(() => {
      const btn = input.parentElement?.querySelector("button") as HTMLButtonElement
      btn?.click()
    }, 60)
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── MOBILE TOP BAR ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.7rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} className="fai-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 30, height: 30, background: "black", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "1rem" }}>🤖</span>
          </div>
          <span style={{ color: "white", fontWeight: 900, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Flex AI</span>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setMenuOpen(o => !o)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, width: 38, height: 38, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 0 }}>
            {[0,1,2].map(i => <span key={i} style={{ display: "block", width: 16, height: 2, background: "white", borderRadius: 2 }} />)}
          </button>
          {menuOpen && (
            <div style={{ position: "absolute", top: 44, right: 0, background: "#111", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "0.5rem", minWidth: 170, zIndex: 300 }}>
              {navLinks.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "0.55rem 0.875rem", color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600, borderRadius: 6 }}>
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* LEFT — nav links (desktop only) */}
        <div style={{ width: 175, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.2rem", overflowY: "auto" }} className="fai-left">
          <p style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.5rem" }}>Navigate</p>
          {navLinks.map(l => (
            <a key={l.href} href={l.href} style={{ display: "block", padding: "0.55rem 0.65rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.78rem", fontWeight: 500, borderRadius: 7, border: "1px solid transparent", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.target as HTMLElement).style.color = "white" }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; (e.target as HTMLElement).style.color = "rgba(255,255,255,0.6)" }}>
              {l.label}
            </a>
          ))}
        </div>

        {/* CENTER — chat, fills remaining space */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <ChatBot fullPage />
        </div>

        {/* RIGHT — suggestions (desktop only) */}
        <div style={{ width: 185, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.07)", padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.3rem", overflowY: "auto" }} className="fai-right">
          <p style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.5rem" }}>Quick Ask</p>
          {suggestions.map(s => (
            <button key={s} onClick={() => sendSuggestion(s)} style={{ display: "flex", alignItems: "center", padding: "0.5rem 0.65rem", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, color: "rgba(255,255,255,0.65)", fontSize: "0.74rem", fontWeight: 500, cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.15s" }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.background = "rgba(255,255,255,0.06)"; el.style.color = "white" }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = "rgba(255,255,255,0.65)" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        /* Desktop: show sidebars, hide topbar hamburger on desktop */
        @media (min-width: 769px) {
          .fai-topbar { display: none !important; }
          .fai-left { display: flex !important; }
          .fai-right { display: flex !important; }
        }
        /* Mobile: hide sidebars, show topbar */
        @media (max-width: 768px) {
          .fai-topbar { display: flex !important; }
          .fai-left { display: none !important; }
          .fai-right { display: none !important; }
        }
      `}</style>
    </div>
  )
}
