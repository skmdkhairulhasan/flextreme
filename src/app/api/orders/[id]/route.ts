import { NextRequest } from "next/server"
import { proxyToWorker } from "@/lib/api/proxy"

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params
  return proxyToWorker(request, `/api/orders/${encodeURIComponent(id)}`)
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params
  return proxyToWorker(request, `/api/orders/${encodeURIComponent(id)}`)
}
