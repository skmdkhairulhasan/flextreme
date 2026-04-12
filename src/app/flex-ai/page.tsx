"use client"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function FlexAIPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hey! I'm Flex — your AI fitness & shopping assistant.\n\n🚚 Track your order\n🚛 Delivery charges & info\n👕 Browse & shop products\n📏 Size recommendation\n💪 Workout plans\n🥗 Diet charts\n📊 BMI calculator\n💊 Supplements\n\nWhat do you need? 💪" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text) return
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: text }])
    setLoading(true)
    // Use same API as chatbot widget
    try {
      const res = await fetch("/api/flex-ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, I couldn't process that. Try again!" }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }])
    }
    setLoading(false)
  }

  function formatMessage(text: string) {
    return text.split("\n").map((line, i) => (
      <span key={i}>{line}{i < text.split("\n").length - 1 && <br />}</span>
    ))
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "black", display: "flex", flexDirection: "column", paddingTop: "72px" }}>
      {/* Header */}
      <div style={{ backgroundColor: "black", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: "42px", height: "42px", backgroundColor: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>🤖</div>
        <div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Flex AI</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", margin: 0 }}>Your fitness & shopping assistant</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: "8px", height: "8px", backgroundColor: "#16a34a", borderRadius: "50%" }} />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "800px", width: "100%", margin: "0 auto" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "0.5rem" }}>
            {msg.role === "assistant" && (
              <div style={{ width: "32px", height: "32px", backgroundColor: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: "75%", padding: "0.875rem 1.1rem", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              backgroundColor: msg.role === "user" ? "white" : "rgba(255,255,255,0.08)",
              color: msg.role === "user" ? "black" : "white", fontSize: "0.9rem", lineHeight: 1.6,
              border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.1)" : "none"
            }}>
              {formatMessage(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
            <div style={{ width: "32px", height: "32px", backgroundColor: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🤖</div>
            <div style={{ padding: "0.875rem 1.1rem", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: "6px", height: "6px", backgroundColor: "rgba(255,255,255,0.5)", borderRadius: "50%", animation: `bounce 1s infinite ${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick buttons */}
      <div style={{ padding: "0.75rem 1.5rem", display: "flex", gap: "0.5rem", overflowX: "auto", borderTop: "1px solid rgba(255,255,255,0.06)", maxWidth: "800px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {["Find my order 🚚", "Workout plan 💪", "Diet chart 🥗", "BMI check 📊", "Size guide 📏", "Supplements 💊"].map(btn => (
          <button key={btn} onClick={() => { setInput(btn); }} style={{ flexShrink: 0, padding: "0.4rem 0.875rem", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)", borderRadius: "20px", fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap" }}>
            {btn}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "1rem 1.5rem 1.5rem", backgroundColor: "black", borderTop: "1px solid rgba(255,255,255,0.1)", maxWidth: "800px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "0.5rem 0.5rem 0.5rem 1rem" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask Flex anything..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: "0.9rem" }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ width: "38px", height: "38px", backgroundColor: input.trim() ? "white" : "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "black" : "rgba(255,255,255,0.4)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100% { transform: translateY(0) } 40% { transform: translateY(-6px) } }
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
      `}</style>
    </div>
  )
}
