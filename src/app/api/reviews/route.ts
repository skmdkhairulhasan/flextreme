import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

function normalizeReview(row: any) {
  return {
    ...row,
    product_name: row.product_name || "",
    customer_location: row.customer_location || "",
    review_text: row.comment || "",
    photo_url: row.photo_url || null,
    // status column is now the source of truth; approved boolean kept in sync
    status: row.status || (row.approved ? "approved" : "pending"),
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const statusFilter = searchParams.get("status")   // approved | pending | rejected | null
    const limit        = searchParams.get("limit")
    const productId    = searchParams.get("product_id")
    const limitNum     = limit ? Math.max(1, parseInt(limit, 10) || 1) : null

    let rows: any[]

    if (productId && statusFilter === "approved") {
      rows = limitNum
        ? await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.product_id = ${productId}::uuid AND r.status = 'approved' ORDER BY r.created_at DESC LIMIT ${limitNum}`
        : await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.product_id = ${productId}::uuid AND r.status = 'approved' ORDER BY r.created_at DESC`
    } else if (productId) {
      rows = limitNum
        ? await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.product_id = ${productId}::uuid ORDER BY r.created_at DESC LIMIT ${limitNum}`
        : await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.product_id = ${productId}::uuid ORDER BY r.created_at DESC`
    } else if (statusFilter === "approved") {
      rows = limitNum
        ? await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.status = 'approved' ORDER BY r.created_at DESC LIMIT ${limitNum}`
        : await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.status = 'approved' ORDER BY r.created_at DESC`
    } else if (statusFilter) {
      // pending, rejected, or any other value
      rows = limitNum
        ? await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.status = ${statusFilter} ORDER BY r.created_at DESC LIMIT ${limitNum}`
        : await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.status = ${statusFilter} ORDER BY r.created_at DESC`
    } else {
      // No filter — return all (admin page uses this)
      rows = limitNum
        ? await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id ORDER BY r.created_at DESC LIMIT ${limitNum}`
        : await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id ORDER BY r.created_at DESC`
    }

    return NextResponse.json({ reviews: rows.map(normalizeReview) })
  } catch (error) {
    console.error("Reviews GET error:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.product_id) {
      return NextResponse.json({ error: "product_id is required" }, { status: 400 })
    }

    // Determine initial status
    const initStatus = body.status === "approved" ? "approved" : "pending"
    const initApproved = initStatus === "approved"

    const [review] = await sql`
      INSERT INTO reviews (
        product_id, customer_name, phone, rating, comment,
        approved, status, photo_url, customer_location
      ) VALUES (
        ${body.product_id}::uuid,
        ${body.customer_name || body.name || ""},
        ${body.phone ?? null},
        ${body.rating || 5},
        ${body.comment || body.review_text || ""},
        ${initApproved},
        ${initStatus},
        ${body.photo_url ?? null},
        ${body.customer_location ?? null}
      )
      RETURNING *
    `

    return NextResponse.json({
      review: normalizeReview({ ...review, product_name: body.product_name || "" })
    })
  } catch (error) {
    console.error("Reviews POST error:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: "Review ID required" }, { status: 400 })

    // Determine new status + approved bool in sync
    let newStatus: string | null = null
    let newApproved: boolean | null = null

    if (updates.status !== undefined) {
      newStatus = updates.status                          // "approved" | "pending" | "rejected"
      newApproved = updates.status === "approved"
    } else if (updates.approved !== undefined) {
      newApproved = updates.approved === true
      newStatus = newApproved ? "approved" : "pending"
    }

    const [review] = await sql`
      UPDATE reviews SET
        customer_name     = COALESCE(${updates.customer_name     ?? null}, customer_name),
        phone             = COALESCE(${updates.phone             ?? null}, phone),
        rating            = COALESCE(${updates.rating            ?? null}, rating),
        comment           = COALESCE(${updates.comment ?? updates.review_text ?? null}, comment),
        photo_url         = COALESCE(${updates.photo_url         ?? null}, photo_url),
        customer_location = COALESCE(${updates.customer_location ?? null}, customer_location),
        status            = COALESCE(${newStatus},   status),
        approved          = COALESCE(${newApproved}, approved)
      WHERE id = ${id}::uuid
      RETURNING *
    `

    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 })

    return NextResponse.json({ review: normalizeReview(review) })
  } catch (error) {
    console.error("Reviews PATCH error:", error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Review ID required" }, { status: 400 })

    const rows = await sql`DELETE FROM reviews WHERE id = ${id}::uuid RETURNING id`
    if (rows.length === 0) return NextResponse.json({ error: "Review not found" }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reviews DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}
