import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone") || ""
  if (!phone) return NextResponse.json({ flex100: false, name: "" })
  const supabase = await createClient()
  const { data } = await supabase
    .from("customers")
    .select("flex100, name")
    .eq("phone", phone)
    .single()
  return NextResponse.json({ flex100: data?.flex100 === true, name: data?.name || "" })
}
