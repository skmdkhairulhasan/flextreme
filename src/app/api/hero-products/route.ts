import { NextResponse } from "next/server"
import sql from "@/lib/db"
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

function defaultProducts(): HeroProduct[] {
  const payload = initialHeroProducts as { products?: HeroProduct[] } | HeroProduct[]
  return Array.isArray(payload) ? payload : payload.products || []
}

function parseProducts(value: string | null | undefined): HeroProduct[] {
  if (!value) return defaultProducts()
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
    if (Array.isArray(parsed.products)) return parsed.products
  } catch {}
  return defaultProducts()
}

export async function GET() {
  try {
    const rows = await sql`SELECT value FROM settings WHERE key = ${"hero_products"} LIMIT 1`
    const products = parseProducts(rows[0]?.value)
    return NextResponse.json({ products })
  } catch (error) {
    console.error("Hero products GET error:", error)
    return NextResponse.json({ error: "Failed to fetch hero products" }, { status: 500 })
  }
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

    await sql`
      INSERT INTO settings (key, value)
      VALUES (${"hero_products"}, ${JSON.stringify(body.products)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `

    return NextResponse.json({ success: true, message: "Products saved successfully" })
  } catch (error) {
    console.error("Hero products POST error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save products" },
      { status: 500 }
    )
  }
}
