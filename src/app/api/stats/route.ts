import { NextResponse } from "next/server"
import sql from "@/lib/db"

export async function GET() {
  try {
    const [products, orders, customers, reviews, rating, revenue] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM products`,
      sql`SELECT COUNT(*) as count FROM orders`,
      sql`SELECT COUNT(*) as count FROM customers`,
      sql`SELECT COUNT(*) as count FROM reviews`,
      sql`SELECT COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE approved = true`,
      sql`SELECT COALESCE(SUM(total_price), 0) as total_revenue FROM orders WHERE status IN ('confirmed','processing','shipped','delivered')`,
    ])

    const avgRating = Number(rating[0]?.avg_rating || 0)

    return NextResponse.json({
      productCount: Number(products[0]?.count || 0),
      orderCount: Number(orders[0]?.count || 0),
      customerCount: Number(customers[0]?.count || 0),
      reviewCount: Number(reviews[0]?.count || 0),
      avgRating: Math.round(avgRating * 10) / 10,
      totalRevenue: Number(revenue[0]?.total_revenue || 0),
    })
  } catch (error) {
    console.error("Stats GET error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
