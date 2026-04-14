"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function AnnouncementBanner() {
  const [text, setText] = useState("")
  const [bg, setBg] = useState("#000000")
  const [color, setColor] = useState("#ffffff")
  const [enabled, setEnabled] = useState(false)
  const [speed, setSpeed] = useState(30) // seconds - higher = slower

  useEffect(() => {
    createClient()
      .from("settings")
      .select("key, value")
      .in("key", ["banner_text","banner_bg","banner_color","banner_enabled","banner_speed"])
      .then(({ data }) => {
        if (!data) return
        const m: Record<string, string> = {}
        data.forEach(r => { m[r.key] = r.value })
        if (m.banner_text) setText(m.banner_text)
        if (m.banner_bg) setBg(m.banner_bg)
        if (m.banner_color) setColor(m.banner_color)
        if (m.banner_speed) setSpeed(parseInt(m.banner_speed) || 30)
        setEnabled(m.banner_enabled === "true")
      })
  }, [])

  if (!enabled || !text) return null

  return (
    <>
      <style>{`
        body .navbar-fixed { top: 36px !important; }
        @keyframes marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .banner-track {
          display: inline-flex;
          gap: 80px;
          white-space: nowrap;
          animation: marquee ${speed}s linear infinite;
        }
        .banner-track:hover { animation-play-state: paused; }
      `}</style>
      <div style={{ height: "36px" }} />
      <div style={{ backgroundColor: bg, overflow: "hidden", height: "36px", display: "flex", alignItems: "center", position: "fixed", top: 0, left: 0, right: 0, zIndex: 55 }}>
        <div className="banner-track">
          {[...Array(6)].map((_, i) => (
            <span key={i} style={{ color, fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {text}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
