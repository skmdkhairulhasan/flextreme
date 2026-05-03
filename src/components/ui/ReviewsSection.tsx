"use client"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"

export default function ReviewsSection({ reviews }: { reviews: any[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (reviews.length === 0) return null

  return (
    <section style={{ backgroundColor: "var(--theme-primary, black)", padding: "6rem 1.5rem", marginTop: "0" }}>
      {/* Lightbox */}
      {mounted && lightbox && createPortal(
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
        .reviews-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: stretch;
          gap: 20px;
        }
        .reviews-grid .review-card {
          flex: 1 1 280px;
          max-width: 340px;
          min-width: 220px;
        }
        @media (max-width: 640px) {
          .reviews-grid .review-card { flex: 1 1 calc(50% - 10px); max-width: none; min-width: 0; }
          .reviews-grid { gap: 12px; }
        }
        .review-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 1px solid rgba(255,255,255,0.12);
          overflow: hidden;
          background: rgba(255,255,255,0.04);
        }
        .review-card-body {
          padding: 1.25rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .review-text {
          font-size: 0.875rem;
          line-height: 1.6;
          color: rgba(255,255,255,0.75);
          font-style: italic;
          flex: 1;
          height: 5.6em;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        .review-footer {
          margin-top: auto;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .review-image-wrap {
          height: 220px;
          overflow: hidden;
          border-top: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.3);
          position: relative;
          flex-shrink: 0;
        }
        .review-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .review-no-image {
          height: 220px;
          background: rgba(255,255,255,0.02);
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        @media (max-width: 640px) {
          .review-card-body { padding: 0.875rem; }
          .review-text { font-size: 0.78rem; height: 4.2em; -webkit-line-clamp: 3; }
          .review-image-wrap { height: 160px; }
          .review-no-image { height: 160px; }
        }
      `}</style>

      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>Real Athletes</p>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, color: "white" }}>What They Say</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", marginTop: "0.75rem" }}>{reviews.length} verified {reviews.length === 1 ? "review" : "reviews"}</p>
        </div>

        <div className="reviews-grid">
          {reviews.map((review: any, index: number) => (
            <div key={review.id || index} className="review-card">
              <div className="review-card-body">
                <div style={{ fontSize: "0.9rem", marginBottom: "0.6rem", color: "#f0a500" }}>
                  {"★".repeat(review.rating)}<span style={{ color: "rgba(255,255,255,0.15)" }}>{"★".repeat(5 - review.rating)}</span>
                </div>
                <p className="review-text">"{review.review_text}"</p>
                <div className="review-footer">
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.82rem", color: "white" }}>{review.customer_name}</p>
                    {review.customer_location && <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{review.customer_location}</p>}
                    {review.product_name && <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>Purchased: {review.product_name}</p>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                    <span style={{ width: "13px", height: "13px", backgroundColor: "white", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "black", fontSize: "0.45rem" }}>v</span>
                    <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Verified</span>
                  </div>
                </div>
              </div>
              {review.photo_url ? (
                <div className="review-image-wrap" style={{ cursor: "zoom-in" }} onClick={() => setLightbox(review.photo_url)}>
                  <img className="review-image" src={review.photo_url} alt="Customer photo" />
                  <p style={{ position: "absolute", bottom: 0, left: 0, right: 0, fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "0.25rem", background: "rgba(0,0,0,0.4)" }}>📷 Tap to enlarge</p>
                </div>
              ) : (
                <div className="review-no-image" />
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link href="/reviews" style={{ display: "inline-block", border: "1px solid rgba(255,255,255,0.3)", padding: "0.875rem 2.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", color: "white" }}>See All Reviews</Link>
        </div>
      </div>
    </section>
  )
}
