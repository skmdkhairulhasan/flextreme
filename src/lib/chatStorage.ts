const STORAGE_KEY = "flextreme_chat_history"
const TTL = 1000 * 60 * 60 * 4
const EVENT_NAME = "flextreme:chat-history-sync"

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function saveChat<T>(messages: T[]) {
  if (!canUseStorage()) return

  try {
    const payload = {
      messages,
      timestamp: Date.now(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }))
  } catch {}
}

export function loadChat<T>(): T[] {
  if (!canUseStorage()) return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.timestamp !== "number" || !Array.isArray(parsed.messages)) {
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    if (Date.now() - parsed.timestamp > TTL) {
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    return parsed.messages
  } catch {
    return []
  }
}

export function clearChat() {
  if (!canUseStorage()) return
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { messages: [], timestamp: Date.now() } }))
}

export function subscribeChat(callback: () => void) {
  if (typeof window === "undefined") return () => {}

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback()
  }
  const onCustom = () => callback()

  window.addEventListener("storage", onStorage)
  window.addEventListener(EVENT_NAME, onCustom)

  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(EVENT_NAME, onCustom)
  }
}
