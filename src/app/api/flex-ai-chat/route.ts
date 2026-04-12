import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function smart(raw: string) {
  return raw.toLowerCase()
    .replace(/[?!.,;:'"]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/gonna/g, "going to").replace(/wanna/g, "want to")
    .replace(/\bu\b/g, "you").replace(/\bpls\b|\bplz\b/g, "please")
    .replace(/\bmbi\b|\bbim\b/g, "bmi")
    .replace(/workut|workoit/g, "workout")
    .trim()
}

function has(msg: string, words: string[]) {
  return words.some(w => msg.includes(w))
}

function calcBMI(w: number, h: number) { return w / Math.pow(h / 100, 2) }

export async function POST(req: NextRequest) {
  try {
    const { message, profile: profileData } = await req.json()
    if (!message) return NextResponse.json({ reply: "Please send a message." })

    const msg = smart(message)
    const supabase = await createClient()

    // ── ORDER LOOKUP ──
    const digits = message.replace(/\D/g, "")
    if (digits.length >= 10) {
      const local = digits.startsWith("0") ? digits : "0" + digits.slice(-10)
      const withCountry = "88" + local.replace(/^0/, "")
      const { data } = await supabase.from("orders").select("*")
        .or(`phone.eq.${digits},phone.eq.${local},phone.eq.${withCountry}`)
        .order("created_at", { ascending: false }).limit(5)
      if (data && data.length > 0) {
        const reply = "📦 Your recent orders:\n\n" + data.map((o: any, i: number) => {
          const emoji = o.status==="delivered"?"✅":o.status==="shipped"?"🚚":o.status==="confirmed"?"✓":"⏳"
          return `ORDER ${i+1}\nProduct: ${o.product_name}\n🔘 STATUS: ${emoji} ${(o.status||"pending").toUpperCase()}\nQty: ${o.quantity} | Size: ${o.size} | Color: ${o.color}`
        }).join("\n\n") + "\n\nNeed help? WhatsApp: +8801935962421"
        return NextResponse.json({ reply })
      }
      if (digits.length >= 10) return NextResponse.json({ reply: "❌ No orders found for that number.\n\nCheck the number or WhatsApp: +8801935962421" })
    }

    // ── ORDER TRACKING INTENT ──
    const orderWords = ["order","parcel","package","shipment","delivery status"]
    const actionWords = ["track","find","check","where","status","lookup","show","tell"]
    if (orderWords.some(w=>msg.includes(w)) && actionWords.some(w=>msg.includes(w)) || msg.includes("my order") || msg.includes("find my order") || msg.includes("track my order")) {
      return NextResponse.json({ reply: "Sure! Send me the phone number you used when placing your order and I'll check it right away. 📦" })
    }

    // ── SETTINGS ──
    const { data: settings } = await supabase.from("settings").select("key,value")
    const s: Record<string,string> = {}
    ;(settings || []).forEach((r: any) => s[r.key] = r.value)

    // ── DELIVERY ──
    if (has(msg, ["delivery","charge","shipping","how long","arrive","days"])) {
      if (s.free_delivery === "true") {
        return NextResponse.json({ reply: "🚚 FREE DELIVERY nationwide!\n\nWe deliver across all Bangladesh for FREE.\n✓ Cash on Delivery — pay when it arrives\n✓ Zero advance payment\n\nEstimated times:\n🏙️ Khulna City: 1-2 days\n🗺️ Near Khulna: 2-3 days\n🇧🇩 All Bangladesh: 3-5 days" })
      }
      return NextResponse.json({ reply: "Check our delivery page for charges and times: /delivery\n\nWe ship from Khulna. Cash on Delivery — pay when it arrives. 🚚" })
    }

    // ── PRODUCTS ──
    if (has(msg, ["product","show","browse","tops","shirt","compression","what do you sell","collection","buy","shop"])) {
      const { data: products } = await supabase.from("products").select("name,price,slug").eq("in_stock", true).limit(5)
      if (products && products.length > 0) {
        const list = products.map((p:any) => `👕 ${p.name} — BDT ${p.price}\n   → /products/${p.slug}`).join("\n\n")
        return NextResponse.json({ reply: "Here's our collection:\n\n" + list + "\n\nAll sweat-wicking, 4-way stretch compression fit. 🔥\n\nVisit: /products" })
      }
      return NextResponse.json({ reply: "Check our full collection at /products 👕\n\nAll Flextreme gear is compression fit, sweat-wicking, built for real athletes." })
    }

    // ── SIZE ──
    if (has(msg, ["size","fit","measurement","chest","width","what size","which size"])) {
      if (/\d{2,3}/.test(msg)) {
        const nums = [...msg.matchAll(/(\d{2,3})/g)].map(m => parseInt(m[1]))
        const n = nums[0]
        const isInch = msg.includes("inch") || msg.includes('"')
        const cm = isInch ? Math.round(n * 2.54) : n
        let size = "XL"
        if (cm <= 33) size = "M"
        else if (cm <= 35) size = "L"
        return NextResponse.json({ reply: `Based on ${cm}cm measurement:\n\nRecommended size: **${size}**\n\n💡 Our tops are compression fit — go 1 size down for skin-tight feel.\n\nVisit /size-guide for full measurements 📏` })
      }
      return NextResponse.json({ reply: "SIZE GUIDE — Compression Top (cm)\n\nM: Length 63cm | Width 33cm\nL: Length 65cm | Width 35cm\nXL: Length 68cm | Width 38cm\n\n💡 Compression fit stretches 20-30%. Go 1 size smaller for skin-tight feel.\n\nTell me your chest/width measurement and I'll recommend your size! 📏" })
    }

    // ── INJURY ──
    const bodyParts = ["knee","back","shoulder","wrist","ankle","elbow","hip","neck"]
    const painWords = ["pain","injury","hurt","sore","ache","sprain"]
    if (bodyParts.some(b=>msg.includes(b)) && painWords.some(p=>msg.includes(p)) || msg.includes("i have") && painWords.some(p=>msg.includes(p))) {
      const area = bodyParts.find(b=>msg.includes(b)) || "injured area"
      const advice: Record<string,string> = {
        knee: "Knee injury — avoid squats, lunges, leg press.\n\n✓ Upper body focus\n✓ Swimming/cycling (low impact)\n✓ Hip thrusts\n\nIce 15min after training. See a physio if pain is sharp.",
        back: "Back injury — no deadlifts, heavy squats, rowing.\n\n✓ Chest, arms, shoulders (seated)\n✓ Light walking\n✓ Core bracing (no crunches)\n\nDon't push through back pain. See a physio.",
        shoulder: "Shoulder injury — avoid overhead press, bench press.\n\n✓ Legs, core, cardio\n✓ Resistance band rotations\n\nRest, ice, physio. Shoulder injuries worsen if ignored.",
        wrist: "Wrist issue — avoid barbell pressing, push-ups.\n\n✓ Legs (squats, leg press)\n✓ Cardio (bike, treadmill)\n\nWrist wraps help. Let it rest.",
      }
      return NextResponse.json({ reply: advice[area] || `${area} injury — rest it, ice it, see a physio if it persists. Focus on unaffected muscle groups in the meantime.` })
    }

    // ── SUPPLEMENTS ──
    if (has(msg, ["supplement","protein","creatine","whey","bcaa","pre workout","vitamin"])) {
      return NextResponse.json({ reply: "SUPPLEMENT GUIDE\n\nESSENTIAL (worth every taka):\n✓ Whey Protein — 25-30g post workout\n✓ Creatine Monohydrate — 5g daily (#1 proven)\n✓ Multivitamin — with breakfast\n✓ Fish Oil Omega-3 — 2-3g daily\n\nSKIP THESE:\n✗ Fat burners — mostly caffeine + marketing\n✗ Testosterone boosters — almost never work\n✗ BCAA — useless if taking protein\n\nTruth: Sleep + food > every supplement. Fix those first." })
    }

    // ── BMI ──
    if (has(msg, ["bmi","body mass","calculate","calorie","tdee","overweight"])) {
      return NextResponse.json({ reply: "To calculate your BMI, tell me:\n1. Your height in cm (e.g. 175)\n2. Your weight in kg (e.g. 75)\n\nExample: 'I am 175cm and 75kg'\n\nOr visit our Flex AI chat for a full fitness profile! 💪" })
    }

    // ── BMI with numbers ──
    const heightMatch = msg.match(/(\d{2,3})\s*cm/)
    const weightMatch = msg.match(/(\d{2,3})\s*kg/)
    if (heightMatch && weightMatch) {
      const h = parseInt(heightMatch[1]), w = parseInt(weightMatch[1])
      if (h > 100 && h < 250 && w > 30 && w < 300) {
        const bmi = calcBMI(w, h)
        const cat = bmi < 18.5 ? "🟡 Underweight" : bmi < 25 ? "🟢 Normal Weight" : bmi < 30 ? "🟡 Overweight" : "🔴 Obese"
        return NextResponse.json({ reply: `BMI: ${bmi.toFixed(1)} — ${cat}\n\nHeight: ${h}cm | Weight: ${w}kg\n\nFor a full plan with TDEE, protein targets, and diet chart, use the full Flex AI fitness profile!` })
      }
    }

    // ── WORKOUT ──
    if (has(msg, ["workout","gym","exercise","training","routine","plan","lift","muscle","build","gain","fit"])) {
      return NextResponse.json({ reply: "WORKOUT PLAN\n\nFor a personalized plan I need your:\n• Height, weight, age\n• Goal (lose fat / build muscle / maintain)\n• Activity level\n\nTell me these or say 'build my full plan' for a complete fitness profile! 💪\n\nExample split:\n📅 Mon/Thu — Push (chest, shoulders, triceps)\n📅 Tue/Fri — Pull (back, biceps)\n📅 Wed/Sat — Legs\n📅 Sun — Rest" })
    }

    // ── DIET ──
    if (has(msg, ["diet","meal","food","eat","nutrition","calorie","protein","carb"])) {
      return NextResponse.json({ reply: "DIET PLAN\n\nFor a personalized diet I need your:\n• Height, weight, age\n• Goal (lose fat / build muscle / maintain)\n• Diet type (Halal, vegetarian, vegan, etc.)\n\nSay 'build my full plan' for a complete profile!\n\n🥗 General tips:\n• Eat every 3-4 hours\n• 1.6-2.2g protein per kg bodyweight\n• 3-4L water daily\n• Prioritize whole foods over supplements" })
    }

    // ── BRAND ──
    if (msg.includes("flextreme") || has(msg, ["brand","about","story","who are you","what is this"])) {
      return NextResponse.json({ reply: (s.about_story || "Flextreme is a premium gym wear brand from Bangladesh, built by athletes for athletes. We create compression gear that performs as good as it looks.") + "\n\nWork Hard. Flex Extreme. 🔥\n\nSee our products: /products" })
    }

    // ── GREETING ──
    if (has(msg, ["hi","hello","hey","how are you","howdy","good morning","good evening"])) {
      return NextResponse.json({ reply: "Hey! 👋 I'm Flex — your AI fitness & shopping assistant.\n\nI can help with:\n🚚 Order tracking\n💪 Workout plans\n🥗 Diet charts\n📊 BMI calculator\n📏 Size guide\n💊 Supplements\n👕 Products\n\nWhat do you need?" })
    }

    // ── MOTIVATION ──
    if (has(msg, ["motivat","inspire","lazy","tired","give up","hard","difficult"])) {
      return NextResponse.json({ reply: "Discipline > motivation. Motivation comes and goes. Discipline stays.\n\nYou don't wait to feel like it. You show up anyway. That's the difference.\n\n**Work Hard. Flex Extreme. 🔥**\n\nNow — workout plan or diet chart?" })
    }

    // ── CONTACT ──
    if (has(msg, ["contact","whatsapp","phone","email","support","help me"])) {
      return NextResponse.json({ reply: "📞 Contact Flextreme:\n\nWhatsApp: +8801935962421\nEmail: flextremefit@gmail.com\n\nAvailable 9am-9pm daily.\n\nOr use the green WhatsApp button on any page." })
    }

    // ── GYM GEAR ──
    if (has(msg, ["gear","cloth","wear","outfit","what to wear","gym outfit","compression","attire"])) {
      return NextResponse.json({ reply: "GYM WEAR GUIDE by Flextreme\n\nLifting:\n→ Compression top + shorts\n→ Flat-soled shoes (not running shoes)\n\nCardio/HIIT:\n→ Lightweight compression tee\n→ Cushioned running shoes\n\nAlways choose:\n→ Sweat-wicking (never cotton)\n→ 4-way stretch\n→ Compression fit\n\nFlextreme checks every box 🔥 → /products" })
    }

    // ── RECOVERY ──
    if (has(msg, ["recovery","rest","sleep","sore","doms","rest day"])) {
      return NextResponse.json({ reply: "RECOVERY GUIDE\n\nMuscles grow during recovery, not training.\n\n→ 7-9 hours sleep (non-negotiable)\n→ Beginners: 2-3 rest days/week\n→ Intermediate: 1-2 rest days\n→ Advanced: min 1 day\n\nActive recovery: 20-30 min walk, stretch, foam roll.\n\nSleep is your most powerful supplement. 🌙" })
    }

    // Default
    return NextResponse.json({ reply: "I can help with:\n\n🚚 Track your order\n💪 Workout plans\n🥗 Diet charts\n📊 BMI calculator\n📏 Size guide\n💊 Supplements\n🚛 Delivery info\n👕 Products\n\nWhat do you need? Just ask!" })

  } catch {
    return NextResponse.json({ reply: "Something went wrong. Try again or WhatsApp us: +8801935962421" })
  }
}
