"use client"
import { useState, useRef } from "react"
import { apiFetchClient, uploadFileToApi } from "@/lib/api/client"

export default function ReviewForm({ productId, productName }: { productId: string, productName: string }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [location, setLocation] = useState("")
  const [product, setProduct] = useState(productName || "")
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [text, setText] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    if (!name.trim()) { setError("Please enter your name"); return }
    if (!text.trim()) { setError("Please write your review"); return }
    if (text.trim().length < 3) { setError("Review must be at least 3 characters"); return }
    setLoading(true)
    setError("")
    try {
      let photo_url: string | null = null
      if (photo) {
        try {
          const upload = await uploadFileToApi(photo, "reviews")
          photo_url = upload.url
        } catch (uploadErr: any) {
          setError("Photo upload failed: " + uploadErr.message)
          setLoading(false)
          return
        }
      }
      await apiFetchClient("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          customer_name: name.trim(),
          customer_location: location.trim(),
          email: email.trim() || null,
          rating,
          review_text: text.trim(),
          photo_url,
          product_name: product.trim() || productName || null,
          status: "pending",
        }),
      })
      setSuccess(true)
    } catch (err: any) {
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
        <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.3rem" }}>{["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}</p>
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
        <div>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem", color: "#555" }}>Email <span style={{ fontWeight: 400, textTransform: "none" }}>(Optional)</span></label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.65rem 0.875rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem", color: "#555" }}>Product <span style={{ fontWeight: 400, textTransform: "none" }}>(Optional)</span></label>
          <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Which product?" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.65rem 0.875rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem", color: "#555" }}>Your Review *</label>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Tell others about your experience..." rows={4} style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.65rem 0.875rem", fontSize: "0.9rem", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
        <p style={{ fontSize: "0.7rem", color: "#999", marginTop: "0.25rem" }}>{text.length} characters</p>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem", color: "#555" }}>
          Photo <span style={{ fontWeight: 400, color: "#999", textTransform: "none" }}>(Optional — max 5MB)</span>
        </label>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
          const file = e.target.files?.[0]
          if (!file) return
          if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB"); return }
          setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); setError("")
        }} />
        {photoPreview ? (
          <div style={{ position: "relative", display: "inline-block" }}>
            <img src={photoPreview} alt="Preview" style={{ width: "100px", height: "100px", objectFit: "cover", border: "1px solid #e0e0e0", display: "block" }} />
            <button onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = "" }}
              style={{ position: "absolute", top: -7, right: -7, width: 20, height: 20, borderRadius: "50%", background: "#dc2626", color: "white", border: "none", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1rem", border: "1.5px dashed #ccc", background: "white", cursor: "pointer", fontSize: "0.82rem", color: "#666" }}>
            📷 Add Photo
          </button>
        )}
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
