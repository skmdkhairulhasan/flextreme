import { NextRequest, NextResponse } from "next/server"
import type { Order, Product } from "@/types"
import { classifyText } from "@/lib/nlpClient"

// ── Helpers ──────────────────────────────────────────────────────────────────
function smart(raw: string) {
  return raw.toLowerCase()
    .replace(/[?!.,;:'"]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/gonna/g,"going to").replace(/wanna/g,"want to")
    .replace(/\bu\b/g,"you").replace(/\bpls\b|\bplz\b/g,"please")
    .replace(/\bmbi\b|\bbim\b|\bbim\b/g,"bmi").replace(/\bexcercise\b/g,"exercise")
    .replace(/\bworkut\b|\bworkoit\b/g,"workout")
    .trim()
}
function has(msg: string, words: string[]) { return words.some(w => msg.includes(w)) }
function calcBMI(w: number, h: number) { return w / Math.pow(h / 100, 2) }
function bmiCat(b: number) { return b < 18.5 ? "🟡 Underweight" : b < 25 ? "🟢 Normal Weight" : b < 30 ? "🟠 Overweight" : "🔴 Obese" }
function tdee(w: number, h: number, age: number, activity: number) {
  const bmr = 10 * w + 6.25 * h - 5 * age + 5
  const mult = [1.2, 1.375, 1.55, 1.725, 1.9][Math.min(activity - 1, 4)]
  return Math.round(bmr * mult)
}

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "")
}

function assignSettings(target: Record<string, string>, settings: Record<string, string> | { key: string; value: string }[] | undefined) {
  if (Array.isArray(settings)) {
    settings.forEach(setting => {
      if (setting.key) target[setting.key] = setting.value
    })
    return
  }
  Object.assign(target, settings || {})
}

// ── Number extractor ──────────────────────────────────────────────────────────
function extractNums(msg: string) {
  return [...msg.matchAll(/\d+\.?\d*/g)].map(m => parseFloat(m[0]))
}

// ── Conversation state from request ──────────────────────────────────────────
type State = {
  step?: string           // what we're waiting for next
  height?: number
  weight?: number
  age?: number
  gender?: string
  activity?: number
  goal?: string
  religion?: string
  intent?: string         // "bmi" | "workout" | "diet"
}

export async function POST(req: NextRequest) {
  try {
    const { message, state: rawState } = await req.json()
    if (!message) return NextResponse.json({ reply: "Please send a message." })

    const msg = smart(message)
    const state: State = rawState || {}
    const nlpResult = await classifyText(message).catch(() => null)
    const externalIntent = typeof nlpResult?.intent === "string" ? nlpResult.intent : null

    // ── SETTINGS ──────────────────────────────────────────────────────────────
    const s: Record<string,string> = {}
    try {
      const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      const settingsRes = await fetch(`${base}/api/settings`, { cache: "no-store" })
      if (settingsRes.ok) {
        const { settings } = await settingsRes.json()
        assignSettings(s, settings)
      }
    } catch {}

    // ────────────────────────────────────────────────────────────────────────
    // STEP MACHINE — if we're mid-conversation, handle the step first
    // ────────────────────────────────────────────────────────────────────────
    if (state.step) {
      const nums = extractNums(msg)
      const n = nums[0]

      // ── Waiting for HEIGHT ──
      if (state.step === "height") {
        let h = n
        if (!h || h < 50 || h > 250) {
          // Maybe they gave feet/inches like "5'10" or "5 10"
          const feetMatch = message.match(/(\d)\s*[''`]\s*(\d{1,2})/)
          if (feetMatch) h = Math.round(parseInt(feetMatch[1]) * 30.48 + parseInt(feetMatch[2]) * 2.54)
          // Try "5 feet 10" or "5ft"
          const ftMatch = message.match(/(\d+)\s*(?:ft|feet|foot)/)
          const inMatch = message.match(/(\d+)\s*(?:in|inch)/)
          if (ftMatch) h = Math.round(parseInt(ftMatch[1]) * 30.48 + (inMatch ? parseInt(inMatch[1]) * 2.54 : 0))
        }
        if (!h || h < 100 || h > 250) return NextResponse.json({ reply: "I didn't catch that. Please give your height in cm, e.g. **175**", state })
        const newState = { ...state, height: h, step: "weight" }
        return NextResponse.json({ reply: `Got it — **${h}cm**. Now your weight in kg? (e.g. 75)`, state: newState })
      }

      // ── Waiting for WEIGHT ──
      if (state.step === "weight") {
        const w = n
        if (!w || w < 30 || w > 300) return NextResponse.json({ reply: "Please give your weight in kg, e.g. **75**", state })
        const h = state.height!
        const bmi = calcBMI(w, h)
        const cat = bmiCat(bmi)

        if (state.intent === "bmi") {
          return NextResponse.json({
            reply: `📊 BMI: **${bmi.toFixed(1)}** — ${cat}\n\nHeight: ${h}cm | Weight: ${w}kg\n\nWant a full fitness plan with TDEE, protein targets, and a diet chart? Say **yes** or **full plan**.`,
            state: { ...state, weight: w, step: "full_plan_offer" }
          })
        }
        const newState = { ...state, weight: w, step: "age" }
        return NextResponse.json({ reply: `Weight **${w}kg**. BMI: ${bmi.toFixed(1)} — ${cat}\n\nHow old are you?`, state: newState })
      }

      // ── Waiting for AGE ──
      if (state.step === "age") {
        const age = n
        if (!age || age < 10 || age > 100) return NextResponse.json({ reply: "Please give your age in years, e.g. **25**", state })
        const newState = { ...state, age, step: "activity" }
        return NextResponse.json({
          reply: `Age **${age}**. What's your activity level?\n\n1️⃣ Sedentary (desk job, no gym)\n2️⃣ Light (1-3 days/week)\n3️⃣ Moderate (3-5 days/week)\n4️⃣ Active (6-7 days/week)\n5️⃣ Very Active (intense daily training)\n\nReply 1-5`,
          state: newState
        })
      }

      // ── Waiting for ACTIVITY ──
      if (state.step === "activity") {
        const a = n
        if (!a || a < 1 || a > 5) return NextResponse.json({ reply: "Reply with a number 1-5 for your activity level.", state })
        const newState = { ...state, activity: a, step: "goal" }
        return NextResponse.json({
          reply: `Activity level: ${a}/5. What's your goal?\n\n1️⃣ Lose fat\n2️⃣ Build muscle\n3️⃣ Maintain / improve fitness\n\nReply 1, 2, or 3`,
          state: newState
        })
      }

      // ── Waiting for GOAL ──
      if (state.step === "goal") {
        const goalMap: Record<string,string> = { "1":"cut","2":"bulk","3":"maintain","lose":"cut","fat":"cut","cut":"cut","build":"bulk","muscle":"bulk","gain":"bulk","maintain":"maintain","toned":"maintain","fit":"maintain" }
        const words = msg.split(" ")
        const goal = goalMap[msg.trim()] || words.map(w => goalMap[w]).find(Boolean) || (n === 1 ? "cut" : n === 2 ? "bulk" : n === 3 ? "maintain" : null)
        if (!goal) return NextResponse.json({ reply: "Please reply 1 (lose fat), 2 (build muscle), or 3 (maintain).", state })

        if (state.intent === "diet") {
          const newState = { ...state, goal, step: "religion" }
          return NextResponse.json({
            reply: `Goal: **${goal === "cut" ? "Lose fat" : goal === "bulk" ? "Build muscle" : "Maintain"}**. Any diet restrictions?\n\n1️⃣ Halal only\n2️⃣ Hindu (no beef)\n3️⃣ Vegetarian\n4️⃣ Vegan\n5️⃣ None / No restriction\n\nReply 1-5`,
            state: newState
          })
        }

        // Build workout plan
        return buildWorkoutPlan({ ...state, goal }, s)
      }

      // ── Waiting for RELIGION (diet) ──
      if (state.step === "religion") {
        const relMap: Record<string,string> = { "1":"halal","2":"hindu","3":"vegetarian","4":"vegan","5":"none","halal":"halal","muslim":"halal","hindu":"hindu","veg":"vegetarian","vegetarian":"vegetarian","vegan":"vegan","none":"none" }
        const words = msg.split(" ")
        const rel = relMap[msg.trim()] || words.map(w => relMap[w]).find(Boolean) || (n >= 1 && n <= 5 ? relMap[String(Math.round(n))] : null)
        if (!rel) return NextResponse.json({ reply: "Please reply 1-5 for your diet type.", state })
        return buildDietPlan({ ...state, religion: rel }, s)
      }

      // ── Offer diet after workout plan ──
      if (state.step === "offer_diet") {
        if (has(msg, ["yes","sure","ok","okay","yep","yeah","diet","food","meal","eat"])) {
          const newState = { ...state, step: "religion", intent: "diet" }
          return NextResponse.json({
            reply: `Any diet restrictions?

1️⃣ Halal only
2️⃣ Hindu (no beef)
3️⃣ Vegetarian
4️⃣ Vegan
5️⃣ None / No restriction

Reply 1-5`,
            state: newState
          })
        }
        return NextResponse.json({ 
          reply: "Got it! Ask me anything else — diet, products, orders. 💪", 
          state: { height: state.height, weight: state.weight, age: state.age, activity: state.activity, goal: state.goal }
        })
      }

      // ── Full plan offer after BMI ──
      if (state.step === "full_plan_offer") {
        // User wants diet specifically
        if (has(msg, ["diet","food","meal","eat","nutrition"])) {
          const newState = { ...state, step: "age", intent: "diet" }
          return NextResponse.json({ reply: "Let's build your diet plan! How old are you?", state: newState })
        }
        // User wants workout specifically
        if (has(msg, ["workout","exercise","gym","training","plan","routine"])) {
          const newState = { ...state, step: "age", intent: "workout" }
          return NextResponse.json({ reply: "Let's build your workout plan! How old are you?", state: newState })
        }
        // User says yes = workout plan
        if (has(msg, ["yes","full","plan","sure","ok","okay","yep","yeah","both"])) {
          const newState = { ...state, step: "age", intent: "workout" }
          return NextResponse.json({ reply: "Let's build your full plan! How old are you?", state: newState })
        }
        // User says no - clear state but keep height/weight for future
        return NextResponse.json({ 
          reply: "No problem! I have your height and weight saved. Ask me for a workout plan, diet, or anything else! 💪", 
          state: { height: state.height, weight: state.weight } 
        })
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // SMART CONTEXT — if profile already built, use it
    // ────────────────────────────────────────────────────────────────────────
    const hasProfile = state.height && state.weight && state.age && state.activity && state.goal
    
    // Religion/diet change mid-conversation
    const religionChange = msg.includes("vegan") || msg.includes("vegetarian") || msg.includes("halal") || 
      msg.includes("hindu") || msg.includes("no beef") || msg.includes("i am muslim") || msg.includes("i am vegan") ||
      msg.includes("change my diet") || msg.includes("update diet") || msg.includes("change diet")
    if (religionChange && hasProfile) {
      let rel = state.religion || "none"
      if ((msg.includes("vegan") && !msg.includes("not vegan")) || msg.includes("vegan")) rel = "vegan"
      else if (msg.includes("vegetarian") && !msg.includes("not")) rel = "vegetarian"
      else if (msg.includes("halal") || msg.includes("muslim")) rel = "halal"
      else if (msg.includes("hindu") || msg.includes("no beef")) rel = "hindu"
      const newState = { ...state, religion: rel }
      return buildDietPlan(newState, s)
    }

    // User asks for DIET and we already have profile — skip straight to restrictions
    if (has(msg, ["diet","meal plan","diet chart","food plan","eating plan","nutrition plan","what to eat"]) && hasProfile) {
      const newState = { ...state, intent: "diet", step: "religion" }
      return NextResponse.json({ 
        reply: `I already have your profile! Any diet restrictions?

1️⃣ Halal only
2️⃣ Hindu (no beef)
3️⃣ Vegetarian
4️⃣ Vegan
5️⃣ None / No restriction

Reply 1-5`,
        state: newState
      })
    }

    // User asks for WORKOUT and we already have profile — build it directly
    if (has(msg, ["workout","gym","exercise","training","routine","plan","lift","muscle"]) && hasProfile) {
      return buildWorkoutPlan(state, s)
    }

    // User asks for BMI and we already have height/weight
    if (has(msg, ["bmi","body mass","mbi","bim","my bmi"]) && state.height && state.weight) {
      const bmi = calcBMI(state.weight, state.height)
      return NextResponse.json({
        reply: `📊 Your BMI: **${bmi.toFixed(1)}** — ${bmiCat(bmi)}

Height: ${state.height}cm | Weight: ${state.weight}kg

Want a workout or diet plan based on this?`,
        state
      })
    }

    // User says YES after BMI offer — start age step if we have height+weight but no age
    if (has(msg, ["yes","sure","ok","okay","yep","yeah","full plan","full","plan"]) && state.height && state.weight && !state.age) {
      return NextResponse.json({ reply: "Let's build your full plan! How old are you?", state: { ...state, step: "age", intent: "workout" } })
    }

    // ────────────────────────────────────────────────────────────────────────
    // FRESH INTENTS — detect what they want
    // ────────────────────────────────────────────────────────────────────────

    // ── ORDER LOOKUP ──
    const digits = message.replace(/\D/g, "")
    if (digits.length >= 10 && !has(msg, ["height","weight","cm","kg","year"])) {
      const local = digits.startsWith("0") ? digits : "0" + digits.slice(-10)
      const withCountry = "88" + local.replace(/^0/, "")
      const ordersRes = await fetch(`${getBaseUrl()}/api/orders`, { cache: "no-store" })
      const { orders = [] }: { orders?: Order[] } = ordersRes.ok ? await ordersRes.json() : {}
      const data = orders
        .filter(order => [digits, local, withCountry].includes(order.phone))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
      if (data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reply = "📦 **Your recent orders:**\n\n" + data.map((o: any, i: number) => {
          const statusEmoji = { delivered:"✅", shipped:"🚚", processing:"⚙️", confirmed:"✓", cancelled:"❌" }[o.status as string] || "⏳"
          let line = `**ORDER ${i+1}**\n👕 ${o.product_name}\n🔘 Status: ${statusEmoji} ${(o.status||"pending").toUpperCase()}\n📦 Qty: ${o.quantity} | Size: ${o.size} | Color: ${o.color}`
          if (o.tracking_url) line += `\n🔗 ${o.tracking_url}`
          return line
        }).join("\n\n─────────────────\n\n") + "\n\n❓ Need help? WhatsApp: +8801935962421"
        return NextResponse.json({ reply, state: {} })
      }
      if (digits.length >= 10) return NextResponse.json({ reply: "❌ No orders found for that number.\n\nDouble-check the number you used when ordering, or WhatsApp us: +8801935962421", state: {} })
    }

    // ── ORDER INTENT ──
    if (externalIntent === "find_order" || has(msg, ["my order","track","find my order","check my order","where is my","parcel","shipment","order status"]) || (has(msg,["order","package"]) && has(msg,["track","find","check","where","status","tell"]))) {
      return NextResponse.json({ reply: "Sure! Send me the **phone number** you used when placing your order and I'll look it up right away. 📦", state: { step: "order_phone" } })
    }

    // ── BMI — step by step ──
    if (externalIntent === "bmi_calc" || has(msg, ["bmi","body mass","body fat","how fat","am i fat","am i overweight","check my weight","check my bmi","mbi","bim","my bmi"])) {
      // If they already gave height+weight in same message
      const nums = extractNums(msg)
      const heightM = msg.match(/(\d{2,3})\s*cm/)
      const weightM = msg.match(/(\d{2,3})\s*kg/)
      if (heightM && weightM) {
        const h = parseInt(heightM[1]), w = parseInt(weightM[1])
        if (h > 100 && w > 30) {
          const bmi = calcBMI(w, h)
          return NextResponse.json({ reply: `📊 BMI: **${bmi.toFixed(1)}** — ${bmiCat(bmi)}\n\nHeight: ${h}cm | Weight: ${w}kg\n\nWant a full plan with TDEE, protein targets, and diet? Say **yes**.`, state: { height: h, weight: w, step: "full_plan_offer", intent: "workout" } })
        }
      }
      // Also check plain numbers like "182 76"
      if (nums.length >= 2) {
        const possible = nums.filter(n => n > 100 && n < 250)
        const possibleW = nums.filter(n => n > 30 && n < 250 && n !== possible[0])
        if (possible.length && possibleW.length) {
          const h = possible[0], w = possibleW[0]
          const bmi = calcBMI(w, h)
          return NextResponse.json({ reply: `📊 BMI: **${bmi.toFixed(1)}** — ${bmiCat(bmi)}\n\nHeight: ${h}cm | Weight: ${w}kg\n\nWant a full plan? Say **yes**.`, state: { height: h, weight: w, step: "full_plan_offer", intent: "workout" } })
        }
      }
      return NextResponse.json({ reply: "Let's calculate your BMI! 📊\n\nWhat's your **height in cm**? (e.g. 175)", state: { step: "height", intent: "bmi" } })
    }

    // ── Height/weight given as plain numbers without context ──
    const nums = extractNums(msg)
    if (state.step === undefined && nums.length >= 1) {
      // Single big number — might be height
      if (nums.length === 1 && nums[0] >= 140 && nums[0] <= 220) {
        return NextResponse.json({ reply: `Taking **${nums[0]}cm** as your height. What's your weight in kg?`, state: { step: "weight", height: nums[0], intent: "bmi" } })
      }
      // Two numbers — height + weight
      if (nums.length >= 2) {
        const h = nums.find(n => n >= 140 && n <= 220)
        const w = nums.find(n => n >= 30 && n <= 200 && n !== h)
        if (h && w) {
          const bmi = calcBMI(w, h)
          return NextResponse.json({ reply: `📊 BMI: **${bmi.toFixed(1)}** — ${bmiCat(bmi)}\n\nHeight: ${h}cm | Weight: ${w}kg\n\nWant a full fitness plan? Say **yes**.`, state: { height: h, weight: w, step: "full_plan_offer", intent: "workout" } })
        }
      }
    }

    // ── WORKOUT ──
    if (externalIntent === "workout_plan" || has(msg, ["workout","gym","exercise","training","routine","plan","lift","muscle","build muscle","gain muscle","get fit","build my"])) {
      return NextResponse.json({ reply: "Let's build your workout plan! 💪\n\nFirst — what's your **height in cm**? (e.g. 175)", state: { step: "height", intent: "workout" } })
    }

    // ── DIET ──
    if (externalIntent === "diet_chart" || has(msg, ["diet","meal plan","diet plan","diet chart","food plan","eating plan","nutrition plan","what to eat","meal chart"])) {
      return NextResponse.json({ reply: "Let's build your diet plan! 🥗\n\nFirst — what's your **height in cm**? (e.g. 175)", state: { step: "height", intent: "diet" } })
    }

    // ── DELIVERY ──
    if (externalIntent === "delivery_info" || has(msg, ["delivery","charge","shipping","how long","arrive","days","free delivery"])) {
      if (s.free_delivery === "true") {
        return NextResponse.json({ reply: "🚚 **FREE DELIVERY** nationwide!\n\nWe deliver across all Bangladesh for FREE.\n✓ Cash on Delivery — pay when it arrives\n✓ Zero advance payment\n\n🏙️ Khulna City: 1-2 days\n🗺️ Near Khulna: 2-3 days\n🇧🇩 All Bangladesh: 3-5 days", state: {} })
      }
      return NextResponse.json({ reply: "Check our delivery page: /delivery\n\nWe ship from Khulna. Cash on Delivery — pay when it arrives. 🚚", state: {} })
    }

    // ── PRODUCTS ──
    if (externalIntent === "product_browse" || has(msg, ["product","show","browse","what do you sell","collection","shop","see products","show products","view products"])) {
      const productsRes = await fetch(`${getBaseUrl()}/api/products?in_stock=true&limit=5`, { cache: "no-store" })
      const { products = [] }: { products?: Product[] } = productsRes.ok ? await productsRes.json() : {}
      if (products && products.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = products.map((p:any) => `👕 **${p.name}** — BDT ${p.price}\n   → /products/${p.slug}`).join("\n\n")
        return NextResponse.json({ reply: "Here's our collection:\n\n" + list + "\n\nAll sweat-wicking, 4-way stretch compression fit. 🔥", state: {} })
      }
      return NextResponse.json({ reply: "Check our full collection at /products 👕\n\nAll Flextreme gear: compression fit, sweat-wicking, built for athletes.", state: {} })
    }

    // ── SIZE ──
    if (externalIntent === "size_help" || has(msg, ["size","which size","what size","fit me","size guide","chest measurement"])) {
      const m = msg.match(/(\d{2,3})/)
      if (m) {
        const n2 = parseInt(m[1])
        const isInch = msg.includes("inch") || msg.includes('"')
        const cm = isInch ? Math.round(n2 * 2.54) : n2
        const size = cm <= 33 ? "M" : cm <= 35 ? "L" : "XL"
        return NextResponse.json({ reply: `Based on **${cm}cm** measurement: recommended size is **${size}**.\n\n💡 Our tops are compression fit — go 1 size down for skin-tight feel.\n\nFull size guide: /size-guide`, state: {} })
      }
      return NextResponse.json({ reply: "📏 **SIZE GUIDE — Compression Top**\n\nM: Length 63cm | Width 33cm\nL: Length 65cm | Width 35cm\nXL: Length 68cm | Width 38cm\n\n💡 Compression fit stretches 20-30%. If between sizes, go smaller for skin-tight feel.\n\nTell me your chest/width in cm and I'll pick your size!", state: {} })
    }

    // ── SUPPLEMENTS ──
    if (externalIntent === "supplement" || has(msg, ["supplement","protein","creatine","whey","bcaa","pre workout","pre-workout","vitamin","mass gainer"])) {
      return NextResponse.json({ reply: "💊 **SUPPLEMENT GUIDE**\n\n✅ Worth it:\n• Whey Protein — 25-30g post-workout\n• Creatine Monohydrate — 5g daily (most proven)\n• Multivitamin — with breakfast\n• Fish Oil Omega-3 — 2-3g daily\n\n❌ Skip these:\n• Fat burners — mostly caffeine + hype\n• Test boosters — rarely work\n• BCAA — pointless if you take protein\n\n💡 Truth: Sleep + food beats every supplement.", state: {} })
    }

    // ── INJURY ──
    const bodyParts = ["knee","back","shoulder","wrist","ankle","elbow","hip","neck","hamstring","quad","calf"]
    const painWords = ["pain","injury","hurt","sore","ache","sprain","strain","injured","pulled","torn","swollen"]
    const hasInjury = (bodyParts.some(b=>msg.includes(b)) && painWords.some(p=>msg.includes(p))) || (has(msg,["i have","i got","i feel"]) && painWords.some(p=>msg.includes(p)))
    if (externalIntent === "injury_help" || hasInjury) {
      const area = bodyParts.find(b=>msg.includes(b)) || "injured area"
      const advice: Record<string,string> = {
        knee: "🦵 **Knee injury** — avoid squats, lunges, leg press for now.\n\n✓ Train upper body\n✓ Swimming or cycling (low impact)\n✓ Hip thrusts (pain-free range)\n\nIce 15 min after training. See a physio if sharp pain.",
        back: "🔙 **Back injury** — no deadlifts, heavy squats, or rowing.\n\n✓ Upper body (seated)\n✓ Light walking\n✓ Core bracing, not crunches\n\nNever push through back pain. See a physio.",
        shoulder: "💪 **Shoulder injury** — avoid overhead press, bench press.\n\n✓ Train legs, core, cardio\n✓ Resistance band rotations\n\nRest, ice, physio. Shoulder injuries worsen when ignored.",
        wrist: "🤝 **Wrist injury** — avoid barbell pressing, push-ups.\n\n✓ Train legs (squats, leg press)\n✓ Cardio (bike, treadmill)\n\nWrist wraps help for support.",
        ankle: "🦶 **Ankle injury** — rest from running/jumping.\n\n✓ Upper body and seated exercises\n✓ Swimming (if no pain)\n\nElevate, ice, compress. See a physio if it doesn't improve in 3 days.",
        hamstring: "🦵 **Hamstring strain** — avoid deadlifts, leg curls, sprinting.\n\n✓ Upper body, core\n✓ Light walking when pain-free\n\nGradual return. Hamstrings re-strain easily if rushed.",
      }
      return NextResponse.json({ reply: advice[area] || `⚠️ **${area} injury** — rest it, ice it, and see a physio if it doesn't improve. Train around it with unaffected muscle groups.`, state: {} })
    }

    // ── RECOVERY ──
    if (has(msg, ["recovery","rest day","sleep","sore","doms","overtraining","rest"])) {
      return NextResponse.json({ reply: "😴 **RECOVERY GUIDE**\n\nMuscles grow during recovery, not training.\n\n→ 7-9 hours sleep every night (non-negotiable)\n→ Beginners: 2-3 rest days/week\n→ Intermediate: 1-2 rest days\n→ Advanced: minimum 1 full rest day\n\nActive recovery: 20-30 min walk, light stretching, foam rolling.\n\n💡 Sleep is your most powerful supplement.", state: {} })
    }

    // ── GYM GEAR ──
    if (has(msg, ["gear","clothing","wear","outfit","what to wear","gym outfit","attire","dress","cloth"])) {
      return NextResponse.json({ reply: "👕 **GYM GEAR GUIDE**\n\n**Lifting:**\n→ Compression top + shorts\n→ Flat-soled shoes\n\n**Cardio/HIIT:**\n→ Lightweight tee, cushioned shoes\n\n**Always choose:**\n→ Sweat-wicking fabric (never cotton)\n→ 4-way stretch\n→ Compression fit\n\nFlextreme checks every box 🔥 → /products", state: {} })
    }

    // ── MOTIVATION ──
    if (has(msg, ["motivat","inspire","lazy","no energy","tired","give up","can't do it","hard","difficult","demotivated"])) {
      return NextResponse.json({ reply: "🔥 **Discipline over motivation.**\n\nMotivation is a feeling — it comes and goes.\nDiscipline is a decision — it stays.\n\nYou don't wait to feel ready. You show up anyway.\nEvery rep. Every set. Every day.\n\nThat's the difference between average and elite.\n\n**Work Hard. Flex Extreme.** 💪", state: {} })
    }

    // ── BRAND ──
    if (msg === "flextreme" || has(msg, ["about flextreme","who are you","what is flextreme","tell me about","brand story","flextreme brand"])) {
      return NextResponse.json({ reply: (s.about_story || "Flextreme is a premium gym wear brand from Bangladesh, built by athletes for athletes.") + "\n\nWork Hard. Flex Extreme. 🔥\n\n→ /products", state: {} })
    }

    // ── CONTACT ──
    if (has(msg, ["contact","whatsapp","call","email","reach","support","talk to someone","human"])) {
      return NextResponse.json({ reply: "📞 **Contact Flextreme**\n\nWhatsApp: +8801935962421\nEmail: flextremefit@gmail.com\n\nAvailable 9am–9pm daily.\n\nTap the green WhatsApp button on any page for instant reply.", state: {} })
    }

    // ── GREETING ──
    if (externalIntent === "greeting" || has(msg, ["hi","hello","hey","how are you","howdy","good morning","good evening","sup","what's up","wassup","hiya"])) {
      return NextResponse.json({ reply: "Hey! 👋 I'm Flex — your AI fitness & shopping assistant.\n\nI can help with:\n🚚 Order tracking\n💪 Workout plans\n🥗 Diet charts\n📊 BMI calculator\n📏 Size guide\n💊 Supplements\n👕 Products\n\nWhat do you need?", state: {} })
    }

    // ── Default ──
    return NextResponse.json({ reply: "I can help with:\n\n🚚 **Track your order** — share your phone number\n💪 **Workout plan** — personalized for your goals\n🥗 **Diet chart** — based on your profile\n📊 **BMI** — just tell me your height and weight\n📏 **Size guide**\n💊 **Supplements**\n👕 **Products**\n\nWhat do you need?", state: {} })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ reply: "Something went wrong. Try again or WhatsApp: +8801935962421" })
  }
}

// ── Plan builders ─────────────────────────────────────────────────────────────
function buildWorkoutPlan(state: State, s: Record<string,string>) {
  const { height: h, weight: w, age, activity = 3, goal } = state
  if (!h || !w || !age) return NextResponse.json({ reply: "Missing some info. Say 'workout plan' to start again.", state: {} })
  const calories = tdee(w, h, age, activity)
  const targetCal = goal === "cut" ? calories - 400 : goal === "bulk" ? calories + 300 : calories
  const protein = Math.round(w * (goal === "bulk" ? 2.2 : 1.8))

  const plans: Record<string,string> = {
    cut: `🔥 **FAT LOSS WORKOUT PLAN**\n\nTarget: ${targetCal} kcal/day | Protein: ${protein}g\n\n**Mon/Thu — Upper (Push)**\n• Bench Press 4×8\n• Shoulder Press 3×10\n• Tricep Pushdown 3×12\n\n**Tue/Fri — Upper (Pull)**\n• Rows 4×8\n• Pull-ups 3×max\n• Bicep Curl 3×12\n\n**Wed/Sat — Lower + Cardio**\n• Squats 4×8\n• Leg Press 3×12\n• 20 min HIIT\n\n**Sun — Rest or walk**\n\n💡 Cardio after weights for max fat burn.`,
    bulk: `💪 **MUSCLE BUILDING PLAN**\n\nTarget: ${targetCal} kcal/day | Protein: ${protein}g\n\n**Mon — Chest + Triceps**\n• Bench Press 4×6-8\n• Incline DB Press 3×10\n• Tricep Dips 3×12\n\n**Tue — Back + Biceps**\n• Deadlift 4×5\n• Barbell Rows 3×8\n• Bicep Curl 4×10\n\n**Wed — Legs**\n• Squats 5×5\n• Leg Press 4×10\n• Romanian Deadlift 3×10\n\n**Thu — Shoulders**\n• OHP 4×8\n• Lateral Raises 4×12\n• Face Pulls 3×15\n\n**Fri — Arms + Core**\n• 21s Curls, Skull Crushers, Planks\n\n**Sat/Sun — Rest**`,
    maintain: `⚡ **MAINTENANCE PLAN**\n\nTarget: ${targetCal} kcal/day | Protein: ${protein}g\n\n**3-4 days/week full body:**\n• Squat 3×10\n• Bench Press 3×10\n• Rows 3×10\n• OHP 3×10\n• 15 min cardio\n\n💡 Progressive overload: add weight or reps each week.`
  }

  return NextResponse.json({
    reply: (plans[goal!] || plans.maintain) + "\n\nWant a **diet chart** to match this plan? Reply **yes** or **diet**.",
    state: { ...state, step: "offer_diet" }
  })
}

function buildDietPlan(state: State, s: Record<string,string>) {
  const { height: h, weight: w, age, activity = 3, goal, religion = "none" } = state
  if (!h || !w || !age) return NextResponse.json({ reply: "Missing some info. Say 'diet plan' to start again.", state: {} })
  const calories = tdee(w, h, age, activity)
  const targetCal = goal === "cut" ? calories - 400 : goal === "bulk" ? calories + 300 : calories
  const protein = Math.round(w * (goal === "bulk" ? 2.2 : 1.8))
  const carbs = Math.round((targetCal * 0.45) / 4)
  const fat = Math.round((targetCal * 0.25) / 9)

  const isHalal = religion === "halal"
  const isVeg = religion === "vegetarian"
  const isVegan = religion === "vegan"
  const isHindu = religion === "hindu"

  const proteinSrc = isVegan ? "tofu, lentils, chickpeas, soy milk"
    : isVeg ? "eggs, paneer, Greek yogurt, lentils"
    : isHalal ? "halal chicken, halal beef, fish, eggs"
    : isHindu ? "chicken, fish, eggs, paneer (no beef)"
    : "chicken, beef, fish, eggs"

  const reply = `🥗 **PERSONALIZED DIET PLAN**\n\nTarget: **${targetCal} kcal** | Protein: **${protein}g** | Carbs: **${carbs}g** | Fat: **${fat}g**\n\n**🌅 Breakfast**\n• Oats + ${isVegan ? "plant milk" : "milk"} + banana\n• ${isVeg || isVegan ? "Peanut butter toast" : "3 eggs (any style)"}\n• Green tea or black coffee\n\n**🍎 Snack (10am)**\n• ${isVegan ? "Mixed nuts + fruit" : "Greek yogurt + nuts"}\n\n**🍽️ Lunch**\n• Brown rice or 2 rotis\n• ${isVegan ? "Lentil curry + vegetables" : `${proteinSrc.split(",")[0].trim()} curry`}\n• Mixed salad\n\n**💪 Pre-workout**\n• Banana + dates\n\n**🥤 Post-workout**\n• ${isVegan ? "Soy protein shake" : "Whey protein shake"} or ${isVegan ? "tofu + rice" : "chicken + rice"}\n\n**🌙 Dinner**\n• 2 rotis or rice\n• ${proteinSrc.split(",")[0].trim()} + vegetables\n\n**Protein sources:** ${proteinSrc}\n💧 Water: 3-4L daily. Eat every 3-4 hours.`

  return NextResponse.json({ reply, state: {} })
}
