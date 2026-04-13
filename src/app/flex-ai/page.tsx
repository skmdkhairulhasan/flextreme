"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import ChatBot from "@/components/ui/ChatBot"
import Navbar from "@/components/layout/Navbar"

const SUGGESTIONS = [
  { icon: "🚚", text: "Track my order" },
  { icon: "💪", text: "Build workout plan" },
  { icon: "🥗", text: "Make diet chart" },
  { icon: "📊", text: "Calculate my BMI" },
  { icon: "📏", text: "What size fits me?" },
  { icon: "💊", text: "Supplement advice" },
  { icon: "🚛", text: "Delivery charges" },
  { icon: "👕", text: "Show me products" },
  { icon: "🏋️", text: "Gym gear guide" },
  { icon: "🩹", text: "Injury advice" },
  { icon: "🔥", text: "Motivate me" },
]

export default function FlexAIPage() {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    createClient()
      .from("products")
      .select("id,name,price,slug,images")
      .eq("in_stock", true)
      .limit(4)
      .then(({ data }) => { if (data) setProducts(data) })
  }, [])

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

  const border = "1px solid rgba(255,255,255,0.07)"

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0a0a", color: "white", overflow: "hidden" }}>

      {/* Real site Navbar */}
      <Navbar />

      {/* Body — below navbar (navbar is 72px) */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden", paddingTop: "72px" }}>

        {/* LEFT — Suggestions */}
        <aside id="fai-left" style={{ width: 210, flexShrink: 0, borderRight: border, padding: "14px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6, paddingLeft: 2 }}>Quick Ask</p>
          {SUGGESTIONS.map(s => (
            <button key={s.text} onClick={() => sendSuggestion(s.text)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "white" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.6)" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{s.icon}</span>
              <span>{s.text}</span>
            </button>
          ))}
        </aside>

        {/* CENTER — ChatBot (same perfect brain) */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          <ChatBot fullPage />
        </main>

        {/* RIGHT — Featured Products */}
        <aside id="fai-right" style={{ width: 210, flexShrink: 0, borderLeft: border, padding: "14px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6, paddingLeft: 2 }}>Featured Products</p>
          {products.length === 0 && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", padding: "4px 2px" }}>Loading...</p>
          )}
          {products.map(p => (
            <a key={p.id} href={`/products/${p.slug}`}
              style={{ display: "block", textDecoration: "none", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#111", marginBottom: 4, transition: "border-color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,234,255,0.35)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}>
              {p.images?.[0] && (
                <img src={p.images[0]} alt={p.name} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
              )}
              <div style={{ padding: "8px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                <p style={{ color: "#00eaff", fontSize: 11, fontWeight: 700, margin: "3px 0 0" }}>BDT {p.price}</p>
              </div>
            </a>
          ))}
          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: border, textAlign: "center" }}>
            <a href="/products" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>View all products →</a>
          </div>
        </aside>
      </div>

      {/* Hide sidebars on mobile */}
      <style>{`
        @media (max-width: 768px) {
          #fai-left, #fai-right { display: none !important; }
        }
      `}</style>
    </div>
  )
}
