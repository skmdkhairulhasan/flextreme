import { NextRequest, NextResponse } from "next/server"

const logisticsCosts: any[] = []

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("order_id")
    
    if (orderId) {
      const cost = logisticsCosts.find(c => c.order_id === orderId)
      return NextResponse.json({ cost: cost || null })
    }
    
    return NextResponse.json({ costs: logisticsCosts })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch costs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newCost = {
      id: crypto.randomUUID(),
      order_id: body.order_id,
      delivery_charge: body.delivery_charge || 0,
      travel_cost: body.travel_cost || 0,
      cod_tax: body.cod_tax || 0,
      other_costs: body.other_costs || 0,
      notes: body.notes || "",
      created_at: new Date().toISOString()
    }
    logisticsCosts.push(newCost)
    return NextResponse.json({ cost: newCost })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create cost" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, order_id, ...updates } = body
    
    let index = -1
    if (id) {
      index = logisticsCosts.findIndex(c => c.id === id)
    } else if (order_id) {
      index = logisticsCosts.findIndex(c => c.order_id === order_id)
    }
    
    if (index === -1) {
      return NextResponse.json({ error: "Cost not found" }, { status: 404 })
    }
    
    logisticsCosts[index] = {
      ...logisticsCosts[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json({ cost: logisticsCosts[index] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update cost" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }
    
    const index = logisticsCosts.findIndex(c => c.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "Cost not found" }, { status: 404 })
    }
    
    logisticsCosts.splice(index, 1)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete cost" }, { status: 500 })
  }
}
