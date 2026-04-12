import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message) return NextResponse.json({ reply: "Please send a message." })

    const supabase = await createClient()
    const msg = message.toLowerCase().trim()

    // Order lookup
    if (/\d{10,13}/.test(message.replace(/\D/g, ""))) {
      const phone = message.replace(/\D/g, "")
      const { data } = await supabase.from("orders").select("*")
        .or(`phone.eq.${phone},phone.eq.0${phone.slice(-10)}`)
        .order("created_at", { ascending: false }).limit(5)
      if (data && data.length > 0) {
        const reply = "📦 Your recent orders:\n\n" + data.map((o: any, i: number) =>
          `ORDER ${i+1}\nProduct: ${o.product_name}\n🔘 STATUS: ${(o.status||"pending").toUpperCase()}\nQty: ${o.quantity} | Size: ${o.size} | Color: ${o.color}`
        ).join("\n\n") + "\n\nNeed help? WhatsApp: +8801935962421"
        return NextResponse.json({ reply })
      }
      return NextResponse.json({ reply: "❌ No orders found for that number. Check the number or WhatsApp us: +8801935962421" })
    }

    // Delivery
    const { data: settings } = await supabase.from("settings").select("key,value")
    const s: Record<string,string> = {}
    ;(settings || []).forEach((r: any) => s[r.key] = r.value)
    if (msg.includes("delivery") || msg.includes("charge") || msg.includes("shipping")) {
      if (s.free_delivery === "true") return NextResponse.json({ reply: "🚚 FREE DELIVERY nationwide!\n\nWe deliver across all Bangladesh for FREE.\n✓ Cash on Delivery\n✓ Pay when it arrives\n✓ Zero advance" })
      return NextResponse.json({ reply: "Check our delivery page for charges: /delivery" })
    }

    return NextResponse.json({ reply: null }) // fall through to client-side getReply
  } catch {
    return NextResponse.json({ reply: "Something went wrong. Please try again." })
  }
}
