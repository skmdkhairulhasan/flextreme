"use client"

export type FlexChatMessage = { role: "user" | "assistant"; content: string }
export type FlexChatProfile = {
  height?: number
  weight?: number
  age?: number
  gender?: string
  goal?: string
  religion?: string
  activity?: string
  workoutType?: string
  workoutDays?: number
  experience?: string
  step?: string
}

type FlexChatSnapshot = {
  messages?: FlexChatMessage[]
  profile?: FlexChatProfile
  mode?: string | null
  updatedAt?: number
  expiresAt?: number
}

const STORAGE_KEY = "flextreme_flex_ai_chat"
const EVENT_NAME = "flextreme:flex-ai-chat-sync"
const SESSION_TTL_MS = 6 * 60 * 60 * 1000

function isBrowser() {
  return typeof window !== "undefined"
}

export function loadFlexChatSnapshot(): FlexChatSnapshot | null {
  if (!isBrowser()) return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const snapshot = JSON.parse(raw) as FlexChatSnapshot
    if (snapshot.expiresAt && snapshot.expiresAt < Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return snapshot
  } catch {
    return null
  }
}

export function saveFlexChatSnapshot(snapshot: FlexChatSnapshot) {
  if (!isBrowser()) return

  const current = loadFlexChatSnapshot() || {}
  const now = Date.now()
  const next = {
    ...current,
    ...snapshot,
    updatedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }))
  }, 0)
}

export function subscribeFlexChatSnapshot(callback: (snapshot: FlexChatSnapshot) => void) {
  if (!isBrowser()) return () => {}

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    try {
      callback(JSON.parse(event.newValue) as FlexChatSnapshot)
    } catch {}
  }

  const onCustom = (event: Event) => {
    callback((event as CustomEvent<FlexChatSnapshot>).detail)
  }

  window.addEventListener("storage", onStorage)
  window.addEventListener(EVENT_NAME, onCustom)

  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(EVENT_NAME, onCustom)
  }
}
