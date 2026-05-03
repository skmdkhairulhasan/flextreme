"use client"

import { useEffect, useState } from "react"

type Review = {
  id: string
  product_id: string
  product_name: string
  customer_name: string
  customer_location?: string
  rating: number
  comment?: string
  review_text?: string
  photo_url?: string
  status: string
  approved?: boolean
  created_at: string
}

// Get review text from either field name
function getReviewText(review: Review): string {
  return review.comment || review.review_text || ""
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")

  useEffect(() => { loadReviews() }, [])

  async function loadReviews() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/reviews")
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to load reviews")
        setReviews([])
      } else {
        setReviews(data.reviews || [])
      }
    } catch (e: any) {
      setError(e.message || "Network error")
      setReviews([])
    }
    setLoading(false)
  }

  async function updateStatus(reviewId: string, newStatus: string) {
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reviewId, status: newStatus }),
      })
      if (res.ok) {
        setReviews(prev => prev.map(r =>
          r.id === reviewId ? { ...r, status: newStatus, approved: newStatus === "approved" } : r
        ))
      }
    } catch (e) {
      console.error("Failed to update review:", e)
    }
  }

  async function deleteReview(reviewId: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, { method: "DELETE" })
      if (res.ok) setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch (e) {
      console.error("Failed to delete review:", e)
    }
  }

  const filteredReviews = filter === "all"
    ? reviews
    : reviews.filter(r => {
        const s = r.status || (r.approved ? "approved" : "pending")
        return s === filter
      })

  const pendingCount  = reviews.filter(r => (r.status || (r.approved ? "approved" : "pending")) === "pending").length
  const approvedCount = reviews.filter(r => (r.status || (r.approved ? "approved" : "pending")) === "approved").length
  const rejectedCount = reviews.filter(r => r.status === "rejected").length

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>Reviews</h1>
        <p style={{ color: "#999", marginTop: "1rem" }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>Customer Reviews</h1>
        <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          Approve, reject, or delete customer reviews · {reviews.length} total
        </p>
      </div>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1.5rem", fontWeight: 600 }}>
          ⚠️ {error}
          <button onClick={loadReviews} style={{ marginLeft: "1rem", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 700 }}>Retry</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { key: "all",      label: "All",      count: reviews.length },
          { key: "pending",  label: "Pending",  count: pendingCount },
          { key: "approved", label: "Approved", count: approvedCount },
          { key: "rejected", label: "Rejected", count: rejectedCount },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            style={{
              padding: "0.5rem 1.25rem",
              backgroundColor: filter === key ? "black" : "#f5f5f5",
              color: filter === key ? "white" : "#666",
              border: "1px solid #e0e0e0",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: filter === key ? 700 : 500,
            }}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {filteredReviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#bbb", border: "1px dashed #e0e0e0", backgroundColor: "white" }}>
          <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>💬</p>
          <p style={{ fontWeight: 700 }}>No {filter === "all" ? "" : filter + " "}reviews yet</p>
          {filter !== "all" && (
            <button onClick={() => setFilter("all")} style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "black", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}>
              View All Reviews
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredReviews.map(review => {
            const reviewStatus = review.status || (review.approved ? "approved" : "pending")
            const text = getReviewText(review)

            return (
              <div key={review.id} style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    {/* Stars + status badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ color: "#f59e0b", fontSize: "1rem", letterSpacing: "1px" }}>
                        {"★".repeat(review.rating || 0)}
                        <span style={{ color: "#e0e0e0" }}>{"★".repeat(5 - (review.rating || 0))}</span>
                      </span>
                      <span style={{
                        fontSize: "0.68rem", fontWeight: 700,
                        padding: "0.2rem 0.65rem", borderRadius: "20px",
                        textTransform: "uppercase",
                        backgroundColor: reviewStatus === "approved" ? "#dcfce7" : reviewStatus === "rejected" ? "#fee2e2" : "#fef9c3",
                        color: reviewStatus === "approved" ? "#16a34a" : reviewStatus === "rejected" ? "#dc2626" : "#854d0e",
                      }}>
                        {reviewStatus}
                      </span>
                    </div>

                    {/* Customer info */}
                    <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                      {review.customer_name}
                      {review.customer_location && (
                        <span style={{ color: "#999", fontWeight: 400, fontSize: "0.82rem" }}> · {review.customer_location}</span>
                      )}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "0.15rem" }}>
                      {review.product_name && <span>📦 {review.product_name} · </span>}
                      {new Date(review.created_at).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Review text */}
                {text ? (
                  <p style={{ fontSize: "0.9rem", color: "#333", lineHeight: 1.7, marginBottom: "1rem", padding: "0.875rem", backgroundColor: "#fafafa", borderLeft: "3px solid #e0e0e0", fontStyle: "italic" }}>
                    "{text}"
                  </p>
                ) : (
                  <p style={{ fontSize: "0.82rem", color: "#bbb", marginBottom: "1rem", fontStyle: "italic" }}>No review text</p>
                )}

                {/* Photo */}
                {review.photo_url && (
                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>Photo</p>
                    <img
                      src={review.photo_url}
                      alt="Review photo"
                      style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover", border: "1px solid #e0e0e0", cursor: "zoom-in" }}
                      onClick={() => window.open(review.photo_url, "_blank")}
                    />
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.5rem", paddingTop: "1rem", borderTop: "1px solid #f0f0f0", flexWrap: "wrap" }}>
                  {reviewStatus !== "approved" && (
                    <button onClick={() => updateStatus(review.id, "approved")}
                      style={{ padding: "0.5rem 1rem", backgroundColor: "#dcfce7", color: "#16a34a", border: "1px solid #86efac", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                      ✓ Approve
                    </button>
                  )}
                  {reviewStatus !== "rejected" && (
                    <button onClick={() => updateStatus(review.id, "rejected")}
                      style={{ padding: "0.5rem 1rem", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                      ✗ Reject
                    </button>
                  )}
                  {reviewStatus !== "pending" && (
                    <button onClick={() => updateStatus(review.id, "pending")}
                      style={{ padding: "0.5rem 1rem", backgroundColor: "#fef9c3", color: "#854d0e", border: "1px solid #fcd34d", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                      ⟳ Set Pending
                    </button>
                  )}
                  <button onClick={() => deleteReview(review.id)}
                    style={{ padding: "0.5rem 1rem", backgroundColor: "#f5f5f5", color: "#666", border: "1px solid #e0e0e0", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
