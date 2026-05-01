export async function getProducts() {
  try {
    const res = await fetch("/api/products?limit=20")
    if (!res.ok) return []
    const data = await res.json()
    return data.products || []
  } catch {
    return []
  }
}

export async function getOrderStatus(phone: string) {
  try {
    const res = await fetch("/api/orders?phone=" + encodeURIComponent(phone))
    if (!res.ok) return []
    const data = await res.json()
    return data.orders || []
  } catch {
    return []
  }
}
