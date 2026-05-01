"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Product } from "@/types"

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products")
        const data: { products?: Product[] } = await res.json()
        const products = data.products || []
        setAllProducts(products)
        setFilteredProducts(products)
        
        // Extract unique categories
        const cats = ["All Categories", ...Array.from(new Set(products.map(p => p.category).filter((category): category is string => Boolean(category))))]
        setCategories(cats)
      } catch (e) {
        console.error("Products fetch error:", e)
      }
    }
    loadProducts()
  }, [])

  useEffect(() => {
    let filtered = allProducts

    // Filter by category
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
    }

    setFilteredProducts(filtered)
  }, [searchQuery, selectedCategory, allProducts])

  return (
    <div style={{ paddingTop: "72px", backgroundColor: "white", flex: 1 }}>
      {/* Header */}
      <div style={{ backgroundColor: "var(--theme-btn-bg, black)", color: "var(--theme-btn-text, white)", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>The Collection</p>
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 }}>All Products</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "1rem" }}>{filteredProducts.length} products available</p>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "1.5rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: "250px",
              padding: "0.75rem 1rem",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem",
              outline: "none"
            }}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem",
              backgroundColor: "white",
              cursor: "pointer",
              minWidth: "180px"
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products grid */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "4rem 1.5rem" }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>
            <p>No products found.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2.5rem" }}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
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
          <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.3rem" }}>{product.category}</p>
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
