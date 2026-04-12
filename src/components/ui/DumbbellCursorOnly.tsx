"use client"
import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"

export default function DumbbellCursorOnly() {
  const [pos, setPos] = useState({ x: -200, y: -200 })
  const [visible, setVisible] = useState(false)
  const [scrollbarHeld, setScrollbarHeld] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [rapidClick, setRapidClick] = useState(false)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; dx: number; dy: number }[]>([])
  const [mounted, setMounted] = useState(false)
  const clickCount = useRef(0)
  const clickTimer = useRef<NodeJS.Timeout | null>(null)
  const rapidTimer = useRef<NodeJS.Timeout | null>(null)
  const particleId = useRef(0)

  useEffect(() => { setMounted(true) }, [])

  // Tweak these 3 numbers to change size
  const size = rapidClick ? 48 : clicked ? 42 : 32

  // ── TILT SETTINGS ──
  // Change TILT_DEG to adjust the angle (e.g. 30, 45, -20)
  // Change TILT_X and TILT_Y to move the hotspot (action point)
  // More negative = toward top-left, less negative = more centered
  const TILT_DEG = 45
  const TILT_X = -30  // % offset X for hotspot
  const TILT_Y = -30  // % offset Y for hotspot

  useEffect(() => {
    function isScrollbarClick(e: MouseEvent) {
      return e.clientX >= document.documentElement.clientWidth
    }
    function onMove(e: MouseEvent) {
      setPos({ x: e.clientX, y: e.clientY })
      if (!isScrollbarClick(e) && !scrollbarHeld) setVisible(true)
    }
    function onDown(e: MouseEvent) {
      if (isScrollbarClick(e)) { setScrollbarHeld(true); setVisible(false); return }
      setClicked(true)
      clickCount.current++
      if (clickTimer.current) clearTimeout(clickTimer.current)
      clickTimer.current = setTimeout(() => { clickCount.current = 0 }, 600)
      if (clickCount.current >= 5) {
        setRapidClick(true)
        if (rapidTimer.current) clearTimeout(rapidTimer.current)
        rapidTimer.current = setTimeout(() => { setRapidClick(false); clickCount.current = 0 }, 1200)
        const id = particleId.current++
        const newParticles = Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2
          return { id: id * 100 + i, x: e.clientX, y: e.clientY, dx: Math.cos(angle), dy: Math.sin(angle) }
        })
        setParticles(p => [...p, ...newParticles])
        setTimeout(() => setParticles(p => p.filter(pt => !newParticles.find(n => n.id === pt.id))), 650)
      } else {
        const id = particleId.current++
        const newParticles = Array.from({ length: 4 }, (_, i) => {
          const angle = (i / 4) * Math.PI * 2
          return { id: id * 100 + i, x: e.clientX, y: e.clientY, dx: Math.cos(angle), dy: Math.sin(angle) }
        })
        setParticles(p => [...p, ...newParticles])
        setTimeout(() => setParticles(p => p.filter(pt => !newParticles.find(n => n.id === pt.id))), 650)
      }
    }
    function onUp() {
      setClicked(false)
      if (scrollbarHeld) { setScrollbarHeld(false); setVisible(true) }
    }
    function onLeave() { setVisible(false) }
    function onEnter() { setVisible(true) }

    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("mousedown", onDown, { passive: true })
    window.addEventListener("mouseup", onUp, { passive: true })
    document.documentElement.addEventListener("mouseleave", onLeave)
    document.documentElement.addEventListener("mouseenter", onEnter)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mousedown", onDown)
      window.removeEventListener("mouseup", onUp)
      document.documentElement.removeEventListener("mouseleave", onLeave)
      document.documentElement.removeEventListener("mouseenter", onEnter)
      if (clickTimer.current) clearTimeout(clickTimer.current)
      if (rapidTimer.current) clearTimeout(rapidTimer.current)
    }
  }, [scrollbarHeld])

  const t = `translate(${TILT_X}%, ${TILT_Y}%) rotate(${TILT_DEG}deg)`
  const tRage1 = `translate(${TILT_X}%, ${TILT_Y}%) rotate(${TILT_DEG - 8}deg)`
  const tRage2 = `translate(${TILT_X}%, ${TILT_Y}%) rotate(${TILT_DEG + 8}deg)`

  const css = `
    *, *::before, *::after { cursor: none !important; }

    @keyframes dbClick {
      0%   { transform: ${t} scale(1); }
      25%  { transform: ${t} scale(0.75); }
      60%  { transform: ${t} scale(1.18); }
      80%  { transform: ${t} scale(0.96); }
      100% { transform: ${t} scale(1); }
    }
    @keyframes dbRage {
      0%,100% { transform: ${tRage1} scale(1.3); }
      50%     { transform: ${tRage2} scale(1.45); }
    }
    @keyframes dbParticle {
      0%   { opacity: 0.9; transform: translate(-50%,-50%) scale(1); }
      100% { opacity: 0; transform: translate(calc(-50% + var(--dx)*50px), calc(-50% + var(--dy)*50px)) scale(0); }
    }
    @keyframes dbRageText {
      0%   { opacity:0; transform:translate(-50%,-160%) scale(0.7); }
      30%  { opacity:1; transform:translate(-50%,-180%) scale(1); }
      70%  { opacity:1; transform:translate(-50%,-185%) scale(1); }
      100% { opacity:0; transform:translate(-50%,-210%) scale(0.9); }
    }

    .db-cur {
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      transform: ${t};
      will-change: left, top;
      transition: opacity 0.08s;
    }
    .db-cur.clicking { animation: dbClick 0.3s cubic-bezier(0.36,0.07,0.19,0.97) forwards; }
    .db-cur.raging   { animation: dbRage 0.25s ease-in-out infinite; }

    .db-particle {
      position: fixed;
      pointer-events: none;
      z-index: 2147483646;
      border-radius: 50%;
      background: white;
      mix-blend-mode: exclusion;
      animation: dbParticle 0.65s ease-out forwards;
      transform: translate(-50%,-50%);
    }
    .db-rage-label {
      position: fixed;
      pointer-events: none;
      z-index: 2147483646;
      font-size: 0.6rem;
      font-weight: 900;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: white;
      mix-blend-mode: exclusion;
      animation: dbRageText 1s ease-out forwards;
      white-space: nowrap;
      transform: translate(-50%, -100%);
    }
  `

  if (!mounted) return <style dangerouslySetInnerHTML={{ __html: css }} />

  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {rapidClick && (
        <div className="db-rage-label" style={{ left: pos.x, top: pos.y }}>
          {["LIFT! 🏋️", "GRIND!", "BEAST MODE!", "MAX OUT!", "GET GAINS!"][Math.floor(Date.now() / 1000) % 5]}
        </div>
      )}

      {particles.map(p => (
        <div key={p.id} className="db-particle" style={{
          left: p.x, top: p.y,
          width: rapidClick ? "7px" : "5px",
          height: rapidClick ? "7px" : "5px",
          "--dx": p.dx, "--dy": p.dy,
        } as React.CSSProperties} />
      ))}

      <div
        className={"db-cur " + (rapidClick ? "raging" : clicked ? "clicking" : "")}
        style={{ left: pos.x, top: pos.y, opacity: visible ? 1 : 0 }}
      >
        <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block", transition: "width 0.15s ease, height 0.15s ease" }}>
          <rect x="18" y="21" width="12" height="6" rx="2" fill="white"/>
          <rect x="6"  y="16" width="8"  height="16" rx="3" fill="white"/>
          <rect x="3"  y="19" width="6"  height="10" rx="2" fill="white"/>
          <rect x="34" y="16" width="8"  height="16" rx="3" fill="white"/>
          <rect x="39" y="19" width="6"  height="10" rx="2" fill="white"/>
        </svg>
      </div>
    </>,
    document.body
  )
}
