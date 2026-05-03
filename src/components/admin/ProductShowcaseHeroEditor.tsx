"use client"
import { useState } from "react"
import { uploadToCloudinary } from "@/lib/cloudinary"

interface Product {
  image: string
  label: string
  slug: string
  color: string
  circleColor?: string
  glowEnabled?: boolean
  glowPulse?: boolean
}

interface ProductShowcaseHeroEditorProps {
  initialProducts?: Product[]
  onSave?: (products: Product[]) => void
}

type ProductTextField = "image" | "label" | "slug" | "color"

export default function ProductShowcaseHeroEditor({
  initialProducts = [],
  onSave = () => {}
}: ProductShowcaseHeroEditorProps) {
  const defaultProducts: Product[] = [
    { image: "/compression 01.png", label: "Ultra Flex Half Sleeve", slug: "/products/ultra-flex-half-sleeve", color: "#FF6B6B", circleColor: "#FF6B6B", glowEnabled: true, glowPulse: false },
    { image: "/compression 02.png", label: "Ultra Flex Sleeveless", slug: "/products/ultra-flex-sleeveless", color: "#4ECDC4", circleColor: "#4ECDC4", glowEnabled: true, glowPulse: false },
    { image: "/compression 03.png", label: "Ultra Flex Compression", slug: "/products/ultra-flex-compression", color: "#95E1D3", circleColor: "#95E1D3", glowEnabled: true, glowPulse: false },
  ]

  const [products, setProducts] = useState<Product[]>(
    initialProducts.length > 0 ? initialProducts : defaultProducts
  )

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) updateProduct(index, "image", e.target.result as string)
      }
      reader.readAsDataURL(file)
      const url = await uploadToCloudinary(file, "flextreme/hero-showcase")
      updateProduct(index, "image", url)
    } catch (err) {
      alert("Upload failed: " + (err instanceof Error ? err.message : "Upload failed"))
    }
  }

  const addProduct = () => {
    setProducts([...products, { image: "", label: "", slug: "", color: "#4ECDC4", circleColor: "#4ECDC4" }])
  }

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const updateProduct = (index: number, field: ProductTextField, value: string) => {
    setProducts(prev => prev.map((product, i) => {
      if (i !== index) return product
      if (field === "color") return { ...product, color: value, circleColor: value }
      return { ...product, [field]: value }
    }))
  }

  // Shared input style
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "0.875rem",
    boxSizing: "border-box",
    outline: "none",
  }

  return (
    <div style={{ padding: "1.5rem", background: "#f5f5f5", borderRadius: "8px", boxSizing: "border-box" }}>
      {/* Mobile safety global override */}
      <style>{`
        .showcase-editor-card { box-sizing: border-box; width: 100%; overflow: hidden; }
        .showcase-editor-card input,
        .showcase-editor-card textarea { box-sizing: border-box; max-width: 100%; }
        .showcase-image-row { display: flex; gap: 0.75rem; align-items: flex-start; flex-wrap: wrap; }
        .showcase-image-row label { flex-shrink: 0; }
        .showcase-image-row .url-input { flex: 1; min-width: 0; width: 100%; overflow: hidden; }
        .showcase-image-row .url-input input { width: 100%; min-width: 0; box-sizing: border-box; }
        .showcase-color-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
        .showcase-color-row input[type="color"] { flex-shrink: 0; width: 60px; height: 44px; }
        .showcase-color-row .hex-input { flex: 1; min-width: 0; width: 100%; }
        .showcase-color-row .hex-input input { width: 100%; min-width: 0; box-sizing: border-box; }
        .showcase-color-row .color-preview { flex-shrink: 0; width: 48px; height: 48px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
        @media (max-width: 480px) {
          .showcase-image-row { flex-direction: column; }
          .showcase-image-row label { width: 100%; }
          .showcase-color-row .color-preview { display: none; }
        }
      `}</style>

      <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 700 }}>
        Product Showcase Hero Editor
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {products.map((product, index) => (
          <div
            key={index}
            className="showcase-editor-card"
            style={{
              background: "#fff",
              padding: "1.25rem",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            {/* Card header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Product {index + 1}</h3>
              {products.length > 1 && (
                <button
                  onClick={() => removeProduct(index)}
                  style={{ background: "#ef4444", color: "#fff", border: "none", padding: "0.4rem 0.875rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}
                >
                  Remove
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Image upload */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>
                  Product Image
                </label>
                <div className="showcase-image-row">
                  <label
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.65rem 1.25rem", background: "#3b82f6", color: "#fff", borderRadius: "4px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, whiteSpace: "nowrap" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#2563eb")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#3b82f6")}
                  >
                    📁 Choose Image
                    <input
                      type="file" accept="image/*"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(index, f) }}
                      style={{ display: "none" }}
                    />
                  </label>
                  <div className="url-input">
                    <input
                      type="text" value={product.image}
                      onChange={e => updateProduct(index, "image", e.target.value)}
                      placeholder="Or paste image URL"
                      style={inputStyle}
                    />
                  </div>
                </div>
                {product.image && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <img
                      src={product.image} alt="Preview"
                      style={{ maxWidth: "160px", maxHeight: "160px", objectFit: "contain", border: "2px solid #e5e7eb", borderRadius: "8px", padding: "0.75rem", background: "#f9fafb" }}
                    />
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>Product Name</label>
                <input
                  type="text" value={product.label}
                  onChange={e => updateProduct(index, "label", e.target.value)}
                  placeholder="Ultra Flex Half Sleeve"
                  style={inputStyle}
                />
              </div>

              {/* Slug */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>Product Link (Slug)</label>
                <input
                  type="text" value={product.slug}
                  onChange={e => updateProduct(index, "slug", e.target.value)}
                  placeholder="/products/ultra-flex-half-sleeve"
                  style={inputStyle}
                />
              </div>

              {/* Circle Color — wraps on mobile */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>Circle / Glow Color</label>
                <div className="showcase-color-row">
                  <input
                    type="color"
                    value={product.circleColor || product.color}
                    onChange={e => updateProduct(index, "color", e.target.value)}
                    style={{ width: 60, height: 44, border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer", padding: 0 }}
                  />
                  <input
                    type="text"
                    value={product.circleColor || product.color}
                    onChange={e => updateProduct(index, "color", e.target.value)}
                    placeholder="#FF6B6B"
                    className="hex-input"
                    style={{ ...inputStyle, fontFamily: "monospace", width: "auto" }}
                  />
                  <div
                    className="color-preview"
                    style={{
                      background: product.circleColor || product.color,
                      boxShadow: `0 2px 8px rgba(0,0,0,0.2), 0 0 16px ${product.circleColor || product.color}`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addProduct}
        style={{ marginTop: "1.5rem", background: "#3b82f6", color: "#fff", border: "none", padding: "0.75rem 1.5rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 700, width: "100%" }}
      >
        + Add Another Product
      </button>

      <button
        onClick={() => onSave(products)}
        style={{ marginTop: "0.75rem", background: "#10b981", color: "#fff", border: "none", padding: "1rem 2rem", borderRadius: "4px", cursor: "pointer", fontSize: "1rem", fontWeight: 700, width: "100%" }}
      >
        Save Hero Settings
      </button>

      <div style={{ marginTop: "1.5rem", padding: "1.25rem", background: "#fff", borderRadius: "8px" }}>
        <h3 style={{ marginBottom: "0.75rem", fontSize: "1rem", fontWeight: 700 }}>Preview (JSON)</h3>
        <pre style={{ background: "#1f2937", color: "#10b981", padding: "1rem", borderRadius: "4px", fontSize: "0.72rem", overflow: "auto", maxHeight: "240px", margin: 0 }}>
          {JSON.stringify(products, null, 2)}
        </pre>
      </div>
    </div>
  )
}
