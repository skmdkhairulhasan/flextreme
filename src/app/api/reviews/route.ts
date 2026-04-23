import { NextRequest } from "next/server"

const API_BASE = process.env.CLOUDFLARE_API_BASE_URL!

export async function GET(request: NextRequest) {
  const res = await fetch(`${API_BASE}/api/reviews${request.nextUrl.search || ""}`)

  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()

  const res = await fetch(`${API_BASE}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })

  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}