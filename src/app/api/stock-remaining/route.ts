import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

function parseJsonField(value: unknown, fallback: any) {
  if (value == null) return fallback
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const productId = body.product_id || body.productId || body.id
    const slug = body.slug
    const size = body.size || ""
    const color = body.color || ""

    let rows
    if (productId) {
      rows = await sql`SELECT * FROM products WHERE id = ${productId}::uuid LIMIT 1`
    } else if (slug) {
      rows = await sql`SELECT * FROM products WHERE slug = ${slug} LIMIT 1`
    } else {
      return NextResponse.json({ error: "Product ID or slug required" }, { status: 400 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const product = rows[0]
    const stockMatrix = parseJsonField(product.stock_matrix, {})
    const stockQuantity = Number(product.stock_quantity || 0)
    const key = size && color ? `${String(size).trim()}_${String(color).trim()}` : ""
    const matchedKey = key
      ? Object.keys(stockMatrix).find(k => k.toLowerCase() === key.toLowerCase()) || key
      : ""

    let sold = 0
    if (key) {
      const soldRows = await sql`
        SELECT COALESCE(SUM(quantity), 0) as sold
        FROM orders
        WHERE product_id = ${product.id}::uuid
          AND LOWER(size) = LOWER(${size})
          AND LOWER(color) = LOWER(${color})
          AND status = ANY(${["confirmed", "processing", "shipped", "delivered"]})
      `
      sold = Number(soldRows[0]?.sold || 0)
    } else {
      const soldRows = await sql`
        SELECT COALESCE(SUM(quantity), 0) as sold
        FROM orders
        WHERE product_id = ${product.id}::uuid
          AND status = ANY(${["confirmed", "processing", "shipped", "delivered"]})
      `
      sold = Number(soldRows[0]?.sold || 0)
    }

    const baseStock = key && matchedKey in stockMatrix
      ? Number(stockMatrix[matchedKey] || 0)
      : stockQuantity
    const remaining = Math.max(0, baseStock - sold)

    return NextResponse.json({
      product_id: product.id,
      in_stock: product.in_stock && remaining > 0,
      remaining,
      stock_remaining: remaining,
      sold,
      stock_matrix: stockMatrix,
    })
  } catch (error) {
    console.error("Stock remaining POST error:", error)
    return NextResponse.json(
      { error: "Failed to check stock" },
      { status: 500 }
    )
  }
}
