// FLEXTREME NLP Trainer
// Uses node-nlp to classify user intents with probability scoring
// Trains once on startup, zero cost per message

let classifierCache: any = null

export async function getClassifier() {
  if (classifierCache) return classifierCache

  try {
    const { NlpManager } = await import("node-nlp")
    const manager = new NlpManager({ languages: ["en"], forceNER: false, nlu: { log: false } })

    // ── FIND ORDER ──
    const findOrder = [
      "where is my order", "track my order", "find my order", "check my order",
      "where is my package", "track my package", "my order status",
      "can you find my order", "can you track my order", "what happened to my order",
      "when will my order arrive", "has my order shipped", "order not arrived",
      "i want to track my order", "please find my order", "help me find my order",
      "look up my order", "search for my order", "locate my order",
      "i placed an order", "did my order go through", "my parcel",
      "where is my delivery", "delivery status", "shipment status",
    ]
    findOrder.forEach(t => manager.addDocument("en", t, "find_order"))

    // ── SIZE HELP ──
    const sizeHelp = [
      "what size should i get", "which size fits me", "size chart",
      "size guide", "size recommendation", "what size am i",
      "i am 175cm what size", "i am 180 cm", "height 175",
      "does this fit", "how does it fit", "size help",
      "what size for me", "help me with size", "size advice",
      "should i get medium or large", "i need size help",
    ]
    sizeHelp.forEach(t => manager.addDocument("en", t, "size_help"))

    // ── WORKOUT PLAN ──
    const workoutPlan = [
      "build me a workout", "give me a workout plan", "workout routine",
      "gym routine", "exercise plan", "training schedule", "training plan",
      "workout program", "gym program", "gym plan", "can you make me a workout",
      "i want to work out", "help me train", "beginner workout",
      "full body workout", "chest workout", "leg workout", "back workout",
      "how to get fit", "gym schedule", "what exercises should i do",
    ]
    workoutPlan.forEach(t => manager.addDocument("en", t, "workout_plan"))

    // ── DIET CHART ──
    const dietChart = [
      "give me a diet plan", "diet chart", "meal plan", "food plan",
      "what should i eat", "eating plan", "nutrition plan", "meal chart",
      "diet guide", "food guide", "daily diet", "can you make me a diet",
      "help me with diet", "healthy eating plan", "diet for muscle",
      "diet for weight loss", "what to eat", "food recommendation",
    ]
    dietChart.forEach(t => manager.addDocument("en", t, "diet_chart"))

    // ── BMI ──
    const bmiCalc = [
      "calculate my bmi", "check my bmi", "what is my bmi", "bmi calculator",
      "body mass index", "am i overweight", "am i underweight",
      "check my weight", "my bmi", "calculate bmi", "bmi check",
      "how many calories should i eat", "calorie calculator", "tdee",
      "maintenance calories", "how much should i eat",
    ]
    bmiCalc.forEach(t => manager.addDocument("en", t, "bmi_calc"))

    // ── DELIVERY INFO ──
    const deliveryInfo = [
      "delivery charge", "delivery cost", "how much for delivery",
      "delivery time", "how long does delivery take", "when will it arrive",
      "delivery to dhaka", "delivery to chittagong", "delivery to khulna",
      "free delivery", "shipping cost", "how long to deliver",
      "delivery fee", "is delivery free", "delivery charges",
    ]
    deliveryInfo.forEach(t => manager.addDocument("en", t, "delivery_info"))

    // ── INJURY HELP ──
    const injuryHelp = [
      "i have knee pain", "my knee hurts", "knee injury",
      "i have back pain", "my back hurts", "back injury",
      "shoulder pain", "shoulder injury", "my shoulder hurts",
      "wrist pain", "ankle pain", "i am injured", "i got injured",
      "pain in my knee", "pain in my back", "sore shoulder",
      "can i workout with injury", "exercise with pain",
    ]
    injuryHelp.forEach(t => manager.addDocument("en", t, "injury_help"))

    // ── SUPPLEMENT ──
    const supplement = [
      "what supplements should i take", "supplement advice", "protein powder",
      "creatine", "whey protein", "what to take for muscle", "supplement guide",
      "should i take supplements", "best supplements", "supplement recommendation",
      "bcaa", "pre workout supplement", "what supplement is good",
    ]
    supplement.forEach(t => manager.addDocument("en", t, "supplement"))

    // ── PRODUCT BROWSE ──
    const productBrowse = [
      "show me your products", "what do you sell", "browse products",
      "gym clothing", "gym clothes", "gym wear", "flextreme products",
      "show me clothes", "what products", "your clothing",
      "compression shirt", "compression top", "gym shirt",
      "buy clothes", "shop", "browse", "see products",
    ]
    productBrowse.forEach(t => manager.addDocument("en", t, "product_browse"))

    // ── GREETING ──
    const greeting = [
      "hi", "hello", "hey", "good morning", "good evening",
      "hi there", "hello there", "hey there", "whats up", "wassup",
      "how are you", "how are you doing", "how is it going",
    ]
    greeting.forEach(t => manager.addDocument("en", t, "greeting"))

    // Train the model
    await manager.train()
    manager.save = () => {} // disable file saving
    classifierCache = manager
    console.log("[FlexNLP] Model trained successfully")
    return manager
  } catch (e) {
    console.warn("[FlexNLP] Failed to load node-nlp:", e)
    return null
  }
}

export async function classifyIntent(message: string): Promise<{ intent: string, score: number } | null> {
  try {
    const manager = await getClassifier()
    if (!manager) return null
    const result = await manager.process("en", message.toLowerCase().trim())
    if (result.intent && result.score > 0.5) {
      return { intent: result.intent, score: result.score }
    }
    return null
  } catch {
    return null
  }
}
