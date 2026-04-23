import { NextRequest } from "next/server"

const API_BASE = process.env.CLOUDFLARE_API_BASE_URL!

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params

  const res = await fetch(`${API_BASE}/api/products/${slug}`)

  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}