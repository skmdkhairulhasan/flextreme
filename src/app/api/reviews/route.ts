import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

function normalizeReview(row: any) {
  return {
    ...row,
    product_name: row.product_name || "",
    customer_name: row.customer_name || "",
    customer_location: row.customer_location || "",
    comment: row.comment || "",
    review_text: row.comment || row.review_text || "",
    photo_url: row.photo_url || null,
    rating: Number(row.rating) || 5,
    featured: row.featured === true || row.featured === "true",
    status: row.status || (row.approved ? "approved" : "pending"),
    approved: row.approved === true || row.status === "approved",
  }
}

// Auto-add any missing columns — safe to call repeatedly
let columnsReady = false
async function ensureColumns() {
  if (columnsReady) return
  try {
    // D1/SQLite: product_id is nullable by default (no NOT NULL constraint in schema)
  } catch {}
  try {
    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photo_url TEXT`
  } catch {}
  try {
    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_location TEXT`
  } catch {}
  try {
    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`
  } catch {}
  try {
    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false`
  } catch {}
  try {
    await sql`UPDATE reviews SET status = 'approved' WHERE approved = true AND status = 'pending'`
  } catch {}
  columnsReady = true
}

export async function GET(request: NextRequest) {
  try {
    await ensureColumns()

    const { searchParams } = request.nextUrl
    const statusFilter  = searchParams.get("status")   // approved | pending | rejected
    const featuredOnly  = searchParams.get("featured") === "true"
    const limit         = searchParams.get("limit")
    const productId     = searchParams.get("product_id")
    const limitNum      = limit ? Math.max(1, parseInt(limit, 10) || 1) : null

    // Fetch all matching rows — filter in JS to stay safe across schema versions
    let rows: any[]

    if (productId) {
      rows = limitNum
        ? await sql`
            SELECT r.*, p.name AS product_name
            FROM reviews r
            LEFT JOIN products p ON p.id = r.product_id
            WHERE r.product_id = ${productId}
            ORDER BY r.featured DESC, r.created_at DESC
            LIMIT ${limitNum}
          `
        : await sql`
            SELECT r.*, p.name AS product_name
            FROM reviews r
            LEFT JOIN products p ON p.id = r.product_id
            WHERE r.product_id = ${productId}
            ORDER BY r.featured DESC, r.created_at DESC
          `
    } else {
      rows = limitNum
        ? await sql`
            SELECT r.*, p.name AS product_name
            FROM reviews r
            LEFT JOIN products p ON p.id = r.product_id
            ORDER BY r.featured DESC, r.created_at DESC
            LIMIT ${limitNum}
          `
        : await sql`
            SELECT r.*, p.name AS product_name
            FROM reviews r
            LEFT JOIN products p ON p.id = r.product_id
            ORDER BY r.featured DESC, r.created_at DESC
          `
    }

    let reviews = rows.map(normalizeReview)

    // Status filter
    if (statusFilter === "approved") {
      reviews = reviews.filter(r => r.approved === true || r.status === "approved")
    } else if (statusFilter === "pending") {
      reviews = reviews.filter(r => r.status === "pending" && r.approved !== true)
    } else if (statusFilter === "rejected") {
      reviews = reviews.filter(r => r.status === "rejected")
    }

    // Featured filter
    if (featuredOnly) {
      reviews = reviews.filter(r => r.featured === true)
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("Reviews GET error:", error)
    return NextResponse.json({ error: "Failed to fetch reviews", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureColumns()

    const body         = await request.json()
    const initStatus   = body.status === "approved" ? "approved" : "pending"
    const initApproved = initStatus === "approved"
    const commentText  = body.comment || body.review_text || ""
    const photoUrl     = body.photo_url || null
    const location     = body.customer_location || null
    const customerName = body.customer_name || body.name || ""
    const productName  = body.product_name || null

    let review: any

    if (body.product_id) {
      const rows = await sql`
        INSERT INTO reviews (
          product_id, customer_name, phone, rating, comment,
          approved, status, photo_url, customer_location, featured
        ) VALUES (
          ${body.product_id},
          ${customerName},
          ${body.phone ?? null},
          ${Number(body.rating) || 5},
          ${commentText},
          ${initApproved},
          ${initStatus},
          ${photoUrl},
          ${location},
          false
        )
        RETURNING *
      `
      review = rows[0]
    } else {
      // No product linked — from /reviews/write standalone page
      const rows = await sql`
        INSERT INTO reviews (
          customer_name, phone, rating, comment,
          approved, status, photo_url, customer_location, featured
        ) VALUES (
          ${customerName},
          ${body.phone ?? null},
          ${Number(body.rating) || 5},
          ${commentText},
          ${initApproved},
          ${initStatus},
          ${photoUrl},
          ${location},
          false
        )
        RETURNING *
      `
      review = rows[0]
    }

    return NextResponse.json({
      success: true,
      review: normalizeReview({ ...review, product_name: productName || "" }),
    })
  } catch (error) {
    console.error("Reviews POST error:", error)
    return NextResponse.json({ error: "Failed to create review", details: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: "Review ID required" }, { status: 400 })

    // Sync status + approved boolean
    let newStatus: string | null = null
    let newApproved: boolean | null = null
    if (updates.status !== undefined) {
      newStatus   = updates.status
      newApproved = updates.status === "approved"
    } else if (updates.approved !== undefined) {
      newApproved = Boolean(updates.approved)
      newStatus   = newApproved ? "approved" : "pending"
    }

    const newFeatured = updates.featured !== undefined ? Boolean(updates.featured) : null

    const rows = await sql`
      UPDATE reviews SET
        customer_name     = COALESCE(${updates.customer_name     ?? null}, customer_name),
        phone             = COALESCE(${updates.phone             ?? null}, phone),
        rating            = COALESCE(${updates.rating            ?? null}, rating),
        comment           = COALESCE(${updates.comment ?? updates.review_text ?? null}, comment),
        photo_url         = COALESCE(${updates.photo_url         ?? null}, photo_url),
        customer_location = COALESCE(${updates.customer_location ?? null}, customer_location),
        status            = COALESCE(${newStatus},   status),
        approved          = COALESCE(${newApproved}, approved),
        featured          = COALESCE(${newFeatured}, featured)
      WHERE id = ${id}
      RETURNING *
    `

    if (!rows[0]) return NextResponse.json({ error: "Review not found" }, { status: 404 })
    return NextResponse.json({ review: normalizeReview(rows[0]) })
  } catch (error) {
    console.error("Reviews PATCH error:", error)
    return NextResponse.json({ error: "Failed to update review", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Review ID required" }, { status: 400 })
    const rows = await sql`DELETE FROM reviews WHERE id = ${id} RETURNING id`
    if (!rows[0]) return NextResponse.json({ error: "Review not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reviews DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}
