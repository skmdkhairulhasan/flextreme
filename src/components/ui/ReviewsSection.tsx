"use client"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"

// Fixed dimensions — every card is IDENTICAL in structure
const TEXT_H  = 200  // px — stars + quote text
const FOOT_H  = 68   // px — name / location / verified
const IMAGE_H = 220  // px — photo (only if present)
// Total card height with photo:    TEXT_H + FOOT_H + IMAGE_H = 488px
// Total card height without photo: TEXT_H + FOOT_H           = 268px
// All photo cards are same height; all text-only cards are same height.
// Cards in the same row are forced to the tallest via align-items:stretch.

export default function ReviewsSection({ reviews }: { reviews: any[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [mounted, setMounted]   = useState(false)
  useEffect(() => setMounted(true), [])

  if (reviews.length === 0) return null

  const hasPhoto    = reviews.some(r => r.photo_url)
  const photoReviews = reviews.filter(r => r.photo_url)
  const textReviews  = reviews.filter(r => !r.photo_url)

  // Group: show photo reviews first, then text-only
  const sorted = [...photoReviews, ...textReviews]

  return (
    <section style={{ backgroundColor: "var(--theme-primary, black)", padding: "6rem 1.5rem" }}>

      {/* Lightbox */}
      {mounted && lightbox && createPortal(
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.92)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", cursor: "zoom-out" }}>
          <button onClick={() => setLightbox(null)} style={{ position: "fixed", top: "1rem", right: "1rem", background: "white", border: "none", color: "black", fontSize: "1rem", cursor: "pointer", width: "36px", height: "36px", borderRadius: "50%", fontWeight: 700 }}>✕</button>
          <img src={lightbox} alt="Review photo" onClick={e => e.stopPropagation()} style={{ maxWidth: "92vw", maxHeight: "82vh", objectFit: "contain", cursor: "default" }} />
        </div>,
        document.body
      )}

      <style>{`
        .rv-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
        }

        /* Every card is the same width */
        .rv-card {
          flex: 1 1 270px;
          max-width: 320px;
          min-width: 200px;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255,255,255,0.12);
          overflow: hidden;
          background: rgba(255,255,255,0.04);
        }

        /* Text block — fixed height, same for ALL cards */
        .rv-body {
          height: ${TEXT_H}px;
          padding: 1.25rem 1.25rem 0;
          box-sizing: border-box;
          flex-shrink: 0;
          overflow: hidden;
        }

        .rv-stars { font-size: 0.9rem; margin-bottom: 0.6rem; color: #f0a500; flex-shrink: 0; }

        .rv-text {
          font-size: 0.875rem;
          line-height: 1.6;
          color: rgba(255,255,255,0.75);
          font-style: italic;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          margin: 0;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        /* Footer — fixed height, same for ALL cards */
        .rv-footer {
          height: ${FOOT_H}px;
          padding: 0.6rem 1.25rem 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-top: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
          box-sizing: border-box;
          margin-top: 0.75rem;
        }

        /* Photo block — fixed height, only on photo cards */
        .rv-photo {
          height: ${IMAGE_H}px;
          overflow: hidden;
          border-top: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.3);
          position: relative;
          flex-shrink: 0;
          cursor: zoom-in;
        }
        .rv-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .rv-photo-hint {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          font-size: 0.62rem;
          color: rgba(255,255,255,0.4);
          text-align: center;
          padding: 0.25rem;
          background: rgba(0,0,0,0.4);
        }

        @media (max-width: 640px) {
          .rv-card { flex: 1 1 calc(50% - 10px); max-width: none; min-width: 0; }
          .rv-grid  { gap: 12px; }
          .rv-body  { height: ${Math.round(TEXT_H * 0.9)}px; padding: 0.875rem 0.875rem 0; }
          .rv-footer{ height: ${Math.round(FOOT_H * 0.95)}px; padding: 0.5rem 0.875rem 0.6rem; }
          .rv-photo { height: ${Math.round(IMAGE_H * 0.75)}px; }
          .rv-text  { font-size: 0.78rem; -webkit-line-clamp: 5; line-height: 1.5; }
        }
      `}</style>

      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>Real Athletes</p>
          <h2 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, color: "white" }}>What They Say</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", marginTop: "0.75rem" }}>
            {reviews.length} verified {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>

        <div className="rv-grid">
          {sorted.map((review: any, index: number) => (
            <div key={review.id || index} className="rv-card">

              {/* Text area — fixed height */}
              <div className="rv-body">
                <div className="rv-stars">
                  {"★".repeat(review.rating || 5)}
                  <span style={{ color: "rgba(255,255,255,0.15)" }}>{"★".repeat(5 - (review.rating || 5))}</span>
                </div>
                <p className="rv-text">"{review.review_text || review.comment}"</p>
              </div>

              {/* Footer — fixed height */}
              <div className="rv-footer">
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.82rem", color: "white", marginBottom: "0.1rem" }}>{review.customer_name}</p>
                  {review.customer_location && <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.1rem" }}>{review.customer_location}</p>}
                  <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>{review.product_name ? "Purchased: " + review.product_name : "\u00a0"}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                  <span style={{ width: "13px", height: "13px", backgroundColor: "white", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "black", fontSize: "0.45rem", fontWeight: 900 }}>✓</span>
                  <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Verified</span>
                </div>
              </div>

              {/* Photo — fixed height, only rendered when photo exists */}
              {review.photo_url && (
                <div className="rv-photo" onClick={() => setLightbox(review.photo_url)}>
                  <img src={review.photo_url} alt="Customer photo" />
                  <p className="rv-photo-hint">📷 Tap to enlarge</p>
                </div>
              )}

            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link href="/reviews" style={{ display: "inline-block", border: "1px solid rgba(255,255,255,0.3)", padding: "0.875rem 2.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", color: "white" }}>
            See All Reviews
          </Link>
        </div>
      </div>
    </section>
  )
}
