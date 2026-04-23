import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const res = await fetch(`${process.env.CLOUDFLARE_API_BASE_URL}/api/orders/${id}`)

    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json()

    const res = await fetch(`${process.env.CLOUDFLARE_API_BASE_URL}/api/orders/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const res = await fetch(`${process.env.CLOUDFLARE_API_BASE_URL}/api/orders/${id}`, {
      method: "DELETE",
    })

    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    )
  }
}