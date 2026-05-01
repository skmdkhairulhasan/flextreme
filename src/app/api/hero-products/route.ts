import { NextResponse } from "next/server"
import initialHeroProducts from "../../../../data/hero-products.json"

type HeroProduct = {
  image: string
  label: string
  slug: string
  color?: string
  circleColor?: string
  glowEnabled?: boolean
  glowPulse?: boolean
}

type HeroProductsPayload = {
  products: HeroProduct[]
}

let heroProducts: HeroProductsPayload = initialHeroProducts as HeroProductsPayload

export async function GET() {
  return NextResponse.json(heroProducts)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.products || !Array.isArray(body.products)) {
      return NextResponse.json(
        { success: false, error: "Invalid data format" },
        { status: 400 }
      )
    }

    heroProducts = { products: body.products }

    return NextResponse.json({ success: true, message: "Products saved successfully" })
  } catch (error) {
    console.error("Failed to save products:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save products" },
      { status: 500 }
    )
  }
}
