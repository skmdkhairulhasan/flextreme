function getApiBaseUrl() {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
  return base.replace(/\/$/, "")
}

export async function apiFetchServer<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    throw new Error(data.error || "Request failed")
  }
  return data as T
}
