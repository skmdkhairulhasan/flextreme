import Link from "next/link"
import ReviewsGrid from "@/components/ui/ReviewsGrid"
import { apiFetchServer } from "@/lib/api/server"

export const metadata = { title: "Customer Reviews" }

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ rating?: string; page?: string }>
}) {
  const { rating, page } = await searchParams

  const currentPage = parseInt(page || "1")
  const perPage = 12

  // Fetch ALL reviews from API
  let allReviews: any[] = []

  try {
    const res = await apiFetchServer<{ reviews: any[] }>(
      "/api/reviews?status=approved&limit=1000"
    )
    allReviews = res?.reviews || []
  } catch (e) {
    console.error("Reviews fetch error:", e)
  }

  // Filter by rating
  let filtered = allReviews
  if (rating && rating !== "all") {
    filtered = filtered.filter((r) => r.rating === parseInt(rating))
  }

  // Pagination
  const total = filtered.length
  const totalPages = Math.ceil(total / perPage)
  const from = (currentPage - 1) * perPage
  const to = from + perPage
  const reviews = filtered.slice(from, to)

  // Stats
  const avgRating =
    allReviews.length > 0
      ? (
          allReviews.reduce((sum, r) => sum + r.rating, 0) /
          allReviews.length
        ).toFixed(1)
      : "0"

  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: allReviews.filter((x) => x.rating === r).length,
  }))

  return (
    <div style={{ paddingTop: "72px", minHeight: "100vh", backgroundColor: "var(--theme-bg, white)" }}>
      
      {/* HEADER */}
      <div style={{ backgroundColor: "var(--theme-primary, black)", color: "var(--theme-btn-text, white)", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>Real Athletes</p>
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "1.5rem" }}>Customer Reviews</h1>

        <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
          ⭐ {avgRating} / 5.0 <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>({allReviews.length} reviews)</span>
        </div>

        <Link href="/reviews/write" style={{ display: "inline-block", backgroundColor: "var(--theme-bg, white)", color: "black", padding: "0.75rem 2rem", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", marginTop: "1rem" }}>
          ✍️ Write a Review
        </Link>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        
        {/* FILTER */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/reviews" style={{ padding: "0.5rem 1rem", border: "1px solid #e0e0e0", textDecoration: "none", color: rating ? "#666" : "black", fontWeight: rating ? 400 : 700, fontSize: "0.875rem" }}>
            All
          </Link>
          {ratingCounts.map((rc) => (
            <Link key={rc.rating} href={`/reviews?rating=${rc.rating}`} style={{ padding: "0.5rem 1rem", border: "1px solid #e0e0e0", textDecoration: "none", color: rating === String(rc.rating) ? "black" : "#666", fontWeight: rating === String(rc.rating) ? 700 : 400, fontSize: "0.875rem" }}>
              {rc.rating}★ ({rc.count})
            </Link>
          ))}
        </div>

        {/* GRID */}
        {reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <ReviewsGrid reviews={reviews} />
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "3rem" }}>
            {currentPage > 1 && (
              <Link href={`/reviews?page=${currentPage - 1}${rating ? `&rating=${rating}` : ''}`} style={{ padding: "0.75rem 1.5rem", border: "2px solid black", textDecoration: "none", color: "black", fontWeight: 700, fontSize: "0.875rem" }}>
                ← Previous
              </Link>
            )}

            {currentPage < totalPages && (
              <Link href={`/reviews?page=${currentPage + 1}${rating ? `&rating=${rating}` : ''}`} style={{ padding: "0.75rem 1.5rem", backgroundColor: "black", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "0.875rem" }}>
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
