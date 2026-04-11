"use client"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import LogoCursor from "./LogoCursor"
import DumbbellCursorOnly from "./DumbbellCursorOnly"

export default function DumbbellCursorWrapper() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [cursorType, setCursorType] = useState<string | null>(null)

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches
    const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    const isSmallScreen = window.innerWidth < 1024
    if (!isTouch && hasMouse && !isSmallScreen) setShow(true)
    function onResize() {
      const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches
      const mouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches
      const small = window.innerWidth < 1024
      setShow(!touch && mouse && !small)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    async function fetchCursorType() {
      const supabase = createClient()
      const { data } = await supabase.from("settings").select("value").eq("key", "cursor_type").single()
      setCursorType(data?.value || "logo")
    }
    fetchCursorType()
  }, [])

  if (pathname.startsWith("/admin")) return null
  if (!show) return null
  if (cursorType === null) return null       // loading — no flicker
  if (cursorType === "normal") return null   // system cursor

  if (cursorType === "dumbbell") return <DumbbellCursorOnly />
  return <LogoCursor />                      // default: logo
}
