import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

function parseJsonField(value: unknown, fallback: unknown) {
  if (value == null) return fallback
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeProduct(product: any) {
  if (!product) return null
  return {
    ...product,
    sizes: parseJsonField(product.sizes, []),
    colors: parseJsonField(product.colors, []),
    images: parseJsonField(product.images, []),
    stock_matrix: parseJsonField(product.stock_matrix, {}),
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const rows = await sql`SELECT * FROM products WHERE slug = ${slug} LIMIT 1`

    if (rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const product = normalizeProduct(rows[0])
    return NextResponse.json({ product, products: [product] })
  } catch (error) {
    console.error("Product slug GET error:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}
