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

  // Fetch sold orders to compute remaining stock
  const { data: soldOrders } = await supabase
    .from("orders")
    .select("size, color, quantity")
    .eq("product_id", p.id)
    .in("status", ["confirmed", "processing", "shipped", "delivered"])

  // Subtract sold quantities from stock_matrix
  let computedMatrix: Record<string, number> | null = null
  const pAny = p as any
  if (pAny.stock_matrix && soldOrders) {
    computedMatrix = { ...pAny.stock_matrix } as Record<string, number>
    for (const order of soldOrders) {
      if (!order.size || !order.color) continue
      const key = order.size.trim() + "_" + order.color.trim()
      const matrix = computedMatrix as Record<string, number>
      const matchedKey = Object.keys(matrix).find(
        k => k.toLowerCase() === key.toLowerCase()
      ) || key
      if (matchedKey in matrix) {
        matrix[matchedKey] = Math.max(0, (matrix[matchedKey] || 0) - (order.quantity || 1))
      }
    }
  }

  const productWithStock = { ...p, stock_matrix: computedMatrix || pAny.stock_matrix } as any

  return (
    <div style={{ 
      paddingTop: "clamp(60px, 10vh, 80px)", // Responsive top padding for different header heights
      minHeight: "100dvh", // Uses dynamic viewport height for mobile browsers
      backgroundColor: "var(--theme-bg, white)",
      overflowX: "hidden" // Prevents horizontal scroll issues
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem" }}>
        
        {/* Breadcrumbs - Scrollable on very small screens */}
        <div style={{ 
          display: "flex", 
          gap: "0.5rem", 
          alignItems: "center", 
          marginBottom: "1.5rem", 
          fontSize: "0.75rem", 
          color: "#999",
          overflowX: "auto",
          whiteSpace: "nowrap",
          scrollbarWidth: "none" 
        }}>
          <a href="/" style={{ color: "#999", textDecoration: "none" }}>Home</a>
          <span>/</span>
          <a href="/products" style={{ color: "#999", textDecoration: "none" }}>Products</a>
          <span>/</span>
          <span style={{ color: "black", fontWeight: 600 }}>{p.name}</span>
        </div>

        <style>{`
          .product-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 4rem;
            align-items: start;
          }
          @media (max-width: 1024px) {
            .product-grid { gap: 2rem; }
          }
          @media (max-width: 768px) {
            .product-grid { 
              grid-template-columns: 1fr; 
              gap: 2.5rem; 
            }
            .product-title {
              font-size: 1.75rem !important;
            }
          }
        `}</style>

        <div className="product-grid">
          {/* Left Column: Visuals */}
          <div style={{ width: "100%", overflow: "hidden" }}>
            <ImageGallery images={p.images || []} productName={p.name} />
            {p.video_url && (
              <div style={{ marginTop: "1.5rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.75rem", color: "#999" }}>Product Video</p>
                <div style={{ position: "relative", width: "100%", backgroundColor: "#000", aspectRatio: "16/9" }}>
                  <video 
                    src={p.video_url} 
                    controls 
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "0.5rem" }}>{p.category}</p>
            <h1 className="product-title" style={{ fontSize: "2.5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "1rem" }}>{p.name}</h1>
            
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 900 }}>BDT {p.price.toLocaleString()}</span>
              {(p as any).original_price && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.1rem", color: "#999", textDecoration: "line-through" }}>BDT {(p as any).original_price.toLocaleString()}</span>
                  <span style={{ backgroundColor: "var(--theme-primary, black)", color: "var(--theme-btn-text, white)", padding: "0.2rem 0.6rem", fontSize: "0.75rem", fontWeight: 700 }}>
                    {Math.round((((p as any).original_price - p.price) / (p as any).original_price) * 100)}% OFF
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              {!p.in_stock ? (
                <span style={{ display: "inline-block", fontSize: "0.8rem", fontWeight: 700, color: "#dc2626", backgroundColor: "#fee2e2", padding: "0.3rem 0.875rem", border: "1px solid #fca5a5" }}>
                  SOLD OUT
                </span>
              ) : (
                <span style={{ display: "inline-block", fontSize: "0.8rem", fontWeight: 700, color: "#16a34a", backgroundColor: "#f0fdf4", padding: "0.3rem 0.875rem", border: "1px solid #bbf7d0" }}>
                  ✓ In Stock
                </span>
              )}
            </div>

            <p style={{ color: "#555", lineHeight: 1.7, fontSize: "0.95rem", marginBottom: "2rem", paddingBottom: "2rem", borderBottom: "1px solid #e0e0e0" }}>{p.description}</p>
            
            <div style={{ marginBottom: "2rem", paddingBottom: "2rem", borderBottom: "1px solid #e0e0e0" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem", color: "#999" }}>Performance Features</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {["Compression Fit", "Sweat-Wicking", "4-Way Stretch", "Muscle Definition"].map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 500 }}>
                    <span style={{ width: "18px", height: "18px", backgroundColor: "var(--theme-primary, black)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--theme-btn-text, white)", fontSize: "0.6rem", flexShrink: 0 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <OrderForm product={productWithStock} />
            <div style={{ marginTop: "1.5rem" }}>
              <ReviewForm productId={p.id} productName={p.name} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: "4rem" }}>
          <ProductReviews productId={p.id} />
        </div>
      </div>
    </div>
  )
}