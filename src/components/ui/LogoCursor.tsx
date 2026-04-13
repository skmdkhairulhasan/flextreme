"use client"
import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"

export default function LogoCursor() {
  const [pos, setPos] = useState({ x: -200, y: -200 })
  const lastPos = useRef({ x: -200, y: -200 })
  const [visible, setVisible] = useState(false)
  const [scrollbarHeld, setScrollbarHeld] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [rapidClick, setRapidClick] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; dx: number; dy: number }[]>([])
  const [mounted, setMounted] = useState(false)
  const clickCount = useRef(0)
  const clickTimer = useRef<NodeJS.Timeout | null>(null)
  const rapidTimer = useRef<NodeJS.Timeout | null>(null)
  const particleId = useRef(0)

  useEffect(() => { setMounted(true) }, [])

  // Small resting, big on click
  const size = rapidClick ? 48 : clicked ? 42 : hovering ? 34 : 20

  useEffect(() => {
    function isScrollbarClick(e: MouseEvent) {
      return e.clientX >= document.documentElement.clientWidth
    }
    function isInteractive(el: Element | null): boolean {
      if (!el) return false
      const tag = el.tagName.toLowerCase()
      if (['a','button','input','select','textarea','label'].includes(tag)) return true
      const style = window.getComputedStyle(el)
      if (style.cursor === 'pointer') return true
      if ((el as HTMLElement).getAttribute('role') === 'button') return true
      // Check if any ancestor within 4 levels is clickable (catches img inside <a>)
      let parent = el.parentElement
      for (let i = 0; i < 4 && parent; i++) {
        const pt = parent.tagName.toLowerCase()
        if (['a','button'].includes(pt)) return true
        if (window.getComputedStyle(parent).cursor === 'pointer') return true
        parent = parent.parentElement
      }
      return false
    }
    function onPointerMove(e: PointerEvent) {
      // Update cursor position even during scrollbar drag
      setPos({ x: e.clientX, y: e.clientY })
    }
    function onMove(e: MouseEvent) {
      lastPos.current = { x: e.clientX, y: e.clientY }
      setPos({ x: e.clientX, y: e.clientY })
      if (!isScrollbarClick(e) && !scrollbarHeld) setVisible(true)
      const el = document.elementFromPoint(e.clientX, e.clientY)
      setHovering(isInteractive(el) || isInteractive(el?.parentElement || null))
    }
    function onScroll() {
      const { x, y } = lastPos.current
      if (x < 0) return
      const el = document.elementFromPoint(x, y)
      setHovering(isInteractive(el) || isInteractive(el?.parentElement || null))
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
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("scroll", onScroll, { passive: true, capture: true })
    window.addEventListener("mousedown", onDown, { passive: true })
    window.addEventListener("mouseup", onUp, { passive: true })
    document.documentElement.addEventListener("mouseleave", onLeave)
    document.documentElement.addEventListener("mouseenter", onEnter)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("scroll", onScroll, { capture: true } as any)
      window.removeEventListener("mousedown", onDown)
      window.removeEventListener("mouseup", onUp)
      document.documentElement.removeEventListener("mouseleave", onLeave)
      document.documentElement.removeEventListener("mouseenter", onEnter)
      if (clickTimer.current) clearTimeout(clickTimer.current)
      if (rapidTimer.current) clearTimeout(rapidTimer.current)
    }
  }, [scrollbarHeld])

  const css = `
    *, *::before, *::after { cursor: none !important; }
    ::-webkit-scrollbar-thumb { cursor: grab !important; }
    ::-webkit-scrollbar-thumb:active { cursor: grabbing !important; }

    @keyframes logoClick {
      0%   { transform: translate(-50%, -50%) scale(1); }
      25%  { transform: translate(-50%, -50%) scale(0.75); }
      60%  { transform: translate(-50%, -50%) scale(1.18); }
      80%  { transform: translate(-50%, -50%) scale(0.96); }
      100% { transform: translate(-50%, -50%) scale(1); }
    }
    @keyframes logoRage {
      0%,100% { transform: translate(-50%, -50%) scale(1.3); }
      50%     { transform: translate(-50%, -50%) scale(1.45); }
    }
    @keyframes logoParticle {
      0%   { opacity: 0.9; transform: translate(-50%,-50%) scale(1); }
      100% { opacity: 0; transform: translate(calc(-50% + var(--dx)*50px), calc(-50% + var(--dy)*50px)) scale(0); }
    }
    @keyframes logoRageText {
      0%   { opacity:0; transform:translate(-50%,-160%) scale(0.7); }
      30%  { opacity:1; transform:translate(-50%,-180%) scale(1); }
      70%  { opacity:1; transform:translate(-50%,-185%) scale(1); }
      100% { opacity:0; transform:translate(-50%,-210%) scale(0.9); }
    }

    .logo-cur {
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      transform: translate(-50%, -50%);
      will-change: left, top;
      transition: opacity 0.08s;
    }
    .logo-cur.clicking { animation: logoClick 0.3s cubic-bezier(0.36,0.07,0.19,0.97) forwards; }
    .logo-cur.raging   { animation: logoRage 0.25s ease-in-out infinite; }

    .logo-particle {
      position: fixed;
      pointer-events: none;
      z-index: 2147483646;
      border-radius: 50%;
      background: white;
      mix-blend-mode: exclusion;
      animation: logoParticle 0.65s ease-out forwards;
      transform: translate(-50%,-50%);
    }
    .logo-rage-label {
      position: fixed;
      pointer-events: none;
      z-index: 2147483646;
      font-size: 0.6rem;
      font-weight: 900;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: white;
      mix-blend-mode: exclusion;
      animation: logoRageText 1s ease-out forwards;
      white-space: nowrap;
      transform: translate(-50%, -100%);
    }
  `

  if (!mounted) return <style dangerouslySetInnerHTML={{ __html: css }} />

  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {rapidClick && (
        <div className="logo-rage-label" style={{ left: pos.x, top: pos.y }}>
          {["FLEX EXTREME", "WORK HARD", "NO LIMITS", "PUSH IT", "GO HARD"][Math.floor(Date.now() / 1000) % 5]}
        </div>
      )}

      {particles.map(p => (
        <div key={p.id} className="logo-particle" style={{
          left: p.x, top: p.y,
          width: rapidClick ? "7px" : "5px",
          height: rapidClick ? "7px" : "5px",
          "--dx": p.dx, "--dy": p.dy,
        } as React.CSSProperties} />
      ))}

      <div
        className={"logo-cur " + (rapidClick ? "raging" : clicked ? "clicking" : "")}
        style={{ left: pos.x, top: pos.y, opacity: visible ? 1 : 0 }}
      >
        <img
          src="/logo-transparent.png"
          alt=""
          draggable={false}
          style={{
            width: size + "px",
            height: size + "px",
            objectFit: "contain",
            filter: hovering ? "invert(1) sepia(1) saturate(10) hue-rotate(160deg) drop-shadow(0 0 8px #00eaff) brightness(1.3)" : "invert(1) drop-shadow(0 0 2px rgba(0,0,0,0.8))",
            display: "block",
            transition: "width 0.15s ease, height 0.15s ease",
          }}
        />
      </div>
    </>,
    document.body
  )
}
