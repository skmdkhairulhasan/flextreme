export async function flexAI(
  userMessage: string,
  profile?: any,
  products?: any[],
  settings?: Record<string, string>
): Promise<string> {
  // Fallback AI response when no specific intent matched
  const msg = userMessage.toLowerCase()

  // Product recommendation
  if (msg.includes("recommend") || msg.includes("suggest") || msg.includes("what should")) {
    if (products && products.length > 0) {
      const top = products.slice(0, 3)
      return "Here are some popular products:\n\n" + top.map(p => `• ${p.name} — BDT ${p.price}`).join("\n") + "\n\nBrowse more at /products"
    }
    return "Check out our products at /products"
  }

  // Default friendly response
  return "I'm here to help! Ask me about:\n• Workout plans\n• Diet advice\n• BMI calculation\n• Products\n• Order tracking\n• Delivery info\n\nWhat would you like to know?"
}
