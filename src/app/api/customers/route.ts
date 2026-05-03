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

    if (!id) return NextResponse.json({ error: "Customer ID required" }, { status: 400 })

    const [customer] = await sql`
      UPDATE customers SET
        name     = COALESCE(${updates.name     ?? null}, name),
        email    = COALESCE(${updates.email    ?? null}, email),
        phone    = COALESCE(${updates.phone    ?? null}, phone),
        vip      = COALESCE(${updates.vip      ?? null}, vip),
        flex100  = COALESCE(${updates.flex100  ?? null}, flex100)
      WHERE id = ${id}
      RETURNING *
    `

    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    return NextResponse.json({ customer })
  } catch (error) {
    console.error("Customers PATCH error:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "Customer ID required" }, { status: 400 })

    const rows = await sql`DELETE FROM customers WHERE id = ${id} RETURNING id`
    if (rows.length === 0) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Customers DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
