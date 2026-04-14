"use client"
import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export default function WriteReviewPage() {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [rating, setRating] = useState(5)
  const [text, setText] = useState("")
  const [product, setProduct] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [hover, setHover] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB"); return }
    if (!file.type.startsWith("image/")) { setError("Please upload an image file"); return }
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError("")
  }

  async function submit() {
    if (!name.trim()) { setError("Please enter your name"); return }
    if (!text.trim()) { setError("Please write your review"); return }
    setLoading(true); setError("")
    const supabase = createClient()

    let photo_url: string | null = null

    // Upload photo if provided
    if (photo) {
      const ext = photo.name.split(".").pop()
      const fileName = `review-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("review-photos")
        .upload(fileName, photo, { contentType: photo.type, upsert: false })
      if (uploadErr) {
        setError("Photo upload failed: " + uploadErr.message)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from("review-photos").getPublicUrl(uploadData.path)
      photo_url = urlData.publicUrl
    }

    const { error: dbErr } = await supabase.from("reviews").insert({
      customer_name: name.trim(),
      customer_location: location.trim() || null,
      rating,
      review_text: text.trim(),
      product_name: product.trim() || null,
      photo_url,
      status: "pending",
    })
    setLoading(false)
    if (dbErr) { setError("Error: " + dbErr.message); return }
    setSuccess(true)
  }

  if (success) return (
    <div style={{ paddingTop: "72px", minHeight: "100vh", backgroundColor: "var(--theme-bg, white)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
        <h2 style={{ fontWeight: 900, fontSize: "1.5rem", textTransform: "uppercase", marginBottom: "0.75rem" }}>Thank You!</h2>
        <p style={{ color: "#555", marginBottom: "1.5rem" }}>Your review has been submitted and will be published after approval.</p>
        <a href="/reviews" style={{ display: "inline-block", backgroundColor: "var(--theme-primary, black)", color: "var(--theme-btn-text, white)", padding: "0.875rem 2rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>Back to Reviews</a>
      </div>
    </div>
  )

  return (
    <div style={{ paddingTop: "72px", minHeight: "100vh", backgroundColor: "var(--theme-bg, white)" }}>
      <div style={{ backgroundColor: "var(--theme-primary, black)", color: "var(--theme-btn-text, white)", padding: "3rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>Share Your Experience</p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 }}>Write a Review</h1>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        {/* Star Rating */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Your Rating *</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
            {[1,2,3,4,5].map(star => (
              <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "2.5rem", color: star <= (hover || rating) ? "#f0a500" : "#e0e0e0", transition: "color 0.1s", lineHeight: 1 }}>★</button>
            ))}
          </div>
          <p style={{ fontSize: "0.82rem", color: "#999", marginTop: "0.5rem" }}>
            {["","Terrible","Poor","Average","Good","Excellent"][hover || rating]}
          </p>
        </div>

        {/* Form Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 1rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" as const }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>City / District</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Dhaka" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 1rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>Product (Optional)</label>
          <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Which product did you buy?" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 1rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" as const }} />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>Your Review *</label>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Tell others about your experience..." rows={5}
            style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 1rem", fontSize: "0.9rem", outline: "none", resize: "vertical" as const, fontFamily: "inherit", boxSizing: "border-box" as const }} />
          <p style={{ fontSize: "0.7rem", color: "#999", marginTop: "0.25rem" }}>{text.length} characters</p>
        </div>

        {/* Photo Upload */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Photo <span style={{ fontWeight: 400, color: "#999", textTransform: "none" }}>(Optional — max 5MB)</span>
          </label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
          
          {photoPreview ? (
            <div style={{ position: "relative", display: "inline-block" }}>
              <img src={photoPreview} alt="Preview" style={{ width: "120px", height: "120px", objectFit: "cover", border: "1px solid #e0e0e0", display: "block" }} />
              <button onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = "" }}
                style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: "#dc2626", color: "var(--theme-btn-text, white)", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem", border: "1.5px dashed #ccc", background: "white", cursor: "pointer", fontSize: "0.85rem", color: "#666", borderRadius: "4px" }}>
              📷 Upload Photo
            </button>
          )}
        </div>

        {error && <div style={{ backgroundColor: "#fff0f0", border: "1px solid #ffcccc", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#cc0000" }}>{error}</div>}

        <button onClick={submit} disabled={loading} style={{ width: "100%", backgroundColor: "var(--theme-primary, black)", color: "var(--theme-btn-text, white)", padding: "1.1rem", fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.15em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Submitting..." : "Submit Review"}
        </button>
        <p style={{ fontSize: "0.72rem", color: "#999", textAlign: "center" as const, marginTop: "0.75rem" }}>Reviews are published after approval</p>
      </div>
    </div>
  )
}
