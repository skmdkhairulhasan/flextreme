import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Product } from "@/types"
import BrandStamp from "@/components/ui/BrandStamp"

async function getSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from("settings").select("*")
  const map: Record<string, string> = {}
  data?.forEach((s: any) => { map[s.key] = s.value })
  return map
}

export const dynamic = "force-dynamic"
export default async function HomePage() {
  const supabase = await createClient()
  const [{ data: products }, settings, { count: productCount }, { data: reviews }, { count: orderCount }, { data: allReviews }] = await Promise.all([
    supabase.from("products").select("*").eq("is_featured", true).limit(4),
    getSettings(),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(6),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("rating").eq("status", "approved"),
  ])
  const featuredProducts = (products as Product[]) || []
  const totalProducts = productCount || 0
  const approvedReviews = reviews || []
  const totalOrders = orderCount || 0
  const allApprovedReviews = allReviews || []
  const avgRating = allApprovedReviews.length > 0
    ? (allApprovedReviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) / allApprovedReviews.length)
    : 5
  const avgRatingDisplay = avgRating.toFixed(1) + " / 5"
  const customerCount = totalOrders > 0
    ? (totalOrders >= 1000 ? (Math.floor(totalOrders / 100) * 100) + "+" : totalOrders >= 100 ? totalOrders + "+" : totalOrders > 0 ? totalOrders + "+" : "Growing")
    : "Growing"
  return (
    <div>
      <HeroSection settings={settings} />
      <FeaturedProducts products={featuredProducts} />
      <PerformanceFeatures />
      <WhyFlextreme />
      <BrandStory settings={settings} totalProducts={totalProducts} customerCount={customerCount} avgRating={avgRatingDisplay} totalReviews={allApprovedReviews.length} />
      <Reviews reviews={approvedReviews} />
      <FinalCTA settings={settings} />
    </div>
  )
}

function HeroSection({ settings }: { settings: Record<string, string> }) {
  const bgType = settings.hero_bg_type || "color"
  const bgImage = settings.hero_bg_image || ""
  const bgVideo = settings.hero_bg_video || ""
  const bgOpacity = parseFloat(settings.hero_bg_opacity || "1")
  const overlayOpacity = parseFloat(settings.hero_overlay_opacity || "0.6")
  const showWatermark = settings.hero_show_watermark !== "false"
  const bgScale = parseFloat(settings.hero_bg_scale || "1")
  const bgPosX = parseFloat(settings.hero_bg_pos_x || "50")
  const bgPosY = parseFloat(settings.hero_bg_pos_y || "50")
  const watermarkSize = settings.hero_watermark_size || "75"
  const watermarkOpacity = parseFloat(settings.hero_watermark_opacity || "0.045")
  return (
    <section style={{ minHeight: "100vh", backgroundColor: "black", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "72px", paddingBottom: "4rem", overflow: "hidden", position: "relative" }}>
      {bgType === "image" && bgImage && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <img src={bgImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: bgPosX + "% " + bgPosY + "%", opacity: bgOpacity, transform: "scale(" + bgScale + ")", transformOrigin: bgPosX + "% " + bgPosY + "%" }} />
          <div style={{ position: "absolute", inset: 0, backgroundColor: "black", opacity: overlayOpacity }} />
        </div>
      )}
      {bgType === "video" && bgVideo && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <video autoPlay muted loop playsInline src={bgVideo} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: bgOpacity }} />
          <div style={{ position: "absolute", inset: 0, backgroundColor: "black", opacity: overlayOpacity }} />
        </div>
      )}
      {showWatermark && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: watermarkSize + "vw", maxWidth: parseFloat(watermarkSize) * 10 + "px", aspectRatio: "1/1", pointerEvents: "none", zIndex: 0 }}>
          <img src="/logo-transparent.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "invert(1)", opacity: watermarkOpacity }} />
        </div>
      )}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem", textAlign: "center", position: "relative", zIndex: 1, width: "100%" }}>

        {/* Brand stamp — drifts in from left with smoke */}
        <BrandStamp />

        {/* Badge */}
        <div style={{ display: "inline-block", border: "1px solid rgba(255,255,255,0.2)", padding: "0.4rem 1.2rem", marginBottom: "2rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
          {settings.hero_badge || "Premium Gym Wear"}
        </div>

        {/* Headline */}
        <div style={{ marginBottom: "2.5rem" }}>
          {(settings.hero_headline || "WORK|HARD.|FLEX|EXTREME.").split("|").map((line, i) => (
            <h1 key={i} style={{ fontSize: "clamp(3.5rem, 12vw, 9rem)", fontWeight: 900, color: i % 2 === 0 ? "white" : "rgba(255,255,255,0.2)", lineHeight: 0.85, letterSpacing: "-0.05em", textTransform: "uppercase", margin: 0, marginBottom: i % 2 !== 0 ? "0.15em" : 0 }}>
              {line}
            </h1>
          ))}
        </div>

        <div style={{ width: "40px", height: "1px", backgroundColor: "rgba(255,255,255,0.3)", margin: "0 auto 1.5rem" }} />

        <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", color: "rgba(255,255,255,0.5)", maxWidth: "420px", margin: "0 auto 2.5rem", lineHeight: 1.7, fontWeight: 300, letterSpacing: "0.02em" }}>
          {settings.hero_tagline || "Engineered for athletes who refuse to settle. Built for the gym. Made to be seen."}
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", paddingBottom: "3rem" }}>
          <Link href="/products" style={{ backgroundColor: "white", color: "black", padding: "1rem 2.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", display: "inline-block" }}>Shop Collection</Link>
          <Link href="/about" style={{ backgroundColor: "transparent", color: "white", padding: "1rem 2.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", display: "inline-block", border: "1px solid rgba(255,255,255,0.3)" }}>Our Story</Link>
        </div>
      </div>
    </section>
  )
}

function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section style={{ backgroundColor: "white", padding: "6rem 1.5rem" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#999", marginBottom: "0.75rem" }}>The Collection</p>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 }}>Featured Gear</h2>
        </div>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}><p>No featured products found.</p></div>
        ) : (
          <div className="featured-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
            {products.map((product) => (<ProductCard key={product.id} product={product} />))}
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link href="/products" style={{ display: "inline-block", border: "2px solid black", padding: "1rem 3rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", color: "black" }}>View All Products</Link>
        </div>
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: Product }) {
  const image = product.images && product.images[0] ? product.images[0] : "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800"
  const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : null
  return (
    <Link href={"/products/" + product.slug} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{ cursor: "pointer" }}>
        <div style={{ position: "relative", backgroundColor: "#f5f5f5", aspectRatio: "3/4", overflow: "hidden", marginBottom: "1rem" }}>
          <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {discount && <div style={{ position: "absolute", top: "1rem", left: "1rem", backgroundColor: "black", color: "white", padding: "0.25rem 0.6rem", fontSize: "0.7rem", fontWeight: 700 }}>-{discount}%</div>}
        </div>
        <div>
          <p style={{ fontSize: "0.7rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>{product.category}</p>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase" }}>{product.name}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>BDT {product.price.toLocaleString()}</span>
            {product.original_price && <span style={{ fontSize: "0.875rem", color: "#999", textDecoration: "line-through" }}>BDT {product.original_price.toLocaleString()}</span>}
          </div>
          <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            {product.sizes && product.sizes.slice(0, 4).map((size) => (
              <span key={size} style={{ border: "1px solid #e0e0e0", padding: "0.15rem 0.5rem", fontSize: "0.65rem", fontWeight: 600, color: "#666" }}>{size}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}

function PerformanceFeatures() {
  const features = [
    { icon: "01", title: "Compression Fit", stat: "2x better support", description: "Engineered compression supports muscles during heavy lifts and reduces fatigue so you can train longer." },
    { icon: "02", title: "Sweat-Wicking", stat: "3x faster drying", description: "Advanced moisture-wicking fabric pulls sweat away from your skin instantly, keeping you dry and focused." },
    { icon: "03", title: "4-Way Stretch", stat: "360 degree flex", description: "Move in every direction without restriction. Squat deeper, reach higher, push harder." },
    { icon: "04", title: "Muscle Definition", stat: "Elite athlete cut", description: "Strategic fit that highlights your physique. Look as powerful as you perform." },
  ]
  return (
    <section style={{ backgroundColor: "black", padding: "6rem 1.5rem", color: "white" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ marginBottom: "4rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>Built Different</p>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 }}>Performance Tech</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2rem" }}>
          {features.map((feature, index) => (
            <div key={index} style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "2.5rem 2rem" }}>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: "white", marginBottom: "1rem" }}>{feature.icon}</div>
              <div style={{ display: "inline-block", backgroundColor: "rgba(255,255,255,0.08)", padding: "0.25rem 0.75rem", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "1rem" }}>{feature.stat}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>{feature.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", lineHeight: 1.7 }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhyFlextreme() {
  const comparisons = [
    { feature: "Compression Fit", flextreme: true, others: false },
    { feature: "Sweat-Wicking Fabric", flextreme: true, others: true },
    { feature: "4-Way Stretch", flextreme: true, others: false },
    { feature: "Muscle-Definition Cut", flextreme: true, others: false },
    { feature: "Cash on Delivery", flextreme: true, others: false },
    { feature: "Nationwide Delivery", flextreme: true, others: false },
    { feature: "Elite Build Quality", flextreme: true, others: false },
    { feature: "Value for Performance", flextreme: true, others: false },
  ]
  return (
    <section style={{ backgroundColor: "white", padding: "6rem 1.5rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#999", marginBottom: "0.75rem" }}>The Difference</p>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 }}>Why Flextreme?</h2>
        </div>
        <div style={{ border: "1px solid #e0e0e0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", backgroundColor: "black", color: "white", padding: "0.875rem 1.25rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Feature</div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", justifyContent: "center" }}>Flextreme</div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", justifyContent: "center", color: "rgba(255,255,255,0.4)" }}>Others</div>
          </div>
          {comparisons.map((row, index) => (
            <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", padding: "0.875rem 1.25rem", borderTop: "1px solid #e0e0e0", backgroundColor: index % 2 === 0 ? "white" : "#fafafa", alignItems: "center" }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 500 }}>{row.feature}</div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", color: "#16a34a", fontWeight: 900, fontSize: "1.2rem", lineHeight: 1 }}>{row.flextreme ? "✓" : "✗"}</div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", color: row.others ? "#16a34a" : "#dc2626", fontWeight: 900, fontSize: "1.2rem", lineHeight: 1 }}>{row.others ? "✓" : "✗"}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BrandStory({ settings, totalProducts, customerCount, avgRating, totalReviews }: { settings: Record<string, string>, totalProducts: number, customerCount: string, avgRating: string, totalReviews: number }) {
  const stats = [
    { number: customerCount, label: "Happy Athletes", sub: "Real orders" },
    { number: String(totalProducts), label: "Core Products", sub: "In collection" },
    { number: "100%", label: "Cash on Delivery", sub: "Pay on arrival" },
    { number: avgRating, label: "Avg Rating", sub: totalReviews + " verified reviews" },
  ]
  function renderText(text: string) {
    if (!text) return null
    const lines = text.split("\n")
    return <>{lines.map((line: string, li: number) => {
      const parts = line.split(/(\*\*[\s\S]+?\*\*|_[\s\S]+?_|<u>[\s\S]+?<\/u>)/g)
      const rendered = parts.map((part: string, i: number) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2,-2)}</strong>
        if (part.startsWith("_") && part.endsWith("_") && part.length > 2) return <em key={i}>{part.slice(1,-1)}</em>
        if (part.startsWith("<u>") && part.endsWith("</u>")) return <u key={i}>{part.slice(3,-4)}</u>
        return <span key={i}>{part}</span>
      })
      return <span key={li}>{rendered}{li < lines.length - 1 && <br/>}</span>
    })}</>
  }
  return (
    <section style={{ backgroundColor: "#0a0a0a", padding: "6rem 1.5rem", color: "white" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "4rem", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>Our Story</p>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1.5rem" }}>Born In The Gym.<br />Built For The Grind.</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, fontSize: "1rem", marginBottom: "2rem" }}>
            {renderText(settings.brand_story || "Flextreme was born from frustration. We were athletes who could not find gym wear that matched our intensity.")}
          </p>
          <Link href="/about" style={{ display: "inline-block", border: "1px solid rgba(255,255,255,0.4)", padding: "0.875rem 2rem", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", color: "white" }}>Read Our Story</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {stats.map((stat, index) => (
            <div key={index} style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "2rem", textAlign: "center" }}>
              <p style={{ fontSize: "clamp(1.8rem, 4vw, 2.3rem)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "0.4rem" }}>{stat.number}</p>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>{stat.label}</p>
              <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Reviews({ reviews }: { reviews: any[] }) {
  if (reviews.length === 0) return null
  return (
    <section style={{ backgroundColor: "white", padding: "6rem 1.5rem" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#999", marginBottom: "0.75rem" }}>Real Athletes</p>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 }}>What They Say</h2>
          <p style={{ color: "#999", fontSize: "0.875rem", marginTop: "0.75rem" }}>{reviews.length} verified {reviews.length === 1 ? "review" : "reviews"} shown</p>
        </div>
        <style>{`
              @media (max-width: 640px) {
                .featured-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
              }
            `}</style>
            <div className="featured-grid" style={{ display: "grid", gridTemplateColumns: reviews.length === 1 ? "minmax(auto, 480px)" : "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", justifyContent: "center" }}>
          {reviews.map((review: any, index: number) => (
            <div key={review.id || index} style={{ border: "1px solid #e0e0e0", padding: "2rem" }}>
              <div style={{ fontSize: "1rem", marginBottom: "1rem", color: "#f0a500" }}>{"★".repeat(review.rating)}<span style={{ color: "#e0e0e0" }}>{"★".repeat(5 - review.rating)}</span></div>
              <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "#333", marginBottom: "1.5rem", fontStyle: "italic" }}>"{review.review_text}"</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>{review.customer_name}</p>
                  {review.customer_location && <p style={{ fontSize: "0.75rem", color: "#999" }}>{review.customer_location}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: "14px", height: "14px", backgroundColor: "black", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.5rem" }}>v</span>
                  <span style={{ fontSize: "0.65rem", color: "#666", fontWeight: 600 }}>Verified</span>
                </div>
              </div>
              {review.product_name && <p style={{ fontSize: "0.7rem", color: "#bbb", marginTop: "0.5rem" }}>Purchased: {review.product_name}</p>}
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link href="/reviews" style={{ display: "inline-block", border: "2px solid black", padding: "0.875rem 2.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", color: "black" }}>See All Reviews</Link>
        </div>
      </div>
    </section>
  )
}

function FinalCTA({ settings }: { settings: Record<string, string> }) {
  return (
    <section style={{ backgroundColor: "black", padding: "8rem 1.5rem", textAlign: "center", color: "white" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "1.5rem" }}>Ready To Level Up?</p>
        <h2 style={{ fontSize: "clamp(3rem, 8vw, 6rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: 0.9, marginBottom: "2rem" }}>
          {settings.cta_headline || "START YOUR JOURNEY."}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "3rem", maxWidth: "500px", margin: "0 auto 3rem" }}>
          {settings.cta_subtext || "Join our growing community. Cash on Delivery. Nationwide shipping."}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/products" style={{ backgroundColor: "white", color: "black", padding: "1rem 2.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", display: "inline-block" }}>Shop Now</Link>
          <a href={"https://wa.me/" + (settings.whatsapp_number || "8801935962421")} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: "#25D366", color: "white", padding: "1rem 2.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", display: "inline-block" }}>WhatsApp Us</a>
        </div>
      </div>
    </section>
  )
}
