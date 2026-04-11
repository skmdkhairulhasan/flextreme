export function emotionalReply(msg:string){

if(msg.includes("sad") || msg.includes("depressed"))
return "Bad days happen. Even a 20 minute workout can clear your mind. Stay strong 💪"

if(msg.includes("tired"))
return "Recovery matters. Sleep well, hydrate, and come back stronger tomorrow."

if(msg.includes("happy"))
return "Love the energy. Channel it into the gym 💪"

return null

}