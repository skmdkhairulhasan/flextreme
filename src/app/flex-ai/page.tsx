"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import { loadChat, saveChat, subscribeChat } from "@/lib/chatStorage"

type Message = { role: "user" | "assistant", content: string }
type Settings = Record<string, string>
type Profile = {
  height?: number; weight?: number; age?: number; gender?: string
  goal?: string; religion?: string; activity?: string
  workoutType?: string; workoutDays?: number; experience?: string
  step?: string
}

const SUGGESTIONS = [
  "Find my order 🚚",
  "Build my full plan 💪",
  "Calculate BMI 📊",
  "Workout plan 🏋️",
  "Diet chart 🥗",
  "Supplements 💊",
  "Size guide 📏",
  "What to wear at gym 👕",
  "Delivery info 🛵",
  "Talk to human 💬",
]

// ── ALL SHARED LOGIC (same as ChatBot bubble) ──
const INTENTS = {
  greeting: ["hi","hello","hey","salaam","hola","yo","sup","howdy","wassup","whats up","good day","greetings","asalamu","wslm"],
  howare: ["how are you","how r u","hows it","how you doing","how do you do","you good","you okay","hru"],
  bmi: ["bmi","body mass","body fat","mbi","bim","calculate me","measure me","check my","my stats","my data","my info","what am i","my numbers","my measurements"],
  calorie: ["calorie","calories","cal","tdee","maintenance","how much should i eat","daily intake","energy intake","how many cal","caloric","kcal","calorie need","calorie goal","calorie calculator","calorie calc","maintanance","maintainance","maintenence","maintanence","maintenace","how much to eat","how much food","calorie deficit","calorie surplus"],
  diet: ["diet","meal","food","eat","nutrition","what to eat","eating plan","meal plan","food plan","diet plan","diet chart","what should i eat","meal chart","daily food","food guide","recipes","grocery","what food","not vegan","not vegetarian","i eat meat","i eat chicken","halal","change diet","update diet","wrong diet","incorrect diet"],
  workout: ["workout","exercise","training","gym plan","routine","program","lifting","weights","cardio","push pull","ppl","upper lower","split","sets reps","gym routine","fitness plan","training plan","exercise plan","how to train","train me","my routine","build routine"],
  supplement: ["supplement","protein powder","whey","creatine","pre workout","preworkout","bcaa","vitamin","what to take","supp","supps","what supplement","protein shake","mass gainer","fat burner","what pills"],
  gymwear: ["what to wear","gym wear","gym gear","gym clothes","gym outfit","workout clothes","outfit","what clothes","dress for gym","gymwear","attire","gym kit","clothing","apparel","what should i wear","wear to gym","gym dress","active wear","activewear","sportswear"],
  size: ["size","sizing","what size","which size","size guide","fit me","my size","size for me","size recommendation","chest measurement","waist measurement","hip measurement","what fits","will it fit","size chart","size help","size?","fit?","my width","my length","width is","length is","width cm","length cm","chest is","my chest","my waist","waist is","i am width","width are","measure","shirt width","shirt length","width","length"],
  motivation: ["motivat","lazy","no motivation","give up","tired","skip","skip workout","hard","difficult","struggle","can't do","cant do","demotivat","no energy","procrastinat","dont want","don't feel like","hate gym","bore","bored gym","quit"],
  injury: ["injur","pain","hurt","sore","knee","my knee","back pain","my back","back injury","shoulder pain","my shoulder","shoulder injury","wrist pain","ankle pain","sprain","strain","ache","pulled muscle","physiotherapy","my wrist","my ankle","i am injured","got injured","injured knee","injured back","injured shoulder","hurt my","hurt knee","hurt back","hurt shoulder","have pain","have injury","i have pain"],
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



function GlowingRobot({ size = 28, talking = false }: { size?: number; talking?: boolean }) {
  const h = Math.round(size * 1.14)
  return (
    <svg className={`robotGlow ${talking ? "robotTalking" : ""}`} width={size} height={h} viewBox="0 0 120 120">
      <rect x="25" y="15" width="70" height="45" rx="12" fill="#0b1625"/>
      <g className="robotEye"><circle cx="50" cy="38" r="6" fill="#00eaff"/><circle cx="70" cy="38" r="6" fill="#00eaff"/></g>
      <path className="robotMouth" d="M48 48 Q60 56 72 48" stroke="#00eaff" strokeWidth="2" strokeLinecap="round"/>
      <rect x="40" y="65" width="40" height="22" rx="6" fill="#dce2ee"/>
      <rect x="45" y="88" width="8" height="10" rx="2" fill="#c8d0de"/>
      <rect x="67" y="88" width="8" height="10" rx="2" fill="#c8d0de"/>
      <rect x="20" y="68" width="15" height="7" rx="3" fill="#a8b4c4"/>
      <rect x="85" y="68" width="15" height="7" rx="3" fill="#a8b4c4"/>
    </svg>
  )
}

export default function FlexAIPage() {
  const pathname = usePathname()
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hey! I'm FlexAI — your fitness & shopping assistant.\n\n🚚 Track your order\n👕 Browse & shop products\n📏 Size recommendation\n💪 Workout plans\n🥗 Diet charts\n📊 BMI calculator\n💊 Supplements\n\nWhat do you need? 💪"
  }])
  const messagesRef = useRef<Message[]>(messages)
  const [input, setInput] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ── Same refs as ChatBot bubble ──
  const profileRef = useRef<Profile>({}  )
  const settingsRef = useRef<Settings>({}  )
  const modeRef = useRef<string | null>(null)
  const productsCacheRef = useRef<any[]>([])
  const chatHydratedRef = useRef(false)
  const chatSyncingRef = useRef(false)
  const [, forceUpdate] = useState(0)
  function updateMessages(updater: (prev: Message[]) => Message[]) {
    const next = updater(messagesRef.current)
    messagesRef.current = next
    setMessages(next)
    saveChat(next)
  }

  function setProfile(p: Profile) {
    profileRef.current = p
    forceUpdate(n => n + 1)
  }

  useEffect(() => {
    const savedMessages = loadChat<Message>()
    if (savedMessages.length) {
      chatSyncingRef.current = true
      messagesRef.current = savedMessages
      setMessages(savedMessages)
    }
    chatHydratedRef.current = true
    if (savedMessages.length) window.setTimeout(() => { chatSyncingRef.current = false }, 0)
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeChat(() => {
      const updated = loadChat<Message>()
      if (!updated.length) return
      chatSyncingRef.current = true
      messagesRef.current = updated
      setMessages(updated)
      window.setTimeout(() => { chatSyncingRef.current = false }, 0)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!chatHydratedRef.current || chatSyncingRef.current) return
    if (messages.length <= 1) return
    saveChat(messages)
  }, [messages])

  useEffect(() => {
    async function load() {
      const [settingsRes, productsRes] = await Promise.all([
        fetch("/api/settings").then(r => r.ok ? r.json() : {settings:[]}).catch(() => ({settings:[]})),
        fetch("/api/products?limit=6&in_stock=true").then(r => r.ok ? r.json() : {products:[]}).catch(() => ({products:[]}))
      ])
      const map: Settings = {}
      if (settingsRes.settings && Array.isArray(settingsRes.settings)) {
        settingsRes.settings.forEach((s: any) => { if (s.key) map[s.key] = s.value })
      }
      settingsRef.current = map
      if (productsRes.products) {
        productsCacheRef.current = productsRes.products
        setProducts(productsRes.products.slice(0, 6))
      }
    }
    load()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── EXACT SAME getReply logic as bubble ChatBot ──
  function getReply(raw: string): string {
    const msg = smart(raw)
    const p = profileRef.current
    const s = settingsRef.current
    const products: any[] = productsCacheRef.current || []
    const num = parseFloat(raw.replace(/[^0-9.]/g, ""))
    const hasNum = !isNaN(num) && num > 0

    const phoneRaw = raw.trim().replace(/[\s\-\+\.]/g, "")
    const isPhone = /^(?:88)?0[1-9]\d{8,10}$/.test(phoneRaw) || /^\d{11,13}$/.test(phoneRaw)
    
    if (modeRef.current === "order_lookup") {
      if (!isPhone) {
        const digitsOnly = raw.trim().replace(/\D/g, "")
        if (digitsOnly.length === 10 && digitsOnly.startsWith("1")) {
          return "__PHONE_LOOKUP__:0" + digitsOnly
        }
        const wantsEscape = msg.includes("cancel") || msg.includes("never mind") || msg.includes("stop") ||
          msg.includes("forget") || msg.includes("exit") || msg.includes("back") ||
          msg.includes("angry") || msg.includes("dumb") ||
          msg.includes("stupid") || has(msg, "greeting") || has(msg, "workout") ||
          has(msg, "diet") || has(msg, "product") || has(msg, "supplement")
        if (wantsEscape) {
          modeRef.current = null
        } else {
          return "I need your phone number to check the order 📱\nExample: 01712345678\n\n(Say 'cancel' to go back)"
        }
      }
    }
    if (isPhone && modeRef.current === "order_lookup") {
      setTimeout(async () => {
        try {
          const digits = phoneRaw.replace(/^88/, "")
          const local = digits.startsWith("0") ? digits : "0" + digits.replace(/^88/, "")
          
          const res = await fetch("/api/orders?phone=" + encodeURIComponent(local))
          const { orders } = await res.json()
          
          let orderReply = ""
          if (orders && orders.length > 0) {
            orderReply = "📦 Here are your recent orders:\n\n"
            orders.slice(0,5).forEach((o:any, i:number) => {
              const product = o.product_name || "Product"
              const status = o.status || "processing"
              const qty = o.quantity || 1
              const size = o.size ? "\nSize: " + o.size : ""
              const color = o.color ? "\nColor: " + o.color : ""
              orderReply += `ORDER ${i+1}\nProduct: ${product}\nStatus: ${status}\nQuantity: ${qty}${size}${color}`
              if (status === "shipped" && o.tracking_url) {
                orderReply += `\n\n🚚 Track: ${o.tracking_url}\n`
              }
              orderReply += "\n\n"
            })
            orderReply += "Need help? WhatsApp us: +8801935962421"
          } else {
            orderReply = "❌ No order found for: " + phoneRaw + "\n\nWhatsApp: +8801935962421"
          }
          modeRef.current = null
          updateMessages(prev => [...prev, { role: "assistant", content: orderReply }])
        } catch {
          updateMessages(prev => [...prev, { role: "assistant", content: "Server error. WhatsApp: +8801935962421" }])
        }
        setLoading(false)
      }, 400)
      return "__ASYNC__"
    }

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
    if (modeRef.current && modeRef.current.startsWith("update_") && !hasNum) {
      modeRef.current = null
    }

    if (has(msg, "bmi") && !p.step && p.weight && p.height) return showStats(p)
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

    const isReligionMsg =
      /i am (muslim|hindu|vegetarian|vegan|halal)/.test(msg) ||
      /im (muslim|hindu|vegetarian|vegan)/.test(msg) ||
      /i'm (muslim|hindu|vegetarian|vegan)/.test(msg) ||
      msg.includes("not vegan") || msg.includes("not vegetarian") ||
      msg.includes("i eat meat") || msg.includes("i eat chicken") || msg.includes("i eat beef") ||
      (msg.includes("change") && (msg.includes("muslim") || msg.includes("hindu") || msg.includes("vegetarian") || msg.includes("vegan") || msg.includes("halal") || msg.includes("diet") && p.religion))
    if (isReligionMsg) {
      let newRel = p.religion || "none"
      if (/muslim|halal/.test(msg)) newRel = "muslim"
      else if (/hindu/.test(msg)) newRel = "hindu"
      else if (/vegan/.test(msg) && !msg.includes("not")) newRel = "vegan"
      else if (/vegetarian|vegeterian|veggie|vegiterian/.test(msg) && !msg.includes("not")) newRel = "vegetarian"
      else if (msg.includes("not vegan") || msg.includes("not vegetarian") || msg.includes("i eat meat") || msg.includes("i eat chicken")) newRel = "none"
      if (newRel !== (p.religion || "none")) {
        setProfile({ ...p, religion: newRel })
        return "Got it — updated to " + newRel + " diet! 🥗\nSay 'diet' for a fresh plan with the right food."
      }
    }

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
      return "Got it — workout updated to " + (newType === "home" ? "home/bodyweight" : newType === "both" ? "gym + home" : "gym") + "! 💪\nSay 'workout' for a fresh plan."
    }

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
      return "I hear you — I'm still learning! 😅\nTry rephrasing and I'll do my best.\n\nOr WhatsApp us directly: +8801935962421 for instant human help."
    }
    if (msg.includes("im sad") || msg.includes("i'm sad") || msg.includes("not good") || msg.includes("im tired") || msg.includes("i'm tired") || msg.includes("stressed")) return "Rough day? Exercise is the best medicine — even a 20-min walk changes your mood. Want a quick session plan?"
    if (msg === "sad" || msg === "feeling sad" || msg.includes("feeling low") || msg.includes("feeling bad")) return "That's okay. Bad days happen. 💙\nA quick 20-min workout releases endorphins. Want a short session plan?"
    if (msg === "what to do" || msg === "what should i do" || msg.includes("help me decide")) return "Here's what I can help with:\n\n🚚 Track order\n🛍️ Shop products\n💪 Workout plan\n🥗 Diet chart\n📊 BMI check\n💊 Supplements\n\nWhat sounds good?"
    if (has(msg, "love")) return "Love you too! Now let's get to work. What's your goal? 🖤💪"
    if (has(msg, "compliment")) return "Appreciate that. Now let's channel this energy into your gains. What do you need? 💪"
    if (has(msg, "thanks")) return "Let's go. Keep executing. 💪"
    if (msg.includes("anything else") || msg.includes("what else") || msg.includes("what can you do") || msg.includes("what do you do") || msg === "help") {
      return "Here's everything I can help with:\n\n🚚 Track your order\n💪 Workout plan\n🥗 Diet chart\n📊 BMI + calories\n💊 Supplement guide\n👕 Gym wear advice\n📏 Size guide\n🛍️ Product recommendations\n\nJust ask anything!"
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
      return "Want a gym workout plan? Just say 'workout' and I'll build one for you! 💪"
    }
    if (msg.match(/^(ok|okay|sure|got it|cool|great|alright|yes|yeah|yep|k|np)\.?$/)) return "Good. What's next? 💪"

    if (has(msg, "motivation")) return "Motivation is temporary. Discipline is permanent.\n\nYou don't wait to feel like it. You show up anyway. That's the difference.\n\nNow — what's your workout today? I'll plan it."

    const isInjuryMsg = has(msg, "injury") ||
      (msg.includes("knee") && (msg.includes("injury") || msg.includes("pain") || msg.includes("hurt") || msg.includes("sore") || msg.includes("injur") || modeRef.current === "injury")) ||
      (msg.includes("back") && (msg.includes("injury") || msg.includes("pain") || msg.includes("hurt") || msg.includes("injur") || modeRef.current === "injury")) ||
      (msg.includes("shoulder") && (msg.includes("injury") || msg.includes("pain") || msg.includes("hurt") || modeRef.current === "injury")) ||
      msg.includes("i am injured") || msg.includes("got injured") || msg.includes("hurt my")
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

    if (has(msg, "fullplan")) {
      setProfile({ ...p, step: "height" })
      return "Let's build your complete program.\n\nHeight in cm?"
    }

    if (has(msg, "bmi") || has(msg, "calorie")) {
      if (p.weight && p.height) return showStats(p)
      setProfile({ ...p, step: "height" })
      return "Height in cm?"
    }

    if (has(msg, "diet")) {
      if (p.weight && p.height && p.age && p.gender && p.activity) {
        return getDietPlan(p, calcTDEE(p.weight, p.height, p.age, p.gender, p.activity))
      }
      setProfile({ ...p, step: "height" })
      return "I'll build your diet plan. Height in cm?"
    }

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
      if (p.height && p.weight && p.age && p.gender && p.activity && p.goal) {
        const planProfile = {
          ...p,
          workoutType: p.workoutType || "gym",
          workoutDays: p.workoutDays || 4
        }
        return getWorkoutPlan(planProfile)
      }
      setProfile({ ...p, step: "height" })
      return "Let me build your workout. Height in cm?"
    }

    if (has(msg, "weight_loss") || has(msg, "abs")) {
      return "Simple truth: fat loss = calorie deficit + protein + consistency.\n\n→ Eat 300-400 kcal below maintenance\n→ 1.8-2g protein per kg\n→ Lift weights 3-4x/week\n→ Walk 8-10k steps daily\n→ Sleep 7-9 hours\n\nAbs show when body fat is low — 12-15% men, 18-22% women.\n\nWant your exact calorie target? Say 'calculate my BMI'."
    }

    if (has(msg, "muscle_gain")) {
      return "Muscle growth = progressive overload + protein + sleep.\n\n→ Eat 200-400 kcal above maintenance\n→ 2g protein per kg bodyweight\n→ Compound lifts: Squat, Deadlift, Bench, Row\n→ Add weight every week\n→ Sleep 8+ hours\n→ Creatine 5g/day — most proven supplement\n\nWant a full muscle building program?"
    }

    if (has(msg, "rest")) return "Rest is training.\n\nMuscles grow during recovery, not during the workout.\n\n→ Beginners: 2-3 rest days/week\n→ Intermediate: 1-2 rest days/week\n→ Advanced: minimum 1 day\n\nActive recovery: 20-30 min walk, stretch, foam roll.\nSleep: 7-9 hours — non-negotiable."

    if (has(msg, "protein")) {
      const target = p.weight ? Math.round(p.weight * 2) + "g/day for you (" + p.weight + "kg)" : "1.8-2.2g per kg bodyweight"
      return "Protein target: " + target + "\n\nTop sources:\n" + (p.religion === "muslim" ? "Halal chicken, halal beef, fish, eggs, lentils" : p.religion === "hindu" ? "Chicken, fish, eggs, paneer, dal" : p.religion === "vegetarian" ? "Eggs, paneer, Greek yogurt, lentils, chickpeas" : p.religion === "vegan" ? "Tofu, lentils, chickpeas, soy milk, tempeh" : "Chicken, beef, fish, eggs, Greek yogurt") + "\n\nHit this every day. Non-negotiable for results."
    }

    if (has(msg, "gymwear")) {
      if (msg.includes("buy") || msg.includes("purchase") || msg.includes("shop") || msg.includes("order now") || msg.includes("want to get")) {
        if (products.length > 0) {
          const cats: string[] = (() => { try { return JSON.parse(s.product_categories || "[]") } catch { return [] } })()
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

    if (modeRef.current === "awaiting_measurement" && hasNum && num >= 20 && num <= 200) {
      modeRef.current = null
      return getReply("width " + num)
    }
    if (modeRef.current === "awaiting_measurement" && !hasNum) {
      modeRef.current = null
    }

    if (has(msg, "size")) {
      let tables: any[] = []
      try { if (s.size_tables) tables = JSON.parse(s.size_tables) } catch {}
      if (tables.length === 0) return "Size guide not set up yet. Check our size guide page or WhatsApp us!"

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

      const widthCol = table.columns?.find((c: any) => {
        const n = c.name.toLowerCase()
        return n.includes("width") || n.includes("chest") || n.includes("bust")
      })
      const lengthCol = table.columns?.find((c: any) => c.name.toLowerCase().includes("length"))

      const nums = [...msg.matchAll(/(\d{2,3}(?:\.\d)?)/g)].map(m => parseFloat(m[1]))

      const gavWidth = msg.includes("width") || msg.includes("chest") || msg.includes("wide") || msg.includes("bust")
      const gavLength = msg.includes("length") || msg.includes("long") || msg.includes("len")

      function findSize(colId: string, val: number, goDown = false) {
        let idx = table.rows.length - 1
        for (let i = 0; i < table.rows.length; i++) {
          const rowVal = parseFloat(table.rows[i].values?.[colId] || "0")
          if (rowVal >= val) { idx = i; break }
        }
        if (goDown && idx > 0) idx = idx - 1
        return { row: table.rows[idx], index: idx }
      }

      if (gavWidth && nums.length > 0 && widthCol) {
        const userWidth = nums[0]
        const fullChest = Math.round(userWidth * 2)
        const { row: exactRow, index: exactIdx } = findSize(widthCol.id, userWidth, false)
        const specs = (r: any) => table.columns.map((c: any) => c.name + " " + (r.values?.[c.id] || "—") + unit).join(" | ")
        let reply = "Shirt width " + userWidth + unit + " → Full chest ~" + fullChest + unit + "\n\n"
        if (isCompression) {
          const targetWidth = userWidth - 4
          let compIdx = exactIdx
          for (let i = 0; i < table.rows.length; i++) {
            const rw = parseFloat(table.rows[i].values?.[widthCol.id] || "0")
            if (rw >= targetWidth) { compIdx = i; break }
          }
          const compRow = table.rows[Math.min(compIdx, exactIdx)]
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

      if (gavLength && nums.length > 0 && lengthCol) {
        const userLength = nums[0]
        const { row } = findSize(lengthCol.id, userLength, false)
        const specs = table.columns.map((c: any) => c.name + " " + (row.values?.[c.id] || "—") + unit).join(" | ")
        return "Shirt length " + userLength + unit + " → Size " + row.label + "\n" + specs + (isCompression ? "\n\nCompression fit — stretches with your body! 💪" : "")
      }

      if (nums.length > 0) {
        const val = nums[0]
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

      modeRef.current = "awaiting_measurement"
      let reply = "SIZE GUIDE — " + tableName + " (" + unit + ")\n\n"
      if (isCompression) reply += "COMPRESSION FIT — skin tight, stretches with your body\n\n"
      reply += "HOW TO MEASURE (lay shirt flat):\n"
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

    if (has(msg, "delivery")) {
      const d = (k: string) => s["delivery_" + k] ? "BDT " + s["delivery_" + k] : "—"
      return "DELIVERY CHARGES:\n\nDhaka City — " + d("dhaka_city") + "\nDhaka District — " + d("dhaka_district") + "\nNarayanganj/Gazipur — " + d("narayanganj") + "\nMymensingh — " + d("mymensingh") + "\nChittagong — " + d("chittagong") + "\nComilla — " + d("comilla") + "\nSylhet — " + d("sylhet") + "\nRajshahi/Khulna — " + d("rajshahi") + "\nBogra/Barisal/Rangpur — " + d("bogra") + "\nOther districts — " + d("other") + "\n\nAll Cash on Delivery. Which city?"
    }

    const isBuyIntent = msg.includes("buy") || msg.includes("want") || msg.includes("get me") || msg.includes("recommend") || msg.includes("suggest") || msg.includes("looking for") || msg.includes("show me") || msg.includes("which product") || msg.includes("best product") || msg.includes("what product") || msg.includes("shop") || has(msg, "product")
    const isProductMention = msg.includes("top") || msg.includes("shirt") || msg.includes("tee") || msg.includes("compression") || msg.includes("short") || msg.includes("pant") || msg.includes("jogger") || msg.includes("legging") || msg.includes("hoodie") || msg.includes("sleeve") || msg.includes("accessory") || msg.includes("accessories")

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
      const subcatKeywords = ["compression","hoodie","tank","sleeveless","half sleeve","full sleeve","shorts","jogger","legging"]
      const foundSubcats = subcatKeywords.filter(k =>
        toShow.some((p: any) => (p.name + " " + (p.category || "") + " " + (p.description || "")).toLowerCase().includes(k))
      )
      let reply = (catProducts.length > 0
        ? "Here are our " + chosenCat + " products:\n\n" + lines
        : "Here's our full collection:\n\n" + lines)
      if (foundSubcats.length > 1 && toShow.length > 3) {
        reply += "\n\nFilter by type: " + foundSubcats.map((k, i) => (i+1) + ". " + k).join(" | ")
        reply += "\nOr ask: 'show me hoodies' / 'show compression tops'"
      }
      reply += "\n\nWant size help? Just ask! 📏"
      return reply
    }

    const cats: string[] = (() => {
      try { return JSON.parse(s.product_categories || "[]") } catch { return [] }
    })()
    if (cats.length > 0 && modeRef.current === "awaiting_category") {
      const numChoice = parseInt(msg.trim())
      const choiceByNum = !isNaN(numChoice) && numChoice >= 1 && numChoice <= cats.length ? cats[numChoice-1] : null
      const choice = choiceByNum || cats.find((c: string) => msg.includes(c.toLowerCase()))
      if (choice) {
        modeRef.current = "category:" + choice
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
      if (cats.length > 1) {
        modeRef.current = "awaiting_category"
        return "What are you looking for? 🛍️\n\n" + cats.map((c: string, i: number) => (i+1) + ". " + c).join("\n") + "\n\nJust type the number or name!"
      }
      const lines = products.slice(0,5).map((p: any) =>
        "👕 " + p.name + (p.price ? " — BDT " + p.price : "") +
        (p.sizes?.length ? "\n   Sizes: " + p.sizes.join(", ") : "") +
        (p.colors?.length ? "\n   Colors: " + p.colors.join(", ") : "") +
        "\n   → /products/" + (p.slug || p.id)
      ).join("\n\n")
      return "Here's what we have:\n\n" + lines + "\n\nAll sweat-wicking, 4-way stretch, compression fit. 🔥"
    }

    const isOrderTrack =
      msg.includes("track") || msg.includes("where is my order") || msg.includes("my order") ||
      msg.includes("order status") || msg.includes("status of my order") || msg.includes("check order") ||
      msg.includes("find my order") ||
      msg.includes("when will") && (msg.includes("order") || msg.includes("package") || msg.includes("parcel") || msg.includes("product") || msg.includes("item") || msg.includes("delivery") || msg.includes("arrive") || msg.includes("get my") || msg.includes("come")) ||
      msg.includes("when will i get") || msg.includes("when will it arrive") || msg.includes("where is my package") ||
      msg.includes("where is my parcel") || msg.includes("how long will") && msg.includes("deliver") ||
      msg.includes("when is my") && (msg.includes("order") || msg.includes("delivery")) ||
      msg.includes("what time") && msg.includes("order") ||
      msg.includes("how much time") && (msg.includes("order") || msg.includes("deliver") || msg.includes("arrive"))
    if (isOrderTrack || (has(msg, "order") && (msg.includes("track") || msg.includes("status") || msg.includes("where") || msg.includes("find") || msg.includes("check") || msg.includes("lookup")))) {
      modeRef.current = "order_lookup"
      return "Sure! Send me the phone number you used when placing your order and I'll check it right away. 📦"
    }

    if (has(msg, "order")) return "HOW TO ORDER:\n\n1. Products page\n2. Choose item\n3. Pick size + color\n4. Enter name, phone, address\n5. Order Now\n\nCOD — pay on delivery. Confirmed via WhatsApp.\n\nAlready placed an order? Say 'track my order' and I'll look it up! 📦"

    if (has(msg, "payment")) return "Cash on Delivery only. Pay when it arrives. Zero advance. 100% safe."

    if (has(msg, "contact")) return "WhatsApp: +8801935962421\n9am-9pm daily.\n\nOr click the green button on this page."

    if (has(msg, "product")) return "Flextreme makes premium compression wear:\n\nCompression Tops\nCompression Shorts + Leggings\nAccessories\n\nAll: Sweat-wicking. 4-way stretch. Compression fit. Muscle-definition cut.\n\nSee Products page for full collection."

    if (has(msg, "brand")) return (s.about_story || "Flextreme — premium gym wear from Bangladesh. Built by athletes, for athletes.") + "\n\nWork Hard. Flex Extreme."

    if (has(msg, "discount")) return "Follow @flextremefit on Instagram, Facebook, TikTok for deals.\n\nOr WhatsApp: +8801935962421"

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
      let updatedP = p
      if (/muslim|halal/.test(msg)) updatedP = { ...p, religion: "muslim" }
      else if (/hindu/.test(msg)) updatedP = { ...p, religion: "hindu" }
      else if (/\bvegan\b/.test(msg)) updatedP = { ...p, religion: "vegan" }
      else if (/vegetarian|veggie|vegeterian/.test(msg)) updatedP = { ...p, religion: "vegetarian" }
      else if (/not vegan|not vegetarian|i eat meat/.test(msg)) updatedP = { ...p, religion: "none" }
      if (updatedP.religion !== p.religion) setProfile(updatedP)
      return getDietPlan(updatedP, calcTDEE(updatedP.weight!, updatedP.height!, updatedP.age!, updatedP.gender!, updatedP.activity!))
    }

    if (msg === "gym" || (msg.includes("go to gym") || msg.includes("i gym") || msg.includes("i lift"))) {
      setProfile({ ...p, workoutType: "gym" })
      return "Gym mode! 🏋️ Want a workout plan, diet chart, or something else?"
    }

    if (msg.includes("dumb") || msg.includes("stupid") || msg.includes("idiot") || msg.includes("useless") || msg.includes("worst") || msg.includes("terrible") || msg.includes("hate you")) {
      modeRef.current = null
      return "I hear you — I'm still learning! 😅\nTry rephrasing and I'll do my best.\n\nOr WhatsApp us for instant human help: +8801935962421"
    }

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
      return "I didn't catch that. " + (hints[p.step] || "Please continue.")
    }
    return "Got it — what specifically do you need?\n\n🚚 Find my order\n💪 Workout plan\n🥗 Diet chart\n📊 BMI + calories\n💊 Supplements\n👕 Gym gear"
  }



  async function sendMessage(text?: string) {
    const userMsg = (text ?? input).trim()
    if (userMsg.toLowerCase().includes("talk to human")) {
      window.open("https://wa.me/8801935962421?text=Hi%20Flextreme!", "_blank")
      return
    }
    if (!userMsg || loading) return

    setInput("")
    updateMessages(prev => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    setTimeout(async () => {
      let reply = getReply(userMsg)
      if (reply === "__ASYNC__") return
      if (reply.startsWith("__PHONE_LOOKUP__:")) {
        const fixedPhone = reply.replace("__PHONE_LOOKUP__:", "")
        modeRef.current = "order_lookup"
        const fixedReply = getReply(fixedPhone)
        if (fixedReply === "__ASYNC__") return
        reply = fixedReply
      }
      updateMessages(prev => [...prev, { role: "assistant", content: reply }])
      setLoading(false)
    }, 300 + Math.random() * 200)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flexai-root">

      <Navbar />

      {/* ── BODY ── */}
      <div className="flexai-body" style={{ paddingTop: "72px" }}>
        <aside className="flexai-left">
          <p className="side-title">SUGGESTIONS</p>
          {SUGGESTIONS.map(s => <button key={s} className="suggestion" onClick={() => sendMessage(s)}> {s}</button>)}
        </aside>

        <main className="flexai-chat">
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                {msg.role === "assistant" && <div style={{ flexShrink: 0 }}><GlowingRobot size={30} /></div>}
                <div style={{ maxWidth: "72%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", backgroundColor: msg.role === "user" ? "white" : "rgba(255,255,255,0.08)", color: msg.role === "user" ? "black" : "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-line", border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                  {msg.content.split(/(\bhttps?:\/\/\S+|\/products\/\S+)/g).map((part, i) => {
                    if (/^https?:\/\//.test(part)) return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 6, padding: "5px 12px", background: "#0ea5e9", color: "white", borderRadius: 6, textDecoration: "none", fontSize: "0.75rem", fontWeight: 700 }}>🚚 Track Package</a>
                    if (/^\/products\//.test(part)) return <a key={i} href={part} style={{ display: "inline-block", marginTop: 4, padding: "5px 12px", background: "black", color: "white", borderRadius: 6, textDecoration: "none", fontSize: "0.75rem", fontWeight: 700 }}>👕 View Product →</a>
                    return <span key={i}>{part}</span>
                  })}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: 8 }}>
                <div style={{ flexShrink: 0 }}><GlowingRobot size={30} talking /></div>
                <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 0.2, 0.4].map((d, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.4)", animation: `faDot 1.2s ease-in-out ${d}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 8, backgroundColor: "#0a0a0a" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={isMobile ? "Ask here..." : "Ask about workouts, nutrition, products, or your order..."} rows={1} style={{ flex: 1, padding: "10px 14px", backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", minHeight: "40px", maxHeight: "120px", overflowY: "auto" }} />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{ padding: "10px 20px", backgroundColor: input.trim() && !loading ? "white" : "rgba(255,255,255,0.15)", color: input.trim() && !loading ? "black" : "rgba(255,255,255,0.3)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: input.trim() && !loading ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>Send</button>
          </div>
        </main>

        <aside className="flexai-right">
          <p className="side-title">PRODUCTS</p>
          {products.length > 0 ? products.map((p: any) => (
            <Link key={p.id} href={`/products/${p.slug || p.id}`} className="navlink" style={{ display: "block", marginBottom: 6, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{p.name}</div>
              {p.price && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>BDT {p.price}</div>}
            </Link>
          )) : (
            <>
              <Link href="/products" className="navlink" style={{ padding: "8px 10px", display: "block", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 6 }}>👕 Browse All Products</Link>
              <Link href="/size-guide" className="navlink" style={{ padding: "8px 10px", display: "block", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 6 }}>📏 Size Guide</Link>
              <Link href="/delivery" className="navlink" style={{ padding: "8px 10px", display: "block", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>🚚 Delivery Info</Link>
            </>
          )}
          <div className="brand">FLEXTREME<br />Work Hard. Flex Extreme.</div>
        </aside>
      </div>

      <style>{`
        @keyframes faDot{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}
        @keyframes robotGlow{0%,100%{filter:drop-shadow(0 0 4px #00eaff)}50%{filter:drop-shadow(0 0 14px #00eaff)}}
        @keyframes robotBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.15)}}
        @keyframes eyePulse{0%,100%{filter:drop-shadow(0 0 4px #00eaff)}50%{filter:drop-shadow(0 0 12px #00eaff)}}
        @keyframes robotFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .robotGlow{animation:robotGlow 2.4s ease-in-out infinite;}
        .robotEye{animation:robotBlink 4s infinite;transform-origin:center;}
        .robotTalking .robotEye{animation:eyePulse 1.2s infinite;}

        @media(max-width:768px){
          .flexai-left,.flexai-right{display:none!important;}
        }
      `}</style>
    </div>
  )
}
