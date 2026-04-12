"use client"
import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type Message = { role: "user" | "assistant", content: string }
type Settings = Record<string, string>
type Profile = {
  height?: number; weight?: number; age?: number; gender?: string
  goal?: string; religion?: string; activity?: string
  workoutType?: string; workoutDays?: number; experience?: string
  step?: string
}

// ── INTENT CATEGORIES ──
const INTENTS = {
  greeting: ["hi","hello","hey","salaam","hola","sup","howdy","wassup","whats up","good day","greetings","asalamu","wslm"],
  howare: ["how are you","how r u","hows it","how you doing","how do you do","you good","you okay","hru"],
  bmi: ["bmi","body mass","body fat","mbi","bim","calculate me","measure me","check my","my stats","my data","my info","what am i","my numbers","my measurements"],
  calorie: ["calorie","calories","cal","tdee","maintenance","how much should i eat","daily intake","energy intake","how many cal","caloric","kcal","calorie need","calorie goal","calorie calculator","calorie calc","maintanance","maintainance","maintenence","maintanence","maintenace","how much to eat","how much food","calorie deficit","calorie surplus"],
  diet: ["diet","meal","food","eat","nutrition","what to eat","eating plan","meal plan","food plan","diet plan","diet chart","what should i eat","meal chart","daily food","food guide","recipes","grocery","what food","not vegan","not vegetarian","i eat meat","i eat chicken","halal","change diet","update diet","wrong diet","incorrect diet","food chart","my diet","change my diet","update my diet"],
  workout: ["workout","exercise","training","gym plan","routine","program","lifting","weights","cardio","push pull","ppl","upper lower","split","sets reps","gym routine","fitness plan","training plan","exercise plan","how to train","train me","my routine","build routine"],
  supplement: ["supplement","protein powder","whey","creatine","pre workout","preworkout","bcaa","vitamin","what to take","supp","supps","what supplement","protein shake","mass gainer","fat burner","what pills"],
  gymwear: ["what to wear","gym wear","gym gear","gym clothes","gym outfit","workout clothes","outfit","what clothes","dress for gym","gymwear","attire","gym kit","clothing","apparel","what should i wear","wear to gym","gym dress","active wear","activewear","sportswear"],
  size: ["size","sizing","what size","which size","size guide","fit me","my size","size for me","size recommendation","chest measurement","waist measurement","hip measurement","what fits","will it fit","size chart","size help","size?","fit?","my width","my length","width is","length is","width cm","length cm","chest is","my chest","my waist","waist is","i am width","width are","measure","shirt width","shirt length","width","length"],
  motivation: ["motivat","lazy","no motivation","give up","tired","skip","skip workout","hard","difficult","struggle","can't do","cant do","demotivat","no energy","procrastinat","dont want","don't feel like","hate gym","bore","bored gym","quit"],
  injury: ["injur","pain","hurt","knee","my knee","back pain","my back","back injury","shoulder pain","my shoulder","shoulder injury","wrist pain","ankle pain","sprain","strain","ache","pulled muscle","physiotherapy","my wrist","my ankle","i am injured","got injured","injured knee","injured back","injured shoulder","hurt my","hurt knee","hurt back","hurt shoulder","have pain","have injury","i have pain"],
  protein: ["protein","how much protein","protein intake","daily protein","protein goal","protein need","how much protein","protein target"],
  weight_loss: ["lose weight","weight loss","fat loss","slim","shred","cut","get lean","burn fat","reduce weight","drop weight","lose fat","getting fat","too fat","overweight"],
  muscle_gain: ["gain muscle","build muscle","get bigger","bulk","mass","muscle mass","get jacked","get swole","bigger arms","bigger chest","bigger legs","muscle building","hypertrophy"],
  abs: ["abs","six pack","sixpack","six-pack","flat stomach","belly fat","stomach fat","core","midsection","toned stomach"],
  rest: ["rest day","recovery","overtraining","rest","how many rest","sleep","recover","muscle recovery","active recovery"],
  delivery: ["deliver","shipping","ship","how long delivery","arrival","courier","when arrive","delivery time","delivery charge","delivery fee","how much delivery","delivery cost","shipping cost","shipping fee"],
  order: ["order","buy","purchase","how to order","place order","checkout","ordering","buying","how do i buy","shop","shopping"],
  payment: ["payment","pay","cod","cash on delivery","bkash","nagad","card","advance payment","how to pay","payment method"],
  contact: ["whatsapp","contact","phone","number","reach","call","speak to","talk to","human","agent","support","help line","helpline","customer service"],
  product: ["product","collection","what do you sell","what products","what items","catalogue","catalog","range","available products","your products"],
  brand: ["about flextreme","brand story","who made","flextreme story","about brand","company","founder","origin","bangladesh brand","who are you brand"],
  discount: ["discount","offer","sale","promo","coupon","deal","voucher","code","any deal","offer available"],
  thanks: ["thank","thanks","thx","ty","thank you","appreciate","helpful","great help","nicely done"],
  bye: ["bye","goodbye","see you","later","cya","take care","peace","signing off","gtg","gotta go"],
  goodnight: ["good night","gnight","gn","night","sleep well","sweet dreams"],
  goodmorning: ["good morning","gmorning","gm","morning","rise and shine"],
  love: ["i love you","love you","love flextreme","love this","love it"],
  compliment: ["you're amazing","you are amazing","youre amazing","you're great","you are great","great bot","awesome bot","helpful bot","best ai","great ai","you're helpful","you are helpful"],
  whoami: ["who are you","what are you","are you bot","are you ai","are you human","are you robot","are you real"],
  fullplan: ["full plan","complete plan","build me a plan","start me","new plan","help me start","everything","build everything","all in one","total plan","full program","complete program","build my program","design my plan"],
  howtoabs: ["how to get abs","how do i get abs","how to build abs","how to see abs","how to lose belly","lose belly fat","get abs"],
}

function matchIntent(msg: string, keys: string[]): boolean {
  return keys.some(k => msg.includes(k))
}

function smart(raw: string): string {
  return raw.toLowerCase()
    .replace(/[?!.,;:'"]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/gonna/g, "going to").replace(/wanna/g, "want to").replace(/gimme/g, "give me")
    .replace(/\bu\b/g, "you").replace(/\br\b/g, "are").replace(/\bpls\b|\bplz\b/g, "please")
    .replace(/\bmbi\b|\bbim\b/g, "bmi")
    .replace(/workut|workoit|wrk out|wrkout/g, "workout")
    .replace(/excercise|excersize|excersise/g, "exercise")
    .replace(/protien|protine/g, "protein")
    .replace(/weigth|wieght|wheight/g, "weight")
    .replace(/hieght|higth|heigth/g, "height")
    .replace(/supplemnt|suppliment|\bsupp\b|\bsupps\b/g, "supplement")
    .replace(/maintanance|maintainance|maintenence|maintenace|maintanence/g, "maintenance")
    .replace(/calorie calculator|calorie calc|cal calc/g, "calorie")
    .replace(/\btdee\b/g, "calorie maintenance")
    .trim()
}

function has(msg: string, intent: keyof typeof INTENTS): boolean {
  return matchIntent(msg, INTENTS[intent])
}

function calcBMI(w: number, h: number) { return w / Math.pow(h / 100, 2) }
function bmiInfo(b: number) {
  if (b < 18.5) return { cat: "Underweight", icon: "🟡", tip: "Eat more. Calorie surplus + protein." }
  if (b < 25) return { cat: "Normal Weight", icon: "🟢", tip: "Solid. Build muscle or improve endurance." }
  if (b < 30) return { cat: "Overweight", icon: "🟡", tip: "300-400 kcal deficit daily. Start now." }
  return { cat: "Obese", icon: "🔴", tip: "Lifestyle change needed. Consult a doctor alongside training." }
}
function calcTDEE(w: number, h: number, age: number, gender: string, activity: string) {
  const bmr = gender === "female" ? 10*w + 6.25*h - 5*age - 161 : 10*w + 6.25*h - 5*age + 5
  const m: Record<string, number> = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very_active:1.9 }
  return Math.round(bmr * (m[activity] || 1.55))
}

function showStats(p: Profile): string {
  if (!p.weight || !p.height) return "No stats yet. Tell me your height and weight to start."
  const b = calcBMI(p.weight, p.height)
  const info = bmiInfo(b)
  const parts: string[] = ["Your current stats:"]
  parts.push("Height: " + p.height + "cm | Weight: " + p.weight + "kg")
  parts.push("BMI: " + b.toFixed(1) + " — " + info.icon + " " + info.cat)
  if (p.age && p.gender && p.activity) {
    const tdee = calcTDEE(p.weight, p.height, p.age, p.gender, p.activity)
    const goalCal = p.goal === "lose" ? tdee - 400 : p.goal === "gain" ? tdee + 400 : tdee
    parts.push("Maintenance (TDEE): " + tdee + " kcal/day")
    parts.push("Goal calories (" + (p.goal || "maintain") + "): " + goalCal + " kcal/day")
    parts.push("Protein target: " + Math.round(p.weight * 1.8) + "g/day")
  }
  if (p.goal) parts.push("Goal: " + p.goal)
  if (p.religion && p.religion !== "none") parts.push("Diet: " + p.religion)
  parts.push("")
  parts.push(info.tip)
  return parts.join("\n")
}

function getWorkoutPlan(p: Profile): string {
  const days = p.workoutDays || 4
  const gym = p.workoutType === "gym" || p.workoutType === "both"
  const goal = p.goal || "general"

  const P_GYM = "Bench Press 4x10\nIncline DB Press 3x12\nCable Flyes 3x15\nOverhead Press 4x10\nLateral Raises 3x15\nTricep Pushdown 3x15\nSkull Crushers 3x12"
  const P_HOME = "Push-ups 4x20\nPike Push-ups 3x12\nWide Push-ups 3x15\nTricep Dips 4x15\nDiamond Push-ups 3x12"
  const PL_GYM = "Deadlifts 4x8\nLat Pulldown 4x12\nSeated Cable Row 3x12\nFace Pulls 3x15\nBarbell Curl 3x12\nHammer Curls 3x12\nIncline DB Curl 3x10"
  const PL_HOME = "Pull-ups 4x8\nChin-ups 3x8\nSuperman Hold 3x15\nBand Row 3x15\nBicep Curls 3x12"
  const L_GYM = "Barbell Squat 4x10\nLeg Press 4x12\nRomanian Deadlift 3x12\nLeg Curl 3x15\nLeg Extension 3x15\nCalf Raises 4x20\nHip Thrust 3x12"
  const L_HOME = "Squats 4x20\nBulgarian Split Squats 3x12 each\nGlute Bridges 4x15\nWall Sit 3x45s\nCalf Raises 4x25\nLunges 3x12 each"
  const SH_GYM = "Overhead Press 5x5\nArnold Press 4x10\nLateral Raises 4x15\nFront Raises 3x12\nFace Pulls 3x15\nShrugs 3x15"
  const POST_GYM = "Romanian Deadlift 4x10\nLeg Curl 4x12\nHip Thrust 4x12\nLeg Press 3x15\nSeated Calf Raises 4x20"
  const POST_HOME = "Glute Bridges 4x20\nSingle Leg RDL 3x12\nDonkey Kicks 3x15\nHamstring Curl (band) 3x15\nCalf Raises 4x25"
  const HIIT = "5 min warm-up\n20 min HIIT (40s on / 20s off):\n- Burpees, Jump Squats, Mountain Climbers\n- High Knees, Box Jumps, Jumping Jacks\n10 min steady cardio\nCool down + stretch"

  const push = gym ? P_GYM : P_HOME
  const pull = gym ? PL_GYM : PL_HOME
  const legs = gym ? L_GYM : L_HOME
  const posterior = gym ? POST_GYM : POST_HOME

  if (goal === "lose" || goal === "cut") {
    return days >= 5
      ? "FAT LOSS — " + days + " Day Program\n\nDAY 1 — PUSH\n" + push + "\n\nDAY 2 — PULL\n" + pull + "\n\nDAY 3 — LEGS\n" + legs + "\n\nDAY 4 — HIIT CARDIO\n" + HIIT + "\n\nDAY 5 — UPPER BODY\n" + (gym ? SH_GYM : P_HOME) + "\n\nDAY 6-7 — Active recovery (walk, stretch, foam roll)\n\nKEY RULES:\n→ Rest 45-60s between sets\n→ 10,000 steps/day\n→ 300-500 kcal deficit\n→ Sleep 7-9 hours\n→ 3-4L water daily"
      : "FAT LOSS — 4 Day Program\nUpper/Lower Split\n\nDAY 1 — UPPER PUSH\n" + push + "\n\nDAY 2 — LOWER\n" + legs + "\n\nDAY 3 — UPPER PULL\n" + pull + "\n\nDAY 4 — FULL BODY HIIT\n" + HIIT + "\n\n→ 45-60s rest. Keep moving. Fat loss is a lifestyle."
  }

  if (goal === "gain" || goal === "bulk" || goal === "muscle") {
    return days >= 5
      ? "MUSCLE BUILDING — " + days + " Day Push/Pull/Legs\n\nDAY 1 — PUSH A (Chest focus)\n" + (gym ? "Bench Press 5x5\nIncline DB Press 4x8\nCable Flyes 4x12\nOverhead Press 4x8\nLateral Raises 4x12\nSkull Crushers 3x12" : P_HOME) + "\n\nDAY 2 — PULL A (Back thickness)\n" + (gym ? "Deadlift 5x5\nBent Over Row 4x8\nLat Pulldown 4x10\nSeated Row 4x10\nFace Pulls 3x15\nBarbell Curl 4x10" : pull) + "\n\nDAY 3 — LEGS A (Quads)\n" + (gym ? "Back Squat 5x5\nLeg Press 4x12\nLeg Extension 4x15\nCalf Raises 5x20" : legs) + "\n\nDAY 4 — PUSH B (Shoulder focus)\n" + (gym ? SH_GYM : P_HOME) + "\n\nDAY 5 — PULL B (Lat width)\n" + (gym ? "Weighted Pull-ups 5x6\nSingle Arm Row 4x10\nCable Pullover 3x15\nPreacher Curl 4x10\nCable Curl 3x15" : pull) + "\n\nDAY 6 — LEGS B (Posterior)\n" + posterior + "\n\nDAY 7 — REST + stretch + foam roll\n\nKEY RULES:\n→ Add weight every week (progressive overload)\n→ Rest 90-120s between sets\n→ 300-500 kcal surplus\n→ 2g protein per kg bodyweight\n→ 8+ hours sleep — muscles grow at rest"
      : "MUSCLE BUILDING — 4 Day Upper/Lower\n\nDAY 1 — UPPER A (Push)\n" + (gym ? "Bench Press 4x6-8\nOverhead Press 3x8\nIncline DB Press 3x10\nLateral Raises 3x15\nTricep Pushdown 3x12\nSkull Crushers 3x10" : P_HOME) + "\n\nDAY 2 — LOWER A (Quads)\n" + (gym ? "Barbell Squat 4x6-8\nLeg Press 3x12\nLeg Extension 3x15\nCalf Raises 4x20" : L_HOME) + "\n\nDAY 3 — UPPER B (Pull)\n" + (gym ? "Pull-ups 4x8\nBarbell Row 4x8\nSeated Row 3x12\nFace Pulls 3x15\nBarbell Curl 3x10\nHammer Curl 3x12" : pull) + "\n\nDAY 4 — LOWER B (Posterior)\n" + posterior + "\n\n→ Progressive overload every week. Rest 90s. Eat big. Sleep big."
  }

  return "GENERAL FITNESS — " + days + " Day Program\n\nDAY 1 — FULL BODY STRENGTH\n" + (gym ? "Squats 3x12\nBench Press 3x12\nBent Over Row 3x12\nOverhead Press 3x10\nPlank 3x30s" : "Squats 3x15\nPush-ups 3x15\nSuperman 3x12\nPike Push-ups 3x10\nPlank 3x30s") + "\n\nDAY 2 — CARDIO + CORE\n20-25 min jog or cycling\nJump rope 3x2 min\nCrunches 3x20\nLeg raises 3x15\nPlank 3x45s\n\nDAY 3 — LOWER\n" + legs + "\n\nDAY 4 — UPPER\n" + pull + "\n\n→ Show up. Be consistent. Results take 4-6 weeks."
}

function getDietPlan(p: Profile, tdee: number): string {
  const goal = p.goal || "maintain"
  const target = goal === "lose" ? tdee - 400 : goal === "gain" ? tdee + 400 : tdee
  const protein = Math.round((p.weight || 70) * (goal === "gain" ? 2.2 : 1.8))
  const carbs = Math.round((target * 0.45) / 4)
  const fat = Math.round((target * 0.25) / 9)
  const isMuslim = p.religion === "muslim"
  const isHindu = p.religion === "hindu"
  const isVeg = p.religion === "vegetarian"
  const isVegan = p.religion === "vegan"
  const milk = isVegan ? "soy milk" : "milk"
  const eggs = isVeg || isVegan ? "peanut butter + nuts" : "3 eggs"
  const lunch_protein = isVegan ? "tofu curry" : isVeg ? "paneer curry" : isMuslim ? "halal chicken curry" : isHindu ? "chicken/fish curry" : "chicken curry"
  const dinner_protein = isVegan ? "chickpea curry" : isVeg ? "dal + paneer" : isMuslim ? "halal beef or fish" : isHindu ? "fish or chicken" : "chicken or fish"
  const protein_sources = isVegan ? "Tofu, lentils, chickpeas, soy milk, tempeh" : isVeg ? "Eggs, paneer, Greek yogurt, lentils" : isMuslim ? "Halal chicken, halal beef, fish, eggs" : isHindu ? "Chicken, fish, eggs, dal, paneer" : "Chicken, beef, fish, eggs, dairy"
  return "PERSONALIZED DIET PLAN\n\nTarget: " + target + " kcal | Protein: " + protein + "g | Carbs: " + carbs + "g | Fat: " + fat + "g\n\nBreakfast (7-8am)\nOats + " + milk + " + banana\n" + eggs + "\nBlack coffee or green tea\n\nSnack (10am)\nGreek yogurt" + (isVegan ? " / coconut yogurt" : "") + " + mixed nuts\n1 fruit\n\nLunch (1-2pm)\nBrown rice or 2 rotis\n" + lunch_protein + "\nMixed vegetables + salad\n\nPre-Workout\nBanana + dates\nOptional: black coffee\n\nPost-Workout\nProtein shake OR " + (isVeg || isVegan ? "paneer/tofu" : "chicken") + " + rice\n\nDinner (7-8pm)\n2 rotis or rice\n" + dinner_protein + "\nSteamed vegetables\n\nBefore Bed\n" + (isVegan ? "Soy milk + nuts" : "Warm milk + nuts") + "\n\nProtein sources: " + protein_sources + "\nWater: 3-4L daily. Eat every 3-4 hours.\n\nWant adjustments or supplement advice?"
}

function getSupplements(goal: string, isVeg: boolean): string {
  const prot = isVeg ? "Plant Protein" : "Whey Protein"
  const omega = isVeg ? "Algae Oil Omega-3" : "Fish Oil Omega-3"
  const extras = goal === "lose"
    ? "\nFAT LOSS EXTRAS:\nCaffeine — 200mg pre-workout (free from coffee)\nL-Carnitine — 1-2g before cardio\nGreen Tea Extract — mild thermogenic"
    : goal === "gain"
    ? "\nMUSCLE GAIN EXTRAS:\nBeta-Alanine — 3.2g/day (tingling = normal)\nZMA — before bed, boosts recovery + testosterone\nVitamin D3+K2 — hormone health"
    : ""
  return "SUPPLEMENT GUIDE\n\nESSENTIAL (worth every taka):\n" + prot + " — 25-30g post workout\nCreatine Monohydrate — 5g daily, any time. #1 proven supplement.\nMultivitamin — with breakfast\n" + omega + " — 2-3g daily with food\n" + extras + "\n\nSKIP THESE:\nFat burners — mostly caffeine + marketing\nTestosterone boosters — almost never work\nBCAA — useless if taking protein\n\nTruth: Sleep + food > every supplement. Fix those first."
}

export default function ChatBot({ fullPage = false }: { fullPage?: boolean } = {}) {
  const [open, setOpen] = useState(false)
  // Auto-open when fullPage mode
  useEffect(() => { if (fullPage) setOpen(true) }, [fullPage])
  // Hide to side — swipe left/right on button to hide, tap to show
  const [hidden, setHidden] = useState(false)
  const pathname = usePathname()

  // Close chatbox when navigating to a new page
  useEffect(() => { setOpen(false) }, [pathname])


  const [settings, setSettings] = useState<Settings>({})
  const profileRef = useRef<Profile>({})
  const settingsRef = useRef<Settings>({})
  const modeRef = useRef<string | null>(null) // tracks chatbot mode: null | "order_lookup"
  const productsCacheRef = useRef<any[]>([])
  const [, forceUpdate] = useState(0)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! I'm Flex — your AI fitness & shopping assistant.\n\n🚚 Track your order\n🚛 Delivery charges & info\n👕 Browse & shop products\n📏 Size recommendation\n💪 Workout plans\n🥗 Diet charts\n📊 BMI calculator\n💊 Supplements\n\nWhat do you need? 💪" }
  ])
  const [step, setStep] = useState<string | null>(null)

const [profile] = useState({
  height: "",
  weight: "",
  age: "",
  goal: ""
})
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(1)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function setProfile(p: Profile) { profileRef.current = p; forceUpdate(n => n + 1) }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: settingsData }, { data: productsData }] = await Promise.all([
        supabase.from("settings").select("*"),
        supabase.from("products").select("id,name,slug,price,category,sizes,colors,description,is_featured,in_stock").eq("in_stock", true).order("is_featured", { ascending: false }).limit(20)
      ])
      const map: Settings = {}
      settingsData?.forEach((s: any) => { map[s.key] = s.value })
      setSettings(map)
      settingsRef.current = map
      if (productsData) productsCacheRef.current = productsData
    }
    load()
  }, [])

  useEffect(() => { if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 150) } }, [open])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])

  function addBot(content: string, delay = 0) {
  setTimeout(() => {
    setMessages(prev => [
      ...prev,
      { role: "assistant", content }
    ])
  }, delay)
}

  function getReply(raw: string): string {
    const msg = smart(raw)
    const p = profileRef.current
    const s = settingsRef.current
    const products: any[] = productsCacheRef.current || []
    const num = parseFloat(raw.replace(/[^0-9.]/g, ""))
    const hasNum = !isNaN(num) && num > 0

    // ── PHONE NUMBER DETECTION (order lookup) ──
    // If we're waiting for phone, check for phone BEFORE anything else including step machine
    const phoneRaw = raw.trim().replace(/[\s\-\+\.]/g, "")
    const isPhone = /^(?:88)?0[1-9]\d{8,10}$/.test(phoneRaw) || /^\d{11,13}$/.test(phoneRaw)
    if (modeRef.current === "order_lookup") {
      if (!isPhone) {
        const digitsOnly = raw.trim().replace(/\D/g, "")
        // Auto-fix 10-digit number (missing leading 0)
        if (digitsOnly.length === 10 && digitsOnly.startsWith("1")) {
          return "__PHONE_LOOKUP__:0" + digitsOnly
        }
        // Escape hatch — frustrated user or changed topic
        const wantsEscape = msg.includes("cancel") || msg.includes("never mind") || msg.includes("stop") ||
          msg.includes("forget") || msg.includes("exit") || msg.includes("back") ||
          msg.includes("angry") || msg.includes("angry") || msg.includes("dumb") ||
          msg.includes("stupid") || has(msg, "greeting") || has(msg, "workout") ||
          has(msg, "diet") || has(msg, "product") || has(msg, "supplement")
        if (wantsEscape) {
          modeRef.current = null
          // Fall through to handle the actual message
        } else {
          // Still in order lookup — friendly reminder
          return "I need your phone number to check the order 📱\nExample: 01712345678\n\n(Say \'cancel\' to go back)"
        }
      }
    }
    if (isPhone && (modeRef.current === "order_lookup" || modeRef.current === null)) {
      if (modeRef.current === null) modeRef.current = "order_lookup"
      // async order lookup — return loading message, then update
      setTimeout(async () => {
        try {
          // Use server API route to bypass RLS
          const res = await fetch("/api/order-lookup?phone=" + encodeURIComponent(phoneRaw))
          const json = await res.json()
          const data = json.orders
          let orderReply = ""

if (data && data.length > 0) {

  orderReply = "📦 Here are your recent orders:\n\n"

  data.forEach((o:any, i:number) => {

    const product = o.product_name || "Product"
    const status = o.status || "processing"
    const qty = o.quantity || 1
    const size = o.size ? "\nSize: " + o.size : ""
    const color = o.color ? "\nColor: " + o.color : ""

    const sEmoji = status==="delivered"?"✅":status==="shipped"?"🚚":status==="confirmed"?"✓":status==="cancelled"?"❌":"⏳"
    orderReply += `ORDER ${i+1}
Product: ${product}
🔘 STATUS: ${sEmoji} ${status.toUpperCase()}
Quantity: ${qty}${size}${color}`

    if (status === "shipped" && o.tracking_url) {

orderReply += `

🚚 Track your shipment
Click here:
${o.tracking_url}

`
}

    orderReply += "\n\n"
  })

  orderReply += "Need help? WhatsApp us: +8801935962421"

} else {

  orderReply =
  "❌ No order found for number: " +
  phoneRaw +
  "\n\nCheck the number or WhatsApp us: +8801935962421"
}
          modeRef.current = null
          setMessages(prev => [...prev, { role: "assistant", content: orderReply }])
        } catch {
          setMessages(prev => [...prev, { role: "assistant", content: "Couldn't reach our servers. Please try again or WhatsApp: +8801935962421" }])
        }
        setLoading(false)
      }, 400)
      return "__ASYNC__"
    }

    // ── UPDATE MODES — handle number input for profile updates ──
    if (modeRef.current === "update_height" && hasNum && num >= 100 && num <= 250) {
      setProfile({ ...p, height: num }); modeRef.current = null
      return "Height updated to " + num + "cm! ✅ Say 'bmi' to recalculate your stats."
    }
    if (modeRef.current === "update_weight" && hasNum && num >= 20 && num <= 400) {
      setProfile({ ...p, weight: num }); modeRef.current = null
      return "Weight updated to " + num + "kg! ✅ Say 'bmi' to recalculate your stats."
    }
    if (modeRef.current === "update_age" && hasNum && num >= 10 && num <= 100) {
      setProfile({ ...p, age: num }); modeRef.current = null
      return "Age updated to " + Math.round(num) + "! ✅"
    }
    // Clear update mode if they said something else
    if (modeRef.current && modeRef.current.startsWith("update_") && !hasNum) {
      modeRef.current = null
    }

    // ── MEMORY QUERIES (always first) ──
    if ((has(msg, "bmi") || msg.includes("my bmi") || (msg.includes("calculate") && msg.includes("bmi"))) && !p.step) {
      if (p.weight && p.height) return showStats(p)
      setProfile({ ...p, step: "height" })
      return "Let me calculate your BMI! Height in cm? (e.g. 175)"
    }
    if (has(msg, "calorie") && !p.step && p.weight && p.height && p.age && p.gender && p.activity) return showStats(p)
    if (msg.includes("my age") || msg.includes("what age") || msg.includes("how old am i")) {
      if (p.age) { modeRef.current = "update_age"; return "You are " + p.age + " years old.\nSend your new age to update it." }
      return "I don't know your age yet. Say 'bmi' and I'll ask everything step by step."
    }
    if (msg.includes("my height") || msg.includes("what is my height")) {
      if (p.height) { modeRef.current = "update_height"; return "Your height is " + p.height + "cm.\nSend your new height in cm to update it." }
      return "I don't have your height yet. Say 'bmi' and I'll ask you step by step."
    }
    if (msg.includes("my weight") || msg.includes("what is my weight")) {
      if (p.weight) { modeRef.current = "update_weight"; return "Your weight is " + p.weight + "kg.\nSend your new weight in kg to update it." }
      return "I don't have your weight yet. Say 'bmi' and I'll ask you step by step."
    }
    if (msg.includes("my stats") || msg.includes("my data") || msg.includes("remember me") || msg.includes("what did i tell")) {
      return showStats(p)
    }

// ── STEP MACHINE ──
if (p.step) {
  const step = p.step

  const isOrderEscape =
    has(msg, "order") ||
    msg.includes("track") ||
    msg.includes("where is my order") ||
    msg.includes("my order") ||
    /^\d{10,15}$/.test(raw.trim())

    const isGreetingEscape =
    has(msg, "greeting") ||
    has(msg, "bye") ||
    has(msg, "thanks")

  if (isOrderEscape || isGreetingEscape) {
    setProfile({ ...p, step: undefined })
    if (isGreetingEscape) modeRef.current = null
  }

  else if (step === "height") {
    if (!hasNum || num < 100 || num > 250)
      return "That doesn't look right. Height in cm please. (e.g. 175)"

    setProfile({ ...p, height: num, step: "weight" })
    return "Height " + num + "cm. Weight in kg?"
  }

  else if (step === "weight") {
    if (!hasNum || num < 30 || num > 300)
      return "Weight in kg please. (e.g. 75)"

    const b = calcBMI(num, p.height!)
    const info = bmiInfo(b)

    setProfile({ ...p, weight: num, step: "age" })

    return "Weight " + num + "kg. BMI: " + b.toFixed(1) + " — " + info.cat + "\n\nAge?"
  }

  else if (step === "age") {
    const age = parseInt(raw.replace(/[^0-9]/g, ""))

    if (!age || age < 10 || age > 100)
      return "Valid age please. (e.g. 25)"

    setProfile({ ...p, age, step: "gender" })

    return "Age " + age + ". Gender? (male / female)"
  }

  else if (step === "gender") {
    const g = /female|woman|girl|\bf\b/i.test(raw) ? "female" : "male"

    setProfile({ ...p, gender: g, step: "activity" })

    return "Got it. Activity level?\n\n1 — Sedentary (no exercise)\n2 — Light (1-3 days/week)\n3 — Moderate (3-5 days/week)\n4 — Active (6-7 days/week)\n5 — Very Active (intense daily)"
  }

  else if (step === "activity") {
    const am: Record<string, string> = {
      "1": "sedentary",
      "2": "light",
      "3": "moderate",
      "4": "active",
      "5": "very_active"
    }

    const level = am[msg.trim()] || am[raw.trim()] || "moderate"

    const np = { ...p, activity: level, step: "goal" }

    setProfile(np)

    const tdee = calcTDEE(np.weight!, np.height!, np.age!, np.gender!, level)
    const b = calcBMI(np.weight!, np.height!)
    const info = bmiInfo(b)

    return (
      "BMI: " + b.toFixed(1) + " — " + info.icon + " " + info.cat +
      "\nTDEE: " + tdee + " kcal/day\nProtein: " +
      Math.round(np.weight! * 1.8) +
      "g/day\n\n" +
      info.tip +
      "\n\nGoal?\n1 — Lose fat\n2 — Build muscle\n3 — Maintain"
    )
  }

  else if (step === "goal") {
    const gm: Record<string, string> = {
      "1": "lose",
      "2": "gain",
      "3": "maintain"
    }

    const goal =
      gm[msg.trim()] ||
      gm[raw.trim()] ||
      (has(msg, "weight_loss")
        ? "lose"
        : has(msg, "muscle_gain")
        ? "gain"
        : "maintain")

    setProfile({ ...p, goal, step: "religion" })

    return "Diet restrictions?\n\n1 — Muslim (Halal only)\n2 — Hindu (no beef)\n3 — Vegetarian\n4 — Vegan\n5 — None"
  }
  else if (step === "religion") {

  const rm: Record<string, string> = {
    "1": "muslim",
    "2": "hindu",
    "3": "vegetarian",
    "4": "vegan",
    "5": "none"
  }

  const religion =
    rm[msg.trim()] ||
    rm[raw.trim()] ||
    (msg.includes("muslim") ? "muslim" :
     msg.includes("hindu") ? "hindu" :
     msg.includes("vegetarian") ? "vegetarian" :
     msg.includes("vegan") ? "vegan" :
     "none")

  setProfile({ ...p, religion, step: undefined })

  return "Perfect. Your profile is saved.\n\nYou can now ask for:\n• Workout plan\n• Diet chart\n• Supplements\n• BMI stats\n\nWhat do you want next? 💪"
}
}

    // ── INTENT ROUTING ──

    // ── DELIVERY CITY MODE — when waiting for city, route back to delivery handler ──
    // (handled inside the delivery handler itself since it checks modeRef)

    // ── PROFILE UPDATES (must be before greeting/intent matching) ──
    // Religion update — checked first to avoid "i am hindu" matching "hi" greeting
    const isReligionMsg =
      (msg.includes("i am muslim") || msg.includes("i am hindu") || msg.includes("i am vegan") || msg.includes("i am vegetarian") ||
       msg.includes("im muslim") || msg.includes("im hindu") || msg.includes("im vegan") || msg.includes("im vegetarian") ||
       msg.includes("i'm muslim") || msg.includes("i'm hindu") || msg.includes("i'm vegan") || msg.includes("i'm vegetarian")) ||
      msg.includes("not vegan") || msg.includes("not vegetarian") ||
      msg.includes("i eat meat") || msg.includes("i eat chicken") || msg.includes("i eat beef") ||
      (msg.includes("change") && (msg.includes("muslim") || msg.includes("hindu") || msg.includes("vegetarian") || msg.includes("vegan") || msg.includes("halal") || msg.includes("diet")))
    if (isReligionMsg) {
      let newRel = p.religion || "none"
      if (/muslim|halal/.test(msg)) newRel = "muslim"
      else if (/hindu/.test(msg)) newRel = "hindu"
      else if (msg.includes("vegan") && !msg.includes("not vegan") && !msg.includes("vegetarian")) newRel = "vegan"
      else if (/vegetarian|vegeterian|veggie|vegiterian/.test(msg) && !msg.includes("not")) newRel = "vegetarian"
      else if (msg.includes("not vegan") || msg.includes("not vegetarian") || msg.includes("i eat meat") || msg.includes("i eat chicken")) newRel = "none"
      else if (msg.includes("change") && msg.includes("diet") && !newRel) {
        modeRef.current = "change_diet"
        return "What\'s your diet preference? 🥗\n\n1 — Muslim (Halal)\n2 — Hindu (no beef)\n3 — Vegetarian\n4 — Vegan\n5 — None"
      }
      if (newRel !== (p.religion || "none")) {
        setProfile({ ...p, religion: newRel })
        const dn = newRel==="muslim"?"Halal":newRel==="hindu"?"Hindu":newRel==="vegetarian"?"Vegetarian":newRel==="vegan"?"Vegan":"Regular"
        return "Diet updated to " + dn + "! ✅\nSay \'diet\' for your new plan."
      }
    }
    if (modeRef.current === "change_diet") {
      const dietMap: Record<string,string> = {"1":"muslim","2":"hindu","3":"vegetarian","4":"vegan","5":"none"}
      const chosen = dietMap[msg.trim()] ||
        (msg.includes("muslim")||msg.includes("halal")?"muslim":msg.includes("hindu")?"hindu":
         msg.includes("vegetarian")||msg.includes("vegeterian")||msg.includes("veggie")?"vegetarian":
         (msg.includes("vegan")||msg.includes("vegen"))&&!msg.includes("vegetarian")?"vegan":
         msg.includes("none")||msg.includes("everything")?"none":null)
      if (chosen) {
        modeRef.current = null
        setProfile({ ...p, religion: chosen })
        const dn2 = chosen==="muslim"?"Halal":chosen==="hindu"?"Hindu":chosen==="vegetarian"?"Vegetarian":chosen==="vegan"?"Vegan":"Regular"
        return "Diet updated to " + dn2 + "! ✅\nSay \'diet\' for your new plan."
      }
      return "Choose 1-5:\n1 — Muslim\n2 — Hindu\n3 — Vegetarian\n4 — Vegan\n5 — None"
    }

    // Workout location update
    const isWorkoutLocMsg =
      (msg.includes("i workout") || msg.includes("i train") || msg.includes("i exercise") || msg.includes("i go to") || msg.includes("i use") || msg.includes("i will")) &&
      (msg.includes("home") || msg.includes("gym") || msg.includes("calisthenics") || msg.includes("bodyweight"))
    if (isWorkoutLocMsg) {
      let newType = p.workoutType || "gym"
      if (msg.includes("home") && !msg.includes("gym")) newType = "home"
      else if (msg.includes("gym") && !msg.includes("home")) newType = "gym"
      else if (msg.includes("both") || (msg.includes("home") && msg.includes("gym"))) newType = "both"
      else if (msg.includes("calisthenics") || msg.includes("bodyweight")) newType = "home"
      setProfile({ ...p, workoutType: newType })
      return "Got it — workout updated to " + (newType === "home" ? "home/bodyweight" : newType === "both" ? "gym + home" : "gym") + "! 💪\nSay \'workout\' for a fresh plan."
    }

    // Supplements
if (
  has(msg, "supplement") ||
  msg.includes("supplement") ||
  msg.includes("supplements") ||
  msg.includes("creatine") ||
  msg.includes("protein powder") ||
  msg.includes("whey") ||
  msg.includes("pre workout")
) {
  const isVeg = p.religion === "vegetarian" || p.religion === "vegan"
  return getSupplements(p.goal || "general", isVeg)
}

    // Greetings & casual
    if (has(msg, "greeting")) {
      const greetings = [
        "Hey! 👋 Good to see you. Want a workout plan, diet chart, or help with an order?",
        "Hello! 💪 Ready when you are — fitness plans, orders, products, whatever you need!",
        "Hey there! What can I help you with today? Orders, workouts, diet, or products? 😊"
      ]
      return greetings[Math.floor(Math.random() * greetings.length)]
    }
    if (has(msg, "howare")) return "I'm doing great, thanks for asking! 😊 Ready to help you with workouts, diet, orders, or products. What do you need?"
    if (msg.includes("i'm fine") || msg.includes("im fine") || msg.includes("i am fine") || msg.includes("im good") || msg.includes("i'm good")) return "Good. Channel that energy into training. Want a workout? 💪"
    if (msg.includes("are you") && (msg.includes("dumb") || msg.includes("stupid") || msg.includes("real") || msg.includes("bot") || msg.includes("ai") || msg.includes("human"))) {
      if (msg.includes("dumb") || msg.includes("stupid")) return "Ha — fair! I'm an AI and I'm still improving. 😅 What can I actually help you with?"
      return "I'm Flex, an AI assistant for Flextreme. I handle orders, fitness plans, products and more. What do you need? 💪"
    }
    if (msg.includes("dumb") || msg.includes("stupid") || msg.includes("idiot") || msg.includes("useless") || msg.includes("worst") || msg.includes("terrible") || msg.includes("hate you") || msg.includes("hate this")) {
      return "I hear you — I\'m still learning! 😅\nTry rephrasing and I\'ll do my best.\n\nOr WhatsApp us directly: +8801935962421 for instant human help."
    }
    if (msg.includes("im sad") || msg.includes("i'm sad") || msg.includes("not good") || msg.includes("im tired") || msg.includes("i'm tired") || msg.includes("stressed")) return "Rough day? Exercise is the best medicine — even a 20-min walk changes your mood. Want a quick session plan?"
    if (msg === "sad" || msg === "feeling sad" || msg.includes("feeling low") || msg.includes("feeling bad")) return "That's okay. Bad days happen. 💙\nA quick 20-min workout releases endorphins. Want a short session plan?"
    if (msg === "what to do" || msg === "what should i do" || msg.includes("help me decide")) return "Here's what I can help with:\n\n🚚 Track order\n🛍️ Shop products\n💪 Workout plan\n🥗 Diet chart\n📊 BMI check\n💊 Supplements\n\nWhat sounds good?"
    if (msg === "sad" || msg === "feeling sad" || msg.includes("feeling low") || msg.includes("feeling bad")) return "That's okay. Bad days happen to everyone. 💙\n\nA quick 20-min workout releases endorphins — nature's mood booster. Want me to build you a short session?"
    if (msg === "what to do" || msg === "what should i do" || msg.includes("i dont know what to do") || msg.includes("help me decide")) return "I can help you with:\n\n🚚 Track your order\n🚛 Delivery info\n🛍️ Shop products\n📏 Size guide\n💪 Workout plan\n🥗 Diet chart\n📊 BMI check\n💊 Supplements\n\nWhat sounds good?"
    if (has(msg, "love")) return "Love you too! Now let's get to work. What's your goal? 🖤💪"
    if (has(msg, "compliment")) return "Appreciate that. Now let's channel this energy into your gains. What do you need? 💪"
    if (has(msg, "thanks")) return "Let's go. Keep executing. 💪"
    if (msg.includes("anything else") || msg.includes("what else") || msg.includes("what can you do") || msg.includes("what do you do") || msg === "help") {
      return "Here's everything I can help with:\n\n🚚 Track your order\n🚛 Delivery charges by city\n🛍️ Shop products\n📏 Size guide\n💪 Workout plan\n🥗 Diet chart\n📊 BMI check\n💊 Supplements\n👕 Gym wear\n\nJust ask anything!"
    }
    if (has(msg, "bye")) return "See you. Stay consistent. Work Hard, Flex Extreme. 🔥"
    if (has(msg, "goodnight")) return "Rest well. Sleep is when you grow. 7-9 hours minimum. 🌙"
    if (has(msg, "goodmorning")) return "Morning. Best time to train is now. What's the plan? ☀️💪"
    if (has(msg, "whoami")) return "I'm Flex — Flextreme's AI fitness coach. Workouts, nutrition, BMI, gear. Ask me anything. 🤖💪"
    if (msg.includes("haha") || msg.includes("lol") || msg.includes("lmao")) return "Good energy. Use it in the gym. 😄💪"
    if (msg === "gym" || msg === "i go to gym" || msg === "at gym" || msg === "i am at gym") {
      setProfile({ ...p, workoutType: "gym" })
      return "Gym mode! 🏋️ Want your workout plan, diet chart, or size help?"
    }
    if (msg === "gym work" || msg === "gym workout" || msg === "go gym") {
      return "Want a gym workout plan? Just say \\'workout\\' and I\\'ll build one for you! 💪"
    }
    if (msg.match(/^(ok|okay|sure|got it|cool|great|alright|yes|yeah|yep|k|np)\.?$/)) return "Good. What's next? 💪"

    // Motivation
    if (has(msg, "motivation")) return "Motivation is temporary. Discipline is permanent.\n\nYou don't wait to feel like it. You show up anyway. That's the difference.\n\nNow — what's your workout today? I'll plan it."

    // Injury
    // Injury — also catch standalone body part words
    // Skip injury check if waiting for delivery city
    const isInjuryMsg = modeRef.current !== "awaiting_delivery_city" && (has(msg, "injury") ||
      (msg.includes("knee") && (msg.includes("injury") || msg.includes("pain") || msg.includes("hurt") || msg.includes("sore") || msg.includes("injur") || modeRef.current === "injury")) ||
      (msg.includes("back") && (msg.includes("injury") || msg.includes("pain") || msg.includes("hurt") || msg.includes("injur") || modeRef.current === "injury")) ||
      (msg.includes("shoulder") && (msg.includes("injury") || msg.includes("pain") || msg.includes("hurt") || modeRef.current === "injury")) ||
      msg.includes("i am injured") || msg.includes("got injured") || msg.includes("hurt my"))
    if (isInjuryMsg) {
      const area = msg.includes("knee") ? "knee" : msg.includes("back") ? "back" : msg.includes("shoulder") ? "shoulder" : msg.includes("wrist") ? "wrist" : msg.includes("ankle") ? "ankle" : null
      if (area === "knee") return "Knee injury — avoid squats, lunges, leg press for now.\n\nSafe alternatives:\n→ Upper body focus (chest, back, arms)\n→ Swimming or cycling (low impact)\n→ Seated leg extensions (light weight only)\n→ Hip thrusts (no knee stress)\n\nIce 15min after training. See a physio if pain is sharp."
      if (area === "back") return "Back injury — no deadlifts, no heavy squats, no rowing.\n\nSafe alternatives:\n→ Chest, arms, shoulders (seated/lying)\n→ Light walking\n→ Gentle stretching (cat-cow, child's pose)\n→ Core bracing exercises (not crunches)\n\nDon't push through back pain — it can get serious. See a physio."
      if (area === "shoulder") return "Shoulder injury — avoid overhead press, lateral raises, bench press.\n\nSafe alternatives:\n→ Legs, core, cardio\n→ Resistance band external rotations\n→ Light cable face pulls (if painless)\n\nRest, ice, physio. Shoulder injuries get worse if ignored."
      if (area === "wrist") return "Wrist issue — avoid barbell pressing, push-ups, heavy grip work.\n\nSafe alternatives:\n→ Legs (squats, leg press)\n→ Cardio (bike, treadmill)\n→ Cable pushdowns with rope (neutral grip)\n\nWrist wraps help. Let it rest."
      if (area === "ankle") return "Ankle issue — no running, jumping, or heavy leg work.\n\nSafe alternatives:\n→ Upper body — chest, back, arms, shoulders\n→ Seated exercises\n→ Swimming\n\nICE + elevate. Don't walk on it if swollen."
      modeRef.current = "injury"
      return "Safety first. Which area — knee, back, shoulder, wrist, or ankle?\n\nTell me and I'll give you a modified plan."
    }

    // Full plan
    if (has(msg, "fullplan")) {
      setProfile({ ...p, step: "height" })
      return "Let's build your complete program.\n\nHeight in cm?"
    }

    // BMI / calories
    if (has(msg, "bmi") || has(msg, "calorie")) {
      if (p.weight && p.height) return showStats(p)
      setProfile({ ...p, step: "height" })
      return "Height in cm?"
    }

    // Diet
    if (has(msg, "diet")) {
      if (p.weight && p.height && p.age && p.gender && p.activity) {
        return getDietPlan(p, calcTDEE(p.weight, p.height, p.age, p.gender, p.activity))
      }
      setProfile({ ...p, step: "height" })
      return "I'll build your diet plan. Height in cm?"
    }

    // Workout
    // Workout location/type update
    const isLocationUpdate =
      (msg.includes("home") || msg.includes("gym") || msg.includes("calisthenics") || msg.includes("calistenic") || msg.includes("bodyweight") || msg.includes("both")) &&
      (msg.includes("workout") || msg.includes("train") || msg.includes("exercise") || msg.includes("will do") || msg.includes("i do") || msg.includes("i go") || msg.includes("i use") || msg.includes("i have"))
    if (isLocationUpdate) {
      let newType = p.workoutType || "gym"
      if (msg.includes("home") && !msg.includes("gym")) newType = "home"
      else if (msg.includes("gym") && !msg.includes("home")) newType = "gym"
      else if ((msg.includes("both") || (msg.includes("home") && msg.includes("gym")))) newType = "both"
      else if (msg.includes("calisthenics") || msg.includes("calistenic") || msg.includes("bodyweight")) newType = "home"
      setProfile({ ...p, workoutType: newType })
      const typeLabel = newType === "home" ? "home/bodyweight" : newType === "both" ? "gym + home" : "gym"
      return "Got it — updated your workout to " + typeLabel + "! 💪\n\nSay 'workout' for a fresh plan tailored to your setup."
    }

    if (has(msg, "workout")) {

  // If user profile already exists, build workout immediately
  if (p.height && p.weight && p.age && p.gender && p.activity && p.goal) {

    // Default values if not set
    const planProfile = {
      ...p,
      workoutType: p.workoutType || "gym",
      workoutDays: p.workoutDays || 4
    }

    return getWorkoutPlan(planProfile)
  }

  // Otherwise start onboarding
  setProfile({ ...p, step: "height" })
  return "Let me build your workout. Height in cm?"
}

    // Weight loss
    if (has(msg, "weight_loss") || has(msg, "abs")) {
      return "Simple truth: fat loss = calorie deficit + protein + consistency.\n\n→ Eat 300-400 kcal below maintenance\n→ 1.8-2g protein per kg\n→ Lift weights 3-4x/week\n→ Walk 8-10k steps daily\n→ Sleep 7-9 hours\n\nAbs show when body fat is low — 12-15% men, 18-22% women.\n\nWant your exact calorie target? Say 'calculate my BMI'."
    }

    // Muscle gain
    if (has(msg, "muscle_gain")) {
      return "Muscle growth = progressive overload + protein + sleep.\n\n→ Eat 200-400 kcal above maintenance\n→ 2g protein per kg bodyweight\n→ Compound lifts: Squat, Deadlift, Bench, Row\n→ Add weight every week\n→ Sleep 8+ hours\n→ Creatine 5g/day — most proven supplement\n\nWant a full muscle building program?"
    }

    // Rest
    if (has(msg, "rest")) return "Rest is training.\n\nMuscles grow during recovery, not during the workout.\n\n→ Beginners: 2-3 rest days/week\n→ Intermediate: 1-2 rest days/week\n→ Advanced: minimum 1 day\n\nActive recovery: 20-30 min walk, stretch, foam roll.\nSleep: 7-9 hours — non-negotiable."

    // Protein
    if (has(msg, "protein")) {
      const target = p.weight ? Math.round(p.weight * 2) + "g/day for you (" + p.weight + "kg)" : "1.8-2.2g per kg bodyweight"
      return "Protein target: " + target + "\n\nTop sources:\n" + (p.religion === "muslim" ? "Halal chicken, halal beef, fish, eggs, lentils" : p.religion === "hindu" ? "Chicken, fish, eggs, paneer, dal" : p.religion === "vegetarian" ? "Eggs, paneer, Greek yogurt, lentils, chickpeas" : p.religion === "vegan" ? "Tofu, lentils, chickpeas, soy milk, tempeh" : "Chicken, beef, fish, eggs, Greek yogurt") + "\n\nHit this every day. Non-negotiable for results."
    }

    // Gym wear
    if (has(msg, "gymwear")) {
      if (msg.includes("buy") || msg.includes("purchase") || msg.includes("shop") || msg.includes("order now") || msg.includes("want to get")) {
        // User wants to buy — show products instead of guide
        if (products.length > 0) {
          const rawCats = (() => { try { return JSON.parse(s.product_categories || "[]") } catch { return [] } })()
          const cats: string[] = rawCats.map((c: any) => typeof c === "string" ? c : c.name).filter(Boolean)
          if (cats.length > 1) {
            modeRef.current = "awaiting_category"
            return "Great choice! What are you looking for? 🛍️\n\n" + cats.map((c: string, i: number) => (i+1) + ". " + c).join("\n") + "\n\nJust type the number or name!"
          }
          const lines = products.slice(0,5).map((p: any) => "👕 " + p.name + (p.price ? " — BDT " + p.price : "") + "\n   → /products/" + (p.slug || p.id)).join("\n\n")
          return "Here's our collection:\n\n" + lines + "\n\nNeed size help? Just ask! 📏"
        }
      }
      return "GYM WEAR GUIDE by Flextreme\n\nLifting:\n→ Compression top (muscle support + looks elite)\n→ Compression shorts/leggings (full range of motion)\n→ Flat-soled shoes (NOT running shoes for squats/deadlifts)\n\nCardio/HIIT:\n→ Lightweight compression tee\n→ Compression shorts (no chafing)\n→ Cushioned running shoes\n\nYoga/Flexibility:\n→ Fitted compression leggings\n→ Breathable top\n\nAlways choose:\n→ Sweat-wicking (never cotton)\n→ 4-way stretch\n→ Compression fit\n\nFlextreme checks every box. See our Products page. 🔥"
    }

    // Catch bare numbers after size guide (user sent measurement without keyword)
    if (modeRef.current === "awaiting_measurement" && hasNum && num >= 20 && num <= 200) {
      // Treat as width measurement — route back into size logic
      modeRef.current = null
      return getReply("width " + num)
    }
    if (modeRef.current === "awaiting_measurement" && !hasNum) {
      modeRef.current = null  // clear if they said something else
    }

    // Size — reads from size_tables JSON (admin Size Guide)
    if (has(msg, "size")) {
      let tables: any[] = []
      try { if (s.size_tables) tables = JSON.parse(s.size_tables) } catch {}
      if (tables.length === 0) return "Size guide not set up yet. Check our size guide page or WhatsApp us!"

      // Pick table based on product keywords in message
      let table = tables[0]
      for (const t of tables) {
        const tname = (t.name || "").toLowerCase()
        const words = tname.split(/[\s\/\-_,]+/).filter((w: string) => w.length > 3)
        if (words.some((k: string) => msg.includes(k))) { table = t; break }
        if ((msg.includes("hoodie") || msg.includes("sweat")) && tname.includes("hood")) { table = t; break }
        if ((msg.includes("pant") || msg.includes("bottom") || msg.includes("trouser")) && (tname.includes("pant") || tname.includes("bottom"))) { table = t; break }
        if (msg.includes("short") && tname.includes("short")) { table = t; break }
      }

      const unit = table.unit || "cm"
      const tableName = table.name || "Size Guide"
      const isCompression = tableName.toLowerCase().includes("compress") || tableName.toLowerCase().includes("skin") || tableName.toLowerCase().includes("tight")

      // Find columns by type
      const widthCol = table.columns?.find((c: any) => {
        const n = c.name.toLowerCase()
        return n.includes("width") || n.includes("chest") || n.includes("bust")
      })
      const lengthCol = table.columns?.find((c: any) => c.name.toLowerCase().includes("length"))

      // Extract ALL numbers from message
      const nums = [...msg.matchAll(/(\d{2,3}(?:\.\d)?)/g)].map(m => parseFloat(m[1]))

      // Detect what measurement type they gave
      const gavWidth = msg.includes("width") || msg.includes("chest") || msg.includes("wide") || msg.includes("bust")
      const gavLength = msg.includes("length") || msg.includes("long") || msg.includes("len")

      // Helper: find best size from a column value
      function findSize(colId: string, val: number, goDown = false) {
        let idx = table.rows.length - 1
        for (let i = 0; i < table.rows.length; i++) {
          const rowVal = parseFloat(table.rows[i].values?.[colId] || "0")
          if (rowVal >= val) { idx = i; break }
        }
        if (goDown && idx > 0) idx = idx - 1
        return { row: table.rows[idx], index: idx }
      }

      // User gave a width/chest measurement
      if (gavWidth && nums.length > 0 && widthCol) {
        const userWidth = nums[0]
        const fullChest = Math.round(userWidth * 2)
        const { row: exactRow, index: exactIdx } = findSize(widthCol.id, userWidth, false)
        const specs = (r: any) => table.columns.map((c: any) => c.name + " " + (r.values?.[c.id] || "—") + unit).join(" | ")
        let reply = "Shirt width " + userWidth + unit + " → Full chest ~" + fullChest + unit + "\n\n"
        if (isCompression) {
          // For compression: recommend 3-5cm smaller (skin-tight fit)
          // Find size where width is 3-5cm less than user measurement
          const targetWidth = userWidth - 4  // go 4cm smaller
          let compIdx = exactIdx
          for (let i = 0; i < table.rows.length; i++) {
            const rw = parseFloat(table.rows[i].values?.[widthCol.id] || "0")
            if (rw >= targetWidth) { compIdx = i; break }
          }
          const compRow = table.rows[Math.min(compIdx, exactIdx)]  // never go bigger
          const diff = userWidth - parseFloat(compRow.values?.[widthCol.id] || String(userWidth))
          reply += "⚡ " + tableName + " (compression/skin-fit):\n"
          reply += "→ Skin-tight fit: Size " + compRow.label + " (~" + Math.abs(Math.round(diff)) + "cm smaller — stretches with your body)\n"
          if (exactRow.label !== compRow.label) reply += "→ Relaxed fit: Size " + exactRow.label + "\n"
          reply += "\n" + compRow.label + " specs: " + specs(compRow) + "\n"
          reply += "\n💡 Compression stretches 20-30%. Go smaller for that locked-in feel."
        } else {
          reply += "Recommended: Size " + exactRow.label + "\n"
          reply += exactRow.label + " specs: " + specs(exactRow)
        }
        return reply
      }

      // User gave a length measurement
      if (gavLength && nums.length > 0 && lengthCol) {
        const userLength = nums[0]
        const { row } = findSize(lengthCol.id, userLength, false)
        const specs = table.columns.map((c: any) => c.name + " " + (row.values?.[c.id] || "—") + unit).join(" | ")
        return "Shirt length " + userLength + unit + " → Size " + row.label + "\n" + specs + (isCompression ? "\n\nCompression fit — stretches with your body! 💪" : "")
      }

      // User gave a number but no keyword — try to guess which column
      if (nums.length > 0) {
        const val = nums[0]
        // Try width column first
        if (widthCol) {
          const { row: exactRow, index: exactIdx } = findSize(widthCol.id, val, false)
          const compRow = exactIdx > 0 ? table.rows[exactIdx - 1] : exactRow
          const specs = table.columns.map((c: any) => c.name + " " + (exactRow.values?.[c.id] || "—") + unit).join(" | ")
          let reply = "Taking " + val + " as your shirt width:\n\n"
          if (isCompression) {
            reply += "→ Compression: Size " + compRow.label + " | Regular: Size " + exactRow.label + "\n"
          } else {
            reply += "→ Size " + exactRow.label + "\n"
          }
          reply += exactRow.label + " specs: " + specs
          reply += "\n\nWas that your width or length? Tell me like: 'width 34' or 'length 65'"
          return reply
        }
      }

      // No measurement — show guide with smart prompts
      modeRef.current = "awaiting_measurement"
      const colNames = table.columns?.map((c: any) => c.name).join(" & ") || "measurements"
      let reply = "SIZE GUIDE — " + tableName + " (" + unit + ")\n\n"
      if (isCompression) reply += "COMPRESSION FIT — skin tight, stretches with your body\n\n"
      reply += "HOW TO MEASURE (lay shirt flat):\n"
      // Build instructions based on actual column names
      for (const col of (table.columns || [])) {
        const n = col.name.toLowerCase()
        if (n.includes("width") || n.includes("chest")) reply += "→ " + col.name + ": armpit to armpit (one side)\n"
        else if (n.includes("length")) reply += "→ " + col.name + ": collar to bottom hem\n"
        else reply += "→ " + col.name + ": " + (col.description || "measure as indicated") + "\n"
      }
      reply += "\nSIZES:\n"
      for (const row of table.rows) {
        const vals = table.columns.map((c: any) => c.name + " " + (row.values?.[c.id] || "—")).join(" | ")
        reply += row.label + ": " + vals + "\n"
      }
      if (isCompression) reply += "\nFor skin-tight fit → go 1 size DOWN from your normal size\n"
      reply += "\nExample: say 'width 33' or 'length 65' and I'll recommend your size! 📏"
      if (tables.length > 1) {
        reply += "\n\nAvailable guides:\n"
        tables.forEach((t: any, i: number) => { reply += (i + 1) + ". " + t.name + "\n" })
      }
      return reply
    }
    // Delivery
    if (has(msg, "delivery") || modeRef.current === "awaiting_delivery_city") {
      const isFreeDelivery = s["free_delivery"] === "true"

      if (isFreeDelivery) {
        modeRef.current = null
        return "🚚 FREE DELIVERY nationwide!\n\nWe deliver to every corner of Bangladesh absolutely FREE.\n✓ No minimum order\n✓ Cash on Delivery — pay when it arrives\n✓ Zero advance payment\n\nWhich city are you in? I can tell you the estimated delivery time!"
      }

      // Try to find city in message — search delivery_groups from DB first
      function findZoneFromDB(cityMsg: string): { label: string; charge: string; days: string } | null {
        try {
          const dg = s.delivery_groups ? JSON.parse(s.delivery_groups) : null
          if (!dg) return null
          for (const group of dg) {
            for (const z of group.zones) {
              const zname = z.name.toLowerCase().replace(/[^a-z]/g, "")
              const words = z.name.toLowerCase().split(/[\s\/\-,]+/)
              // Check if any word of zone name appears in message, or message contains zone name
              const match = words.some((w: string) => w.length > 3 && cityMsg.includes(w)) ||
                cityMsg.includes(zname) ||
                // Also check reverse — zone name contains what user typed
                words.some((w: string) => w.length > 3 && zname.startsWith(cityMsg.replace(/[^a-z]/g, "").slice(0,5)))
              if (match) return { label: z.name, charge: z.charge || "", days: z.days || "3-5" }
            }
          }
        } catch {}
        return null
      }

      // Also check common Bangladeshi area → zone mappings
      const areaMap: Record<string, string> = {
        // ── Dhaka Division ──
        // Dhaka City areas
        "dhanmondi": "dhaka", "gulshan": "dhaka", "banani": "dhaka", "mirpur": "dhaka",
        "uttara": "dhaka", "motijheel": "dhaka", "badda": "dhaka", "rampura": "dhaka",
        "mohammadpur": "dhaka", "bashundhara": "dhaka", "farmgate": "dhaka",
        "malibagh": "dhaka", "khilgaon": "dhaka", "lalbagh": "dhaka", "demra": "dhaka",
        "jatrabari": "dhaka", "shyamoli": "dhaka", "kalabagan": "dhaka", "wari": "dhaka",
        "tejgaon": "dhaka", "paltan": "dhaka", "shahbag": "dhaka", "azimpur": "dhaka",
        "elephant road": "dhaka", "new market": "dhaka", "puran dhaka": "dhaka",
        "old dhaka": "dhaka", "keraniganj": "dhaka", "savar": "dhaka",
        "ashulia": "dhaka", "hemayetpur": "dhaka",
        // Narayanganj
        "narayanganj": "narayanganj", "siddhirganj": "narayanganj", "fatullah": "narayanganj",
        "rupganj": "narayanganj", "sonargaon": "narayanganj",
        // Gazipur
        "gazipur": "gazipur", "tongi": "gazipur", "joydebpur": "gazipur",
        "kaliakair": "gazipur", "kapasia": "gazipur",
        // Narsingdi / Manikganj / Munshiganj
        "narsingdi": "dhaka district", "manikganj": "dhaka district",
        "munshiganj": "dhaka district", "vikrampur": "dhaka district",
        // Mymensingh Division
        "mymensingh": "mymensingh", "mymansingh": "mymensingh", "mymensing": "mymensingh",
        "mymansing": "mymensingh", "momensing": "mymensingh", "memensing": "mymensingh",
        "sherpur": "mymensingh", "netrokona": "mymensingh", "jamalpur": "mymensingh",
        "kishoreganj": "mymensingh",

        // ── Chittagong Division ──
        "chittagong": "chittagong", "chattogram": "chittagong", "ctg": "chittagong",
        "chottogram": "chittagong",
        "cox": "chittagong", "coxs bazar": "chittagong", "cox bazar": "chittagong",
        "teknaf": "chittagong", "bandarban": "chittagong", "rangamati": "chittagong",
        "khagrachhari": "chittagong", "feni": "chittagong", "noakhali": "chittagong",
        "lakshmipur": "chittagong", "chandpur": "chittagong",
        "comilla": "comilla", "cumilla": "comilla", "cumila": "comilla",
        "comila": "comilla", "brahmanbarai": "comilla", "brahmanbaria": "comilla",

        // ── Sylhet Division ──
        "sylhet": "sylhet", "sillet": "sylhet",
        "moulvibazar": "sylhet", "moulvi bazar": "sylhet", "moulovibazar": "sylhet",
        "habiganj": "sylhet", "habigonj": "sylhet",
        "sunamganj": "sylhet", "sunamgang": "sylhet",

        // ── Rajshahi Division ──
        "rajshahi": "rajshahi", "rajsahi": "rajshahi",
        "natore": "rajshahi", "naogaon": "rajshahi", "nawabganj": "rajshahi",
        "chapai": "rajshahi", "chapainawabganj": "rajshahi",
        "pabna": "rajshahi", "sirajganj": "rajshahi",

        // ── Khulna Division ──
        "khulna": "khulna", "kulna": "khulna",
        "jessore": "khulna", "jashore": "khulna", "jashor": "khulna", "jessor": "khulna",
        "satkhira": "khulna", "bagerhat": "khulna", "jhenaidah": "khulna",
        "magura": "khulna", "narail": "khulna", "chuadanga": "khulna", "meherpur": "khulna",
        "kushtia": "khulna",

        // ── Rangpur Division ──
        "rangpur": "rangpur", "rangpour": "rangpur",
        "dinajpur": "rangpur", "nilphamari": "rangpur", "lalmonirhat": "rangpur",
        "kurigram": "rangpur", "gaibandha": "rangpur", "thakurgaon": "rangpur",
        "panchagarh": "rangpur",

        // ── Barisal Division ──
        "barisal": "barisal", "barishal": "barisal",
        "patuakhali": "barisal", "barguna": "barisal", "jhalokathi": "barisal",
        "pirojpur": "barisal", "bhola": "barisal",

        // ── Bogra (Rajshahi division cities) ──
        "bogra": "bogra", "bogura": "bogra",
      }

      // Normalize message for matching
      const cleanMsg = msg.replace(/[^a-z\s]/g, "").trim()

      // Try DB lookup first
      let zone = findZoneFromDB(cleanMsg)

      // If not found, try area map to get a better search term
      if (!zone) {
        const mapped = Object.keys(areaMap).find(a => cleanMsg.includes(a))
        if (mapped) zone = findZoneFromDB(areaMap[mapped])
      }

      if (zone) {
        modeRef.current = "awaiting_delivery_city"  // stay in delivery mode for follow-up cities
        const price = zone.charge ? "BDT " + zone.charge : "Free"
        return "📦 Delivery to " + zone.label + ":\n\n💰 Charge: " + price + "\n⏱ Estimated time: " + zone.days + " business days\n\nCash on Delivery — pay when it arrives! 💪\n\nAnother city? Just type it! 🗺️"
      }

      // No city found — ask
      modeRef.current = "awaiting_delivery_city"
      let preview = ""
      try {
        const dg = s.delivery_groups ? JSON.parse(s.delivery_groups) : null
        if (dg && dg[0]?.zones?.[0]) {
          const first = dg[0].zones[0]
          const last = dg[dg.length-1]?.zones?.[0]
          preview = "\n\nFor example:\n📍 " + first.name + " — BDT " + first.charge + " (" + first.days + " days)" +
            (last ? "\n📍 " + last.name + " — BDT " + last.charge + " (" + last.days + " days)" : "")
        }
      } catch {}
      return "Which city or area are you in? 🗺️\n\nTell me your city and I\'ll give you the exact delivery charge and time from our table." + preview
    }

    // ── PRODUCT BROWSING    // ── PRODUCT BROWSING — categories from DB settings, products from DB ──
    const isBuyIntent = msg.includes("buy") || msg.includes("want") || msg.includes("get me") || msg.includes("recommend") || msg.includes("suggest") || msg.includes("looking for") || msg.includes("show me") || msg.includes("which product") || msg.includes("best product") || msg.includes("what product") || msg.includes("shop") || has(msg, "product")
    const isProductMention = msg.includes("top") || msg.includes("shirt") || msg.includes("tee") || msg.includes("compression") || msg.includes("short") || msg.includes("pant") || msg.includes("jogger") || msg.includes("legging") || msg.includes("hoodie") || msg.includes("sleeve") || msg.includes("accessory") || msg.includes("accessories")

    // If user chose a category or subcategory
    if (modeRef.current && modeRef.current.startsWith("category:")) {
      const chosenCat = modeRef.current.replace("category:", "").toLowerCase()
      modeRef.current = null
      const catProducts = products.filter((p: any) =>
        (p.category || "").toLowerCase().includes(chosenCat) ||
        p.name.toLowerCase().includes(chosenCat) ||
        (p.description || "").toLowerCase().includes(chosenCat)
      )
      const toShow = catProducts.length > 0 ? catProducts : products
      const lines = toShow.slice(0,6).map((p: any) => {
        const isComp = (p.name + " " + (p.category || "") + " " + (p.description || "")).toLowerCase().includes("compress")
        return "👕 " + p.name + (p.price ? " — BDT " + p.price : "") +
          (isComp ? " ⚡ Compression" : "") +
          (p.sizes?.length ? "\n   Sizes: " + p.sizes.join(", ") : "") +
          (p.colors?.length ? "\n   Colors: " + p.colors.join(", ") : "") +
          "\n   → /products/" + (p.slug || p.id)
      }).join("\n\n")
      // Check if there are subcategories worth showing
      const subcatKeywords = ["compression","hoodie","tank","sleeveless","half sleeve","full sleeve","shorts","jogger","legging"]
      const foundSubcats = subcatKeywords.filter(k =>
        toShow.some((p: any) => (p.name + " " + (p.category || "") + " " + (p.description || "")).toLowerCase().includes(k))
      )
      let reply = (catProducts.length > 0
        ? "Here are our " + chosenCat + " products:\n\n" + lines
        : "Here\'s our full collection:\n\n" + lines)
      if (foundSubcats.length > 1 && toShow.length > 3) {
        reply += "\n\nFilter by type: " + foundSubcats.map((k, i) => (i+1) + ". " + k).join(" | ")
        reply += "\nOr ask: \'show me hoodies\' / \'show compression tops\'"
      }
      reply += "\n\nWant size help? Just ask! 📏"
      return reply
    }

    // Check if user is replying to a category choice
    const cats: string[] = (() => {
      try {
        const raw = JSON.parse(s.product_categories || "[]")
        return raw.map((c: any) => typeof c === "string" ? c : c.name).filter(Boolean)
      } catch { return [] }
    })()
    if (cats.length > 0 && modeRef.current === "awaiting_category") {
      // Allow numeric selection too
      const numChoice = parseInt(msg.trim())
      const choiceByNum = !isNaN(numChoice) && numChoice >= 1 && numChoice <= cats.length ? cats[numChoice-1] : null
      const choice = choiceByNum || cats.find((c: string) => msg.includes(c.toLowerCase()))
      if (choice) {
        modeRef.current = "category:" + choice
        // Immediately get products for this category
        const catProducts = products.filter((p: any) =>
          (p.category || "").toLowerCase().includes(choice.toLowerCase()) ||
          p.name.toLowerCase().includes(choice.toLowerCase())
        )
        modeRef.current = null
        const lines = catProducts.slice(0,5).map((p: any) =>
          "👕 " + p.name + (p.price ? " — BDT " + p.price : "") +
          (p.sizes?.length ? "\n   Sizes: " + p.sizes.join(", ") : "") +
          (p.colors?.length ? "\n   Colors: " + p.colors.join(", ") : "") +
          "\n   → /products/" + (p.slug || p.id)
        ).join("\n\n")
        return "Here are our " + choice + " products:\n\n" +
          (catProducts.length > 0 ? lines : "No products in this category yet.") +
          "\n\nNeed size help? Just ask! 📏"
      }
    }

    // Direct subcategory search — "show me hoodies", "compression tops", "tank tops"
    const subcatMap: Record<string, string[]> = {
      "compression": ["compress","skin-fit","tight"],
      "hoodie": ["hoodie","sweatshirt","hood"],
      "tank": ["tank","sleeveless"],
      "sleeveless": ["sleeveless","tank"],
      "half sleeve": ["half-sleeve","half sleeve"],
      "full sleeve": ["full-sleeve","full sleeve","long sleeve"],
      "shorts": ["short"],
      "jogger": ["jogger","sweatpant"],
      "legging": ["legging","tight pant"],
    }
    for (const [subcat, keywords] of Object.entries(subcatMap)) {
      if (msg.includes(subcat) && products.length > 0) {
        const matched = products.filter((p: any) =>
          keywords.some(k => (p.name + " " + (p.category || "") + " " + (p.description || "")).toLowerCase().includes(k))
        )
        if (matched.length > 0) {
          const isComp = subcat === "compression"
          const lines = matched.slice(0,5).map((p: any) =>
            "👕 " + p.name + (p.price ? " — BDT " + p.price : "") +
            (p.sizes?.length ? "\n   Sizes: " + p.sizes.join(", ") : "") +
            (p.colors?.length ? "\n   Colors: " + p.colors.join(", ") : "") +
            "\n   → /products/" + (p.slug || p.id)
          ).join("\n\n")
          let reply = "Here are our " + subcat + " products:\n\n" + lines
          if (isComp) reply += "\n\n⚡ These are compression fit — go 1 size smaller for skin-tight feel!"
          reply += "\n\nWant size help? Just ask! 📏"
          return reply
        }
      }
    }

    if (isBuyIntent || isProductMention) {
      if (products.length === 0) {
        return "Check out our Products page for the full collection! 🔥 /products"
      }
      // If we have categories, ask which one
      if (cats.length > 1) {
        modeRef.current = "awaiting_category"
        return "What are you looking for? 🛍️\n\n" + cats.map((c: string, i: number) => (i+1) + ". " + c).join("\n") + "\n\nJust type the number or name!"
      }
      // No categories or just one — show all products
      const lines = products.slice(0,5).map((p: any) =>
        "👕 " + p.name + (p.price ? " — BDT " + p.price : "") +
        (p.sizes?.length ? "\n   Sizes: " + p.sizes.join(", ") : "") +
        (p.colors?.length ? "\n   Colors: " + p.colors.join(", ") : "") +
        "\n   → /products/" + (p.slug || p.id)
      ).join("\n\n")
      return "Here's what we have:\n\n" + lines + "\n\nAll sweat-wicking, 4-way stretch, compression fit. 🔥"
    }

    // ── ORDER TRACKING ──
    // Detect track/status/order lookup intent
    const isOrderTrack =
      msg.includes("track") || msg.includes("where is my order") || msg.includes("my order") ||
      msg.includes("order status") || msg.includes("status of my order") || msg.includes("check order") ||
      msg.includes("find my order") || msg.includes("find my order") ||
      msg.includes("when will") && (msg.includes("order") || msg.includes("package") || msg.includes("parcel") || msg.includes("product") || msg.includes("item") || msg.includes("delivery") || msg.includes("arrive") || msg.includes("get my") || msg.includes("come")) ||
      msg.includes("when will i get") || msg.includes("when will it arrive") || msg.includes("where is my package") ||
      msg.includes("where is my parcel") || msg.includes("how long will") && msg.includes("deliver") ||
      msg.includes("when is my") && (msg.includes("order") || msg.includes("delivery")) ||
      msg.includes("what time") && msg.includes("order") ||
      msg.includes("how much time") && (msg.includes("order") || msg.includes("deliver") || msg.includes("arrive"))
    const orderTrackWords = ["track","find","check","where","status","lookup","locate","search","show","update"]
    const orderRefWords = ["order","parcel","package","shipment"]
    const hasAnyOrderRef = orderRefWords.some(w => msg.includes(w))
    const hasAnyAction = orderTrackWords.some(w => msg.includes(w))
    const hasOrderIntent = isOrderTrack || (hasAnyOrderRef && hasAnyAction) ||
      msg.includes("my order") || msg.includes("my parcel") || msg.includes("my package")
    if (hasOrderIntent) {
      modeRef.current = "order_lookup"
      return "Sure! Send me the phone number you used when placing your order and I\'ll check it right away. 📦"
    }

    // General order info (how to order)
    if (has(msg, "order")) return "HOW TO ORDER:\n\n1. Products page\n2. Choose item\n3. Pick size + color\n4. Enter name, phone, address\n5. Order Now\n\nCOD — pay on delivery. Confirmed via WhatsApp.\n\nAlready placed an order? Say 'track my order' and I'll look it up! 📦"

    // Payment
    if (has(msg, "payment")) return "Cash on Delivery only. Pay when it arrives. Zero advance. 100% safe."

    // Contact
    if (has(msg, "contact")) return "WhatsApp: +8801935962421\n9am-9pm daily.\n\nOr click the green button on this page."

    // Product
    if (has(msg, "product")) return "Flextreme makes premium compression wear:\n\nCompression Tops\nCompression Shorts + Leggings\nAccessories\n\nAll: Sweat-wicking. 4-way stretch. Compression fit. Muscle-definition cut.\n\nSee Products page for full collection."

    // Brand / Flextreme standalone
    if (msg === "flextreme" || msg === "flex" || 
        msg.includes("what is flextreme") || msg.includes("tell me about flextreme") ||
        msg.includes("about flextreme") || msg.includes("flextreme brand") ||
        msg.includes("story of flextreme") || msg.includes("who is flextreme") ||
        (msg.includes("flextreme") && msg.split(" ").length <= 3)) {
      return (s.about_story || "Flextreme is a premium gym wear brand from Bangladesh, built by athletes for athletes.") + "\n\nWork Hard. Flex Extreme. 🔥\n\nSee our products: /products"
    }
    if (has(msg, "brand")) return (s.about_story || "Flextreme — premium gym wear from Bangladesh. Built by athletes, for athletes.") + "\n\nWork Hard. Flex Extreme."

    // Discount
    if (has(msg, "discount")) return "Follow @flextremefit on Instagram, Facebook, TikTok for deals.\n\nOr WhatsApp: +8801935962421"

    // One last attempt — check for numbers that might be height/weight
    if (hasNum && num >= 140 && num <= 220 && !p.height) {
      setProfile({ ...p, height: num, step: "weight" })
      return "Taking " + num + " as your height in cm. Weight in kg?"
    }
    if (hasNum && num >= 40 && num <= 200 && !p.weight && p.height) {
      const b = calcBMI(num, p.height)
      const info = bmiInfo(b)
      setProfile({ ...p, weight: num, step: "age" })
      return "Weight " + num + "kg. BMI: " + b.toFixed(1) + " — " + info.cat + "\n\nAge?"
    }

    // ── CHANGE REQUESTS ──
    const isChangeWorkout = (msg.includes("change") || msg.includes("different") || msg.includes("new plan") || msg.includes("another") || msg.includes("redo") || msg === "change it") &&
      (msg.includes("workout") || msg.includes("exercise") || msg.includes("plan") || msg.includes("routine") || msg.includes("program") || msg === "change it")
    const isChangeDiet = (msg.includes("change") || msg.includes("different") || msg.includes("update") || msg.includes("redo")) &&
      (msg.includes("diet") || msg.includes("meal") || msg.includes("food") || msg.includes("eating"))
    if (isChangeWorkout && p.weight) {
      const alt = (p.workoutType === "gym") ? "home" : "gym"
      const altProfile = { ...p, workoutType: alt }
      setProfile(altProfile)
      return getWorkoutPlan(altProfile) + "\n\n(Switched to " + alt + " version)"
    }
    if (isChangeDiet && p.weight && p.height && p.age && p.gender && p.activity) {
      // Also update religion if mentioned in same message
      let updatedP = p
      if (/muslim|halal/.test(msg)) updatedP = { ...p, religion: "muslim" }
      else if (/hindu/.test(msg)) updatedP = { ...p, religion: "hindu" }
      else if (/\bvegan\b/.test(msg)) updatedP = { ...p, religion: "vegan" }
      else if (/vegetarian|veggie|vegeterian/.test(msg)) updatedP = { ...p, religion: "vegetarian" }
      else if (/not vegan|not vegetarian|i eat meat/.test(msg)) updatedP = { ...p, religion: "none" }
      if (updatedP.religion !== p.religion) setProfile(updatedP)
      return getDietPlan(updatedP, calcTDEE(updatedP.weight!, updatedP.height!, updatedP.age!, updatedP.gender!, updatedP.activity!))
    }

    // Gym alone
    if (msg === "gym" || (msg.includes("go to gym") || msg.includes("i gym") || msg.includes("i lift"))) {
      setProfile({ ...p, workoutType: "gym" })
      return "Gym mode! 🏋️ Want a workout plan, diet chart, or something else?"
    }

    // Insults — be graceful
    if (msg.includes("dumb") || msg.includes("stupid") || msg.includes("idiot") || msg.includes("useless") || msg.includes("worst") || msg.includes("terrible") || msg.includes("hate you")) {
      modeRef.current = null
      return "I hear you — I'm still learning! 😅\nTry rephrasing and I'll do my best.\n\nOr WhatsApp us for instant human help: +8801935962421"
    }

    // Context-aware fallback
    if (modeRef.current === "order_lookup") {
      return "Please send your phone number (e.g. 01712345678) to check your order."
    }
    if (p.step) {
      const hints: Record<string,string> = {
        height:"Height in cm? (e.g. 175)",
        weight:"Weight in kg? (e.g. 75)",
        age:"How old are you?",
        gender:"Male or female?",
        activity:"Activity level 1-5?",
        goal:"Goal: 1-Lose fat, 2-Build muscle, 3-Maintain?",
        religion:"Diet type 1-5?",
      }
      return "I didn\'t catch that. " + (hints[p.step] || "Please continue.")
    }
    return "Got it — what specifically do you need?\n\n🚚 Find my order\n🚛 Delivery info\n🛍️ Shop products\n💪 Workout plan\n🥗 Diet chart\n📊 BMI + calories\n💊 Supplements\n👕 Gym gear"
  }

  async function sendMessage(text?: string) {

  const userMsg = (text ?? input).trim()
   if (userMsg.toLowerCase().includes("talk to human")) {
  window.open("https://wa.me/8801935962421?text=Hi%20Flextreme!", "_blank")
  return
}
  if (!userMsg || loading) return

  setInput("")

  setMessages(prev => [
    ...prev,
    { role: "user", content: userMsg }
  ])

  setLoading(true)

  setTimeout(async () => {

    let reply = getReply(userMsg)

    // Phone lookup is async — getReply returns sentinel and handles its own async + setLoading
    if (reply === "__ASYNC__") return

    // Auto-corrected phone number
    if (reply.startsWith("__PHONE_LOOKUP__:")) {
      const fixedPhone = reply.replace("__PHONE_LOOKUP__:", "")
      modeRef.current = "order_lookup"
      // Recurse with fixed number
      const fixedReply = getReply(fixedPhone)
      if (fixedReply === "__ASYNC__") return
      reply = fixedReply
    }

    // NLP handles intent classification

    setMessages(prev => [
      ...prev,
      { role: "assistant", content: reply }
    ])

    setLoading(false)

  }, 300 + Math.random() * 200)

}

  const quick = [
"Find my order 🚚",
"Delivery info 🚚",
"Shop Products 🛍️",
"Size guide 📏",
"Build my full plan 💪",
"Calculate BMI 📊",
"Workout plan 🏋️",
"Diet chart 🥗",
"Talk to human 💬"
]

function handleSwipe(e:any){
  if(window.innerWidth > 768) return
  if(hidden) { setHidden(false); return }

  const startX = e.touches ? e.touches[0].clientX : e.clientX
  const startY = e.touches ? e.touches[0].clientY : e.clientY

  function onEnd(ev:any){
    const endX = ev.changedTouches ? ev.changedTouches[0].clientX : ev.clientX
    const endY = ev.changedTouches ? ev.changedTouches[0].clientY : ev.clientY
    const dx = endX - startX
    const dy = Math.abs(endY - startY)
    // Swipe left or right (more horizontal than vertical, min 40px)
    if(Math.abs(dx) > 40 && Math.abs(dx) > dy) {
      setHidden(true)
    }
    window.removeEventListener("touchend", onEnd)
    window.removeEventListener("mouseup", onEnd)
  }
  window.addEventListener("touchend", onEnd)
  window.addEventListener("mouseup", onEnd)
}


return (
<>
      <style dangerouslySetInnerHTML={{__html:`
        @keyframes chatPop{0%{transform:scale(0.88) translateY(10px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}
        @keyframes msgIn{0%{transform:translateY(5px);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes dot{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}
        @keyframes badgePop{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}
        @keyframes labelSlide{0%{opacity:0;transform:translateX(8px)}100%{opacity:1;transform:translateX(0)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 4px 20px rgba(0,0,0,0.35),0 0 0 0 rgba(0,0,0,0.1)}50%{box-shadow:0 4px 20px rgba(0,0,0,0.35),0 0 0 8px rgba(0,0,0,0.04)}}
        .cwin{animation:chatPop 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards;}
        .cmsg{animation:msgIn 0.18s ease-out forwards;}
        .d1{animation:dot 1.2s ease-in-out infinite;}
        .d2{animation:dot 1.2s ease-in-out 0.2s infinite;}
        .d3{animation:dot 1.2s ease-in-out 0.4s infinite;}
        .ubadge{animation:badgePop 1.5s ease-in-out infinite;}
        .clabel{animation:labelSlide 0.3s ease-out forwards;}
        .ctoggle{animation:glowPulse 2.5s ease-in-out infinite;}
        @media(max-width:768px){
          .peek-tilt{animation:peekNod 2s ease-in-out infinite!important;}
        }
        @keyframes peekNod{0%,100%{transform:rotate(-20deg) translateY(0)}50%{transform:rotate(-15deg) translateY(-6px)}}
        .ctoggle:hover{transform:scale(1.08)!important;transition:transform 0.2s!important;}
        .qbtn:hover{background:#f0f0f0!important;}
        .cinput:focus{outline:none;border-color:#aaa!important;}
        .msgs::-webkit-scrollbar{width:4px}
        .msgs::-webkit-scrollbar-thumb{background:#e0e0e0;border-radius:4px}
      `}}/>

      {(open || fullPage) && (
        <div className="cwin" data-chatbox="true" style={fullPage ? {position:"fixed",top:0,left:0,right:0,bottom:0,width:"100%",height:"100%",backgroundColor:"white",border:"none",boxShadow:"none",zIndex:10,display:"flex",flexDirection:"column",overflow:"hidden"} : {position:"fixed",bottom:"1.5rem",right:"2rem",width:"340px",height:"540px",backgroundColor:"white",border:"1px solid #e0e0e0",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",zIndex:9998,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{background:"black",padding:"0.875rem 1rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.65rem"}}>
              <div style={{position:"relative",width:"50px"}}>

<style dangerouslySetInnerHTML={{__html:`

@keyframes robotFloat{
0%,100%{transform:translateY(0)}
50%{transform:translateY(-8px)}
}

.robotFloating{
position:absolute;
top:-32px;
left:-6px;
animation:robotFloat 2.5s ease-in-out infinite;
}

`}}/>

<svg
className={`robotFloating robotGlow ${loading ? "robotTalking" : ""}`}
width="66"
height="74"
viewBox="0 0 120 120"
>

<rect x="25" y="15" width="70" height="45" rx="12" fill="#0b1625"/>

<g className="robotEye">
<circle cx="50" cy="38" r="6" fill="#00eaff"/>
<circle cx="70" cy="38" r="6" fill="#00eaff"/>
</g>

<path
d="M48 48 Q60 56 72 48"
stroke="#00eaff"
strokeWidth="2"
strokeLinecap="round"
/>

<rect x="40" y="65" width="40" height="22" rx="6" fill="#dce2ee"/>

<rect x="45" y="88" width="8" height="10" rx="2" fill="#c8d0de"/>
<rect x="67" y="88" width="8" height="10" rx="2" fill="#c8d0de"/>

<rect x="20" y="68" width="15" height="7" rx="3" fill="#a8b4c4"/>
<rect x="85" y="68" width="15" height="7" rx="3" fill="#a8b4c4"/>

</svg>

</div>
              <div>
                <p style={{fontWeight:800,fontSize:"0.9rem",color:"white",margin:0}}>Flex — AI Fitness Coach</p>
                <div style={{display:"flex",alignItems:"center",gap:"0.3rem",marginTop:"0.15rem"}}>
                  <div style={{width:"7px",height:"7px",borderRadius:"50%",backgroundColor:"#22c55e",boxShadow:"0 0 5px #22c55e"}}/>
                  <p style={{fontSize:"0.63rem",color:"rgba(255,255,255,0.5)",margin:0}}>Online · Powered by Flextreme</p>
                </div>
              </div>
            </div>
            {!fullPage && <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",fontSize:"1.2rem",cursor:"var(--chat-cursor,auto)",padding:"0.2rem",lineHeight:1}}>✕</button>}
          </div>
          <div style={{backgroundColor:"#fafafa",borderBottom:"1px solid #eee",padding:"0.35rem 1rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            <span style={{fontSize:"0.65rem",color:"#999",fontWeight:500}}>AI Fitness + Shopping Assistant · Flextreme</span>
          </div>
          <div className="msgs" style={{flex:1,overflowY:"auto",padding:"0.875rem",display:"flex",flexDirection:"column",gap:"0.6rem"}}>
            {messages.map((msg,i)=>(
              <div key={i} className="cmsg" style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:"0.35rem"}}>
                {msg.role==="assistant"&&(
                  <div style={{width:"26px",height:"26px",backgroundColor:"black",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <img src="/logo-transparent.png" alt="" style={{width:"15px",height:"15px",objectFit:"contain",filter:"invert(1)"}}/>
                  </div>
                )}
                <div style={{maxWidth:"83%",padding:"0.55rem 0.85rem",fontSize:"0.81rem",lineHeight:1.6,whiteSpace:"pre-line",borderRadius:msg.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",backgroundColor:msg.role==="user"?"black":"#f0f0f0",color:msg.role==="user"?"white":"#1a1a1a"}}>
                  {msg.content.split(/(\bhttps?:\/\/\S+|\/products\/\S+)/g).map((part,i)=>{
                    if(/^https?:\/\//.test(part)) return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:"6px",padding:"5px 12px",background:"#0ea5e9",color:"white",borderRadius:"6px",textDecoration:"none",fontSize:"0.75rem",fontWeight:700}}>🚚 Track Package</a>
                    if(/^\/products\//.test(part)) return <a key={i} href={part} style={{display:"inline-block",marginTop:"4px",padding:"5px 12px",background:"black",color:"white",borderRadius:"6px",textDecoration:"none",fontSize:"0.75rem",fontWeight:700}}>👕 View Product →</a>
                    return <span key={i}>{part}</span>
                  })}
                </div>
              </div>
            ))}
            {loading&&(
              <div className="cmsg" style={{display:"flex",alignItems:"flex-end",gap:"0.35rem"}}>
                <div style={{width:"26px",height:"26px",backgroundColor:"black",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <img src="/logo-transparent.png" alt="" style={{width:"15px",height:"15px",objectFit:"contain",filter:"invert(1)"}}/>
                </div>
                <div style={{backgroundColor:"#f0f0f0",padding:"0.65rem 0.875rem",borderRadius:"16px 16px 16px 4px",display:"flex",gap:"0.3rem",alignItems:"center"}}>
                  <div className="d1" style={{width:"6px",height:"6px",borderRadius:"50%",backgroundColor:"#999"}}/>
                  <div className="d2" style={{width:"6px",height:"6px",borderRadius:"50%",backgroundColor:"#999"}}/>
                  <div className="d3" style={{width:"6px",height:"6px",borderRadius:"50%",backgroundColor:"#999"}}/>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>
          {messages.length<=1&&(
            <div style={{padding:"0 0.875rem 0.6rem",display:"flex",flexWrap:"wrap",gap:"0.35rem"}}>
              {quick.map(q=>(
                <button key={q} className="qbtn" onClick={()=>sendMessage(q)} style={{fontSize:"0.66rem",padding:"0.28rem 0.65rem",border:"1px solid #e0e0e0",backgroundColor:"white",borderRadius:"20px",cursor:"var(--chat-cursor,auto)",color:"#444",fontFamily:"inherit",transition:"background 0.15s"}}>{q}</button>
              ))}
            </div>
          )}
          <div style={{padding:"0.6rem 0.875rem",borderTop:"1px solid #f0f0f0",display:"flex",gap:"0.4rem",flexShrink:0}}>
            <input ref={inputRef} className="cinput" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder="Ask Flex anything..." style={{flex:1,border:"1px solid #e0e0e0",padding:"0.55rem 0.85rem",fontSize:"0.82rem",borderRadius:"24px",fontFamily:"inherit",cursor:"var(--chat-cursor,auto)",transition:"border-color 0.2s"}}/>
            <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{width:"38px",height:"38px",borderRadius:"50%",backgroundColor:input.trim()?"black":"#ddd",border:"none",color:"white",cursor:"var(--chat-cursor,auto)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* LABEL */}
      {!open && !hidden && !fullPage && (
        <div className="clabel" style={{
          position:"fixed", bottom:28, right:80, zIndex:9996,
          backgroundColor:"black", color:"white",
          padding:"0.4rem 0.9rem", borderRadius:"24px",
          fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.04em",
          whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(0,0,0,0.25)",
          display:"flex", alignItems:"center", gap:"0.4rem",
          pointerEvents:"none",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Chat with Flex AI
        </div>
      )}


      {/* BUTTON — slides right to hide, tap to restore */}
      {!fullPage && <div style={{
        position:"fixed",
        bottom:20,
        right: hidden ? -52 : 4,
        zIndex:9997,
        transition:"right 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hidden ? "rotate(-20deg)" : "rotate(0deg)",
        transformOrigin: "bottom right",
      }}>
        <button
className={`ctoggle ${hidden ? "peek-tilt" : ""}`}
onClick={()=>setOpen(o=>!o)}
onMouseDown={handleSwipe}
onTouchStart={handleSwipe}
style={{
  width:"68px",
  height:"68px",
  borderRadius:"50%",
  backgroundColor:"black",
  border:"2px solid rgba(255,255,255,0.15)",
  cursor:"pointer",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  position:"relative",
  overflow:"visible"
}}
>

<style dangerouslySetInnerHTML={{__html:`

@keyframes robotGlow{
0%,100%{filter:drop-shadow(0 0 4px #00eaff)}
50%{filter:drop-shadow(0 0 14px #00eaff)}
}

@keyframes robotBlink{
0%,92%,100%{transform:scaleY(1)}
95%{transform:scaleY(.1)}
}

@keyframes auraPulse{
0%{transform:scale(1);opacity:.6}
100%{transform:scale(1.8);opacity:0}
}

.robotGlow{
animation:robotGlow 2.4s ease-in-out infinite;
}

.robotEye{
animation:robotBlink 4s infinite;
transform-origin:center;
}

.robotAura{
position:absolute;
width:74px;
height:74px;
border-radius:50%;
border:1.5px solid rgba(0,234,255,0.4);
animation:auraPulse 2.6s infinite;
pointer-events:none;
}

.robotAura2{
animation-delay:1.3s;
}

@keyframes robotFloat{
0%,100%{transform:translate(-50%,0)}
50%{transform:translate(-50%,-8px)}
}

@keyframes robotBlink{
0%,92%,100%{transform:scaleY(1)}
95%{transform:scaleY(.15)}
}

.robotWrap{
position:absolute;
bottom:32px;
left:50%;
transform:translateX(-50%);
animation:robotFloat 2.2s ease-in-out infinite;
}

.robotEye{
animation:robotBlink 4s infinite;
transform-origin:center;
}
@keyframes robotTalk {
0%,100%{d:path("M48 48 Q60 56 72 48")}
50%{d:path("M46 52 Q60 64 74 52")}
}

@keyframes eyePulse{
0%,100%{filter:drop-shadow(0 0 4px #00eaff)}
50%{filter:drop-shadow(0 0 12px #00eaff)}
}

.robotTalking path{
animation:robotTalk 0.6s infinite;
}

.robotTalking .robotEye{
animation:eyePulse 1.2s infinite;
}

`}}/>

{/* ROBOT */}
<div className="robotWrap">

<svg
className={`robotGlow ${loading ? "robotTalking" : ""}`}
width="56"
height="64"
viewBox="0 0 120 120"
>

{/* head */}
<rect x="25" y="15" width="70" height="45" rx="12" fill="#0b1625"/>

{/* eyes */}
<g className="robotEye">
<circle cx="50" cy="38" r="6" fill="#00eaff"/>
<circle cx="70" cy="38" r="6" fill="#00eaff"/>
</g>

{/* smile */}
<path
className="robotMouth"
d="M48 48 Q60 56 72 48"
stroke="#00eaff"
strokeWidth="2"
strokeLinecap="round"
/>

{/* body */}
<rect x="40" y="65" width="40" height="22" rx="6" fill="#dce2ee"/>

{/* legs */}
<rect x="45" y="88" width="8" height="10" rx="2" fill="#c8d0de"/>
<rect x="67" y="88" width="8" height="10" rx="2" fill="#c8d0de"/>

{/* arms */}
<rect x="20" y="68" width="15" height="7" rx="3" fill="#a8b4c4"/>
<rect x="85" y="68" width="15" height="7" rx="3" fill="#a8b4c4"/>

</svg>

</div>

{/* CIRCLE ICON */}
{open ? (
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
<line x1="18" y1="6" x2="6" y2="18"/>
<line x1="6" y1="6" x2="18" y2="18"/>
</svg>
) : (
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
</svg>
)}

</button>
      </div>}
    </>
  )
}