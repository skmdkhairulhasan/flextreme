import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

// D1 returns 0/1 for booleans — normalize everything here
function normalizeReview(row: any) {
  return {
    ...row,
    product_name:      row.product_name || "",
    customer_name:     row.customer_name || "",
    customer_location: row.customer_location || "",
    comment:           row.comment || "",
    review_text:       row.comment || row.review_text || "",
    photo_url:         row.photo_url || null,
    rating:            Number(row.rating) || 5,
    featured:          row.featured === 1 || row.featured === true,
    approved:          row.approved === 1 || row.approved === true || row.status === "approved",
    status:            row.status || (row.approved ? "approved" : "pending"),
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const statusFilter = searchParams.get("status")
    const featuredOnly = searchParams.get("featured") === "true"
    const limit        = searchParams.get("limit")
    const productId    = searchParams.get("product_id")
    const limitNum     = limit ? Math.max(1, parseInt(limit, 10) || 1) : null

    let rows: any[]
    if (productId) {
      rows = limitNum
        ? await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.product_id = ${productId} ORDER BY r.featured DESC, r.created_at DESC LIMIT ${limitNum}`
        : await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.product_id = ${productId} ORDER BY r.featured DESC, r.created_at DESC`
    } else {
      rows = limitNum
        ? await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id ORDER BY r.featured DESC, r.created_at DESC LIMIT ${limitNum}`
        : await sql`SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id ORDER BY r.featured DESC, r.created_at DESC`
    }

    let reviews = rows.map(normalizeReview)

    if (statusFilter === "approved")  reviews = reviews.filter(r => r.approved)
    else if (statusFilter === "pending")  reviews = reviews.filter(r => !r.approved && r.status !== "rejected")
    else if (statusFilter === "rejected") reviews = reviews.filter(r => r.status === "rejected")
    if (featuredOnly) reviews = reviews.filter(r => r.featured)

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("Reviews GET error:", error)
    return NextResponse.json({ error: "Failed to fetch reviews", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body        = await request.json()
    const initApproved = body.status === "approved" ? 1 : 0
    const initStatus   = body.status === "approved" ? "approved" : "pending"
    const commentText  = body.comment || body.review_text || ""
    const customerName = body.customer_name || body.name || ""

    let review: any
    if (body.product_id) {
      const rows = await sql`
        INSERT INTO reviews (product_id, customer_name, phone, email, rating, comment, approved, status, photo_url, customer_location, featured)
        VALUES (${body.product_id}, ${customerName}, ${body.phone ?? null}, ${body.email ?? null}, ${Number(body.rating) || 5}, ${commentText}, ${initApproved}, ${initStatus}, ${body.photo_url || null}, ${body.customer_location || null}, 0)
        RETURNING *`
      review = rows[0]
    } else {
      const rows = await sql`
        INSERT INTO reviews (customer_name, phone, email, rating, comment, approved, status, photo_url, customer_location, featured)
        VALUES (${customerName}, ${body.phone ?? null}, ${body.email ?? null}, ${Number(body.rating) || 5}, ${commentText}, ${initApproved}, ${initStatus}, ${body.photo_url || null}, ${body.customer_location || null}, 0)
        RETURNING *`
      review = rows[0]
    }

    return NextResponse.json({ success: true, review: normalizeReview({ ...review, product_name: body.product_name || "" }) })
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

    // Build targeted UPDATE — only update what's sent
    // D1 needs 0/1 for booleans
    const fields: string[] = []
    const params: any[] = []

    if (updates.status !== undefined) {
      fields.push("status = ?")
      params.push(updates.status)
      fields.push("approved = ?")
      params.push(updates.status === "approved" ? 1 : 0)
    }
    if (updates.approved !== undefined && updates.status === undefined) {
      const a = updates.approved ? 1 : 0
      fields.push("approved = ?")
      params.push(a)
      fields.push("status = ?")
      params.push(a ? "approved" : "pending")
    }
    if (updates.featured !== undefined) {
      fields.push("featured = ?")
      params.push(updates.featured ? 1 : 0)
    }
    if (updates.rating !== undefined) {
      fields.push("rating = ?")
      params.push(Number(updates.rating))
    }
    if (updates.comment !== undefined || updates.review_text !== undefined) {
      fields.push("comment = ?")
      params.push(updates.comment ?? updates.review_text)
    }
    if (updates.customer_name !== undefined) {
      fields.push("customer_name = ?")
      params.push(updates.customer_name)
    }
    if (updates.customer_location !== undefined) {
      fields.push("customer_location = ?")
      params.push(updates.customer_location)
    }
    if (updates.photo_url !== undefined) {
      fields.push("photo_url = ?")
      params.push(updates.photo_url)
    }

    if (fields.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })

    // Build raw SQL with dynamic fields
    const setClauses = fields.join(", ")
    params.push(id)
    const db = (await import("@/lib/db")).default

    // Use raw D1 since our sql tag doesn't support dynamic field building
    const { getCloudflareContext } = await import("@opennextjs/cloudflare")
    const ctx = await getCloudflareContext({ async: true })
    const d1 = (ctx.env as any).DB

    const result = await d1.prepare(`UPDATE reviews SET ${setClauses} WHERE id = ?`)
      .bind(...params)
      .run()

    if (!result.success) return NextResponse.json({ error: "Update failed" }, { status: 500 })

    // Fetch updated row
    const updated = await d1.prepare("SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.id = ?")
      .bind(id)
      .first()

    return NextResponse.json({ review: normalizeReview(updated || { id }) })
  } catch (error) {
    console.error("Reviews PATCH error:", error)
    return NextResponse.json({ error: "Failed to update review", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Review ID required" }, { status: 400 })
    await sql`DELETE FROM reviews WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reviews DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}
