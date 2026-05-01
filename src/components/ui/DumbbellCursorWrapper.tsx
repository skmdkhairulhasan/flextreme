"use client"
import { useEffect, useState } from "react"
import DumbbellCursor from "../products/DumbbellCursor"

export default function DumbbellCursorWrapper() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.ok ? r.json() : { settings: [] })
      .then(data => {
        if (data.settings && Array.isArray(data.settings)) {
          const setting = data.settings.find((s: any) => s.key === "dumbbell_cursor_enabled")
          setEnabled(setting?.value === "true")
        }
      })
      .catch(() => setEnabled(false))
  }, [])

  if (!enabled) return null
  return <DumbbellCursor />
}
