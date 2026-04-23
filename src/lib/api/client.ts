"use client"

const TOKEN_KEY = "flextreme_admin_token"

function getApiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  return base.replace(/\/$/, "")
}

export function getAdminToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiFetchClient<T>(path: string, init: RequestInit = {}, requiresAuth = false): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set("content-type", headers.get("content-type") || "application/json")
  if (requiresAuth) {
    const token = getAdminToken()
    if (token) headers.set("authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  })

  const data: any = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || "Request failed")
  }
  return data as T
}

export async function uploadFileToApi(file: File, folder: string) {
  const token = getAdminToken()
  const formData = new FormData()
  formData.append("file", file)
  formData.append("folder", folder)
  const response = await fetch(`${getApiBaseUrl()}/api/upload`, {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })
  const data: any = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || "Upload failed")
  }
  return data as { key: string; url: string }
}
