"use client"
import { useEffect, useState } from "react"

export default function BrandStamp() {
  const [showFlex, setShowFlex] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowFlex(prev => !prev)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  const white = "white"
  const ash = "rgba(255,255,255,0.15)"
  const whiteGlow = "0 0 30px rgba(255,255,255,0.5), 0 0 80px rgba(255,255,255,0.2)"
  const noGlow = "none"
  const transition = "color 0.9s cubic-bezier(0.4,0,0.2,1), text-shadow 0.9s cubic-bezier(0.4,0,0.2,1)"

  const base: React.CSSProperties = {
    display: "inline-block",
    fontSize: "clamp(3rem, 10.5vw, 8.5rem)",
    fontWeight: 900,
    letterSpacing: "-0.02em",
    textTransform: "uppercase",
    lineHeight: 1,
    transition,
  }

  return (
    <div style={{ width: "100%", textAlign: "center", userSelect: "none", margin: "0 0 2rem", padding: "1rem 0" }}>
      <style>{`
        @keyframes breathe {
          0%,100% { opacity:1 }
          50% { opacity:0.88 }
        }
        .bwrap { animation: breathe 2.8s ease-in-out infinite; }
      `}</style>
      <div className="bwrap">
        <span style={{ ...base, color: showFlex ? white : ash, textShadow: showFlex ? whiteGlow : noGlow }}>FL</span>
        <span style={{ ...base, color: white, textShadow: whiteGlow }}>E</span>
        <span style={{ ...base, color: white, textShadow: whiteGlow }}>X</span>
        <span style={{ ...base, color: showFlex ? ash : white, textShadow: showFlex ? noGlow : whiteGlow }}>TREME</span>
      </div>
    </div>
  )
}
