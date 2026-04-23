import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${process.env.CLOUDFLARE_API_BASE_URL}/api/products`)
    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}