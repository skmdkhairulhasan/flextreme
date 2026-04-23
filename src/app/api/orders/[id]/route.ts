import { NextRequest } from "next/server"

const API_BASE = process.env.CLOUDFLARE_API_BASE_URL!

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.text()

  const res = await fetch(`${API_BASE}/api/orders/${params.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  })

  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}