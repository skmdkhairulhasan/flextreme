import { NextRequest } from "next/server"

const API_BASE = process.env.CLOUDFLARE_API_BASE_URL!

export async function GET() {
  const res = await fetch(`${API_BASE}/api/stats`)

  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}