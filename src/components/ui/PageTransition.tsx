"use client"
import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [show, setShow] = useState(false)
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    setShow(true)
    const t1 = setTimeout(() => setDisplayChildren(children), 300)
    const t2 = setTimeout(() => setShow(false), 600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [pathname])

  useEffect(() => { setDisplayChildren(children) }, [children])

  return (
    <>
      <style>{`
        @keyframes logoFlash {
          0%   { opacity: 0; transform: translate(-50%,-50%) scale(0.6); filter: brightness(0) invert(1); }
          30%  { opacity: 1; transform: translate(-50%,-50%) scale(1.15); filter: brightness(0) invert(1); }
          55%  { opacity: 1; transform: translate(-50%,-50%) scale(1); filter: brightness(0) invert(1); }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(1.4); filter: brightness(0) invert(1) blur(4px); }
        }
        @keyframes flashBg {
          0%   { opacity: 0; }
          25%  { opacity: 0.92; }
          75%  { opacity: 0.92; }
          100% { opacity: 0; }
        }
        @keyframes pageReveal {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Flash overlay */}
      {show && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99990,
          backgroundColor: "black",
          pointerEvents: "all",
          animation: "flashBg 0.6s cubic-bezier(0.4,0,0.2,1) forwards",
        }}>
          {/* FLEX Logo — punches in and out */}
          <img
            src="/logo-transparent.png"
            alt=""
            style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: "72px", height: "72px",
              objectFit: "contain",
              animation: "logoFlash 0.6s cubic-bezier(0.4,0,0.2,1) forwards",
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* Page content — smooth reveal */}
      <div key={pathname} style={{
        animation: "pageReveal 0.35s cubic-bezier(0.22,1,0.36,1) forwards",
      }}>
        {displayChildren}
      </div>
    </>
  )
}
