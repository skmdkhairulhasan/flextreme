"use client"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

// ── Same robot CSS as circular chatbot ──
const ROBOT_CSS = `
@keyframes robotGlow{0%,100%{filter:drop-shadow(0 0 4px #00eaff)}50%{filter:drop-shadow(0 0 14px #00eaff)}}
@keyframes robotBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes robotFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes msgIn{0%{transform:translateY(6px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes dot{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}
.rGlow{animation:robotGlow 2.4s ease-in-out infinite;}
.rEye{animation:robotBlink 4s infinite;transform-origin:center;}
.rFloat{animation:robotFloat 2.5s ease-in-out infinite;}
`

const NAV = [
  {href:"/",label:"Home"},{href:"/products",label:"Products"},
  {href:"/reviews",label:"Reviews"},{href:"/about",label:"About"},
  {href:"/size-guide",label:"Size Guide"},{href:"/delivery",label:"Delivery"},
  {href:"/contact",label:"Contact"},
]

const SUGGESTIONS = [
  {icon:"🚚",text:"Track my order"},{icon:"💪",text:"Build workout plan"},
  {icon:"🥗",text:"Make diet chart"},{icon:"📊",text:"Calculate my BMI"},
  {icon:"📏",text:"What size fits me?"},{icon:"💊",text:"Supplement advice"},
  {icon:"🚛",text:"Delivery charges"},{icon:"👕",text:"Show me products"},
  {icon:"🏋️",text:"Gym gear guide"},{icon:"🩹",text:"Injury advice"},
  {icon:"🔥",text:"Motivate me"},
]

type Msg = {role:"user"|"assistant", content:string}

// ── Exact same robot SVG as circular button ──
function Robot({size=56, float=false}:{size?:number, float?:boolean}) {
  return (
    <svg className={`rGlow${float?" rFloat":""}`} width={size} height={size*1.12} viewBox="0 0 120 120">
      <rect x="25" y="15" width="70" height="45" rx="12" fill="#0b1625"/>
      <g className="rEye">
        <circle cx="50" cy="38" r="6" fill="#00eaff"/>
        <circle cx="70" cy="38" r="6" fill="#00eaff"/>
      </g>
      <path d="M48 48 Q60 56 72 48" stroke="#00eaff" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <rect x="40" y="65" width="40" height="22" rx="6" fill="#dce2ee"/>
      <rect x="45" y="88" width="8" height="10" rx="2" fill="#c8d0de"/>
      <rect x="67" y="88" width="8" height="10" rx="2" fill="#c8d0de"/>
      <rect x="20" y="68" width="15" height="7" rx="3" fill="#a8b4c4"/>
      <rect x="85" y="68" width="15" height="7" rx="3" fill="#a8b4c4"/>
    </svg>
  )
}

function TypingDots() {
  return (
    <div style={{display:"flex",gap:4,padding:"12px 16px",background:"#1a1a1a",borderRadius:"18px 18px 18px 4px",width:"fit-content"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#00eaff",animation:`dot 1.2s ${i*0.2}s infinite`}}/>
      ))}
    </div>
  )
}

function ChatMessage({msg}:{msg:Msg}) {
  const isUser = msg.role === "user"
  return (
    <div style={{display:"flex",gap:10,flexDirection:isUser?"row-reverse":"row",alignItems:"flex-end",animation:"msgIn 0.25s ease-out"}}>
      {!isUser && (
        <div style={{flexShrink:0,marginBottom:2}}>
          <Robot size={28}/>
        </div>
      )}
      <div style={{
        maxWidth:"72%",padding:"10px 14px",lineHeight:1.6,fontSize:14,
        borderRadius:isUser?"18px 18px 4px 18px":"18px 18px 18px 4px",
        background:isUser?"white":"#1a1a1a",
        color:isUser?"black":"rgba(255,255,255,0.9)",
        whiteSpace:"pre-wrap",wordBreak:"break-word"
      }}>
        {msg.content}
      </div>
    </div>
  )
}

export default function FlexAIPage() {
  const [messages, setMessages] = useState<Msg[]>([{
    role:"assistant",
    content:"Hey! I'm Flex — your AI fitness & shopping assistant.\n\n🚚 Track your order\n🚛 Delivery charges & info\n👕 Browse & shop products\n📏 Size recommendation\n💪 Workout plans\n🥗 Diet charts\n📊 BMI calculator\n💊 Supplements\n\nWhat do you need? 💪"
  }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"})
  },[messages,loading])

  useEffect(()=>{
    const h=(e:MouseEvent)=>{
      if(menuRef.current&&!menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown",h)
    return()=>document.removeEventListener("mousedown",h)
  },[])

  async function send(text?:string) {
    const txt = (text??input).trim()
    if(!txt||loading) return
    setInput("")
    setMessages(p=>[...p,{role:"user",content:txt}])
    setLoading(true)
    try {
      const res = await fetch("/api/flex-ai-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:txt})})
      const data = await res.json()
      if(data.reply) setMessages(p=>[...p,{role:"assistant",content:data.reply}])
      else setMessages(p=>[...p,{role:"assistant",content:"I'm not sure about that. Try asking about orders, workouts, diet, or products! 💪"}])
    } catch {
      setMessages(p=>[...p,{role:"assistant",content:"Connection error. Try again or WhatsApp us: +8801935962421"}])
    }
    setLoading(false)
  }

  function sendSuggestion(t:string){ send(t) }

  return (
    <div style={{position:"fixed",inset:0,background:"#0a0a0a",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style dangerouslySetInnerHTML={{__html:ROBOT_CSS}}/>

      {/* ── NAVBAR (always visible) ── */}
      <header style={{height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",borderBottom:"1px solid rgba(255,255,255,0.08)",flexShrink:0,background:"#0a0a0a",zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{position:"relative",width:36,height:36}}>
            <Robot size={34} float/>
          </div>
          <span style={{color:"white",fontWeight:900,fontSize:14,letterSpacing:"0.14em",textTransform:"uppercase"}}>Flex AI</span>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e",marginLeft:2}}/>
        </div>
        <div ref={menuRef} style={{position:"relative"}}>
          <button onClick={()=>setMenuOpen(o=>!o)} style={{width:36,height:36,borderRadius:8,border:"1px solid rgba(255,255,255,0.18)",background:"rgba(255,255,255,0.07)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
            {[0,1,2].map(i=><span key={i} style={{display:"block",width:14,height:2,background:"white",borderRadius:2}}/>)}
          </button>
          {menuOpen&&(
            <div style={{position:"absolute",top:42,right:0,background:"#111",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:6,minWidth:160,zIndex:200,boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>
              {NAV.map(n=>(
                <a key={n.href} href={n.href} onClick={()=>setMenuOpen(false)} style={{display:"block",padding:"9px 14px",color:"rgba(255,255,255,0.8)",textDecoration:"none",fontSize:13,fontWeight:500,borderRadius:7,transition:"background 0.15s"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.08)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  {n.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{flex:1,minHeight:0,display:"flex",overflow:"hidden"}}>

        {/* LEFT — Suggestions (desktop only) */}
        <aside id="fai-left" style={{width:240,flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.07)",padding:"14px 12px",overflowY:"auto",display:"flex",flexDirection:"column",gap:5}}>
          <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:6,paddingLeft:4}}>Quick Ask</p>
          {SUGGESTIONS.map(s=>(
            <button key={s.text} onClick={()=>sendSuggestion(s.text)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:500,cursor:"pointer",textAlign:"left",width:"100%",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="white"}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.6)"}}>
              <span style={{fontSize:15}}>{s.icon}</span><span>{s.text}</span>
            </button>
          ))}
        </aside>

        {/* CENTER — Chat */}
        <main style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"20px 16px",display:"flex",flexDirection:"column",gap:14}}>
            {messages.map((m,i)=><ChatMessage key={i} msg={m}/>)}
            {loading&&(
              <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
                <Robot size={28}/>
                <TypingDots/>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
          {/* Input — sticky bottom, no gap */}
          <div style={{flexShrink:0,borderTop:"1px solid rgba(255,255,255,0.08)",padding:"10px 12px",background:"#0a0a0a",display:"flex",gap:8,alignItems:"center"}}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
              placeholder="Ask Flex anything..." style={{flex:1,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:24,padding:"9px 16px",fontSize:14,color:"white",outline:"none",fontFamily:"inherit"}}/>
            <button onClick={()=>send()} disabled={!input.trim()||loading} style={{width:40,height:40,borderRadius:"50%",background:input.trim()?"white":"rgba(255,255,255,0.15)",border:"none",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={input.trim()?"black":"rgba(255,255,255,0.4)"} strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </main>

        {/* RIGHT — Nav (desktop only) */}
        <aside id="fai-right" style={{width:240,flexShrink:0,borderLeft:"1px solid rgba(255,255,255,0.07)",padding:"14px 12px",overflowY:"auto",display:"flex",flexDirection:"column",gap:3}}>
          <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:6,paddingLeft:4}}>Navigate</p>
          {NAV.map(n=>(
            <a key={n.href} href={n.href} style={{display:"block",padding:"9px 10px",color:"rgba(255,255,255,0.55)",textDecoration:"none",fontSize:12,fontWeight:500,borderRadius:8,transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="white"}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.55)"}}>
              {n.label}
            </a>
          ))}
          <div style={{marginTop:"auto",paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.07)",textAlign:"center"}}>
            <span style={{fontSize:10,color:"rgba(255,255,255,0.2)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Flextreme AI</span>
          </div>
        </aside>
      </div>

      {/* Hide sidebars on mobile */}
      <style>{`
        @media(max-width:768px){#fai-left,#fai-right{display:none!important;}}
        input::placeholder{color:rgba(255,255,255,0.35);}
        *{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.1) transparent;}
      `}</style>
    </div>
  )
}
