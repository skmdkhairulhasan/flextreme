"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ReviewForm({ productId, productName }: { productId: string, productName: string }) {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    if (!name.trim()) { setError("Please enter your name"); return }
    if (rating === 0) { setError("Please select a star rating"); return }
    if (!text.trim()) { setError("Please write your review"); return }
    if (text.trim().length < 20) { setError("Review must be at least 20 characters"); return }
    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      console.log("Submitting review with productId:", productId)
      const payload = {
        product_id: productId,
        product_name: productName,
        customer_name: name.trim(),
        customer_location: location.trim(),
        rating,
        review_text: text.trim(),
        status: "pending",
      }
      console.log("Payload:", payload)
      const { data, error: dbError } = await supabase.from("reviews").insert(payload).select()
      console.log("Response data:", data)
      console.log("Response error:", dbError)
      if (dbError) {
        setError("Error: " + dbError.message + " (Code: " + dbError.code + ")")
        return
      }
      setSuccess(true)
    } catch (err: any) {
      console.error("Catch error:", err)
      setError("Error: " + (err?.message || JSON.stringify(err)))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ border: "1px solid #e0e0e0", padding: "2rem", textAlign: "center", marginTop: "2rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>★</div>
        <h3 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.5rem" }}>Thank You!</h3>
        <p style={{ color: "#555", fontSize: "0.9rem", lineHeight: 1.7 }}>Your review has been submitted and is waiting for approval.</p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: "2rem", borderTop: "1px solid #e0e0e0", paddingTop: "2rem" }}>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.5rem" }}>Write a Review</h3>

      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", color: "#555" }}>Your Rating *</label>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} style={{ background: "none", border: "none", fontSize: "2rem", cursor: "pointer", color: star <= (hoverRating || rating) ? "#f0a500" : "#e0e0e0", transition: "color 0.15s", padding: "0", lineHeight: 1 }}>★</button>
          ))}
        </div>
        {rating > 0 && <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.3rem" }}>{["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem", color: "#555" }}>Full Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.65rem 0.875rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem", color: "#555" }}>City / District</label>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Dhaka" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.65rem 0.875rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem", color: "#555" }}>Your Review *</label>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Tell others about your experience... (minimum 20 characters)" rows={4} style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.65rem 0.875rem", fontSize: "0.9rem", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
        <p style={{ fontSize: "0.7rem", color: text.length < 20 ? "#999" : "#16a34a", marginTop: "0.25rem" }}>{text.length} / 20 minimum characters</p>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fff0f0", border: "1px solid #ffcccc", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#cc0000" }}>
          {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", backgroundColor: loading ? "#333" : "black", color: "white", padding: "0.875rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Submitting..." : "Submit Review"}
      </button>

      <p style={{ fontSize: "0.72rem", color: "#999", textAlign: "center", marginTop: "0.75rem" }}>Reviews are published after approval</p>
    </div>
  )
}
