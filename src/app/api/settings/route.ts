import { NextResponse, NextRequest } from "next/server"
import sql from "@/lib/db"

export async function GET() {
  try {
    const rows = await sql`SELECT key, value FROM settings ORDER BY key`
    return NextResponse.json({ settings: rows })
  } catch (error) {
    console.error("Settings GET error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.settings && Array.isArray(body.settings)) {
      for (const s of body.settings) {
        await sql`
          INSERT INTO settings (key, value) VALUES (${s.key}, ${s.value})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `
      }
      const rows = await sql`SELECT key, value FROM settings ORDER BY key`
      return NextResponse.json({ success: true, settings: rows })
    }

    const { key, value } = body
    if (!key) return NextResponse.json({ error: "Setting key required" }, { status: 400 })

    await sql`
      INSERT INTO settings (key, value) VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `
    return NextResponse.json({ success: true, setting: { key, value } })
  } catch (error) {
    console.error("Settings POST error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  return POST(request)
}
