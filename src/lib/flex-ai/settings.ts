export async function getSetting(key: string): Promise<string | null> {
  try {
    const res = await fetch("/api/settings")
    if (!res.ok) return null
    const data = await res.json()
    if (data.settings && Array.isArray(data.settings)) {
      const setting = data.settings.find((s: any) => s.key === key)
      return setting?.value || null
    }
    return null
  } catch {
    return null
  }
}

export async function getDeliveryCharges() {
  try {
    const res = await fetch("/api/settings")
    if (!res.ok) return []
    const data = await res.json()
    if (data.settings && Array.isArray(data.settings)) {
      return data.settings.filter((s: any) => s.key?.startsWith("delivery_"))
    }
    return []
  } catch {
    return []
  }
}
