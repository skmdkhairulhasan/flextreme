import { Product } from "@/types"
import { notFound } from "next/navigation"
import OrderForm from "@/components/products/OrderForm"
import ImageGallery from "@/components/products/ImageGallery"
import ReviewForm from "@/components/products/ReviewForm"
import ProductReviews from "@/components/products/ProductReviews"
import sql from "@/lib/db"

export const dynamic = "force-dynamic"

function parseJsonField(value: unknown, fallback: unknown) {
  if (value == null) return fallback
  if (typeof value !== "string") return value
  try { return JSON.parse(value) } catch { return fallback }
}

function normalizeProduct(row: any): Product {
  return {
    ...row,
    sizes: parseJsonField(row.sizes, []),
    colors: parseJsonField(row.colors, []),
    images: parseJsonField(row.images, []),
    stock_matrix: parseJsonField(row.stock_matrix, {}),
  } as Product
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let product: Product | null = null
  try {
    const rows = await sql`SELECT * FROM products WHERE slug = ${slug} LIMIT 1`
    if (rows.length > 0) product = normalizeProduct(rows[0])
  } catch (err) {
    console.error("Product fetch error:", err)
  }
  if (!product) notFound()
  const p = product

  let soldOrders: any[] = []
  try {
    soldOrders = await sql`
      SELECT size, color, quantity FROM orders
      WHERE product_id = ${p.id}::uuid
        AND status = ANY(${["confirmed", "processing", "shipped", "delivered"]})
    `
  } catch {}

  let computedMatrix: Record<string, number> | null = null
  const pAny = p as any
  if (pAny.stock_matrix && soldOrders.length > 0) {
    computedMatrix = { ...pAny.stock_matrix } as Record<string, number>
    for (const order of soldOrders) {
      if (!order.size || !order.color) continue
      const key = order.size.trim() + "_" + order.color.trim()
      const matrix = computedMatrix as Record<string, number>
      const matchedKey = Object.keys(matrix).find(k => k.toLowerCase() === key.toLowerCase()) || key
      if (matchedKey in matrix) {
        matrix[matchedKey] = Math.max(0, (matrix[matchedKey] || 0) - (order.quantity || 1))
      }
    }
  }

  const productWithStock = { ...p, stock_matrix: computedMatrix || pAny.stock_matrix } as any

  return (
    <div style={{
      paddingTop: "clamp(60px, 10vh, 80px)",
      minHeight: "100dvh",
      backgroundColor: "var(--theme-bg, white)",
      overflowX: "hidden",
    }}>
      {/* 
        KEY MOBILE FIX: All responsive styles in a single <style> block.
        Using clamp() on font sizes instead of fixed px so nothing overflows.
        The grid collapses to 1fr on mobile — right col goes below left col, no overlap.
      */}
      <style>{`
        .product-outer {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1.25rem;
          box-sizing: border-box;
        }
        .product-breadcrumbs {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 1.5rem;
          font-size: 0.75rem;
          color: #999;
          overflow-x: auto;
          white-space: nowrap;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .product-breadcrumbs::-webkit-scrollbar { display: none; }
        .product-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 3.5rem;
          align-items: start;
          width: 100%;
        }
        .product-left {
          width: 100%;
          min-width: 0;
          overflow: hidden;
        }
        .product-right {
          width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .product-title {
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin-bottom: 1rem;
          word-break: break-word;
        }
        .perf-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        @media (max-width: 900px) {
          .product-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .product-right {
            /* Right col below left on mobile — no overlap */
            order: 2;
          }
          .product-left {
            order: 1;
          }
        }
        @media (max-width: 480px) {
          .product-outer { padding: 1rem; }
          .perf-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="product-outer">

        {/* Breadcrumbs */}
        <div className="product-breadcrumbs">
          <a href="/" style={{ color: "#999", textDecoration: "none" }}>Home</a>
          <span>/</span>
          <a href="/products" style={{ color: "#999", textDecoration: "none" }}>Products</a>
          <span>/</span>
          <span style={{ color: "black", fontWeight: 600 }}>{p.name}</span>
        </div>

        <div className="product-grid">

          {/* Left: Images + Video */}
          <div className="product-left">
            <ImageGallery images={p.images || []} productName={p.name} />
            {p.video_url && (
              <div style={{ marginTop: "1.5rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.75rem", color: "#999" }}>Product Video</p>
                <div style={{ position: "relative", width: "100%", backgroundColor: "#000", aspectRatio: "16/9" }}>
                  <video src={p.video_url} controls style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              </div>
            )}
          </div>

          {/* Right: Info + Order form */}
          <div className="product-right">

            {/* Category */}
            <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "0.5rem" }}>
              {p.category}
            </p>

            {/* Name */}
            <h1 className="product-title">{p.name}</h1>

            {/* Price */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "clamp(1.4rem, 3vw, 1.75rem)", fontWeight: 900 }}>
                BDT {p.price.toLocaleString()}
              </span>
              {pAny.original_price && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "1rem", color: "#999", textDecoration: "line-through" }}>
                    BDT {pAny.original_price.toLocaleString()}
                  </span>
                  <span style={{ backgroundColor: "var(--theme-primary, black)", color: "var(--theme-btn-text, white)", padding: "0.2rem 0.5rem", fontSize: "0.72rem", fontWeight: 700 }}>
                    {Math.round(((pAny.original_price - p.price) / pAny.original_price) * 100)}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Stock badge */}
            <div style={{ marginBottom: "1.25rem" }}>
              {!p.in_stock ? (
                <span style={{ display: "inline-block", fontSize: "0.8rem", fontWeight: 700, color: "#dc2626", backgroundColor: "#fee2e2", padding: "0.3rem 0.875rem", border: "1px solid #fca5a5" }}>SOLD OUT</span>
              ) : (
                <span style={{ display: "inline-block", fontSize: "0.8rem", fontWeight: 700, color: "#16a34a", backgroundColor: "#f0fdf4", padding: "0.3rem 0.875rem", border: "1px solid #bbf7d0" }}>
                  ✓ In Stock{pAny.stock_quantity ? ` (${pAny.stock_quantity} available)` : ""}
                </span>
              )}
            </div>

            {/* Description */}
            <div
              style={{ color: "#555", lineHeight: 1.7, fontSize: "0.95rem", marginBottom: "1.75rem", paddingBottom: "1.75rem", borderBottom: "1px solid #e0e0e0", wordBreak: "break-word" }}
              dangerouslySetInnerHTML={{ __html: p.description || "" }}
            />

            {/* Performance features */}
            <div style={{ marginBottom: "1.75rem", paddingBottom: "1.75rem", borderBottom: "1px solid #e0e0e0" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem", color: "#999" }}>
                Performance Features
              </p>
              <div className="perf-grid">
                {["Compression Fit", "Sweat-Wicking", "4-Way Stretch", "Muscle Definition"].map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 500 }}>
                    <span style={{ width: "18px", height: "18px", minWidth: "18px", backgroundColor: "var(--theme-primary, black)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--theme-btn-text, white)", fontSize: "0.6rem" }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Order form */}
            <OrderForm product={productWithStock} />

            {/* Review form */}
            <div style={{ marginTop: "1.5rem" }}>
              <ReviewForm productId={p.id} productName={p.name} />
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={{ marginTop: "4rem" }}>
          <ProductReviews productId={p.id} />
        </div>
      </div>
    </div>
  )
}
