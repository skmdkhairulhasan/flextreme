import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

function normalizeReview(row: any) {
  return {
    ...row,
    product_name: row.product_name || "",
    customer_name: row.customer_name || row.name || "",
    customer_location: row.customer_location || "",
    comment: row.comment || "",
    review_text: row.comment || row.review_text || "",
    photo_url: row.photo_url || null,
    rating: Number(row.rating) || 5,
    status: row.status || (row.approved ? "approved" : "pending"),
    approved: row.approved ?? (row.status === "approved"),
  }
}

async function ensureColumns() {
  try {
    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photo_url TEXT`
    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_location TEXT`
    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`
    await sql`UPDATE reviews SET status = 'approved' WHERE approved = true AND (status IS NULL OR status = 'pending')`
  } catch { /* columns already exist */ }
}

let columnsEnsured = false

export async function GET(request: NextRequest) {
  try {
    if (!columnsEnsured) { await ensureColumns(); columnsEnsured = true }

    const { searchParams } = request.nextUrl
    const statusFilter = searchParams.get("status")
    const limit        = searchParams.get("limit")
    const productId    = searchParams.get("product_id")
    const limitNum     = limit ? Math.max(1, parseInt(limit, 10) || 1) : null

    let rows: any[]

    if (productId) {
      rows = limitNum
        ? await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.product_id = ${productId}::uuid ORDER BY r.created_at DESC LIMIT ${limitNum}`
        : await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.product_id = ${productId}::uuid ORDER BY r.created_at DESC`
    } else {
      rows = limitNum
        ? await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id ORDER BY r.created_at DESC LIMIT ${limitNum}`
        : await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id ORDER BY r.created_at DESC`
    }

    let reviews = rows.map(normalizeReview)

    if (statusFilter === "approved") {
      reviews = reviews.filter(r => r.approved === true || r.status === "approved")
    } else if (statusFilter === "pending") {
      reviews = reviews.filter(r => r.status === "pending" && r.approved !== true)
    } else if (statusFilter === "rejected") {
      reviews = reviews.filter(r => r.status === "rejected")
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("Reviews GET error:", error)
    return NextResponse.json({ error: "Failed to fetch reviews", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!columnsEnsured) { await ensureColumns(); columnsEnsured = true }

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
          approved, status, photo_url, customer_location
        ) VALUES (
          ${body.product_id}::uuid,
          ${customerName},
          ${body.phone ?? null},
          ${Number(body.rating) || 5},
          ${commentText},
          ${initApproved},
          ${initStatus},
          ${photoUrl},
          ${location}
        )
        RETURNING *
      `
      review = rows[0]
    } else {
      const rows = await sql`
        INSERT INTO reviews (
          customer_name, phone, rating, comment,
          approved, status, photo_url, customer_location
        ) VALUES (
          ${customerName},
          ${body.phone ?? null},
          ${Number(body.rating) || 5},
          ${commentText},
          ${initApproved},
          ${initStatus},
          ${photoUrl},
          ${location}
        )
        RETURNING *
      `
      review = rows[0]
    }

    return NextResponse.json({
      success: true,
      review: normalizeReview({ ...review, product_name: productName || "" })
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

    let newStatus: string | null = null
    let newApproved: boolean | null = null
    if (updates.status !== undefined) {
      newStatus   = updates.status
      newApproved = updates.status === "approved"
    } else if (updates.approved !== undefined) {
      newApproved = Boolean(updates.approved)
      newStatus   = newApproved ? "approved" : "pending"
    }

    const rows = await sql`
      UPDATE reviews SET
        customer_name     = COALESCE(${updates.customer_name     ?? null}, customer_name),
        phone             = COALESCE(${updates.phone             ?? null}, phone),
        rating            = COALESCE(${updates.rating            ?? null}::int, rating),
        comment           = COALESCE(${updates.comment ?? updates.review_text ?? null}, comment),
        photo_url         = COALESCE(${updates.photo_url         ?? null}, photo_url),
        customer_location = COALESCE(${updates.customer_location ?? null}, customer_location),
        status            = COALESCE(${newStatus},   status),
        approved          = COALESCE(${newApproved}, approved)
      WHERE id = ${id}::uuid
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
    const rows = await sql`DELETE FROM reviews WHERE id = ${id}::uuid RETURNING id`
    if (!rows[0]) return NextResponse.json({ error: "Review not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reviews DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}
