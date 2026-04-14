"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

export default function Modal({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: "1rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
        {children}
      </div>
    </div>,
    document.body
  )
}
