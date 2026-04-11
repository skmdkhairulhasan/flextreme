import { createClient } from "@/lib/supabase/client"

export async function getSetting(key:string){

const supabase = createClient()

const {data} = await supabase
.from("settings")
.select("value")
.eq("key",key)
.single()

return data?.value || null

}

export async function getDeliveryCharges(){

const supabase = createClient()

const {data} = await supabase
.from("settings")
.select("key,value")
.like("key","delivery_%")

return data

}