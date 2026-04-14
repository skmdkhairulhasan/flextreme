import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import ReviewsGrid from "@/components/ui/ReviewsGrid"

export const metadata = { title: "Customer Reviews" }

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ rating?: string, page?: string }> }) {
  const { rating, page } = await searchParams
  const supabase = await createClient()
  const currentPage = parseInt(page || "1")
  const perPage = 12
  const from = (currentPage - 1) * perPage
  const to = from + perPage - 1

  let query = supabase.from("reviews").select("*", { count: "exact" }).eq("status", "approved").order("created_at", { ascending: false })
  if (rating && rating !== "all") query = query.eq("rating", parseInt(rating))
  const { data: reviews, count } = await query.range(from, to)

  const { data: allReviews } = await supabase.from("reviews").select("rating").eq("status", "approved")
  const totalPages = Math.ceil((count || 0) / perPage)
  const allReviewsList = allReviews || []
  const avgRating = allReviewsList.length > 0 ? (allReviewsList.reduce((sum, r) => sum + r.rating, 0) / allReviewsList.length).toFixed(1) : "0"
  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({ rating: r, count: allReviewsList.filter(x => x.rating === r).length }))

  return (
    <div style={{ paddingTop: "72px", minHeight: "100vh", backgroundColor: "white" }}>
      <div style={{ backgroundColor: "black", color: "white", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>Real Athletes</p>
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 }}>Customer Reviews</h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginTop: "1rem" }}>
          <span style={{ color: "#f0a500", fontSize: "1.5rem" }}>{"★".repeat(Math.round(Number(avgRating)))}</span>
          <span style={{ color: "white", fontSize: "1.25rem", fontWeight: 900 }}>{avgRating}</span>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>({allReviewsList.length} reviews)</span>
        </div>
        <Link href="/reviews/write" style={{ display: "inline-block", marginTop: "1.5rem", backgroundColor: "white", color: "black", padding: "0.875rem 2.5rem", fontWeight: 900, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
          ✍️ Write a Review
        </Link>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .reviews-layout { grid-template-columns: 1fr !important; }
          .reviews-sidebar { display: none; }
          .reviews-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div className="reviews-layout" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "3rem", alignItems: "start" }}>

          {/* Sidebar */}
          <div style={{ position: "sticky", top: "90px" }}>
            <div style={{ border: "1px solid #e0e0e0", padding: "1.5rem", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.25rem" }}>Filter by Rating</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <Link href="/reviews" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", textDecoration: "none", backgroundColor: !rating || rating === "all" ? "black" : "transparent", color: !rating || rating === "all" ? "white" : "#333", fontSize: "0.85rem", fontWeight: !rating || rating === "all" ? 700 : 400 }}>
                  <span>All Reviews</span>
                  <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{allReviewsList.length}</span>
                </Link>
                {ratingCounts.map(rc => (
                  <Link key={rc.rating} href={"/reviews?rating=" + rc.rating} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", textDecoration: "none", backgroundColor: rating === String(rc.rating) ? "black" : "transparent", color: rating === String(rc.rating) ? "white" : "#333", fontSize: "0.85rem", fontWeight: rating === String(rc.rating) ? 700 : 400 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ color: rating === String(rc.rating) ? "white" : "#f0a500" }}>{"★".repeat(rc.rating)}</span>
                    </span>
                    <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{rc.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div style={{ border: "1px solid #e0e0e0", padding: "1.5rem", backgroundColor: "#f9f9f9" }}>
              <h3 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Rating Breakdown</h3>
              {ratingCounts.map(rc => (
                <div key={rc.rating} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#666", width: "12px" }}>{rc.rating}</span>
                  <span style={{ color: "#f0a500", fontSize: "0.75rem" }}>★</span>
                  <div style={{ flex: 1, height: "6px", backgroundColor: "#e0e0e0", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", backgroundColor: "black", width: allReviewsList.length > 0 ? (rc.count / allReviewsList.length * 100) + "%" : "0%", borderRadius: "3px" }} />
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#999", width: "20px", textAlign: "right" }}>{rc.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews grid */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.875rem", color: "#666" }}>
                Showing {from + 1}–{Math.min(to + 1, count || 0)} of {count || 0} reviews
                {rating && rating !== "all" ? " for " + rating + " stars" : ""}
              </p>
            </div>

            {(!reviews || reviews.length === 0) ? (
              <div style={{ textAlign: "center", padding: "4rem", border: "1px solid #e0e0e0", color: "#999" }}>
                <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No reviews yet</p>
                <p style={{ fontSize: "0.85rem" }}>Be the first to leave a review!</p>
                <Link href="/products" style={{ display: "inline-block", marginTop: "1rem", backgroundColor: "black", color: "white", padding: "0.75rem 2rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", textDecoration: "none" }}>Shop Now</Link>
              </div>
            ) : (
              <ReviewsGrid reviews={reviews} />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "3rem", flexWrap: "wrap" }}>
                {currentPage > 1 && (
                  <Link href={"/reviews?page=" + (currentPage - 1) + (rating ? "&rating=" + rating : "")} style={{ padding: "0.6rem 1.25rem", border: "1px solid #e0e0e0", textDecoration: "none", color: "#333", fontSize: "0.85rem", fontWeight: 600 }}>
                    Previous
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Link key={p} href={"/reviews?page=" + p + (rating ? "&rating=" + rating : "")} style={{ padding: "0.6rem 1rem", border: "1px solid #e0e0e0", textDecoration: "none", color: p === currentPage ? "white" : "#333", backgroundColor: p === currentPage ? "black" : "white", fontSize: "0.85rem", fontWeight: p === currentPage ? 700 : 400, minWidth: "42px", textAlign: "center" }}>
                    {p}
                  </Link>
                ))}
                {currentPage < totalPages && (
                  <Link href={"/reviews?page=" + (currentPage + 1) + (rating ? "&rating=" + rating : "")} style={{ padding: "0.6rem 1.25rem", border: "1px solid #e0e0e0", textDecoration: "none", color: "#333", fontSize: "0.85rem", fontWeight: 600 }}>
                    Next
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
