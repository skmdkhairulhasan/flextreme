import { NextRequest, NextResponse } from "next/server"
import { customers, orders, recalculateCustomerStats } from "@/lib/data/orders"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get("product_id")
    const status = searchParams.get("status")
    
    let filtered = [...orders]
    
    if (productId) {
      filtered = filtered.filter(o => o.product_id === productId)
    }
    
    if (status) {
      const statuses = status.split(",")
      filtered = filtered.filter(o => statuses.includes(o.status))
    }
    
    // Sort by created_at descending
    const sorted = filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({ orders: sorted })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newOrder = {
      id: crypto.randomUUID(),
      name: body.customer_name || body.name,
      phone: body.phone,
      email: body.email || null,
      address: body.address,
      product_id: body.product_id,
      product_name: body.product_name,
      size: body.size || null,
      color: body.color || null,
      quantity: body.quantity || 1,
      total_price: body.total_price,
      status: body.status || "pending",
      notes: body.notes || "",
      tracking_url: body.tracking_url || null,
      created_at: new Date().toISOString(),
    }

    orders.unshift(newOrder)

    // AUTO-CREATE CUSTOMER if doesn't exist
    const existingCustomer = customers.find(c => c.phone === newOrder.phone)
    if (!existingCustomer) {
      const newCustomer = {
        id: crypto.randomUUID(),
        name: newOrder.name,
        phone: newOrder.phone,
        email: newOrder.email,
        flex100: customers.length < 100, // First 100 get FLEX100
        vip: false,
        total_orders: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
      }
      customers.push(newCustomer)
    }

    // Recalculate customer stats
    recalculateCustomerStats(newOrder.phone)

    return NextResponse.json({ order: newOrder })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const orderIndex = orders.findIndex(o => o.id === id)

    if (orderIndex === -1) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const oldPhone = orders[orderIndex].phone
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Recalculate stats for old and new phone (if changed)
    recalculateCustomerStats(oldPhone)
    if (updates.phone && updates.phone !== oldPhone) {
      recalculateCustomerStats(updates.phone)
    }

    return NextResponse.json({ order: orders[orderIndex] })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update order" },
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
        { error: "Order ID required" },
        { status: 400 }
      )
    }

    const orderIndex = orders.findIndex(o => o.id === id)

    if (orderIndex === -1) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const phone = orders[orderIndex].phone
    orders.splice(orderIndex, 1)

    // Recalculate customer stats
    recalculateCustomerStats(phone)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    )
  }
}
