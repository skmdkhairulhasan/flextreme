"use client"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"

export default function ReviewsSection({ reviews }: { reviews: any[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  if (reviews.length === 0) return null

  return (
    <section style={{ backgroundColor: "white", padding: "6rem 1.5rem" }}>
      {/* Lightbox */}
      {lightbox && typeof document !== "undefined" && createPortal(
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.92)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", cursor: "zoom-out" }}>
          <div style={{ position: "fixed", top: "1rem", right: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>Tap outside to close</span>
            <button onClick={() => setLightbox(null)} style={{ background: "white", border: "none", color: "black", fontSize: "1rem", cursor: "pointer", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>✕</button>
          </div>
          <img src={lightbox} alt="Review photo" onClick={e => e.stopPropagation()} style={{ maxWidth: "92vw", maxHeight: "82vh", objectFit: "contain", cursor: "default", borderRadius: "4px" }} />
        </div>,
        document.body
      )}

      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#999", marginBottom: "0.75rem" }}>Real Athletes</p>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 }}>What They Say</h2>
          <p style={{ color: "#999", fontSize: "0.875rem", marginTop: "0.75rem" }}>{reviews.length} verified {reviews.length === 1 ? "review" : "reviews"} shown</p>
        </div>

        <style>{`
          .reviews-grid { display: grid; gap: 1.5rem; justify-content: center; }
          @media (max-width: 640px) {
            .reviews-grid { grid-template-columns: ${reviews.length === 1 ? "minmax(auto,480px)" : "1fr 1fr"} !important; gap: 1rem !important; }
          }
          @media (min-width: 641px) {
            .reviews-grid { grid-template-columns: ${reviews.length === 1 ? "minmax(auto,480px)" : "repeat(auto-fit, minmax(280px, 1fr))"} !important; }
          }
        `}</style>

        <div className="reviews-grid">
          {reviews.map((review: any, index: number) => (
            <div key={review.id || index} style={{ border: "1px solid #e0e0e0", overflow: "hidden" }}>
              <div style={{ padding: "1.5rem", paddingBottom: review.photo_url ? "1rem" : "1.5rem" }}>
                <div style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "#f0a500" }}>{"★".repeat(review.rating)}<span style={{ color: "#e0e0e0" }}>{"★".repeat(5 - review.rating)}</span></div>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "#333", marginBottom: "1.25rem", fontStyle: "italic" }}>"{review.review_text}"</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #f0f0f0", paddingTop: "0.75rem" }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>{review.customer_name}</p>
                    {review.customer_location && <p style={{ fontSize: "0.72rem", color: "#999" }}>{review.customer_location}</p>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ width: "14px", height: "14px", backgroundColor: "black", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.5rem" }}>v</span>
                    <span style={{ fontSize: "0.65rem", color: "#666", fontWeight: 600 }}>Verified</span>
                  </div>
                </div>
                {review.product_name && <p style={{ fontSize: "0.7rem", color: "#bbb", marginTop: "0.5rem" }}>Purchased: {review.product_name}</p>}
              </div>
              {/* Photo below text */}
              {review.photo_url && (
                <div style={{ cursor: "zoom-in", borderTop: "1px solid #f0f0f0" }} onClick={() => setLightbox(review.photo_url)}>
                  <img src={review.photo_url} alt="Customer photo" style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }} />
                  <p style={{ fontSize: "0.65rem", color: "#999", textAlign: "center", padding: "0.3rem", background: "#fafafa" }}>📷 Tap to enlarge</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link href="/reviews" style={{ display: "inline-block", border: "2px solid black", padding: "0.875rem 2.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", color: "black" }}>See All Reviews</Link>
        </div>
      </div>
    </section>
  )
}
