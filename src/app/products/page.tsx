import Link from "next/link"
import { apiFetchServer } from "@/lib/api/server"
import { Product } from "@/types"
import FilterBar from "./FilterBar"

export const metadata = { title: "Products" }

export default async function ProductsPage() {
  const [{ products }, { settings }] = await Promise.all([
    apiFetchServer<{ products: Product[] }>("/api/products"),
    apiFetchServer<{ settings: Record<string, string> }>("/api/settings?keys=product_categories"),
  ])
  const allProducts = products || []

  // Parse categories — handle both string[] and CategoryGroup[] formats
  let categoryGroups: { id: string; name: string; subcategories: string[] }[] = []
  const catRaw = settings?.product_categories
  if (catRaw) {
    try {
      const parsed = JSON.parse(catRaw)
      if (parsed.length > 0 && typeof parsed[0] === "string") {
        categoryGroups = parsed.map((name: string) => ({ id: name, name, subcategories: [] }))
      } else {
        categoryGroups = parsed
      }
    } catch {}
  }

  return (
    <div style={{ paddingTop: "72px", minHeight: "100vh", backgroundColor: "white" }}>
      {/* Header — exactly as original */}
      <div style={{ backgroundColor: "var(--theme-btn-bg, black)", color: "var(--theme-btn-text, white)", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>The Collection</p>
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 }}>All Products</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "1rem" }}>{allProducts.length} products available</p>
      </div>

      {/* Filter bar — only shown if categories exist */}
      {categoryGroups.length > 0 && (
        <FilterBar categoryGroups={categoryGroups} />
      )}

      {/* Products grid — exactly as original */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "4rem 1.5rem" }}>
        {allProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>
            <p>No products found. Check your Supabase connection.</p>
          </div>
        ) : (
          <div id="products-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2.5rem" }}>
            {allProducts.map((product) => (
              <div key={product.id} data-subcategory={(product as any).subcategory || ""}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const image = product.images && product.images[0] ? product.images[0] : "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800"
  const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : null
  return (
    <Link href={"/products/" + product.slug} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div>
        <div style={{ position: "relative", backgroundColor: "#f5f5f5", aspectRatio: "3/4", overflow: "hidden", marginBottom: "1.25rem" }}>
          <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {discount && (
            <div style={{ position: "absolute", top: "1rem", left: "1rem", backgroundColor: "var(--theme-btn-bg, black)", color: "var(--theme-btn-text, white)", padding: "0.25rem 0.6rem", fontSize: "0.7rem", fontWeight: 700 }}>-{discount}%</div>
          )}
        </div>
        <div>
          <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.3rem" }}>{product.category}{(product as any).subcategory ? " · " + (product as any).subcategory : ""}</p>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>{product.name}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>BDT {product.price.toLocaleString()}</span>
            {product.original_price && (
              <span style={{ fontSize: "0.875rem", color: "#999", textDecoration: "line-through" }}>BDT {product.original_price.toLocaleString()}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {product.colors && product.colors.map((color) => (
              <span key={color} style={{ fontSize: "0.65rem", color: "#666", border: "1px solid #e0e0e0", padding: "0.15rem 0.5rem" }}>{color}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
