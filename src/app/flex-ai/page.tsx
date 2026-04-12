"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import ChatBot from "@/components/ui/ChatBot"

export default function FlexAIPage() {
  const router = useRouter()
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

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      
      {/* Mobile: hamburger top-right */}
      <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 100 }} className="flex-ai-mobile-menu">
        <button onClick={() => setMenuOpen(o => !o)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", width: "40px", height: "40px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "4px" }}>
          <span style={{ width: "18px", height: "2px", backgroundColor: "white", borderRadius: "2px" }}/>
          <span style={{ width: "18px", height: "2px", backgroundColor: "white", borderRadius: "2px" }}/>
          <span style={{ width: "18px", height: "2px", backgroundColor: "white", borderRadius: "2px" }}/>
        </button>
        {menuOpen && (
          <div style={{ position: "absolute", top: "48px", right: 0, backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.5rem", minWidth: "160px", zIndex: 200 }}>
            {navLinks.map(link => (
              <a key={link.href} href={link.href} style={{ display: "block", padding: "0.6rem 1rem", color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: "4px" }}
                onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: three-column layout */}
      <div className="flex-ai-desktop-layout" style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* LEFT SIDEBAR — quick actions */}
        <div className="flex-ai-sidebar-left" style={{ width: "200px", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto" }}>
          <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem" }}>Quick Ask</p>
          {[
            { icon: "🚚", label: "Track Order" },
            { icon: "💪", label: "Workout Plan" },
            { icon: "🥗", label: "Diet Chart" },
            { icon: "📊", label: "BMI Check" },
            { icon: "📏", label: "Size Guide" },
            { icon: "💊", label: "Supplements" },
            { icon: "🚛", label: "Delivery Info" },
            { icon: "👕", label: "Browse Products" },
            { icon: "🏋️", label: "Gym Gear Guide" },
            { icon: "🔥", label: "Motivation" },
          ].map(btn => (
            <button key={btn.label} onClick={() => {
              const chatInput = document.querySelector('.cinput') as HTMLInputElement
              if (chatInput) { chatInput.value = btn.label; chatInput.dispatchEvent(new Event('input', { bubbles: true })); chatInput.focus() }
            }} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.75rem", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "rgba(255,255,255,0.7)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%" }}>
              <span>{btn.icon}</span><span>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* CENTER — Chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", maxWidth: "680px", margin: "0 auto" }}>
          <ChatBot fullPage />
        </div>

        {/* RIGHT SIDEBAR — nav links */}
        <div className="flex-ai-sidebar-right" style={{ width: "180px", flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.25rem", overflowY: "auto" }}>
          <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem" }}>Navigate</p>
          {navLinks.map(link => (
            <a key={link.href} href={link.href} style={{ display: "block", padding: "0.6rem 0.75rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: "6px", border: "1px solid transparent", transition: "all 0.15s" }}>
              {link.label}
            </a>
          ))}
          <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", textAlign: "center" as const }}>Powered by<br/>Flextreme AI</p>
          </div>
        </div>
      </div>

      <style>{`
        .flex-ai-mobile-menu { display: none; }
        @media (max-width: 768px) {
          .flex-ai-mobile-menu { display: block; }
          .flex-ai-sidebar-left { display: none !important; }
          .flex-ai-sidebar-right { display: none !important; }
          .flex-ai-desktop-layout { flex-direction: column; }
        }
        @media (min-width: 769px) {
          .flex-ai-mobile-menu { display: none !important; }
        }
        .flex-ai-sidebar-left button:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.15) !important; color: white !important; }
        .flex-ai-sidebar-right a:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.12) !important; color: white !important; }
      `}</style>
    </div>
  )
}
