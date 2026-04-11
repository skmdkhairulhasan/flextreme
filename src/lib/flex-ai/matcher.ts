export function contains(msg:string, words:string[]){

for(const w of words){

if(msg.includes(w)) return true

}

return false

}