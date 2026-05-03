import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

async function checkCustomer(phone: string) {
  if (!phone) return null
  const rows = await sql`SELECT * FROM customers WHERE phone = ${phone} LIMIT 1`
  return rows[0] || null
}

// GET - used by checkout and OrderForm
export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get("phone")
    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 })
    const customer = await checkCustomer(phone.trim())
    return NextResponse.json({
      exists: Boolean(customer),
      customer,
      flex100: customer?.flex100 === 1 || customer?.flex100 === true,
      vip: customer?.vip === 1 || customer?.vip === true,
    })
  } catch (error) {
    console.error("Customer check GET error:", error)
    return NextResponse.json({ error: "Failed to check customer" }, { status: 500 })
  }
}

// POST - kept for backward compatibility
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const phone = body.phone || body.customer_phone
    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 })
    const customer = await checkCustomer(phone.trim())
    return NextResponse.json({
      exists: Boolean(customer),
      customer,
      flex100: customer?.flex100 === 1 || customer?.flex100 === true,
      vip: customer?.vip === 1 || customer?.vip === true,
    })
  } catch (error) {
    console.error("Customer check POST error:", error)
    return NextResponse.json({ error: "Failed to check customer" }, { status: 500 })
  }
}
