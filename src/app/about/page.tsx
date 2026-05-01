import Link from "next/link"
import { apiFetchServer } from "@/lib/api/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "About Us | Flextreme" }

export default async function AboutPage() {

  let settings: Record<string, string> = {}
  let products: any[] = []
  let orders: any[] = []
  let reviews: any[] = []

  // ✅ FETCH FROM API INSTEAD OF SUPABASE
  try {
    const s = await apiFetchServer<{ settings: any[] }>("/api/settings")
    s.settings?.forEach((r: any) => {
      settings[r.key] = r.value
    })
  } catch (e) {
    console.error("Settings error:", e)
  }

  try {
    const p = await apiFetchServer<{ products: any[] }>("/api/products")
    products = p.products || []
  } catch (e) {
    console.error("Products error:", e)
  }

  try {
    const o = await apiFetchServer<{ orders: any[] }>("/api/orders")
    orders = o.orders || []
  } catch (e) {
    console.error("Orders error:", e)
  }

  try {
    const r = await apiFetchServer<{ reviews: any[] }>("/api/reviews")
    reviews = r.reviews || []
  } catch (e) {
    console.error("Reviews error:", e)
  }

  const productCount = products.length
  const totalOrders = orders.length

  const athleteCount =
    totalOrders >= 1000
      ? Math.floor(totalOrders / 100) * 100 + "+"
      : totalOrders > 0
      ? totalOrders + "+"
      : "Growing"

  const approvedReviews = reviews.filter((r: any) => r.status === "approved")

  const avgRating =
    approvedReviews.length > 0
      ? (
          approvedReviews.reduce((s: number, r: any) => s + r.rating, 0) /
          approvedReviews.length
        ).toFixed(1)
      : "5.0"

  const s = settings

  const heroHeadline = s.about_hero_headline || "Born From The Grind."
  const heroSub = s.about_hero_sub || ""
  const storyTitle = s.about_story_title || "Our Story"
  const statsTitle = s.about_stats_title || "Growing"
  const brandStory = s.brand_story || `Flextreme was born from frustration. We saw athletes who could push the limits—yet their gym wear held them back.

We started by listening. Talking to hundreds of lifters, runners, CrossFitters. Their problems became our blueprint. No compromises on fabric. No cutting corners on fit.

Every product you see here passed through real athletes first. Because we believe the grind deserves better gear.

Add your brand story in Admin → Settings → About Page → Brand Story`

  // Values section
  const valuesTitle = s.about_values_title || "Our Values"
  let values: any[] = []
  if (s.about_values) {
    try { values = JSON.parse(s.about_values) } catch {}
  }

  // Team section
  const teamTitle = s.about_team_title || "Behind Flextreme"
  let team: any[] = []
  if (s.about_team) {
    try { team = JSON.parse(s.about_team) } catch {}
  }

  // CTA section
  const ctaHeadline = s.about_cta_headline || "Join The|Movement."
  const ctaSubtext = s.about_cta_subtext || ""

  const stats = [
    { number: athleteCount, label: "Happy Athletes", sub: "and growing" },
    { number: String(productCount), label: "Core Products", sub: "tested by athletes" },
    { number: avgRating + " ★", label: "Avg Rating", sub: approvedReviews.length + " verified reviews" },
    { number: "100%", label: "Cash on Delivery", sub: "nationwide" },
  ]

  return (
    <div style={{ paddingTop: "72px", backgroundColor: "white", flex: 1 }}>
      
      {/* BLACK HERO SECTION */}
      <section style={{ backgroundColor: "black", color: "white", padding: "6rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(3rem, 10vw, 6rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: "1rem" }}>
          {heroHeadline.split("|").map((line, i) => (
            <span key={i}>
              {line}
              {i < heroHeadline.split("|").length - 1 && <br />}
            </span>
          ))}
        </h1>
        {heroSub && <p style={{ marginTop: "1rem", color: "rgba(255,255,255,0.7)", fontSize: "1.125rem", maxWidth: "600px", margin: "0 auto" }}>{heroSub}</p>}
      </section>

      {/* WHITE CONTENT SECTION */}
      <section style={{ padding: "6rem 1.5rem", backgroundColor: "white" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          
          {/* Brand Story */}
          <div style={{ maxWidth: "800px", margin: "0 auto 6rem" }}>
            <h2 style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#999", marginBottom: "2rem" }}>{storyTitle}</h2>
            <div style={{ fontSize: "1.125rem", lineHeight: 1.8, color: "#333", whiteSpace: "pre-wrap" }}>
              {brandStory}
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ marginBottom: "6rem" }}>
            <h2 style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#999", marginBottom: "3rem" }}>{statsTitle}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ textAlign: "center", padding: "2rem", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
                <p style={{ fontSize: "clamp(1.8rem, 4vw, 2.3rem)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "0.4rem" }}>{stat.number}</p>
                <p style={{ fontSize: "0.75rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>{stat.label}</p>
                <p style={{ fontSize: "0.65rem", color: "#999", letterSpacing: "0.05em" }}>{stat.sub}</p>
              </div>
            ))}
            </div>
          </div>

          {/* Values Section */}
          {values.length > 0 && (
            <div style={{ marginBottom: "6rem" }}>
              <h2 style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#999", marginBottom: "3rem" }}>{valuesTitle}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
                {values.map((value, i) => (
                  <div key={i} style={{ padding: "2rem", border: "2px solid #e5e7eb", borderRadius: "12px" }}>
                    <div style={{ fontSize: "4rem", fontWeight: 900, color: "#f0f0f0", marginBottom: "-1rem", lineHeight: 1 }}>0{i + 1}</div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.75rem" }}>{value.title}</h3>
                    <p style={{ fontSize: "0.875rem", color: "#666", lineHeight: 1.6 }}>{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Section */}
          {team.length > 0 && (
            <div>
              <h2 style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#999", marginBottom: "3rem" }}>{teamTitle}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
                {team.map((person, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "2rem", border: "2px solid #e5e7eb", borderRadius: "12px" }}>
                    <div style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "#000", color: "#fff", margin: "0 auto 1.5rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: 900 }}>
                      {person.name.charAt(0)}
                    </div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>{person.name}</h3>
                    <p style={{ fontSize: "0.75rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>{person.role}</p>
                    <p style={{ fontSize: "0.875rem", color: "#666", lineHeight: 1.6 }}>{person.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* BLACK CTA SECTION */}
      <section style={{ padding: "6rem 1.5rem", backgroundColor: "black", color: "white", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: 0.9, marginBottom: "1.5rem" }}>
            {ctaHeadline.split("|").map((line, i) => (
              <span key={i}>
                {line}
                {i < ctaHeadline.split("|").length - 1 && <br />}
              </span>
            ))}
          </h2>
          {ctaSubtext && <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.7)", marginBottom: "2rem", lineHeight: 1.6 }}>{ctaSubtext}</p>}
          <Link href="/products" style={{ display: "inline-block", backgroundColor: "white", color: "black", padding: "1rem 2.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
            Shop Now
          </Link>
        </div>
      </section>

    </div>
  )
}
