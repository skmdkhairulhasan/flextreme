import { NextRequest } from "next/server"

const API_BASE = process.env.CLOUDFLARE_API_BASE_URL!

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const res = await fetch(`${API_BASE}/api/products/${params.slug}`)

  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}