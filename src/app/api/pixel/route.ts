import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Facebook Conversions API — server-side event tracking
// This mirrors browser pixel events server-side for better accuracy
// Especially important when users have ad blockers

function hashData(data: string): string {
  return crypto.createHash("sha256").update(data.toLowerCase().trim()).digest("hex")
}

export async function POST(req: NextRequest) {
  try {
    const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID
    const accessToken = process.env.FB_CONVERSIONS_API_TOKEN

    if (!pixelId || !accessToken) {
      return NextResponse.json({ skipped: true })
    }

    const { eventName, eventData, userData } = await req.json()

    // Build user data with hashed PII
    const user_data: Record<string, any> = {
      client_ip_address: req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "",
      client_user_agent: req.headers.get("user-agent") || "",
      fbp: userData?.fbp || "",  // Facebook browser ID cookie
      fbc: userData?.fbc || "",  // Facebook click ID
    }

    // Hash personal data if provided
    if (userData?.email) user_data.em = [hashData(userData.email)]
    if (userData?.phone) user_data.ph = [hashData(userData.phone.replace(/\D/g, ""))]
    if (userData?.name) {
      const parts = userData.name.trim().split(" ")
      user_data.fn = [hashData(parts[0])]
      if (parts.length > 1) user_data.ln = [hashData(parts.slice(1).join(" "))]
    }

    const payload = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: userData?.url || "",
        action_source: "website",
        user_data,
        custom_data: {
          currency: "BDT",
          value: eventData?.value || 0,
          ...eventData,
        },
      }],
      test_event_code: process.env.FB_TEST_EVENT_CODE || undefined,
    }

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    const result = await res.json()

    if (!res.ok) {
      console.error("FB Conversions API error:", result)
      return NextResponse.json({ error: result }, { status: 500 })
    }

    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error("Pixel API error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
