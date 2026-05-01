import { NextResponse, NextRequest } from "next/server"

// TEMP in-memory settings (same idea as products)
const settings = [
  { key: "footer_tagline", value: "Premium gym wear built for serious athletes" },
  { key: "whatsapp_number", value: "8801935962421" },
  { key: "instagram_url", value: "" },
  { key: "facebook_url", value: "" },
  { key: "banner_enabled", value: "false" },
  { key: "cursor_type", value: "logo" },
  { key: "store_name", value: "Flextreme" },
  { key: "store_email", value: "" },
  { key: "store_phone", value: "" },
  { key: "store_address", value: "" },
  { key: "hero_tagline", value: "Engineered for athletes who refuse to settle.\nBuilt for the gym. Made to be seen." },
  { key: "glow_enabled", value: "true" },
  { key: "glow_size", value: "520" },
  { key: "glow_opacity", value: "0.65" },
  { key: "glow_blur", value: "90" },
  { key: "glow_pulse", value: "false" },
  { key: "glow_color", value: "" },
  { key: "free_delivery_enabled", value: "false" },
  { key: "free_delivery_above", value: "0" },
  { key: "delivery_cities", value: '[{"name":"Dhaka","price":60},{"name":"Outside Dhaka","price":120}]' },
  { key: "promo_code", value: "" },
  { key: "promo_discount", value: "0" },
  { key: "promo_message", value: "" },
]

export async function GET() {
  try {
    return NextResponse.json({
      settings,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.settings && Array.isArray(body.settings)) {
      // Update all settings
      body.settings.forEach((newSetting: { key: string; value: string }) => {
        const existingIndex = settings.findIndex(s => s.key === newSetting.key)
        
        if (existingIndex !== -1) {
          // Update existing
          settings[existingIndex].value = newSetting.value
        } else {
          // Add new
          settings.push(newSetting)
        }
      })
      
      return NextResponse.json({ success: true, settings })
    }
    
    // Single setting update
    const { key, value } = body
    
    if (!key) {
      return NextResponse.json(
        { error: "Setting key required" },
        { status: 400 }
      )
    }
    
    const existingIndex = settings.findIndex(s => s.key === key)
    
    if (existingIndex !== -1) {
      settings[existingIndex].value = value
    } else {
      settings.push({ key, value })
    }
    
    return NextResponse.json({ success: true, setting: { key, value } })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  return POST(request)
}
