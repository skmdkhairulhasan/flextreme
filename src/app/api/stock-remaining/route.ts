import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("id") || ""
  if (!productId) return NextResponse.json({ remaining: null, matrix: {} })

  const supabase = await createClient()
  const countedStatuses = ["confirmed", "processing", "shipped", "delivered"]

  const [{ data: product }, { data: orders }] = await Promise.all([
    supabase.from("products").select("stock_matrix, stock_quantity").eq("id", productId).single(),
    supabase.from("orders").select("size, color, quantity, status").eq("product_id", productId)
  ])

  const matrix = { ...(product?.stock_matrix || {}) }
  const soldMatrix: Record<string, number> = {}

  ;(orders || []).filter((o: any) => countedStatuses.includes(o.status)).forEach((o: any) => {
    const k = ((o.size || "").trim() + "_" + (o.color || "").trim())
    const matched = Object.keys(matrix).find(mk => mk.toLowerCase() === k.toLowerCase()) || k
    soldMatrix[matched] = (soldMatrix[matched] || 0) + (o.quantity || 1)
  })

  const remainingMatrix: Record<string, number> = {}
  Object.keys(matrix).forEach(k => {
    remainingMatrix[k] = Math.max(0, (Number(matrix[k]) || 0) - (soldMatrix[k] || 0))
  })

  const totalRemaining = Object.values(remainingMatrix).reduce((s, v) => s + v, 0)

  return NextResponse.json({ remaining: totalRemaining, matrix: remainingMatrix, soldMatrix })
}
