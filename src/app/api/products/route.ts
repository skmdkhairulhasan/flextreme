import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const featured = searchParams.get("featured")
    const limit = searchParams.get("limit")
    const inStock = searchParams.get("in_stock")
    const id = searchParams.get("id")
    const slug = searchParams.get("slug")

    let rows

    if (id) {
      rows = await sql`SELECT * FROM products WHERE id = ${id}::uuid ORDER BY created_at DESC`
    } else if (slug) {
      rows = await sql`SELECT * FROM products WHERE slug = ${slug} ORDER BY created_at DESC`
    } else if (featured === "true" && inStock === "true") {
      rows = await sql`SELECT * FROM products WHERE is_featured = true AND in_stock = true ORDER BY created_at DESC ${limit ? sql`LIMIT ${parseInt(limit)}` : sql``}`
    } else if (featured === "true") {
      rows = await sql`SELECT * FROM products WHERE is_featured = true ORDER BY created_at DESC ${limit ? sql`LIMIT ${parseInt(limit)}` : sql``}`
    } else if (inStock === "true") {
      rows = await sql`SELECT * FROM products WHERE in_stock = true ORDER BY created_at DESC ${limit ? sql`LIMIT ${parseInt(limit)}` : sql``}`
    } else {
      rows = await sql`SELECT * FROM products ORDER BY created_at DESC ${limit ? sql`LIMIT ${parseInt(limit)}` : sql``}`
    }

    return NextResponse.json({ products: rows })
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
        is_featured, in_stock, stock_quantity, low_stock_alert, stock_matrix
      ) VALUES (
        ${body.name}, ${body.slug}, ${body.price}, ${body.original_price ?? null},
        ${body.category ?? null}, ${body.subcategory ?? null},
        ${JSON.stringify(body.sizes || [])}, ${JSON.stringify(body.colors || [])},
        ${JSON.stringify(body.images || [])}, ${body.video_url ?? null},
        ${body.description || ""}, ${body.is_featured || false},
        ${body.in_stock ?? true}, ${body.stock_quantity ?? null},
        ${body.low_stock_alert || 5}, ${JSON.stringify(body.stock_matrix || {})}
      )
      RETURNING *
    `
    return NextResponse.json({ success: true, product })
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
        sizes = COALESCE(${updates.sizes ? JSON.stringify(updates.sizes) : null}::jsonb, sizes),
        colors = COALESCE(${updates.colors ? JSON.stringify(updates.colors) : null}::jsonb, colors),
        images = COALESCE(${updates.images ? JSON.stringify(updates.images) : null}::jsonb, images),
        video_url = COALESCE(${updates.video_url ?? null}, video_url),
        description = COALESCE(${updates.description ?? null}, description),
        is_featured = COALESCE(${updates.is_featured ?? null}, is_featured),
        in_stock = COALESCE(${updates.in_stock ?? null}, in_stock),
        stock_quantity = COALESCE(${updates.stock_quantity ?? null}, stock_quantity),
        stock_matrix = COALESCE(${updates.stock_matrix ? JSON.stringify(updates.stock_matrix) : null}::jsonb, stock_matrix),
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `
    return NextResponse.json({ success: true, product })
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
    await sql`DELETE FROM products WHERE id = ${id}::uuid`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Products DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
