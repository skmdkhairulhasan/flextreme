import { NextRequest } from "next/server"
import { proxyToWorker } from "@/lib/api/proxy"

export async function GET(request: NextRequest) {
  return proxyToWorker(request, `/api/settings${request.nextUrl.search || ""}`)
}
