"use client"
import { useState } from "react"
import ChatBot from "@/components/ui/ChatBot"

export default function FlexAIPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: "/", label: "🏠 Home" },
    { href: "/products", label: "👕 Products" },
    { href: "/reviews", label: "⭐ Reviews" },
    { href: "/about", label: "ℹ️ About" },
    { href: "/size-guide", label: "📏 Size Guide" },
    { href: "/delivery", label: "🚚 Delivery" },
    { href: "/contact", label: "📞 Contact" },
  ]

  const suggestions = [
    "Find my order 🚚",
    "Build workout plan 💪",
    "Make diet chart 🥗",
    "Calculate my BMI 📊",
    "What size fits me? 📏",
    "Supplement advice 💊",
    "Delivery charges 🚛",
    "Show me products 👕",
    "Gym gear guide 🏋️",
    "Recovery tips 😴",
    "Injury advice 🩹",
    "Motivation 🔥",
  ]

  function sendSuggestion(text: string) {
    const input = document.querySelector('.cinput') as HTMLInputElement
    if (!input) return
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    nativeInputValueSetter?.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    setTimeout(() => {
      const sendBtn = input.closest('div')?.querySelector('button') as HTMLButtonElement
      sendBtn?.click()
    }, 50)
  }

  return (
    <>
      <style>{`
        .fai-root { position:fixed; inset:0; background:#0a0a0a; display:flex; flex-direction:column; }
        .fai-mobile-bar { display:none; }
        .fai-body { flex:1; display:flex; overflow:hidden; }
        .fai-left { width:190px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.07); padding:1rem 0.75rem; display:flex; flex-direction:column; gap:0.35rem; overflow-y:auto; }
        .fai-center { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
        .fai-right { width:170px; flex-shrink:0; border-left:1px solid rgba(255,255,255,0.07); padding:1rem 0.75rem; display:flex; flex-direction:column; gap:0.25rem; overflow-y:auto; }
        .fai-label { font-size:0.58rem; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:rgba(255,255,255,0.28); margin-bottom:0.4rem; padding:0 0.25rem; }
        .fai-sugg { display:flex; align-items:center; padding:0.5rem 0.65rem; background:transparent; border:1px solid rgba(255,255,255,0.07); border-radius:7px; color:rgba(255,255,255,0.65); font-size:0.74rem; font-weight:500; cursor:pointer; text-align:left; width:100%; transition:all 0.15s; }
        .fai-sugg:hover { background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.14); color:white; }
        .fai-navlink { display:block; padding:0.5rem 0.65rem; color:rgba(255,255,255,0.55); text-decoration:none; font-size:0.74rem; font-weight:500; border-radius:7px; border:1px solid transparent; transition:all 0.15s; }
        .fai-navlink:hover { background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.1); color:white; }
        .fai-hamburger { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:white; width:38px; height:38px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:4px; flex-shrink:0; }
        .fai-dropdown { position:absolute; top:48px; right:0; background:#111; border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:0.5rem; min-width:170px; z-index:200; }
        .fai-dropdown a { display:block; padding:0.55rem 0.875rem; color:rgba(255,255,255,0.8); text-decoration:none; font-size:0.8rem; font-weight:600; border-radius:6px; }
        .fai-dropdown a:hover { background:rgba(255,255,255,0.08); color:white; }
        @media (max-width: 768px) {
          .fai-mobile-bar { display:flex !important; }
          .fai-left { display:none !important; }
          .fai-right { display:none !important; }
        }
        @media (min-width: 769px) {
          .fai-mobile-bar { display:none !important; }
        }
      `}</style>

      <div className="fai-root">
        {/* Mobile top bar */}
        <div className="fai-mobile-bar" style={{ padding:"0.75rem 1rem", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
            <div style={{ width:"28px", height:"28px", background:"black", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(255,255,255,0.2)" }}>
              <span style={{ fontSize:"0.9rem" }}>🤖</span>
            </div>
            <span style={{ color:"white", fontWeight:800, fontSize:"0.9rem", letterSpacing:"0.08em", textTransform:"uppercase" }}>Flex AI</span>
          </div>
          <div style={{ position:"relative" }}>
            <button className="fai-hamburger" onClick={() => setMenuOpen(o => !o)}>
              <span style={{ width:"16px", height:"2px", background:"white", borderRadius:"2px" }}/>
              <span style={{ width:"16px", height:"2px", background:"white", borderRadius:"2px" }}/>
              <span style={{ width:"16px", height:"2px", background:"white", borderRadius:"2px" }}/>
            </button>
            {menuOpen && (
              <div className="fai-dropdown">
                {navLinks.map(l => (
                  <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="fai-body">
          {/* LEFT — suggestions */}
          <div className="fai-left">
            <p className="fai-label">Quick Ask</p>
            {suggestions.map(s => (
              <button key={s} className="fai-sugg" onClick={() => sendSuggestion(s)}>{s}</button>
            ))}
          </div>

          {/* CENTER — chat */}
          <div className="fai-center">
            <ChatBot fullPage />
          </div>

          {/* RIGHT — nav */}
          <div className="fai-right">
            <p className="fai-label">Navigate</p>
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="fai-navlink">{l.label}</a>
            ))}
            <div style={{ marginTop:"auto", paddingTop:"1rem", borderTop:"1px solid rgba(255,255,255,0.07)", textAlign:"center" as const }}>
              <span style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.2)", textTransform:"uppercase", letterSpacing:"0.12em" }}>Flextreme AI</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
