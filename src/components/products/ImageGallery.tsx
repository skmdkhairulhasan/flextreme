"use client"
import { useState, useRef, useEffect } from "react"

export default function ImageGallery({ images, productName }: { images: string[], productName: string }) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [lens, setLens] = useState({ show: false, x: 0, y: 0, w: 0, h: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const LENS_SIZE = 130
  const ZOOM = 2.8

  useEffect(() => {
    if (lightbox) {
      document.body.style.overflow = "hidden"
      document.body.style.position = "fixed"
      document.body.style.width = "100%"
      document.documentElement.setAttribute("data-lightbox", "true")
      // Hide navbar while lightbox is open
      const navbar = document.querySelector("nav")
      if (navbar) (navbar as HTMLElement).style.display = "none"
    } else {
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.width = ""
      document.documentElement.removeAttribute("data-lightbox")
      const navbar = document.querySelector("nav")
      if (navbar) (navbar as HTMLElement).style.display = ""
    }
    return () => {
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.width = ""
      document.documentElement.removeAttribute("data-lightbox")
      const navbar = document.querySelector("nav")
      if (navbar) (navbar as HTMLElement).style.display = ""
    }
  }, [lightbox])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!lightbox) return
      if (e.key === "Escape") setLightbox(false)
      if (e.key === "ArrowLeft") setCurrent(i => i === 0 ? images.length - 1 : i - 1)
      if (e.key === "ArrowRight") setCurrent(i => i === images.length - 1 ? 0 : i + 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, images.length])

  if (!images || images.length === 0) {
    return <div style={{ backgroundColor: "#f5f5f5", aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>No image</div>
  }

  function prev(e?: React.MouseEvent) { e?.stopPropagation(); setCurrent(i => i === 0 ? images.length - 1 : i - 1) }
  function next(e?: React.MouseEvent) { e?.stopPropagation(); setCurrent(i => i === images.length - 1 ? 0 : i + 1) }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setLens({ show: true, x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height })
  }

  return (
    <>
      <style>{`
        [data-hovering-image="true"] .fx-cur,
        [data-hovering-image="true"] .fx-particle,
        [data-hovering-image="true"] .rage-label { display: none !important; }
        .img-hover-zone { cursor: none !important; }
        .flx-lightbox {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: #000 !important;
          z-index: 2147483647 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }
        .flx-lb-close {
          position: absolute !important;
          top: 1.5rem !important;
          right: 1.5rem !important;
          width: 56px !important;
          height: 56px !important;
          border-radius: 50% !important;
          border: 2px solid white !important;
          background: rgba(255,255,255,0.2) !important;
          color: white !important;
          font-size: 1.5rem !important;
          cursor: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 10 !important;
          line-height: 1 !important;
          font-weight: 300 !important;
        }
        .flx-lb-close:hover {
          background: rgba(255,255,255,0.4) !important;
          border-color: white !important;
        }
      `}</style>

      {/* Main image */}
      <div
        ref={containerRef}
        className="img-hover-zone"
        onClick={() => { setLightbox(true); setLens(l => ({ ...l, show: false })) }}
        onMouseMove={onMouseMove}
        onMouseEnter={e => {
          document.documentElement.setAttribute("data-hovering-image", "true")
          const rect = containerRef.current?.getBoundingClientRect()
          if (!rect) return
          setLens({ show: true, x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height })
        }}
        onMouseLeave={() => {
          document.documentElement.removeAttribute("data-hovering-image")
          setLens(l => ({ ...l, show: false }))
        }}
        style={{ position: "relative", backgroundColor: "#f5f5f5", aspectRatio: "3/4", overflow: "hidden", marginBottom: "0.75rem" }}
      >
        <img src={images[current]} alt={productName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

        {lens.show && (
          <div style={{ position: "absolute", left: lens.x - LENS_SIZE / 2, top: lens.y - LENS_SIZE / 2, width: LENS_SIZE, height: LENS_SIZE, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.9)", boxShadow: "0 4px 24px rgba(0,0,0,0.5)", overflow: "hidden", pointerEvents: "none", zIndex: 10 }}>
            <img src={images[current]} alt="" style={{ position: "absolute", width: lens.w * ZOOM, height: lens.h * ZOOM, maxWidth: "none", left: -(lens.x * ZOOM - LENS_SIZE / 2), top: -(lens.y * ZOOM - LENS_SIZE / 2), objectFit: "cover" }} />
          </div>
        )}

        {images.length > 1 && (
          <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", backgroundColor: "rgba(0,0,0,0.65)", color: "white", padding: "0.2rem 0.55rem", fontSize: "0.7rem", fontWeight: 700, zIndex: 2, pointerEvents: "none" }}>
            {current + 1} / {images.length}
          </div>
        )}

        {!lens.show && (
          <div style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem", backgroundColor: "rgba(0,0,0,0.65)", color: "white", padding: "0.2rem 0.55rem", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", zIndex: 2, pointerEvents: "none" }}>
            Hover to zoom · Click for fullscreen
          </div>
        )}

        {images.length > 1 && <>
          <button onClick={prev} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", width: "36px", height: "36px", backgroundColor: "rgba(0,0,0,0.6)", border: "none", color: "white", cursor: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, zIndex: 3 }}>&lt;</button>
          <button onClick={next} style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", width: "36px", height: "36px", backgroundColor: "rgba(0,0,0,0.6)", border: "none", color: "white", cursor: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, zIndex: 3 }}>&gt;</button>
        </>}
      </div>

      {images.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          {images.map((img, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{ flexShrink: 0, width: "68px", height: "68px", overflow: "hidden", cursor: "none", border: current === i ? "2px solid black" : "2px solid transparent", opacity: current === i ? 1 : 0.5, transition: "all 0.2s", backgroundColor: "#f5f5f5" }}>
              <img src={img} alt={"thumb " + i} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="flx-lightbox" onClick={() => setLightbox(false)}>

          {/* X close button — top right, fully visible, no navbar in the way */}
          <button className="flx-lb-close" onClick={e => { e.stopPropagation(); setLightbox(false) }}>
            ✕
          </button>

          {/* Counter top left */}
          <div style={{ position: "absolute", top: "1.75rem", left: "1.5rem", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", fontWeight: 700, zIndex: 2 }}>
            {current + 1} / {images.length}
          </div>

          {/* Image area — click on image itself won't close, click black around it will */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", minHeight: 0, padding: "4rem 5rem 0" }}>
            <img
              src={images[current]}
              alt={productName}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block", userSelect: "none" }}
            />

            {images.length > 1 && (
              <button onClick={e => { e.stopPropagation(); prev() }} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "50px", height: "50px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.4)", backgroundColor: "rgba(0,0,0,0.6)", color: "white", fontSize: "1.2rem", cursor: "none", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>&lt;</button>
            )}
            {images.length > 1 && (
              <button onClick={e => { e.stopPropagation(); next() }} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "50px", height: "50px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.4)", backgroundColor: "rgba(0,0,0,0.6)", color: "white", fontSize: "1.2rem", cursor: "none", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>&gt;</button>
            )}
          </div>

          {images.length > 1 && (
            <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", gap: "0.5rem", padding: "1rem 1.5rem 0.5rem" }} onClick={e => e.stopPropagation()}>
              {images.map((img, i) => (
                <div key={i} onClick={() => setCurrent(i)} style={{ width: "54px", height: "54px", overflow: "hidden", cursor: "none", border: current === i ? "2px solid white" : "2px solid rgba(255,255,255,0.25)", opacity: current === i ? 1 : 0.4, transition: "all 0.2s", flexShrink: 0 }}>
                  <img src={img} alt={"t" + i} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}

          <div style={{ flexShrink: 0, textAlign: "center", padding: "0.4rem 0 0.8rem", color: "rgba(255,255,255,0.2)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Click background or press ESC to close
          </div>
        </div>
      )}
    </>
  )
}
