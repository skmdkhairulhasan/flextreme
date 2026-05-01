import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Import the actual arrays from other routes
    // Since we can't import across route files in Next.js App Router,
    // we'll fetch from the actual API endpoints
    
    const [productsRes, ordersRes, reviewsRes] = await Promise.all([
      fetch("http://localhost:3000/api/products", { cache: "no-store" }),
      fetch("http://localhost:3000/api/orders", { cache: "no-store" }),
      fetch("http://localhost:3000/api/reviews", { cache: "no-store" }),
    ]).catch(() => [null, null, null])

    let productCount = 0
    let orderCount = 0
    let reviewCount = 0
    let avgRating = 0

    if (productsRes) {
      const data = await productsRes.json()
      productCount = data.products?.length || 0
    }

    if (ordersRes) {
      const data = await ordersRes.json()
      orderCount = data.orders?.length || 0
    }

    if (reviewsRes) {
      const data = await reviewsRes.json()
      const reviews = data.reviews || []
      reviewCount = reviews.length
      
      if (reviewCount > 0) {
        const approvedReviews = reviews.filter((r: any) => r.status === "approved")
        if (approvedReviews.length > 0) {
          const totalRating = approvedReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
          avgRating = totalRating / approvedReviews.length
        }
      }
    }

    return NextResponse.json({
      productCount,
      orderCount,
      reviewCount,
      avgRating: Math.round(avgRating * 10) / 10,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({
      productCount: 0,
      orderCount: 0,
      reviewCount: 0,
      avgRating: 0,
    })
  }
}
