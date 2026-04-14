"use client"
import { useState, useRef, useEffect } from "react"

interface Props {
  imageUrl: string
  onSave: (scale: number, posX: number, posY: number) => void
  initialScale?: number
  initialPosX?: number
  initialPosY?: number
}

export default function HeroImageEditor({ imageUrl, onSave, initialScale = 1, initialPosX = 50, initialPosY = 50 }: Props) {
  const [scale, setScale] = useState(initialScale)
  const [posX, setPosX] = useState(initialPosX)
  const [posY, setPosY] = useState(initialPosY)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, posX: 50, posY: 50 })
  const [saved, setSaved] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    setDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY, posX, posY })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100 / scale
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100 / scale
    setPosX(Math.min(100, Math.max(0, dragStart.posX - dx)))
    setPosY(Math.min(100, Math.max(0, dragStart.posY - dy)))
  }

  function handleMouseUp() { setDragging(false) }

  function handleTouchStart(e: React.TouchEvent) {
    e.preventDefault()
    const t = e.touches[0]
    setDragging(true)
    setDragStart({ x: t.clientX, y: t.clientY, posX, posY })
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!dragging || !containerRef.current) return
    e.preventDefault()
    const t = e.touches[0]
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((t.clientX - dragStart.x) / rect.width) * 100 / scale
    const dy = ((t.clientY - dragStart.y) / rect.height) * 100 / scale
    setPosX(Math.min(100, Math.max(0, dragStart.posX - dx)))
    setPosY(Math.min(100, Math.max(0, dragStart.posY - dy)))
  }

  function handleTouchEnd() { setDragging(false) }

  function handleSave() {
    onSave(scale, posX, posY)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function reset() {
    setScale(1)
    setPosX(50)
    setPosY(50)
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", marginBottom: "0.75rem" }}>
        Visual Position Editor — Drag to reposition · Use slider to zoom
      </p>

      {/* Preview frame — 16:9 hero ratio */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          overflow: "hidden",
          backgroundColor: "black",
          cursor: dragging ? "grabbing" : "grab",
          border: "2px solid black",
          userSelect: "none",
        }}
      >
        {/* The image */}
        <img
          src={imageUrl}
          alt="Hero preview"
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: posX + "% " + posY + "%",
            transform: "scale(" + scale + ")",
            transformOrigin: posX + "% " + posY + "%",
            pointerEvents: "none",
          }}
        />

        {/* Dark overlay preview */}
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", pointerEvents: "none" }} />

        {/* Grid overlay — rule of thirds */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          viewBox="0 0 300 169"
          preserveAspectRatio="none"
        >
          {/* Vertical thirds */}
          <line x1="100" y1="0" x2="100" y2="169" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <line x1="200" y1="0" x2="200" y2="169" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

          {/* Horizontal thirds */}
          <line x1="0" y1="56" x2="300" y2="56" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <line x1="0" y1="113" x2="300" y2="113" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

          {/* Center cross — bold */}
          <line x1="150" y1="0" x2="150" y2="169" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="0" y1="84.5" x2="300" y2="84.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

          {/* Center dot */}
          <circle cx="150" cy="84.5" r="3" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
          <circle cx="150" cy="84.5" r="1" fill="rgba(255,255,255,0.6)" />

          {/* Rule of thirds intersection dots */}
          {[100, 200].map(x => [56, 113].map(y => (
            <circle key={x + "-" + y} cx={x} cy={y} r="2" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          )))}

          {/* Corner marks */}
          <path d="M0 15 L0 0 L15 0" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
          <path d="M285 0 L300 0 L300 15" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
          <path d="M0 154 L0 169 L15 169" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
          <path d="M285 169 L300 169 L300 154" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        </svg>

        {/* Labels */}
        <div style={{ position: "absolute", bottom: "0.5rem", left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.5)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", pointerEvents: "none", whiteSpace: "nowrap" }}>
          Drag to reposition
        </div>

        {/* Scale indicator */}
        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", color: "rgba(255,255,255,0.6)", fontSize: "0.65rem", fontWeight: 700, backgroundColor: "rgba(0,0,0,0.5)", padding: "0.2rem 0.5rem", pointerEvents: "none" }}>
          {scale.toFixed(1)}x
        </div>

        {/* Text preview overlay */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "white", fontWeight: 900, fontSize: "clamp(1.2rem, 4vw, 2.5rem)", letterSpacing: "-0.04em", textTransform: "uppercase", lineHeight: 0.9, opacity: 0.8 }}>WORK</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontWeight: 900, fontSize: "clamp(1.2rem, 4vw, 2.5rem)", letterSpacing: "-0.04em", textTransform: "uppercase", lineHeight: 0.9, opacity: 0.8 }}>HARD.</p>
            <p style={{ color: "white", fontWeight: 900, fontSize: "clamp(1.2rem, 4vw, 2.5rem)", letterSpacing: "-0.04em", textTransform: "uppercase", lineHeight: 0.9, opacity: 0.8, marginTop: "0.1em" }}>FLEX</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontWeight: 900, fontSize: "clamp(1.2rem, 4vw, 2.5rem)", letterSpacing: "-0.04em", textTransform: "uppercase", lineHeight: 0.9, opacity: 0.8 }}>EXTREME.</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem", color: "#555" }}>
            Zoom — {scale.toFixed(2)}x
          </label>
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#999", marginTop: "0.2rem" }}>
            <span>1x (fit)</span>
            <span>4x (max zoom)</span>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem", color: "#555" }}>
            Position — X: {Math.round(posX)}% Y: {Math.round(posY)}%
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <div>
              <p style={{ fontSize: "0.65rem", color: "#999", marginBottom: "0.2rem" }}>Horizontal</p>
              <input type="range" min={0} max={100} step={1} value={posX} onChange={e => setPosX(parseFloat(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.65rem", color: "#999", marginBottom: "0.2rem" }}>Vertical</p>
              <input type="range" min={0} max={100} step={1} value={posY} onChange={e => setPosY(parseFloat(e.target.value))} style={{ width: "100%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick position presets */}
      <div style={{ marginTop: "0.75rem" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.5rem" }}>Quick Position</p>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {[
            { label: "Center", x: 50, y: 50 },
            { label: "Top", x: 50, y: 20 },
            { label: "Bottom", x: 50, y: 80 },
            { label: "Left", x: 20, y: 50 },
            { label: "Right", x: 80, y: 50 },
            { label: "Top Left", x: 20, y: 20 },
            { label: "Top Right", x: 80, y: 20 },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => { setPosX(preset.x); setPosY(preset.y) }}
              style={{
                padding: "0.3rem 0.75rem",
                fontSize: "0.7rem",
                fontWeight: 600,
                border: "1px solid #e0e0e0",
                backgroundColor: Math.round(posX) === preset.x && Math.round(posY) === preset.y ? "black" : "white",
                color: Math.round(posX) === preset.x && Math.round(posY) === preset.y ? "white" : "#666",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: "0.75rem",
            backgroundColor: saved ? "#16a34a" : "black",
            color: "white",
            border: "none",
            fontSize: "0.8rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          {saved ? "Saved to Website!" : "Apply to Website"}
        </button>
        <button
          onClick={reset}
          style={{
            padding: "0.75rem 1.25rem",
            backgroundColor: "white",
            color: "black",
            border: "1px solid #e0e0e0",
            fontSize: "0.8rem",
            fontWeight: 600,
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
