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
    { image: "/compression 03.png", label: "Ultra Flex Compression", slug: "/products/ultra-flex-compression", color: "#95E1D3", circleColor: "#95E1D3", glowEnabled: true, glowPulse: false }
  ]

  const [products, setProducts] = useState<Product[]>(
    initialProducts.length > 0 ? initialProducts : defaultProducts
  )

  const handleImageUpload = async (index: number, file: File) => {
    try {
      // Show preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) updateProduct(index, 'image', e.target.result as string)
      }
      reader.readAsDataURL(file)
      // Upload to Cloudinary and update with real URL
      const url = await uploadToCloudinary(file, "flextreme/hero-showcase")
      updateProduct(index, 'image', url)
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

  const handleSave = () => {
    onSave(products)
  }

  return (
    <div style={{ padding: '2rem', background: '#f5f5f5', borderRadius: '8px' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
        Product Showcase Hero Editor
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {products.map((product, index) => (
          <div
            key={index}
            style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                Product {index + 1}
              </h3>
              {products.length > 1 && (
                <button
                  onClick={() => removeProduct(index)}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Product Image
                </label>
                
                {/* File Upload Button */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.75rem 1.5rem',
                      background: '#3b82f6',
                      color: '#fff',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                  >
                    📁 Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(index, file)
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                  
                  {/* OR manual URL input */}
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={product.image}
                      onChange={(e) => updateProduct(index, 'image', e.target.value)}
                      placeholder="Or paste image URL"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
                
                {/* Image Preview */}
                {product.image && (
                  <div style={{ marginTop: '1rem' }}>
                    <img
                      src={product.image}
                      alt="Preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '1rem',
                        background: '#f9fafb'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Product Name
                </label>
                <input
                  type="text"
                  value={product.label}
                  onChange={(e) => updateProduct(index, 'label', e.target.value)}
                  placeholder="Ultra Flex Half Sleeve"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Product Link (Slug)
                </label>
                <input
                  type="text"
                  value={product.slug}
                  onChange={(e) => updateProduct(index, 'slug', e.target.value)}
                  placeholder="/products/ultra-flex-half-sleeve"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Circle Color
                </label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={product.circleColor || product.color}
                    onChange={(e) => updateProduct(index, 'color', e.target.value)}
                    style={{
                      width: '80px',
                      height: '50px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={product.circleColor || product.color}
                    onChange={(e) => updateProduct(index, 'color', e.target.value)}
                    placeholder="#FF6B6B"
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: product.circleColor || product.color,
                      border: '3px solid #fff',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2), 0 0 20px ' + (product.circleColor || product.color)
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
        style={{
          marginTop: '1.5rem',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '600',
          width: '100%'
        }}
      >
        + Add Another Product
      </button>

      <button
        onClick={handleSave}
        style={{
          marginTop: '1rem',
          background: '#10b981',
          color: '#fff',
          border: 'none',
          padding: '1rem 2rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '700',
          width: '100%'
        }}
      >
        Save Hero Settings
      </button>

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fff', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
          Preview (JSON Output)
        </h3>
        <pre
          style={{
            background: '#1f2937',
            color: '#10b981',
            padding: '1rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            overflow: 'auto',
            maxHeight: '300px'
          }}
        >
          {JSON.stringify(products, null, 2)}
        </pre>
      </div>
    </div>
  )
}
