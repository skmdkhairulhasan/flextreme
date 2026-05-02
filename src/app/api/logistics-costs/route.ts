import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

type LogisticsCost = {
  id: string
  order_id: string
  delivery_charge: number
  travel_cost: number
  cod_tax: number
  other_costs: number
  notes: string
  created_at: string
  updated_at?: string
}

const LOGISTICS_KEY = "logistics_costs"
const DELIVERY_GROUPS_KEY = "delivery_groups"

function parseJson(value: string | null | undefined, fallback: any) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

async function readSetting(key: string) {
  const rows = await sql`SELECT value FROM settings WHERE key = ${key} LIMIT 1`
  return rows[0]?.value as string | undefined
}

async function saveCosts(costs: LogisticsCost[]) {
  await sql`
    INSERT INTO settings (key, value)
    VALUES (${LOGISTICS_KEY}, ${JSON.stringify(costs)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("order_id")
    const [costsValue, deliveryGroupsValue] = await Promise.all([
      readSetting(LOGISTICS_KEY),
      readSetting(DELIVERY_GROUPS_KEY),
    ])
    const costs: LogisticsCost[] = parseJson(costsValue, [])
    const deliveryGroups = parseJson(deliveryGroupsValue, [])

    if (orderId) {
      const cost = costs.find(c => c.order_id === orderId)
      return NextResponse.json({ cost: cost || null, delivery_groups: deliveryGroups })
    }

    return NextResponse.json({ costs, delivery_groups: deliveryGroups })
  } catch (error) {
    console.error("Logistics costs GET error:", error)
    return NextResponse.json({ error: "Failed to fetch costs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const costs: LogisticsCost[] = parseJson(await readSetting(LOGISTICS_KEY), [])
    const existingIndex = costs.findIndex(c => c.order_id === body.order_id)
    const now = new Date().toISOString()
    const cost: LogisticsCost = {
      id: costs[existingIndex]?.id || crypto.randomUUID(),
      order_id: body.order_id,
      delivery_charge: Number(body.delivery_charge || 0),
      travel_cost: Number(body.travel_cost || 0),
      cod_tax: Number(body.cod_tax || 0),
      other_costs: Number(body.other_costs || 0),
      notes: body.notes || "",
      created_at: costs[existingIndex]?.created_at || now,
      updated_at: now,
    }

    if (existingIndex >= 0) costs[existingIndex] = cost
    else costs.push(cost)

    await saveCosts(costs)
    return NextResponse.json({ cost })
  } catch (error) {
    console.error("Logistics costs POST error:", error)
    return NextResponse.json({ error: "Failed to create cost" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, order_id, ...updates } = body
    const costs: LogisticsCost[] = parseJson(await readSetting(LOGISTICS_KEY), [])

    const index = id
      ? costs.findIndex(c => c.id === id)
      : costs.findIndex(c => c.order_id === order_id)

    if (index === -1) {
      return NextResponse.json({ error: "Cost not found" }, { status: 404 })
    }

    costs[index] = {
      ...costs[index],
      ...updates,
      delivery_charge: Number(updates.delivery_charge ?? costs[index].delivery_charge ?? 0),
      travel_cost: Number(updates.travel_cost ?? costs[index].travel_cost ?? 0),
      cod_tax: Number(updates.cod_tax ?? costs[index].cod_tax ?? 0),
      other_costs: Number(updates.other_costs ?? costs[index].other_costs ?? 0),
      updated_at: new Date().toISOString(),
    }

    await saveCosts(costs)
    return NextResponse.json({ cost: costs[index] })
  } catch (error) {
    console.error("Logistics costs PATCH error:", error)
    return NextResponse.json({ error: "Failed to update cost" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const orderId = searchParams.get("order_id")

    if (!id && !orderId) {
      return NextResponse.json({ error: "ID or order ID required" }, { status: 400 })
    }

    const costs: LogisticsCost[] = parseJson(await readSetting(LOGISTICS_KEY), [])
    const next = costs.filter(c => id ? c.id !== id : c.order_id !== orderId)

    if (next.length === costs.length) {
      return NextResponse.json({ error: "Cost not found" }, { status: 404 })
    }

    await saveCosts(next)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logistics costs DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete cost" }, { status: 500 })
  }
}
