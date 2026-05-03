"use client"

import { useEffect, useState, useCallback } from "react"

type Review = {
  id: string
  product_id?: string
  product_name?: string
  customer_name: string
  customer_location?: string
  rating: number
  comment?: string
  review_text?: string
  photo_url?: string
  status: string
  approved?: boolean
  featured: boolean
  created_at: string
}

function getText(r: Review) {
  return r.comment || r.review_text || ""
}

function Toast({ msg, type, onDone }: { msg: string; type: "ok" | "err" | "info"; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t) }, [onDone])
  const c = { ok: { bg: "#f0fdf4", border: "#86efac", color: "#15803d" }, err: { bg: "#fee2e2", border: "#fca5a5", color: "#dc2626" }, info: { bg: "#f0f9ff", border: "#7dd3fc", color: "#0369a1" } }[type]
  return (
    <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.color, padding: "0.875rem 1.5rem", fontWeight: 700, fontSize: "0.875rem", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 99999, whiteSpace: "nowrap" }}>
      {msg}
    </div>
  )
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "featured">("all")
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "info" } | null>(null)

  const showToast = useCallback((msg: string, type: "ok" | "err" | "info" = "ok") => setToast({ msg, type }), [])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setFetchError("")
    try {
      const res = await fetch("/api/reviews")
      const data = await res.json()
      if (!res.ok) { setFetchError(data.error || "Failed to load"); setReviews([]) }
      else setReviews(data.reviews || [])
    } catch (e: any) {
      setFetchError(e.message || "Network error")
      setReviews([])
    }
    setLoading(false)
  }

  async function patch(reviewId: string, updates: Record<string, any>, successMsg: string) {
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reviewId, ...updates }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Failed")
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...updates } : r))
      showToast(successMsg, "ok")
    } catch (e: any) {
      showToast(e.message || "Failed", "err")
    }
  }

  async function del(reviewId: string, name: string) {
    if (!confirm(`Delete ${name}'s review? Cannot be undone.`)) return
    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      setReviews(prev => prev.filter(r => r.id !== reviewId))
      showToast("Review deleted", "ok")
    } catch {
      showToast("Delete failed", "err")
    }
  }

  const getStatus = (r: Review) => r.status || (r.approved ? "approved" : "pending")

  const filtered = filter === "all"      ? reviews
    : filter === "featured"              ? reviews.filter(r => r.featured)
    : reviews.filter(r => getStatus(r) === filter)

  const counts = {
    all:      reviews.length,
    pending:  reviews.filter(r => getStatus(r) === "pending").length,
    approved: reviews.filter(r => getStatus(r) === "approved").length,
    rejected: reviews.filter(r => getStatus(r) === "rejected").length,
    featured: reviews.filter(r => r.featured).length,
  }

  const statusStyle = (s: string) => ({
    pending:  { bg: "#fef9c3", color: "#854d0e", border: "#fcd34d" },
    approved: { bg: "#dcfce7", color: "#16a34a", border: "#86efac" },
    rejected: { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
  }[s] || { bg: "#f5f5f5", color: "#666", border: "#e0e0e0" })

  if (loading) return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>Reviews</h1>
      <p style={{ color: "#999", marginTop: "1rem" }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ padding: "2rem" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>Customer Reviews</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.4rem" }}>
            {reviews.length} total · {counts.pending} pending · {counts.featured} featured on homepage
          </p>
        </div>
        <button onClick={load} style={{ padding: "0.6rem 1.25rem", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", textTransform: "uppercase" }}>
          ↻ Refresh
        </button>
      </div>

      {fetchError && (
        <div style={{ padding: "1rem 1.25rem", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: "0.875rem", fontWeight: 600, marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          ⚠️ {fetchError}
          <button onClick={load} style={{ textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 700 }}>Retry</button>
        </div>
      )}

      {/* Featured callout */}
      {counts.featured > 0 && (
        <div style={{ padding: "0.875rem 1.25rem", backgroundColor: "#fef9c3", border: "1px solid #fcd34d", borderLeft: "4px solid #f59e0b", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#854d0e" }}>
            ⭐ {counts.featured} review{counts.featured > 1 ? "s" : ""} featured on homepage
          </span>
          <button onClick={() => setFilter("featured")} style={{ fontSize: "0.75rem", fontWeight: 700, color: "#854d0e", textDecoration: "none", backgroundColor: "#fcd34d", padding: "0.3rem 0.75rem", border: "none", cursor: "pointer" }}>
            View Featured →
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {(["all", "pending", "approved", "rejected", "featured"] as const).map(key => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: "0.45rem 1rem",
              backgroundColor: filter === key ? "black" : "#f5f5f5",
              color: filter === key ? "white" : "#666",
              border: "1px solid #e0e0e0",
              cursor: "pointer",
              fontSize: "0.78rem",
              fontWeight: filter === key ? 700 : 500,
              textTransform: "capitalize",
            }}
          >
            {key === "featured" ? "⭐ Featured" : key.charAt(0).toUpperCase() + key.slice(1)} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#bbb", border: "1px dashed #e0e0e0", backgroundColor: "white" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💬</p>
          <p style={{ fontWeight: 700, fontSize: "1rem" }}>No {filter === "all" ? "" : filter + " "}reviews</p>
          {filter !== "all" && (
            <button onClick={() => setFilter("all")} style={{ marginTop: "1rem", padding: "0.5rem 1.25rem", backgroundColor: "black", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}>
              View All
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filtered.map(review => {
            const st = getStatus(review)
            const sc = statusStyle(st)
            const text = getText(review)

            return (
              <div key={review.id} style={{ backgroundColor: "white", border: review.featured ? "2px solid #f59e0b" : "1px solid #e0e0e0", padding: "1.5rem", position: "relative" }}>

                {/* Featured badge */}
                {review.featured && (
                  <div style={{ position: "absolute", top: 0, right: 0, backgroundColor: "#f59e0b", color: "white", fontSize: "0.65rem", fontWeight: 900, padding: "0.25rem 0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    ⭐ Featured on Homepage
                  </div>
                )}

                {/* Review header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem", flexWrap: "wrap", gap: "0.5rem", marginTop: review.featured ? "1rem" : 0 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                      <span style={{ color: "#f59e0b", fontSize: "1rem", letterSpacing: "2px" }}>
                        {"★".repeat(review.rating)}
                        <span style={{ color: "#e0e0e0" }}>{"★".repeat(5 - review.rating)}</span>
                      </span>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.18rem 0.6rem", textTransform: "uppercase", backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {st}
                      </span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: "0.92rem" }}>
                      {review.customer_name}
                      {review.customer_location && <span style={{ fontWeight: 400, color: "#999", fontSize: "0.82rem" }}> · {review.customer_location}</span>}
                    </p>
                    <p style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "0.1rem" }}>
                      {review.product_name && <span>📦 {review.product_name} · </span>}
                      {new Date(review.created_at).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Review text */}
                {text ? (
                  <div style={{ fontSize: "0.9rem", color: "#333", lineHeight: 1.75, marginBottom: "1rem", padding: "0.875rem 1rem", backgroundColor: "#fafafa", borderLeft: "3px solid #e0e0e0", fontStyle: "italic" }}>
                    "{text}"
                  </div>
                ) : (
                  <p style={{ fontSize: "0.82rem", color: "#bbb", marginBottom: "1rem", fontStyle: "italic" }}>No review text</p>
                )}

                {/* Photo */}
                {review.photo_url && (
                  <div style={{ marginBottom: "1rem" }}>
                    <img
                      src={review.photo_url}
                      alt="Review photo"
                      style={{ maxWidth: "180px", maxHeight: "180px", objectFit: "cover", border: "1px solid #e0e0e0", cursor: "zoom-in" }}
                      onClick={() => window.open(review.photo_url!, "_blank")}
                    />
                    <p style={{ fontSize: "0.68rem", color: "#999", marginTop: "0.25rem" }}>Click to enlarge</p>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "0.5rem", paddingTop: "1rem", borderTop: "1px solid #f0f0f0", flexWrap: "wrap", alignItems: "center" }}>

                  {/* Approve / Reject / Pending */}
                  {st !== "approved" && (
                    <button
                      onClick={() => patch(review.id, { status: "approved" }, `✓ ${review.customer_name}'s review approved`)}
                      style={{ padding: "0.5rem 1rem", backgroundColor: "#dcfce7", color: "#16a34a", border: "1px solid #86efac", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      ✓ Approve
                    </button>
                  )}
                  {st !== "rejected" && (
                    <button
                      onClick={() => patch(review.id, { status: "rejected" }, `${review.customer_name}'s review rejected`)}
                      style={{ padding: "0.5rem 1rem", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      ✗ Reject
                    </button>
                  )}
                  {st !== "pending" && (
                    <button
                      onClick={() => patch(review.id, { status: "pending" }, "Set to pending")}
                      style={{ padding: "0.5rem 1rem", backgroundColor: "#fef9c3", color: "#854d0e", border: "1px solid #fcd34d", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      ⟳ Pending
                    </button>
                  )}

                  {/* Feature toggle — only available for approved reviews */}
                  {st === "approved" && (
                    <button
                      onClick={() => patch(
                        review.id,
                        { featured: !review.featured },
                        review.featured ? "Removed from homepage" : "⭐ Featured on homepage!"
                      )}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: review.featured ? "#fef9c3" : "white",
                        color: review.featured ? "#854d0e" : "#555",
                        border: review.featured ? "1px solid #fcd34d" : "1px solid #e0e0e0",
                        fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {review.featured ? "★ Unfeature" : "☆ Feature on Homepage"}
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => del(review.id, review.customer_name)}
                    style={{ padding: "0.5rem 1rem", backgroundColor: "#f5f5f5", color: "#666", border: "1px solid #e0e0e0", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}
                  >
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
