import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

async function recalculateCustomerStats(phone: string) {
  const counted = ["confirmed", "processing", "shipped", "delivered"]
  const [stats] = await sql`
    SELECT COUNT(*) as total_orders, COALESCE(SUM(total_price), 0) as total_spent
    FROM orders
    WHERE phone = ${phone} AND status = ANY(${counted})
  `
  await sql`
    UPDATE customers SET
      total_orders = ${parseInt(stats.total_orders)},
      total_spent = ${parseFloat(stats.total_spent)}
    WHERE phone = ${phone}
  `
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const rows = await sql`SELECT * FROM orders WHERE id = ${id}::uuid LIMIT 1`

    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order: rows[0] })
  } catch (error) {
    console.error("Order GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json()
    const [oldOrder] = await sql`SELECT phone FROM orders WHERE id = ${id}::uuid LIMIT 1`

    // Build update fields — handle product_id cast separately to avoid nested sql`` bug
    const productId = body.product_id ?? null

    const [order] = productId
      ? await sql`
          UPDATE orders SET
            name = COALESCE(${body.name ?? body.customer_name ?? null}, name),
            phone = COALESCE(${body.phone ?? null}, phone),
            email = COALESCE(${body.email ?? null}, email),
            address = COALESCE(${body.address ?? null}, address),
            product_id = ${productId}::uuid,
            product_name = COALESCE(${body.product_name ?? null}, product_name),
            size = COALESCE(${body.size ?? null}, size),
            color = COALESCE(${body.color ?? null}, color),
            quantity = COALESCE(${body.quantity ?? null}, quantity),
            total_price = COALESCE(${body.total_price ?? null}, total_price),
            status = COALESCE(${body.status ?? null}, status),
            notes = COALESCE(${body.notes ?? null}, notes),
            tracking_url = COALESCE(${body.tracking_url ?? null}, tracking_url),
            updated_at = NOW()
          WHERE id = ${id}::uuid
          RETURNING *
        `
      : await sql`
          UPDATE orders SET
            name = COALESCE(${body.name ?? body.customer_name ?? null}, name),
            phone = COALESCE(${body.phone ?? null}, phone),
            email = COALESCE(${body.email ?? null}, email),
            address = COALESCE(${body.address ?? null}, address),
            product_name = COALESCE(${body.product_name ?? null}, product_name),
            size = COALESCE(${body.size ?? null}, size),
            color = COALESCE(${body.color ?? null}, color),
            quantity = COALESCE(${body.quantity ?? null}, quantity),
            total_price = COALESCE(${body.total_price ?? null}, total_price),
            status = COALESCE(${body.status ?? null}, status),
            notes = COALESCE(${body.notes ?? null}, notes),
            tracking_url = COALESCE(${body.tracking_url ?? null}, tracking_url),
            updated_at = NOW()
          WHERE id = ${id}::uuid
          RETURNING *
        `

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (oldOrder?.phone) await recalculateCustomerStats(oldOrder.phone)
    if (body.phone && body.phone !== oldOrder?.phone) await recalculateCustomerStats(body.phone)

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Order PATCH error:", error)
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const [order] = await sql`DELETE FROM orders WHERE id = ${id}::uuid RETURNING phone`

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.phone) await recalculateCustomerStats(order.phone)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Order DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    )
  }
}
