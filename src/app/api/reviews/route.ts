import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

function normalizeReview(row: any) {
  const status = row.approved ? "approved" : "pending"
  return {
    ...row,
    product_name: row.product_name || "",
    customer_location: row.customer_location || "",
    review_text: row.comment || "",
    photo_url: row.photo_url || null,
    status,
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")
    const productId = searchParams.get("product_id")
    const limitNumber = limit ? Math.max(1, parseInt(limit, 10) || 1) : null

    let rows

    if (productId && status === "approved" && limitNumber) {
      rows = await sql`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.product_id = ${productId}::uuid AND r.approved = true
        ORDER BY r.created_at DESC
        LIMIT ${limitNumber}
      `
    } else if (productId && status === "approved") {
      rows = await sql`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.product_id = ${productId}::uuid AND r.approved = true
        ORDER BY r.created_at DESC
      `
    } else if (productId && limitNumber) {
      rows = await sql`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.product_id = ${productId}::uuid
        ORDER BY r.created_at DESC
        LIMIT ${limitNumber}
      `
    } else if (productId) {
      rows = await sql`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.product_id = ${productId}::uuid
        ORDER BY r.created_at DESC
      `
    } else if (status === "approved" && limitNumber) {
      rows = await sql`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.approved = true
        ORDER BY r.created_at DESC
        LIMIT ${limitNumber}
      `
    } else if (status === "approved") {
      rows = await sql`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.approved = true
        ORDER BY r.created_at DESC
      `
    } else if (limitNumber) {
      rows = await sql`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        ORDER BY r.created_at DESC
        LIMIT ${limitNumber}
      `
    } else {
      rows = await sql`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        ORDER BY r.created_at DESC
      `
    }

    let reviews = rows.map(normalizeReview)
    if (status && status !== "approved") {
      reviews = reviews.filter((review: any) => review.status === status)
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("Reviews GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const [review] = await sql`
      INSERT INTO reviews (
        product_id, customer_name, phone, rating, comment, approved
      ) VALUES (
        ${body.product_id}::uuid,
        ${body.customer_name || body.name || ""},
        ${body.phone ?? null},
        ${body.rating || 5},
        ${body.comment || body.review_text || ""},
        ${body.status === "approved" || body.approved === true}
      )
      RETURNING *
    `

    return NextResponse.json({ review: normalizeReview({ ...review, product_name: body.product_name || "" }) })
  } catch (error) {
    console.error("Reviews POST error:", error)
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Review ID required" }, { status: 400 })
    }

    const approved =
      updates.status !== undefined
        ? updates.status === "approved"
        : updates.approved ?? null

    const [review] = await sql`
      UPDATE reviews SET
        customer_name = COALESCE(${updates.customer_name ?? null}, customer_name),
        phone = COALESCE(${updates.phone ?? null}, phone),
        rating = COALESCE(${updates.rating ?? null}, rating),
        comment = COALESCE(${updates.comment ?? updates.review_text ?? null}, comment),
        approved = COALESCE(${approved}, approved)
      WHERE id = ${id}::uuid
      RETURNING *
    `

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ review: normalizeReview(review) })
  } catch (error) {
    console.error("Reviews PATCH error:", error)
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Review ID required" },
        { status: 400 }
      )
    }

    const rows = await sql`DELETE FROM reviews WHERE id = ${id}::uuid RETURNING id`

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reviews DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    )
  }
}
