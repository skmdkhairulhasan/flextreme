export function detectTopic(msg:string){

if(msg.includes("order")) return "order"

if(msg.includes("product") || msg.includes("catalog"))
return "product"

if(msg.includes("delivery")) return "delivery"

if(msg.includes("diet")) return "diet"

if(msg.includes("workout")) return "workout"

if(msg.includes("bmi")) return "bmi"

if(msg.includes("flextreme") || msg.includes("brand"))
return "brand"

return "general"

}