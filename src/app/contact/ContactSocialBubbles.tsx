"use client"
import { useState, useEffect, useRef } from "react"

type Social = { name: string; url: string; color: string }

const ICONS: Record<string, React.ReactNode> = {
  Instagram: <svg width="26" height="26" viewBox="0 0 24 24" fill="white" style={{display:"block"}}><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 4a6 6 0 100 12 6 6 0 000-12zm0 2a4 4 0 110 8 4 4 0 010-8zm5.5-2.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/></svg>,
  Facebook:  <svg width="26" height="26" viewBox="0 0 24 24" fill="white" style={{display:"block"}}><path d="M22 12a10 10 0 10-11.5 9.87v-6.99H8v-2.88h2.5V9.41c0-2.47 1.47-3.84 3.73-3.84 1.08 0 2.2.19 2.2.19v2.42h-1.24c-1.22 0-1.6.76-1.6 1.54v1.85H16l-.4 2.88h-2.2v6.99A10 10 0 0022 12z"/></svg>,
  TikTok:    <svg width="26" height="26" viewBox="0 0 24 24" fill="white" style={{display:"block"}}><path d="M16 3c.3 2.1 1.9 3.7 4 4v3c-1.6 0-3.1-.5-4-1.3V14a6 6 0 11-6-6c.3 0 .7 0 1 .1v3.1a3 3 0 102 2.8V3h3z"/></svg>,
  YouTube:   <svg width="26" height="26" viewBox="0 0 24 24" fill="white" style={{display:"block"}}><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.8zM9.8 15.5v-7l6.2 3.5-6.2 3.5z"/></svg>,
  Twitter:   <svg width="26" height="26" viewBox="0 0 24 24" fill="white" style={{display:"block"}}><path d="M22 5.9c-.7.3-1.5.5-2.3.6a4 4 0 001.7-2.2 8 8 0 01-2.5 1A4 4 0 0012 8.5c0 .3 0 .6.1.9A11.3 11.3 0 013 4.9a4 4 0 001.2 5.4 4 4 0 01-1.8-.5v.1a4 4 0 003.2 3.9 4 4 0 01-1.8.1 4 4 0 003.7 2.8A8.1 8.1 0 012 19.5a11.4 11.4 0 006.2 1.8c7.5 0 11.6-6.2 11.6-11.6v-.5A8.3 8.3 0 0022 5.9z"/></svg>,
}

const CHAT_RIGHT  = 4
const BUBBLE_SIZE = 68
const BUBBLE_GAP  = 8
const BASE_BOTTOM = 140
const ICON_CIRCLE = 50

export default function ContactSocialBubbles({ socials }: { socials: Social[] }) {
  const [mobile, setMobile]       = useState(false)
  const [open, setOpen]           = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const timerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    fn()
    window.addEventListener("resize", fn)
    return () => window.removeEventListener("resize", fn)
  }, [])

  useEffect(() => {
    if (!mobile || open) return
    function cycle() {
      timerRef.current = setTimeout(() => {
        setShowLabel(true)
        timerRef.current = setTimeout(() => {
          setShowLabel(false)
          cycle()
        }, 3000)
      }, 10000)
    }
    cycle()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [mobile, open])

  // ── DESKTOP ──
  if (!mobile) {
    const n = socials.length
    return (
      <>
        <style>{`
          @keyframes sbPop { 0%{transform:scale(0.3);opacity:0} 65%{transform:scale(1.08);opacity:1} 100%{transform:scale(1);opacity:1} }
          .sb-outer{position:fixed;right:${CHAT_RIGHT}px;width:${BUBBLE_SIZE}px;height:${BUBBLE_SIZE}px;display:flex;align-items:center;justify-content:center;}
          .sb-link{position:relative;width:${BUBBLE_SIZE}px;height:${BUBBLE_SIZE}px;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;box-shadow:0 4px 16px rgba(0,0,0,0.28);transition:transform 0.18s ease,box-shadow 0.18s ease;}
          .sb-link:hover{transform:scale(1.1);box-shadow:0 6px 26px rgba(0,0,0,0.42);}
          .sb-tooltip{position:absolute;right:calc(100% + 10px);top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.84);color:white;font-size:0.72rem;font-weight:700;letter-spacing:0.04em;white-space:nowrap;padding:5px 11px;border-radius:6px;opacity:0;pointer-events:none;transition:opacity 0.15s ease;}
          .sb-tooltip::after{content:'';position:absolute;left:100%;top:50%;transform:translateY(-50%);border:5px solid transparent;border-left-color:rgba(0,0,0,0.84);}
          .sb-link:hover .sb-tooltip{opacity:1;}
        `}</style>
        {socials.map((s, i) => (
          <div key={s.name} className="sb-outer" style={{ bottom: BASE_BOTTOM+(n-1-i)*(BUBBLE_SIZE+BUBBLE_GAP), zIndex:8990+i, animation:`sbPop 0.3s cubic-bezier(0.34,1.56,0.64,1) ${(n-1-i)*0.07}s both` }}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="sb-link" style={{backgroundColor:s.color}}>
              {ICONS[s.name] ?? null}
              <span className="sb-tooltip">{s.name}</span>
            </a>
          </div>
        ))}
      </>
    )
  }

  // ── MOBILE ──
  return (
    <>
      <style>{`
        @keyframes pillIn { 0%{opacity:0;transform:translateX(16px) scale(0.92)} 100%{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes labelSlide { 0%{opacity:0;transform:translateX(8px)} 100%{opacity:1;transform:translateX(0)} }
        .mob-pill{position:fixed;right:${CHAT_RIGHT}px;bottom:${BASE_BOTTOM}px;display:flex;flex-direction:row;align-items:center;gap:8px;background:rgba(18,18,18,0.93);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-radius:40px;padding:7px 12px 7px 7px;box-shadow:0 8px 32px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.10);z-index:9000;animation:pillIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both;}
        .mob-pill-icon{width:${ICON_CIRCLE}px;height:${ICON_CIRCLE}px;border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:transform 0.15s;}
        .mob-pill-icon:active{transform:scale(0.88);}
        .mob-pill-divider{width:1px;height:32px;background:rgba(255,255,255,0.15);flex-shrink:0;margin:0 2px;}
        .mob-pill-close{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.12);border:none;color:rgba(255,255,255,0.7);font-size:1rem;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
        .mob-trigger{position:fixed;right:${CHAT_RIGHT}px;bottom:${BASE_BOTTOM}px;width:${BUBBLE_SIZE}px;height:${BUBBLE_SIZE}px;border-radius:50%;border:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;box-shadow:0 4px 16px rgba(0,0,0,0.32);z-index:8990;cursor:pointer;transition:transform 0.15s;background:#7C3AED;}
        .mob-trigger:active{transform:scale(0.92);}
        .socials-label{position:fixed;right:${CHAT_RIGHT+BUBBLE_SIZE+8}px;bottom:${BASE_BOTTOM+BUBBLE_SIZE/2-13}px;background:rgba(0,0,0,0.82);color:white;font-size:0.72rem;font-weight:700;letter-spacing:0.06em;padding:5px 12px;border-radius:20px;z-index:8989;pointer-events:none;white-space:nowrap;}
        .socials-label::after{content:'';position:absolute;left:100%;top:50%;transform:translateY(-50%);border:5px solid transparent;border-left-color:rgba(0,0,0,0.82);}
        .label-in{animation:labelSlide 0.3s ease-out both;}
      `}</style>

      {open && (
        <div className="mob-pill">
          {socials.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="mob-pill-icon" style={{backgroundColor:s.color}} onClick={()=>setOpen(false)} title={s.name}>
              {ICONS[s.name] ?? null}
            </a>
          ))}
          <div className="mob-pill-divider"/>
          <button className="mob-pill-close" onClick={()=>setOpen(false)}>×</button>
        </div>
      )}

      {!open && showLabel && <div className="socials-label label-in">Socials</div>}

      {!open && (
        <button className="mob-trigger" onClick={()=>{ setOpen(true); setShowLabel(false); if(timerRef.current) clearTimeout(timerRef.current) }}>
          {/* "# " hash + tag lines — universal social media symbol */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <line x1="10" y1="4"  x2="8"  y2="20"/>
            <line x1="16" y1="4"  x2="14" y2="20"/>
            <line x1="5"  y1="9"  x2="20" y2="9"/>
            <line x1="4"  y1="15" x2="19" y2="15"/>
          </svg>
        </button>
      )}
    </>
  )
}
