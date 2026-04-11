import { createClient } from "@/lib/supabase/client"

export async function getProducts(){

const supabase = createClient()

const {data} = await supabase
.from("products")
.select("name,price,sizes,colors")

return data

}

export async function getOrderStatus(phone:string){

const supabase = createClient()

const {data} = await supabase
.from("orders")
.select("*")
.eq("phone",phone)
.order("created_at",{ascending:false})
.limit(1)

return data

}
