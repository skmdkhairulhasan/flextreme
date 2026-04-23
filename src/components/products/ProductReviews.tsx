import { apiFetchServer } from "@/lib/api/server"

export default async function ProductReviews({ productId }: { productId: string }) {
  const { reviews } = await apiFetchServer<{ reviews: any[] }>(`/api/reviews?product_id=${encodeURIComponent(productId)}&status=approved`)

  const allReviews = reviews || []
  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : null

  if (allReviews.length === 0) return null

  return (
    <div style={{ marginTop: "3rem", paddingTop: "3rem", borderTop: "1px solid #e0e0e0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
            Customer Reviews
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "#f0a500", fontSize: "1.1rem" }}>{"★".repeat(Math.round(Number(avgRating)))}</span>
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{avgRating}</span>
            <span style={{ color: "#999", fontSize: "0.85rem" }}>({allReviews.length} {allReviews.length === 1 ? "review" : "reviews"})</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {allReviews.map((review: any) => (
          <div key={review.id} style={{ border: "1px solid #e0e0e0", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{review.customer_name}</p>
                {review.customer_location && (
                  <p style={{ fontSize: "0.75rem", color: "#999" }}>{review.customer_location}</p>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#f0a500", fontSize: "0.9rem" }}>{"★".repeat(review.rating)}<span style={{ color: "#e0e0e0" }}>{"★".repeat(5 - review.rating)}</span></div>
                <p style={{ fontSize: "0.7rem", color: "#bbb", marginTop: "0.2rem" }}>
                  {new Date(review.created_at).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
            <p style={{ fontSize: "0.9rem", color: "#444", lineHeight: 1.7 }}>{review.review_text}</p>
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "16px", height: "16px", backgroundColor: "black", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.55rem", flexShrink: 0 }}>v</span>
              <span style={{ fontSize: "0.7rem", color: "#666", fontWeight: 600 }}>Verified Purchase</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
