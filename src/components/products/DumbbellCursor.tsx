"use client"
import { useEffect, useState, useRef } from "react"

export default function DumbbellCursor() {
  const [pos, setPos] = useState({ x: -200, y: -200 })
  const [visible, setVisible] = useState(false)
  const [scrollbarHeld, setScrollbarHeld] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [rapidClick, setRapidClick] = useState(false)
  const [overImage, setOverImage] = useState(false)
  const [particles, setParticles] = useState<{ id: number, x: number, y: number, dx: number, dy: number }[]>([])
  const clickCount = useRef(0)
  const clickTimer = useRef<NodeJS.Timeout | null>(null)
  const rapidTimer = useRef<NodeJS.Timeout | null>(null)
  const particleId = useRef(0)

  useEffect(() => {
    // Watch for data-hovering-image only — NOT data-lightbox
    // Cursor should show in fullscreen lightbox
    const observer = new MutationObserver(() => {
      const isHovering = document.documentElement.hasAttribute("data-hovering-image")
      setOverImage(isHovering)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-hovering-image"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function isScrollbarClick(e: MouseEvent) {
      return e.clientX >= document.documentElement.clientWidth
    }
    function onMove(e: MouseEvent) {
      setPos({ x: e.clientX, y: e.clientY })
      if (!scrollbarHeld) setVisible(true)
    }
    function onDown(e: MouseEvent) {
      if (isScrollbarClick(e)) { setScrollbarHeld(true); setVisible(false); return }
      clickCount.current += 1
      setClicked(true)
      if (clickTimer.current) clearTimeout(clickTimer.current)
      clickTimer.current = setTimeout(() => setClicked(false), 300)
      if (clickCount.current >= 4) {
        setRapidClick(true)
        if (rapidTimer.current) clearTimeout(rapidTimer.current)
        rapidTimer.current = setTimeout(() => { setRapidClick(false); clickCount.current = 0 }, 1000)
      }
      setTimeout(() => { clickCount.current = 0 }, 500)
      const count = clickCount.current >= 4 ? 8 : 3
      const newParticles = Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2
        const speed = 1.5 + Math.random() * 2.5
        return { id: particleId.current++, x: e.clientX, y: e.clientY, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed }
      })
      setParticles(prev => [...prev, ...newParticles])
      setTimeout(() => { setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id))) }, 600)
    }
    function onUp(e: MouseEvent) {
      if (scrollbarHeld) { setScrollbarHeld(false); setPos({ x: e.clientX, y: e.clientY }); setVisible(true) }
    }
    function onLeave() { setVisible(false) }
    function onEnter(e: MouseEvent) {
      if (!scrollbarHeld) { setPos({ x: e.clientX, y: e.clientY }); setVisible(true) }
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mousedown", onDown)
    window.addEventListener("mouseup", onUp)
    document.addEventListener("mouseleave", onLeave)
    document.addEventListener("mouseenter", onEnter as EventListener)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mousedown", onDown)
      window.removeEventListener("mouseup", onUp)
      document.removeEventListener("mouseleave", onLeave)
      document.removeEventListener("mouseenter", onEnter as EventListener)
    }
  }, [scrollbarHeld])

  // Only hide when hovering over product image zoom area — NOT in lightbox
  if (!visible || scrollbarHeld || overImage) return null

  const size = clicked ? 26 : rapidClick ? 38 : 30

  return (
    <>
      <style>{`
        *, *::before, *::after { cursor: none !important; }
        @keyframes fxClick {
          0%   { transform: translate(-50%, 0) scale(1); }
          25%  { transform: translate(-50%, 0) scale(0.72); }
          60%  { transform: translate(-50%, 0) scale(1.18); }
          80%  { transform: translate(-50%, 0) scale(0.96); }
          100% { transform: translate(-50%, 0) scale(1); }
        }
        @keyframes fxRage {
          0%,100% { transform: translate(-50%, 0) scale(1.2) rotate(-6deg); }
          25%     { transform: translate(-50%, 0) scale(1.35) rotate(6deg); }
          50%     { transform: translate(-50%, 0) scale(1.18) rotate(-4deg); }
          75%     { transform: translate(-50%, 0) scale(1.38) rotate(5deg); }
        }
        @keyframes fxParticle {
          0%   { opacity: 0.9; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(calc(var(--dx)*45px), calc(var(--dy)*45px)) scale(0); }
        }
        @keyframes rageText {
          0%   { opacity:0; transform:translate(-50%,-100%) scale(0.7); }
          30%  { opacity:1; transform:translate(-50%,-130%) scale(1); }
          70%  { opacity:1; transform:translate(-50%,-140%) scale(1); }
          100% { opacity:0; transform:translate(-50%,-170%) scale(0.9); }
        }
        .fx-cur {
          position: fixed;
          pointer-events: none;
          z-index: 9999999999;
          top: 0;
          left: 0;
          transform: translate(-50%, 0);
          will-change: left, top;
          mix-blend-mode: exclusion;
        }
        .fx-cur.idle { transform: translate(-50%, 0); }
        .fx-cur.clicking { animation: fxClick 0.3s cubic-bezier(0.36,0.07,0.19,0.97) forwards; }
        .fx-cur.raging { animation: fxRage 0.25s ease-in-out infinite; }
        .fx-particle {
          position: fixed;
          pointer-events: none;
          z-index: 9999999998;
          border-radius: 50%;
          mix-blend-mode: exclusion;
          animation: fxParticle 0.6s ease-out forwards;
        }
        .rage-label {
          position: fixed;
          pointer-events: none;
          z-index: 9999999998;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: white;
          mix-blend-mode: exclusion;
          animation: rageText 1s ease-out forwards;
          white-space: nowrap;
        }
      `}</style>

      {rapidClick && (
        <div className="rage-label" style={{ left: pos.x, top: pos.y - 20 }}>
          {["FLEX EXTREME", "WORK HARD", "NO LIMITS", "PUSH IT", "GO HARD"][Math.floor(Math.random() * 5)]}
        </div>
      )}

      {particles.map(p => (
        <div key={p.id} className="fx-particle" style={{
          left: p.x, top: p.y,
          width: rapidClick ? "7px" : "5px",
          height: rapidClick ? "7px" : "5px",
          backgroundColor: "white",
          "--dx": p.dx, "--dy": p.dy,
        } as React.CSSProperties} />
      ))}

      <div
        className={"fx-cur " + (rapidClick ? "raging" : clicked ? "clicking" : "idle")}
        style={{ left: pos.x, top: pos.y }}
      >
        <img
          src="/logo-transparent.png"
          alt=""
          draggable={false}
          style={{
            width: size + "px",
            height: size + "px",
            objectFit: "contain",
            filter: "invert(1)",
            display: "block",
            transition: "width 0.15s ease, height 0.15s ease",
          }}
        />
      </div>
    </>
  )
}
