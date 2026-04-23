import { NextRequest } from "next/server"
import { proxyToWorker } from "@/lib/api/proxy"

export async function GET(request: NextRequest) {
  return proxyToWorker(request, `/api/reviews${request.nextUrl.search || ""}`)
}

export async function POST(request: NextRequest) {
  return proxyToWorker(request, "/api/reviews")
}
