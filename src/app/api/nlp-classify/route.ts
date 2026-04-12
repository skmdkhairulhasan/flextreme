import { NextRequest, NextResponse } from "next/server"
import { classifyIntent } from "@/lib/flex-nlp/trainer"

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message) return NextResponse.json({ intent: null, score: 0 })
    const result = await classifyIntent(message)
    return NextResponse.json(result ?? { intent: null, score: 0 })
  } catch {
    return NextResponse.json({ intent: null, score: 0 })
  }
}
