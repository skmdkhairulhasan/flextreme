"use client"

import { useEffect, useState } from "react"

type Review = {
  id: string
  product_id: string
  product_name: string
  customer_name: string
  customer_location?: string
  rating: number
  review_text: string
  photo_url?: string
  status: string
  created_at: string
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")

  useEffect(() => {
    loadReviews()
  }, [])

  async function loadReviews() {
    try {
      const res = await fetch("/api/reviews")
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch (e) {
      console.error("Failed to load reviews:", e)
    }
    setLoading(false)
  }

  async function updateStatus(reviewId: string, newStatus: string) {
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reviewId, status: newStatus })
      })

      if (res.ok) {
        setReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, status: newStatus } : r
        ))
      }
    } catch (e) {
      console.error("Failed to update review:", e)
    }
  }

  async function deleteReview(reviewId: string) {
    if (!confirm("Are you sure you want to delete this review?")) return

    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId))
      }
    } catch (e) {
      console.error("Failed to delete review:", e)
    }
  }

  const filteredReviews = filter === "all" 
    ? reviews 
    : reviews.filter(r => r.status === filter)

  const pendingCount = reviews.filter(r => r.status === "pending").length
  const approvedCount = reviews.filter(r => r.status === "approved").length
  const rejectedCount = reviews.filter(r => r.status === "rejected").length

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Reviews</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>
          Customer Reviews
        </h1>
        <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          Approve, reject, or delete customer reviews
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { key: "all", label: "All", count: reviews.length },
          { key: "pending", label: "Pending", count: pendingCount },
          { key: "approved", label: "Approved", count: approvedCount },
          { key: "rejected", label: "Rejected", count: rejectedCount },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: filter === key ? "black" : "#f5f5f5",
              color: filter === key ? "white" : "#666",
              border: "1px solid #e0e0e0",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: filter === key ? 700 : 400
            }}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#999", border: "1px solid #e0e0e0", backgroundColor: "white" }}>
          <p>No {filter === "all" ? "" : filter} reviews found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              style={{
                backgroundColor: "white",
                border: "1px solid #e0e0e0",
                padding: "1.5rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{ color: "#f59e0b", fontSize: "1rem" }}>
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.6rem",
                        borderRadius: "20px",
                        textTransform: "uppercase",
                        backgroundColor:
                          review.status === "approved" ? "#dcfce7" :
                          review.status === "pending" ? "#fef9c3" :
                          "#fee2e2",
                        color:
                          review.status === "approved" ? "#16a34a" :
                          review.status === "pending" ? "#854d0e" :
                          "#dc2626"
                      }}
                    >
                      {review.status}
                    </span>
                  </div>

                  <p style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                    {review.customer_name}
                    {review.customer_location && (
                      <span style={{ color: "#999", fontWeight: 400 }}> • {review.customer_location}</span>
                    )}
                  </p>

                  <p style={{ fontSize: "0.75rem", color: "#999", marginBottom: "0.5rem" }}>
                    Product: {review.product_name}
                  </p>

                  <p style={{ fontSize: "0.875rem", color: "#555", lineHeight: 1.6, marginBottom: "0.5rem" }}>
                    {review.review_text}
                  </p>

                  {review.photo_url && (
                    <img
                      src={review.photo_url}
                      alt="Review"
                      style={{
                        maxWidth: "200px",
                        maxHeight: "200px",
                        objectFit: "cover",
                        border: "1px solid #e0e0e0",
                        borderRadius: "4px",
                        marginTop: "0.5rem"
                      }}
                    />
                  )}

                  <p style={{ fontSize: "0.7rem", color: "#aaa", marginTop: "0.75rem" }}>
                    Submitted: {new Date(review.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", paddingTop: "1rem", borderTop: "1px solid #f0f0f0" }}>
                {review.status !== "approved" && (
                  <button
                    onClick={() => updateStatus(review.id, "approved")}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#dcfce7",
                      color: "#16a34a",
                      border: "1px solid #bbf7d0",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    ✓ Approve
                  </button>
                )}

                {review.status !== "rejected" && (
                  <button
                    onClick={() => updateStatus(review.id, "rejected")}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#fee2e2",
                      color: "#dc2626",
                      border: "1px solid #fca5a5",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    ✗ Reject
                  </button>
                )}

                {review.status !== "pending" && (
                  <button
                    onClick={() => updateStatus(review.id, "pending")}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#fef9c3",
                      color: "#854d0e",
                      border: "1px solid #fcd34d",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    ⟳ Mark Pending
                  </button>
                )}

                <button
                  onClick={() => deleteReview(review.id)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#f5f5f5",
                    color: "#666",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginLeft: "auto"
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
