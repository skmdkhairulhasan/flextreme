import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const phone = body.phone || body.customer_phone

    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 })
    }

    const orders = await sql`
      SELECT *
      FROM orders
      WHERE phone = ${phone}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      found: orders.length > 0,
      orders,
    })
  } catch (error) {
    console.error("Order lookup POST error:", error)
    return NextResponse.json(
      { error: "Failed to lookup orders" },
      { status: 500 }
    )
  }
}
