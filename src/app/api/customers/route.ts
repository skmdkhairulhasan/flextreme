import { NextRequest, NextResponse } from "next/server"
import { customers } from "@/lib/data/orders"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get("phone")

    if (phone) {
      const customer = customers.find(c => c.phone === phone)
      return NextResponse.json({ customer: customer || null })
    }

    // Sort by total_spent descending
    const sorted = [...customers].sort((a, b) => b.total_spent - a.total_spent)
    return NextResponse.json({ customers: sorted })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newCustomer = {
      id: crypto.randomUUID(),
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      address: body.address || null,
      flex100: body.flex100 || false,
      vip: body.vip || false,
      total_orders: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
    }

    customers.push(newCustomer)

    return NextResponse.json({ customer: newCustomer })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, ...updates } = body

    const customerIndex = customers.findIndex(c => c.phone === phone)

    if (customerIndex === -1) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    customers[customerIndex] = {
      ...customers[customerIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({ customer: customers[customerIndex] })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get("phone")

    if (!phone) {
      return NextResponse.json(
        { error: "Phone required" },
        { status: 400 }
      )
    }

    const customerIndex = customers.findIndex(c => c.phone === phone)

    if (customerIndex === -1) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    customers.splice(customerIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    )
  }
}
