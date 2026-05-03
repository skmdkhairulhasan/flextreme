import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

async function recalculateCustomerStats(phone: string) {
  const [stats] = await sql`
    SELECT COUNT(*) as total_orders, COALESCE(SUM(total_price), 0) as total_spent
    FROM orders
    WHERE phone = ${phone} AND status IN ('confirmed','processing','shipped','delivered')
  `
  await sql`
    UPDATE customers SET
      total_orders = ${parseInt(stats.total_orders)},
      total_spent = ${parseFloat(stats.total_spent)}
    WHERE phone = ${phone}
  `
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const productId = searchParams.get("product_id")
    const status = searchParams.get("status")
    const phone = searchParams.get("phone")

    let rows
    if (phone) {
      rows = await sql`SELECT * FROM orders WHERE phone = ${phone} ORDER BY created_at DESC`
    } else if (productId && status) {
      // D1: filter by status in JS after fetching by product_id
      rows = await sql`SELECT * FROM orders WHERE product_id = ${productId} ORDER BY created_at DESC`
      if (status !== "all") {
        const statuses = status.split(",")
        rows = (rows as any[]).filter((r: any) => statuses.includes(r.status))
      }
    } else if (productId) {
      rows = await sql`SELECT * FROM orders WHERE product_id = ${productId} ORDER BY created_at DESC`
    } else if (status) {
      const statuses = status.split(",")
      rows = await sql`SELECT * FROM orders WHERE status IN ('pending','confirmed','processing','shipped','delivered','cancelled') ORDER BY created_at DESC`
    } else {
      rows = await sql`SELECT * FROM orders ORDER BY created_at DESC`
    }

    return NextResponse.json({ orders: rows })
  } catch (error) {
    console.error("Orders GET error:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const productId = body.product_id ?? null

    // Split into two queries to avoid nested sql`` template (not supported by neon)
    const [order] = productId
      ? await sql`
          INSERT INTO orders (
            name, phone, email, address, product_id, product_name,
            size, color, quantity, total_price, status, notes, tracking_url
          ) VALUES (
            ${body.customer_name || body.name},
            ${body.phone}, ${body.email ?? null}, ${body.address ?? null},
            ${productId},
            ${body.product_name ?? null}, ${body.size ?? null}, ${body.color ?? null},
            ${body.quantity || 1}, ${body.total_price || 0},
            ${body.status || "pending"}, ${body.notes || ""}, ${body.tracking_url ?? null}
          )
          RETURNING *
        `
      : await sql`
          INSERT INTO orders (
            name, phone, email, address, product_name,
            size, color, quantity, total_price, status, notes, tracking_url
          ) VALUES (
            ${body.customer_name || body.name},
            ${body.phone}, ${body.email ?? null}, ${body.address ?? null},
            ${body.product_name ?? null}, ${body.size ?? null}, ${body.color ?? null},
            ${body.quantity || 1}, ${body.total_price || 0},
            ${body.status || "pending"}, ${body.notes || ""}, ${body.tracking_url ?? null}
          )
          RETURNING *
        `

    // Auto-create customer if doesn't exist
    const existing = await sql`SELECT id FROM customers WHERE phone = ${body.phone}`
    if (existing.length === 0) {
      const count = await sql`SELECT COUNT(*) as c FROM customers`
      await sql`
        INSERT INTO customers (name, phone, email, flex100)
        VALUES (${body.customer_name || body.name}, ${body.phone}, ${body.email ?? null}, ${parseInt(count[0].c) < 100})
      `
    }

    await recalculateCustomerStats(body.phone)
    return NextResponse.json({ order })
  } catch (error) {
    console.error("Orders POST error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    const [oldOrder] = await sql`SELECT phone FROM orders WHERE id = ${id}`
    const [order] = await sql`
      UPDATE orders SET
        name = COALESCE(${updates.name ?? null}, name),
        phone = COALESCE(${updates.phone ?? null}, phone),
        status = COALESCE(${updates.status ?? null}, status),
        notes = COALESCE(${updates.notes ?? null}, notes),
        tracking_url = COALESCE(${updates.tracking_url ?? null}, tracking_url),
        address = COALESCE(${updates.address ?? null}, address),
        updated_at = datetime('now')
      WHERE id = ${id}
      RETURNING *
    `
    if (oldOrder) await recalculateCustomerStats(oldOrder.phone)
    if (updates.phone && updates.phone !== oldOrder?.phone) await recalculateCustomerStats(updates.phone)
    return NextResponse.json({ order })
  } catch (error) {
    console.error("Orders PATCH error:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Order ID required" }, { status: 400 })
    const [order] = await sql`SELECT phone FROM orders WHERE id = ${id}`
    await sql`DELETE FROM orders WHERE id = ${id}`
    if (order) await recalculateCustomerStats(order.phone)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Orders DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
  }
}
