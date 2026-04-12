let classifierCache: any = null

export async function getClassifier() {
  if (classifierCache) return classifierCache
  try {
    const { NlpManager } = await import("node-nlp")
    const manager = new NlpManager({ languages: ["en"], forceNER: false, nlu: { log: false } })

    const intents: Record<string, string[]> = {
      find_order: [
        "where is my order", "track my order", "find my order", "check my order",
        "where is my package", "my order status", "can you find my order",
        "what happened to my order", "when will my order arrive", "has my order shipped",
        "i want to track", "please find my order", "help me find my order",
        "look up my order", "locate my order", "i placed an order", "my parcel",
        "where is my delivery", "delivery status", "shipment status",
        "need to know about my order", "i need to know my order",
        "tell me about my order", "show me my order", "order info",
        "did my order arrive", "check my delivery", "find my purchase",
      ],
      size_help: [
        "what size should i get", "which size fits me", "size chart", "size guide",
        "size recommendation", "what size am i", "size help", "help me with size",
        "does this fit", "how does it fit", "should i get medium or large",
        "my chest is", "my chest size", "chest measurement", "i am 175cm what size",
        "what size for my chest", "chest 38 inch", "chest 36", "chest 40",
        "width 33", "width 35", "what size for 38 inch chest",
        "recommend size for me", "which size to buy",
      ],
      workout_plan: [
        "build me a workout", "give me a workout plan", "workout routine",
        "gym routine", "exercise plan", "training schedule", "training plan",
        "workout program", "gym program", "gym plan", "can you make me a workout",
        "help me train", "beginner workout", "full body workout",
        "how to get fit", "gym schedule", "what exercises should i do",
        "i want to work out", "make me a workout", "create a workout plan",
        "when should i go to the gym", "gym timing", "how often should i go to gym",
        "what day should i train",
      ],
      diet_chart: [
        "give me a diet plan", "diet chart", "meal plan", "food plan",
        "what should i eat", "eating plan", "nutrition plan", "meal chart",
        "diet guide", "food guide", "daily diet", "can you make me a diet",
        "help me with diet", "healthy eating plan", "diet for muscle",
        "diet for weight loss", "what to eat", "food recommendation",
        "build a diet chart", "create a diet plan", "make me a diet",
      ],
      bmi_calc: [
        "calculate my bmi", "check my bmi", "what is my bmi", "bmi calculator",
        "body mass index", "am i overweight", "am i underweight",
        "check my weight", "my bmi", "calculate bmi", "bmi check",
        "how many calories should i eat", "calorie calculator", "tdee",
        "maintenance calories", "how much should i eat", "my body stats",
      ],
      delivery_info: [
        "delivery charge", "delivery cost", "how much for delivery",
        "delivery time", "how long does delivery take", "when will it arrive",
        "delivery to dhaka", "delivery to chittagong", "free delivery",
        "shipping cost", "is delivery free", "delivery charges",
        "delivery fee", "how long to deliver", "delivery days",
      ],
      injury_help: [
        "i have knee pain", "my knee hurts", "knee injury", "knee problem",
        "i have back pain", "my back hurts", "back injury", "back problem",
        "shoulder pain", "shoulder injury", "my shoulder hurts",
        "wrist pain", "ankle pain", "i am injured", "i got injured",
        "pain in my knee", "pain in my back", "sore shoulder",
        "what should i do if i have knee pain", "knee pain what to do",
        "exercise with pain", "can i workout with injury", "hip pain",
      ],
      supplement: [
        "what supplements should i take", "supplement advice", "protein powder",
        "creatine", "whey protein", "what to take for muscle", "supplement guide",
        "should i take supplements", "best supplements", "supplement recommendation",
        "bcaa", "pre workout supplement", "how is supplements", "tell me about supplements",
        "supplement suggestion", "which supplement", "protein shake",
      ],
      product_browse: [
        "show me your products", "what do you sell", "browse products",
        "gym clothing", "gym clothes", "gym wear", "flextreme products",
        "show me clothes", "what products", "your clothing",
        "compression shirt", "compression top", "gym shirt",
        "buy clothes", "shop", "browse", "see products", "flextreme collection",
        "what do you have", "show me what you have",
      ],
      greeting: [
        "hi", "hello", "hey", "good morning", "good evening", "good afternoon",
        "hi there", "hello there", "hey there", "whats up", "wassup",
        "what should i call you", "what is your name", "who are you",
        "are you a bot", "are you ai", "introduce yourself",
      ],
    }

    Object.entries(intents).forEach(([intent, examples]) => {
      examples.forEach(ex => manager.addDocument("en", ex, intent))
    })

    await manager.train()
    manager.save = () => {}
    classifierCache = manager
    return manager
  } catch (e) {
    console.warn("[FlexNLP] Failed:", e)
    return null
  }
}

export async function classifyIntent(message: string): Promise<{ intent: string, score: number } | null> {
  try {
    const manager = await getClassifier()
    if (!manager) return null
    const result = await manager.process("en", message.toLowerCase().trim())
    if (result.intent && result.score > 0.5) return { intent: result.intent, score: result.score }
    return null
  } catch { return null }
}
