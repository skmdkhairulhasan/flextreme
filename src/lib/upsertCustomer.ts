// Upsert customer after order — call this after any successful order insert
export async function upsertCustomer(
  supabase: any,
  { name, phone, totalPrice }: { name: string; phone: string; totalPrice: number }
) {
  try {
    // Check if customer exists
    const { data: existing } = await supabase
      .from("customers")
      .select("id,total_orders,total_spent,flex100")
      .eq("phone", phone)
      .single()

    if (existing) {
      // Update existing customer
      const newOrders = (existing.total_orders || 0) + 1
      const newSpent = (existing.total_spent || 0) + totalPrice
      await supabase.from("customers").update({
        name, // update name in case it changed
        total_orders: newOrders,
        total_spent: newSpent,
      }).eq("phone", phone)
    } else {
      // Count total customers to determine if FLEX100
      const { count } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
      const isFlex100 = (count || 0) < 100
      await supabase.from("customers").insert({
        name,
        phone,
        total_orders: 1,
        total_spent: totalPrice,
        flex100: isFlex100,
        vip: false,
      })
    }
  } catch (e) {
    console.error("Customer upsert failed:", e)
  }
}
