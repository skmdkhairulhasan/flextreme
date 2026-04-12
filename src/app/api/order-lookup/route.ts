import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone") || ""
  if (!phone) return NextResponse.json({ orders: [] })

  const supabase = await createClient()
  const digits = phone.replace(/\D/g, "")
  const local = digits.startsWith("0") ? digits : "0" + digits.slice(-10)
  const withCountry = "88" + local.replace(/^0/, "")
  const short = digits.slice(-10)

  const { data } = await supabase
    .from("orders")
    .select("*")
    .or(`phone.eq.${phone},phone.eq.${local},phone.eq.${withCountry},phone.eq.${short},phone.eq.0${short}`)
    .order("created_at", { ascending: false })
    .limit(5)

  return NextResponse.json({ orders: data || [] })
}
