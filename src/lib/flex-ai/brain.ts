import { normalizeMessage } from "./normalizer"
import { emotionalReply } from "./emotion"
import { detectTopic } from "./router"
import { calcBMI,bmiCategory,generateDiet,generateWorkout } from "./fitness"
import { getProducts,getOrderStatus } from "./ecommerce"
import { getSetting,getDeliveryCharges } from "./settings"

export async function flexAI(raw:string){

const msg = normalizeMessage(raw)

const emotion = emotionalReply(msg)

if(emotion) return emotion

const topic = detectTopic(msg)

if(topic==="product"){

const products = await getProducts()

if(!products) return "No products found."

return `Available products:\n\n${products.map((p: any)=>`${p.name} — BDT ${p.price}`).join("\n")}`

}

if(topic==="delivery"){

const charges = await getDeliveryCharges()

let reply = "Delivery charges:\n"

charges?.forEach((c: any)=>{
reply += `${c.key.replace("delivery_","")} — ${c.value} BDT\n`
})

return reply

}

if(topic==="brand"){

const story = await getSetting("brand_story")

return story || "Flextreme is a premium gym wear brand."

}

if(topic==="diet"){

return generateDiet(70)

}

if(topic==="workout"){

return generateWorkout()

}

if(topic==="bmi"){

return "Tell me your height and weight to calculate BMI."

}

if(topic==="order"){

return "Send me the phone number you used when ordering and I'll check your order status. 📦"

}

// Neutral fallback — does NOT contain "Ask me about workouts" to avoid ChatBot loop
return "I can help with workouts, diet, BMI, supplements, gym gear, and Flextreme orders. What do you need? 💪"

}
