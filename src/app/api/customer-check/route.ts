import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const phone = body.phone || body.customer_phone

    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 })
    }

    const rows = await sql`SELECT * FROM customers WHERE phone = ${phone} LIMIT 1`
    const customer = rows[0] || null

    return NextResponse.json({
      exists: Boolean(customer),
      customer,
      flex100: Boolean(customer?.flex100),
      vip: Boolean(customer?.vip),
    })
  } catch (error) {
    console.error("Customer check POST error:", error)
    return NextResponse.json(
      { error: "Failed to check customer" },
      { status: 500 }
    )
  }
}
