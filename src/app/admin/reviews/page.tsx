"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type DeleteTarget = { id: string; name: string; photo_url?: string | null } | null

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("pending")
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchReviews() }, [])

  async function fetchReviews() {
    const supabase = createClient()
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    const supabase = createClient()
    await supabase.from("reviews").update({ status }).eq("id", id)
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setUpdating(null)
  }

  async function toggleFeatured(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from("reviews").update({ featured: !current }).eq("id", id)
    setReviews(prev => prev.map(r => r.id === id ? { ...r, featured: !current } : r))
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    // Delete photo from storage first
    if (deleteTarget.photo_url) {
      try {
        const path = deleteTarget.photo_url.split("/review-photos/")[1]
        if (path) await supabase.storage.from("review-photos").remove([path])
      } catch {}
    }
    await supabase.from("reviews").delete().eq("id", deleteTarget.id)
    setReviews(prev => prev.filter(r => r.id !== deleteTarget.id))
    setDeleteTarget(null)
    setDeleting(false)
  }

  async function rejectAndDelete(review: any) {
    const supabase = createClient()
    // Delete photo from storage
    if (review.photo_url) {
      try {
        const path = review.photo_url.split("/review-photos/")[1]
        if (path) await supabase.storage.from("review-photos").remove([path])
      } catch {}
    }
    await supabase.from("reviews").delete().eq("id", review.id)
    setReviews(prev => prev.filter(r => r.id !== review.id))
  }

  const filtered = filter === "all" ? reviews : reviews.filter(r => r.status === filter)
  const pendingCount = reviews.filter(r => r.status === "pending").length

  const statusColors: Record<string, string> = { pending: "#f0a500", approved: "#16a34a", rejected: "#dc2626" }

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>Loading reviews...</div>

  return (
    <div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "white", padding: "1.75rem", maxWidth: "400px", width: "100%", border: "1px solid #e0e0e0" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🗑️</div>
            <h3 style={{ fontWeight: 900, fontSize: "1rem", marginBottom: "0.5rem" }}>Delete Review?</h3>
            <p style={{ color: "#555", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Review by <strong>{deleteTarget.name}</strong></p>
            <p style={{ color: "#999", fontSize: "0.78rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              This will permanently delete the review. <strong>Cannot be undone.</strong>
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={confirmDelete} disabled={deleting} style={{ flex: 1, padding: "0.875rem", backgroundColor: "#dc2626", color: "white", border: "none", fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", fontSize: "0.875rem" }}>
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "0.875rem", backgroundColor: "white", border: "1px solid #e0e0e0", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Reviews</h1>
        <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          {reviews.length} total
          {pendingCount > 0 && <span style={{ marginLeft: "0.5rem", backgroundColor: "#fff3cd", color: "#856404", padding: "0.15rem 0.5rem", fontSize: "0.75rem", fontWeight: 700 }}>{pendingCount} pending</span>}
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["all", "pending", "approved", "rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "0.4rem 1rem", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid #e0e0e0", backgroundColor: filter === s ? "black" : "white", color: filter === s ? "white" : "#666", cursor: "pointer" }}>
            {s} {s !== "all" && "(" + reviews.filter(r => r.status === s).length + ")"}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem", color: "#999", border: "1px solid #e0e0e0", backgroundColor: "white" }}>
          <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No {filter} reviews</p>
          <p style={{ fontSize: "0.85rem" }}>Reviews submitted by customers appear here</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filtered.map((review: any) => (
          <div key={review.id} style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{review.customer_name}</p>
                  {review.customer_location && <span style={{ fontSize: "0.75rem", color: "#999" }}>{review.customer_location}</span>}
                  <span style={{ color: "#f0a500" }}>{"★".repeat(review.rating)}<span style={{ color: "#e0e0e0" }}>{"★".repeat(5 - review.rating)}</span></span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "#999" }}>
                  <strong style={{ color: "#333" }}>{review.product_name}</strong> · {new Date(review.created_at).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: statusColors[review.status], textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid " + statusColors[review.status], padding: "0.2rem 0.6rem", whiteSpace: "nowrap" }}>
                {review.status}
              </span>
            </div>

            <p style={{ fontSize: "0.9rem", color: "#444", lineHeight: 1.7, marginBottom: review.photo_url ? "0.75rem" : "1.25rem", padding: "1rem", backgroundColor: "#f9f9f9", borderLeft: "3px solid #e0e0e0" }}>
              "{review.review_text}"
            </p>
            {review.photo_url && (
              <div style={{ marginBottom: "1.25rem" }}>
                <img src={review.photo_url} alt="Review photo" style={{ maxWidth: "160px", maxHeight: "160px", objectFit: "cover", border: "1px solid #e0e0e0", borderRadius: "4px", cursor: "pointer" }}
                  onClick={() => window.open(review.photo_url, "_blank")} />
                <p style={{ fontSize: "0.65rem", color: "#999", marginTop: "0.3rem" }}>Click to view full size</p>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              {review.status !== "approved" && (
                <button onClick={() => updateStatus(review.id, "approved")} disabled={updating === review.id} style={{ padding: "0.5rem 1.25rem", backgroundColor: "#16a34a", color: "white", border: "none", fontSize: "0.78rem", fontWeight: 700, cursor: updating === review.id ? "not-allowed" : "pointer", textTransform: "uppercase" }}>
                  {updating === review.id ? "..." : "Approve"}
                </button>
              )}
              {review.status === "approved" && (
                <button onClick={() => toggleFeatured(review.id, review.featured)} style={{ padding: "0.5rem 1.25rem", backgroundColor: review.featured ? "#fef3c7" : "white", color: review.featured ? "#92400e" : "#666", border: review.featured ? "1px solid #f59e0b" : "1px solid #e0e0e0", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>
                  {review.featured ? "⭐ Featured" : "☆ Feature"}
                </button>
              )}
              {review.status !== "rejected" && (
                <button onClick={() => updateStatus(review.id, "rejected")} disabled={updating === review.id} style={{ padding: "0.5rem 1.25rem", backgroundColor: "white", color: "#dc2626", border: "1px solid #dc2626", fontSize: "0.78rem", fontWeight: 700, cursor: updating === review.id ? "not-allowed" : "pointer", textTransform: "uppercase" }}>
                  {updating === review.id ? "..." : "Reject"}
                </button>
              )}
              <button onClick={() => rejectAndDelete(review)} style={{ padding: "0.5rem 1.25rem", backgroundColor: "#dc2626", color: "white", border: "none", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>
                Reject & Delete
              </button>
              {review.status === "approved" && (
                <button onClick={() => updateStatus(review.id, "pending")} disabled={updating === review.id} style={{ padding: "0.5rem 1.25rem", backgroundColor: "white", color: "#666", border: "1px solid #e0e0e0", fontSize: "0.78rem", fontWeight: 700, cursor: updating === review.id ? "not-allowed" : "pointer", textTransform: "uppercase" }}>
                  Unpublish
                </button>
              )}
              {/* Delete with confirmation */}
              <button
                onClick={() => setDeleteTarget({ id: review.id, name: review.customer_name, photo_url: review.photo_url })}
                style={{ padding: "0.5rem 1.25rem", backgroundColor: "#fff0f0", color: "#cc0000", border: "1px solid #ffcccc", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", textTransform: "uppercase", marginLeft: "auto" }}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
