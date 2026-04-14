"use client"
import { useState } from "react"
import { createPortal } from "react-dom"

export default function ReviewsGrid({ reviews }: { reviews: any[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  return (
    <>
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

      <style>{`
        .reviews-page-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        @media (max-width: 640px) { .reviews-page-grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; } }
      `}</style>

      <div className="reviews-page-grid">
        {reviews.map((review: any) => (
          <div key={review.id} style={{ border: "1px solid #e0e0e0", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem", paddingBottom: review.photo_url ? "0.875rem" : "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                <div style={{ color: "#f0a500", fontSize: "0.9rem" }}>{"★".repeat(review.rating)}<span style={{ color: "#e0e0e0" }}>{"★".repeat(5 - review.rating)}</span></div>
                <p style={{ fontSize: "0.68rem", color: "#bbb" }}>{new Date(review.created_at).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}</p>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#444", lineHeight: 1.7, marginBottom: "0.875rem", fontStyle: "italic" }}>"{review.review_text}"</p>
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "0.65rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.82rem" }}>{review.customer_name}</p>
                  {review.customer_location && <p style={{ fontSize: "0.7rem", color: "#999" }}>{review.customer_location}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: "13px", height: "13px", backgroundColor: "black", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.45rem" }}>v</span>
                  <span style={{ fontSize: "0.62rem", color: "#666", fontWeight: 600 }}>Verified</span>
                </div>
              </div>
              {review.product_name && <p style={{ fontSize: "0.68rem", color: "#bbb", marginTop: "0.4rem" }}>Purchased: {review.product_name}</p>}
            </div>
            {review.photo_url && (
              <div style={{ cursor: "zoom-in", borderTop: "1px solid #f0f0f0" }} onClick={() => setLightbox(review.photo_url)}>
                <img src={review.photo_url} alt="Customer photo" style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
                <p style={{ fontSize: "0.65rem", color: "#999", textAlign: "center", padding: "0.3rem", background: "#fafafa" }}>📷 Tap to enlarge</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
