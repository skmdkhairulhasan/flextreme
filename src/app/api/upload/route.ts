import { NextRequest } from "next/server"

const API_BASE = process.env.CLOUDFLARE_API_BASE_URL!

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: formData,
  })

  return new Response(await res.text(), {
    status: res.status,
  })
}