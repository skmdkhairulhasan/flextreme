import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params

    const res = await fetch(`${process.env.CLOUDFLARE_API_BASE_URL}/api/products/${slug}`)

    const data = await res.json()

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    )
  }
}