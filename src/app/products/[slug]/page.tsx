import { createClient } from "@/lib/supabase/server"
import { Product } from "@/types"
import { notFound } from "next/navigation"
import OrderForm from "@/components/products/OrderForm"
import ImageGallery from "@/components/products/ImageGallery"
import ReviewForm from "@/components/products/ReviewForm"
import ProductReviews from "@/components/products/ProductReviews"

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: product } = await supabase.from("products").select("*").eq("slug", slug).single()
  if (!product) notFound()
  const p = product as Product
  return (
    <div style={{ paddingTop: "72px", minHeight: "100vh", backgroundColor: "var(--theme-bg, white)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "2rem", fontSize: "0.8rem", color: "#999" }}>
          <a href="/" style={{ color: "#999", textDecoration: "none" }}>Home</a>
          <span>/</span>
          <a href="/products" style={{ color: "#999", textDecoration: "none" }}>Products</a>
          <span>/</span>
          <span style={{ color: "black", fontWeight: 600 }}>{p.name}</span>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .product-layout { grid-template-columns: 1fr !important; gap: 2rem !important; }
          }
        `}</style>
        <div className="product-layout" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "4rem", alignItems: "start" }}>
          <div>
            <ImageGallery images={p.images || []} productName={p.name} />
            {p.video_url && (
              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.75rem", color: "#999" }}>Product Video</p>
                <video src={p.video_url} controls style={{ width: "100%", backgroundColor: "var(--theme-primary, black)" }} />
              </div>
            )}
          </div>
          <div>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "0.5rem" }}>{p.category}</p>
            <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "1rem" }}>{p.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 900 }}>BDT {p.price.toLocaleString()}</span>
              {(p as any).original_price && <span style={{ fontSize: "1.1rem", color: "#999", textDecoration: "line-through" }}>BDT {(p as any).original_price.toLocaleString()}</span>}
              {(p as any).original_price && <span style={{ backgroundColor: "var(--theme-primary, black)", color: "var(--theme-btn-text, white)", padding: "0.2rem 0.6rem", fontSize: "0.75rem", fontWeight: 700 }}>{Math.round((((p as any).original_price - p.price) / (p as any).original_price) * 100)}% OFF</span>}
            </div>

            {/* Stock availability */}
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {!p.in_stock ? (
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#dc2626", backgroundColor: "#fee2e2", padding: "0.3rem 0.875rem", border: "1px solid #fca5a5" }}>
                  SOLD OUT
                </span>
              ) : (
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#16a34a", backgroundColor: "#f0fdf4", padding: "0.3rem 0.875rem", border: "1px solid #bbf7d0" }}>
                  ✓ In Stock
                </span>
              )}
            </div>
            <p style={{ color: "#555", lineHeight: 1.8, fontSize: "0.95rem", marginBottom: "2rem", paddingBottom: "2rem", borderBottom: "1px solid #e0e0e0" }}>{p.description}</p>
            <div style={{ marginBottom: "2rem", paddingBottom: "2rem", borderBottom: "1px solid #e0e0e0" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem", color: "#999" }}>Performance Features</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {["Compression Fit", "Sweat-Wicking", "4-Way Stretch", "Muscle Definition"].map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 500 }}>
                    <span style={{ width: "18px", height: "18px", backgroundColor: "var(--theme-primary, black)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--theme-btn-text, white)", fontSize: "0.6rem", flexShrink: 0 }}>v</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <OrderForm product={p} />
            <ReviewForm productId={p.id} productName={p.name} />
          </div>
        </div>

        {/* Reviews section below */}
        <ProductReviews productId={p.id} />
      </div>
    </div>
  )
}
