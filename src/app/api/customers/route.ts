import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const phone = searchParams.get("phone")

    if (phone) {
      const rows = await sql`SELECT * FROM customers WHERE phone = ${phone}`
      return NextResponse.json({ customers: rows })
    }

    const rows = await sql`SELECT * FROM customers ORDER BY created_at DESC`
    return NextResponse.json({ customers: rows })
  } catch (error) {
    console.error("Customers GET error:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    const [customer] = await sql`
      UPDATE customers SET
        name = COALESCE(${updates.name ?? null}, name),
        email = COALESCE(${updates.email ?? null}, email),
        vip = COALESCE(${updates.vip ?? null}, vip),
        flex100 = COALESCE(${updates.flex100 ?? null}, flex100)
      WHERE id = ${id}::uuid
      RETURNING *
    `
    return NextResponse.json({ customer })
  } catch (error) {
    console.error("Customers PATCH error:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}
