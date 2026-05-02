function getApiBaseUrl() {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === "production" ? "https://flextremefit.com" : "http://localhost:3000")
  return base.replace(/\/$/, "")
}

export async function apiFetchServer<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        ...(init.headers || {}),
        "content-type": "application/json",
      },
    })
    
    const data: any = await response.json().catch(() => ({}))
    
    if (!response.ok) {
      console.error(`API Error [${path}]:`, data.error || response.statusText)
      // Return empty data structure instead of throwing
      return {} as T
    }
    
    return data as T
  } catch (error) {
    console.error(`Fetch Error [${path}]:`, error)
    // Return empty data structure on network error
    return {} as T
  }
}
