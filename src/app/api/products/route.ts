import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

function parseJsonField(value: unknown, fallback: unknown) {
  if (value == null) return fallback
  if (typeof value !== "string") return value
  try { return JSON.parse(value) } catch { return fallback }
}

function normalizeProduct(row: any) {
  return {
    ...row,
    sizes: parseJsonField(row.sizes, []),
    colors: parseJsonField(row.colors, []),
    images: parseJsonField(row.images, []),
    stock_matrix: parseJsonField(row.stock_matrix, {}),
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const featured = searchParams.get("featured")
    const limitParam = searchParams.get("limit")
    const inStock = searchParams.get("in_stock")
    const id = searchParams.get("id")
    const slug = searchParams.get("slug")
    const limit = limitParam ? parseInt(limitParam) : null

    let rows

    if (id) {
      rows = await sql`SELECT * FROM products WHERE id = ${id} ORDER BY sort_order ASC, created_at DESC`
    } else if (slug) {
      rows = await sql`SELECT * FROM products WHERE slug = ${slug} ORDER BY sort_order ASC, created_at DESC`
    } else if (featured === "true" && inStock === "true" && limit) {
      rows = await sql`SELECT * FROM products WHERE is_featured = true AND in_stock = true ORDER BY sort_order ASC, created_at DESC LIMIT ${limit}`
    } else if (featured === "true" && inStock === "true") {
      rows = await sql`SELECT * FROM products WHERE is_featured = true AND in_stock = true ORDER BY sort_order ASC, created_at DESC`
    } else if (featured === "true" && limit) {
      rows = await sql`SELECT * FROM products WHERE is_featured = true ORDER BY sort_order ASC, created_at DESC LIMIT ${limit}`
    } else if (featured === "true") {
      rows = await sql`SELECT * FROM products WHERE is_featured = true ORDER BY sort_order ASC, created_at DESC`
    } else if (inStock === "true" && limit) {
      rows = await sql`SELECT * FROM products WHERE in_stock = true ORDER BY sort_order ASC, created_at DESC LIMIT ${limit}`
    } else if (inStock === "true") {
      rows = await sql`SELECT * FROM products WHERE in_stock = true ORDER BY sort_order ASC, created_at DESC`
    } else if (limit) {
      rows = await sql`SELECT * FROM products ORDER BY sort_order ASC, created_at DESC LIMIT ${limit}`
    } else {
      rows = await sql`SELECT * FROM products ORDER BY sort_order ASC, created_at DESC`
    }

    return NextResponse.json({ products: rows.map(normalizeProduct) })
  } catch (error) {
    console.error("Products GET error:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const [product] = await sql`
      INSERT INTO products (
        name, slug, price, original_price, category, subcategory,
        sizes, colors, images, video_url, description,
        is_featured, in_stock, stock_quantity, low_stock_alert, stock_matrix, sort_order
      ) VALUES (
        ${body.name}, ${body.slug}, ${body.price}, ${body.original_price ?? null},
        ${body.category ?? null}, ${body.subcategory ?? null},
        ${JSON.stringify(body.sizes || [])}, ${JSON.stringify(body.colors || [])},
        ${JSON.stringify(body.images || [])}, ${body.video_url ?? null},
        ${body.description || ""}, ${body.is_featured || false},
        ${body.in_stock ?? true}, ${body.stock_quantity ?? null},
        ${body.low_stock_alert || 5}, ${JSON.stringify(body.stock_matrix || {})}, ${body.sort_order ?? 9999}
      )
      RETURNING *
    `
    return NextResponse.json({ success: true, product: normalizeProduct(product) })
  } catch (error) {
    console.error("Products POST error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    const [product] = await sql`
      UPDATE products SET
        name = COALESCE(${updates.name ?? null}, name),
        slug = COALESCE(${updates.slug ?? null}, slug),
        price = COALESCE(${updates.price ?? null}, price),
        original_price = COALESCE(${updates.original_price ?? null}, original_price),
        category = COALESCE(${updates.category ?? null}, category),
        subcategory = COALESCE(${updates.subcategory ?? null}, subcategory),
        sizes = COALESCE(${updates.sizes ? JSON.stringify(updates.sizes) : null}, sizes),
        colors = COALESCE(${updates.colors ? JSON.stringify(updates.colors) : null}, colors),
        images = COALESCE(${updates.images ? JSON.stringify(updates.images) : null}, images),
        video_url = COALESCE(${updates.video_url ?? null}, video_url),
        description = COALESCE(${updates.description ?? null}, description),
        is_featured = COALESCE(${updates.is_featured ?? null}, is_featured),
        in_stock = COALESCE(${updates.in_stock ?? null}, in_stock),
        stock_quantity = COALESCE(${updates.stock_quantity ?? null}, stock_quantity),
        sort_order = COALESCE(${body.sort_order ?? null}, sort_order),
        stock_matrix = COALESCE(${updates.stock_matrix ? JSON.stringify(updates.stock_matrix) : null}, stock_matrix),
        updated_at = datetime('now')
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json({ success: true, product: normalizeProduct(product) })
  } catch (error) {
    console.error("Products PATCH error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    await sql`DELETE FROM products WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Products DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
