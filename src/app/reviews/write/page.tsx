"use client"
import { useState, useRef } from "react"
import { uploadToCloudinary } from "@/lib/cloudinary"

export default function WriteReviewPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
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
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB")
      return
    }
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError("")
  }

  async function submit() {
    if (!name.trim()) {
      setError("Please enter your name")
      return
    }
    if (!text.trim()) {
      setError("Please write your review")
      return
    }

    setLoading(true)
    setError("")

    let photo_url: string | null = null

    // Upload photo if provided
    if (photo) {
      try {
        photo_url = await uploadToCloudinary(photo, "flextreme/reviews")
      } catch (uploadErr: any) {
        setError("Photo upload failed: " + uploadErr.message)
        setLoading(false)
        return
      }
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_location: location.trim() || null,
          email: email.trim() || null,
          rating,
          review_text: text.trim(),
          product_name: product.trim() || null,
          photo_url,
          status: "pending",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review")
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success)
    return (
      <div style={{ paddingTop: "72px", minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem", color: "#16a34a" }}>✓</div>
          <h2 style={{ fontWeight: 900, fontSize: "1.75rem", textTransform: "uppercase", marginBottom: "0.75rem" }}>Thank You!</h2>
          <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
            Your review has been submitted and will be published after approval.
          </p>
          <a href="/reviews" style={{ display: "inline-block", backgroundColor: "black", color: "white", padding: "0.875rem 2rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>
            Back to Reviews
          </a>
        </div>
      </div>
    )

  return (
    <div style={{ paddingTop: "72px", minHeight: "100vh", backgroundColor: "white" }}>
      {/* Header */}
      <div style={{ backgroundColor: "black", color: "white", padding: "3rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.75rem" }}>
          Share Your Experience
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
          Write a Review
        </h1>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        
        {/* Rating Stars */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem", color: "#333" }}>Your Rating</p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            {[1,2,3,4,5].map(star => (
              <button 
                key={star} 
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                style={{ 
                  fontSize: "2.5rem", 
                  color: star <= (hover || rating) ? "#f59e0b" : "#e5e7eb", 
                  background: "none", 
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.2s",
                  padding: "0.25rem"
                }}
              >
                ★
              </button>
            ))}
          </div>
          <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.5rem" }}>
            {rating === 5 ? "Excellent!" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
          </p>
        </div>

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.875rem", color: "#333" }}>
              Your Name *
            </label>
            <input 
              type="text"
              placeholder="John Doe" 
              value={name} 
              onChange={e => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "0.875rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "0.95rem",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.875rem", color: "#333" }}>
              Location (Optional)
            </label>
            <input 
              type="text"
              placeholder="Dhaka, Bangladesh" 
              value={location} 
              onChange={e => setLocation(e.target.value)}
              style={{
                width: "100%",
                padding: "0.875rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "0.95rem",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.875rem", color: "#333" }}>
              Email (Optional)
            </label>
            <input 
              type="email"
              placeholder="your@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "0.875rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "0.95rem",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.875rem", color: "#333" }}>
              Product (Optional)
            </label>
            <input 
              type="text"
              placeholder="Compression Tank Top" 
              value={product} 
              onChange={e => setProduct(e.target.value)}
              style={{
                width: "100%",
                padding: "0.875rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "0.95rem",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.875rem", color: "#333" }}>
              Your Review *
            </label>
            <textarea 
              placeholder="Share your experience with our products..." 
              value={text} 
              onChange={e => setText(e.target.value)}
              rows={5}
              style={{
                width: "100%",
                padding: "0.875rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "0.95rem",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.875rem", color: "#333" }}>
              Add Photo (Optional)
            </label>
            <input 
              type="file" 
              ref={fileRef} 
              onChange={handlePhoto}
              accept="image/*"
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%",
                padding: "0.875rem",
                border: "2px dashed #d1d5db",
                borderRadius: "4px",
                fontSize: "0.875rem",
                backgroundColor: "#f9fafb",
                color: "#666",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#000"
                e.currentTarget.style.backgroundColor = "#fff"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.backgroundColor = "#f9fafb"
              }}
            >
              {photo ? photo.name : "📷 Choose Photo"}
            </button>
            {photoPreview && (
              <div style={{ marginTop: "1rem" }}>
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: "200px", 
                    maxHeight: "200px", 
                    objectFit: "cover",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px"
                  }} 
                />
                <button
                  onClick={() => {
                    setPhoto(null)
                    setPhotoPreview(null)
                    if (fileRef.current) fileRef.current.value = ""
                  }}
                  style={{
                    display: "block",
                    marginTop: "0.5rem",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Remove Photo
                </button>
              </div>
            )}
          </div>

          {error && (
            <div style={{ 
              padding: "0.875rem", 
              backgroundColor: "#fee2e2", 
              color: "#dc2626",
              borderRadius: "4px",
              fontSize: "0.875rem",
              fontWeight: 600
            }}>
              {error}
            </div>
          )}

          <button 
            onClick={submit} 
            disabled={loading}
            style={{
              width: "100%",
              padding: "1rem",
              backgroundColor: loading ? "#ccc" : "black",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "0.875rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "0.5rem"
            }}
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  )
}
