"use client"
import { useState } from "react"
import { fbEvent } from "@/components/ui/FacebookPixel"

export default function ContactForm({ recipientEmail, whatsapp }: { recipientEmail: string; whatsapp: string }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError("Please enter your name"); return }
    if (!email.trim()) { setError("Please enter your email"); return }
    if (!message.trim()) { setError("Please enter a message"); return }
    setError("")
    setSending(true)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, recipientEmail }),
      })
      const data = await res.json()

      if (data.success) {
        // Email sent via Resend API
        setSent(true)
      } else {
        // Fallback to mailto if no API key configured
        const body = `Name: ${name}\nEmail: ${email}\n\n${message}`
        window.location.href = `mailto:${recipientEmail || "flextremefit@gmail.com"}?subject=${encodeURIComponent(subject || "Message from " + name)}&body=${encodeURIComponent(body)}`
        setSent(true)
      }
    } catch {
      setError("Failed to send. Please try WhatsApp instead.")
    } finally {
      setSending(false)
    }
  }

  function handleWhatsApp() {
    if (!name.trim() || !message.trim()) { setError("Please fill in your name and message first"); return }
    setError("")
    const text = `Hi Flextreme! My name is ${name}.\n\n${message}`
    window.open("https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(text), "_blank")
  }

  const inp: React.CSSProperties = { width: "100%", border: "1px solid #e0e0e0", padding: "0.875rem 1rem", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }
  const lbl: React.CSSProperties = { display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem", color: "#444" }

  if (sent) {
    return (
      <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "2.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>✉️</div>
        <h3 style={{ fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", marginBottom: "0.75rem" }}>Message Sent!</h3>
        <p style={{ color: "#555", fontSize: "0.875rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          Thank you <strong>{name}</strong>! We will get back to you as soon as possible.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setMessage("") }} style={{ padding: "0.75rem 1.5rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", textTransform: "uppercase" }}>
            Send Another
          </button>
          <a href={"https://wa.me/" + whatsapp} target="_blank" rel="noreferrer" style={{ padding: "0.75rem 1.5rem", backgroundColor: "#25D366", color: "white", fontWeight: 700, fontSize: "0.8rem", textDecoration: "none", textTransform: "uppercase", display: "inline-block" }}>
            WhatsApp Us
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "2rem" }}>
      <h2 style={{ fontSize: "0.9rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "2px solid black" }}>
        Send Us a Message
      </h2>
      <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={lbl}>Your Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inp} />
          </div>
          <div>
            <label style={lbl}>Your Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={inp} />
          </div>
        </div>
        <div>
          <label style={lbl}>Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What is this about?" style={inp} />
        </div>
        <div>
          <label style={lbl}>Message *</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us how we can help you..." rows={5} style={{ ...inp, resize: "vertical" as const }} />
        </div>
        {error && <div style={{ backgroundColor: "#fff0f0", border: "1px solid #ffcccc", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#cc0000" }}>{error}</div>}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="submit" disabled={sending} style={{ flex: 1, padding: "1rem", backgroundColor: sending ? "#444" : "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: sending ? "not-allowed" : "pointer", minWidth: "160px" }}>
            {sending ? "Sending..." : "Send Message"}
          </button>
          <button type="button" onClick={handleWhatsApp} style={{ flex: 1, padding: "1rem", backgroundColor: "#25D366", color: "white", border: "none", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", minWidth: "160px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
        </div>
        <p style={{ fontSize: "0.7rem", color: "#999", textAlign: "center" }}>
          For fastest response, use WhatsApp. Email replies within 24 hours.
        </p>
      </form>
    </div>
  )
}
