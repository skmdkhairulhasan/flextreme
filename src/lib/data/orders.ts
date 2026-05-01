export const orders: any[] = []
export const customers: any[] = []

export function recalculateCustomerStats(phone: string) {
  const customer = customers.find((c) => c.phone === phone)
  if (!customer) return

  const customerOrders = orders.filter((o) => o.phone === phone)
  const counted = ["confirmed", "processing", "shipped", "delivered"]

  const countedOrders = customerOrders.filter((o) => counted.includes(o.status))
  customer.total_orders = countedOrders.length
  customer.total_spent = countedOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0)
}
