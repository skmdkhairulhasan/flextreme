import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "About Us | Flextreme" }

export default async function AboutPage() {
  const supabase = await createClient()
  const [{ data: settingsData }, { count }, { data: orders }, { data: reviews }] = await Promise.all([
    supabase.from("settings").select("*"),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("status"),
    supabase.from("reviews").select("rating, status"),
  ])

  const s: Record<string, string> = {}
  settingsData?.forEach((r: any) => { s[r.key] = r.value })

  // Auto stats
  const productCount = count || 0
  const totalOrders = (orders || []).filter((o: any) => o.status !== "cancelled").length
  const athleteCount = totalOrders >= 1000 ? (Math.floor(totalOrders / 100) * 100) + "+" : totalOrders > 0 ? totalOrders + "+" : "Growing"
  const approvedReviews = (reviews || []).filter((r: any) => r.status === "approved")
  const avgRating = approvedReviews.length > 0 ? (approvedReviews.reduce((s: number, r: any) => s + r.rating, 0) / approvedReviews.length).toFixed(1) : "5.0"

  // All fields — empty string means "don't show", no hardcoded fallbacks except hero
  const heroHeadline = s.about_hero_headline || "Born From The Grind."
  const heroSub      = s.about_hero_sub || ""
  const storyTitle   = s.about_story_title || ""
  const storyBody1   = s.about_story_body1 || ""
  const storyBody2   = s.brand_story || ""
  const storyBody3   = s.about_story_body3 || ""
  const valuesTitle  = s.about_values_title || "Our Values"
  const teamTitle    = s.about_team_title || "Behind Flextreme"
  const ctaHeadline  = s.about_cta_headline || "Join The Movement."
  const ctaSub       = s.about_cta_sub || ""

  // Values and team from JSON
  let values: any[] = []
  let team: any[] = []
  try { if (s.about_values) values = JSON.parse(s.about_values) } catch {}
  try { if (s.about_team) team = JSON.parse(s.about_team) } catch {}

  const stats = [
    { number: athleteCount, label: "Happy Athletes" },
    { number: String(productCount), label: "Core Products" },
    { number: avgRating + " ★", label: "Avg Rating" },
    { number: "100%", label: "Cash on Delivery" },
  ]

  // Show story section if any story content exists
  const hasStory = storyTitle || storyBody1 || storyBody2 || storyBody3

  function renderText(text: string) {
    if (!text) return null
    const lines = text.split(/\n/)
    return <>{lines.map((line, li) => {
      const parts = line.split(/(\*\*[\s\S]+?\*\*|_[\s\S]+?_|<u>[\s\S]+?<\/u>)/g)
      const rendered = parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
          return <strong key={i}>{part.slice(2,-2)}</strong>
        if (part.startsWith("_") && part.endsWith("_") && part.length > 2)
          return <em key={i}>{part.slice(1,-1)}</em>
        if (part.startsWith("<u>") && part.endsWith("</u>"))
          return <u key={i}>{part.slice(3,-4)}</u>
        return <span key={i}>{part}</span>
      })
      return <span key={li}>{rendered}{li < lines.length - 1 && <br/>}</span>
    })}</>
  }

  function renderHeadline(text: string) {
    if (!text) return null
    if (text.includes("|")) {
      const parts = text.split("|")
      return <>{parts.map((line, i) => (
        <span key={i}>{i > 0 && <br />}
          {i === parts.length - 1 ? <span style={{ color: "rgba(255,255,255,0.25)" }}>{line}</span> : line}
        </span>
      ))}</>
    }
    return <>{text}</>
  }

  return (
    <div style={{ paddingTop: "72px" }}>

      {/* HERO */}
      <section style={{ backgroundColor: "black", color: "white", padding: "6rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>Our Story</p>
          <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: "2rem" }}>
            {renderHeadline(heroHeadline)}
          </h1>
          {heroSub && <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.8, fontWeight: 300 }}>{renderText(heroSub)}</p>}
        </div>
      </section>

      {/* STORY + STATS */}
      {(hasStory || true) && (
        <section style={{ backgroundColor: "white", padding: "6rem 1.5rem" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "4rem", alignItems: "center" }}>
            <div>
              {storyTitle && (
                <>
                  <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#999", marginBottom: "1rem" }}>How It Started</p>
                  <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "1.5rem" }}>{storyTitle}</h2>
                </>
              )}
              {storyBody1 && <p style={{ color: "#555", lineHeight: 1.8, marginBottom: "1.25rem" }}>{renderText(storyBody1)}</p>}
              {storyBody2 && <p style={{ color: "#555", lineHeight: 1.8, marginBottom: "1.25rem" }}>{renderText(storyBody2)}</p>}
              {storyBody3 && <p style={{ color: "#555", lineHeight: 1.8, marginBottom: "2rem" }}>{renderText(storyBody3)}</p>}
              <Link href="/products" style={{ display: "inline-block", backgroundColor: "black", color: "white", padding: "1rem 2.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>Shop The Collection</Link>
            </div>
            <style>{`.stats-grid { grid-template-columns: 1fr 1fr !important; } @media(max-width:480px){ .stats-grid { grid-template-columns: 1fr 1fr !important; max-width: 100%; overflow: hidden; } .stats-grid > div { padding: 1rem !important; } }`}</style>
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {stats.map((stat, i) => (
                <div key={i} style={{ border: "1px solid #e0e0e0", padding: "1.5rem 1rem", textAlign: "center", minWidth: 0 }}>
                  <p style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>{stat.number}</p>
                  <p style={{ fontSize: "0.75rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* VALUES */}
      {values.length > 0 && (
        <section style={{ backgroundColor: "black", color: "white", padding: "6rem 1.5rem" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>What We Stand For</p>
              <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em" }}>{valuesTitle}</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
              {values.map((v: any, i: number) => (
                <div key={i} style={{ border: "1px solid rgba(255,255,255,0.12)", padding: "2.5rem 2rem" }}>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>{v.number || String(i+1).padStart(2,"0")}</p>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", color: "white" }}>{v.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", lineHeight: 1.75 }}>{renderText(v.description)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TEAM */}
      {team.length > 0 && (
        <section style={{ backgroundColor: "white", padding: "6rem 1.5rem" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#999", marginBottom: "0.75rem" }}>The People</p>
              <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em" }}>{teamTitle}</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
              {team.map((member: any, i: number) => (
                <div key={i} style={{ border: "1px solid #e0e0e0", padding: "2rem" }}>
                  <div style={{ width: "60px", height: "60px", backgroundColor: "black", borderRadius: "50%", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: "1.25rem" }}>
                    {(member.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.25rem" }}>{member.name}</h3>
                  <p style={{ fontSize: "0.75rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>{member.role}</p>
                  <p style={{ color: "#555", fontSize: "0.9rem", lineHeight: 1.7 }}>{renderText(member.description)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ backgroundColor: "black", color: "white", padding: "6rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: "1.5rem" }}>
            {renderHeadline(ctaHeadline)}
          </h2>
          {ctaSub && <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "2.5rem" }}>{renderText(ctaSub)}</p>}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/products" style={{ display: "inline-block", backgroundColor: "white", color: "black", padding: "1rem 2.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>Shop Now</Link>
            <Link href="/contact" style={{ display: "inline-block", backgroundColor: "transparent", color: "white", padding: "1rem 2.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)" }}>Contact Us</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
