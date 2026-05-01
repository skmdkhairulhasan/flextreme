"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Simple inline confirm modal
function ConfirmModal({ open, title, message, onConfirm, onCancel }: any) {
  if (!open) return null
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ backgroundColor: "white", padding: "2rem", maxWidth: "400px", width: "90%", borderRadius: "4px" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>{title}</h3>
        <p style={{ marginBottom: "1.5rem", color: "#666" }}>{message}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "0.5rem 1rem", backgroundColor: "#f5f5f5", border: "none", fontWeight: 600, cursor: "pointer", borderRadius: "4px" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "white", border: "none", fontWeight: 600, cursor: "pointer", borderRadius: "4px" }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products")
      const data = await res.json()
      setProducts(data.products || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function confirmDeleteProduct() {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)

    try {
      const res = await fetch(`/api/products?id=${deleteTarget.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== deleteTarget.id))
      }
    } catch (e) {
      console.error("Delete failed:", e)
    }

    setDeleting(null)
    setDeleteTarget(null)
  }

  async function toggleStock(id: string, current: boolean) {
    try {
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, in_stock: !current }),
      })

      setProducts(prev =>
        prev.map(p => p.id === id ? { ...p, in_stock: !current } : p)
      )
    } catch (e) {
      console.error("Toggle stock failed:", e)
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_featured: !current }),
      })

      setProducts(prev =>
        prev.map(p => p.id === id ? { ...p, is_featured: !current } : p)
      )
    } catch (e) {
      console.error("Toggle featured failed:", e)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Products</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: "2rem" }}>
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product?"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
        onConfirm={confirmDeleteProduct}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Products
          </h1>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>
            {products.length} {products.length === 1 ? "product" : "products"} total
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/products/new")}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "black",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "0.875rem",
            fontWeight: 700,
            textTransform: "uppercase",
            cursor: "pointer"
          }}
        >
          + Add Product
        </button>
      </div>

      {/* Products List */}
      {products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", border: "1px solid #e0e0e0", backgroundColor: "white" }}>
          <p style={{ color: "#999", marginBottom: "1.5rem" }}>No products yet. Create your first product!</p>
          <button
            onClick={() => router.push("/admin/products/new")}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "black",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "0.875rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Add Product
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {products.map(p => (
            <div
              key={p.id}
              style={{
                border: "1px solid #e0e0e0",
                backgroundColor: "white",
                padding: "1.5rem",
                display: "flex",
                gap: "1.5rem",
                alignItems: "center",
                flexWrap: "wrap"
              }}
            >
              {/* Product Image */}
              {p.images && p.images[0] && (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    border: "1px solid #e0e0e0"
                  }}
                />
              )}

              {/* Product Info */}
              <div style={{ flex: 1, minWidth: "200px" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  {p.name}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
                  {p.slug}
                </p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                    BDT {p.price?.toLocaleString()}
                  </span>
                  {p.original_price && (
                    <span style={{ fontSize: "0.875rem", color: "#999", textDecoration: "line-through" }}>
                      BDT {p.original_price.toLocaleString()}
                    </span>
                  )}
                  {p.category && (
                    <span style={{ fontSize: "0.75rem", backgroundColor: "#f5f5f5", padding: "0.25rem 0.5rem", borderRadius: "3px" }}>
                      {p.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => toggleStock(p.id, p.in_stock !== false)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: p.in_stock !== false ? "#dcfce7" : "#fee2e2",
                    color: p.in_stock !== false ? "#16a34a" : "#dc2626",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {p.in_stock !== false ? "✓ In Stock" : "✗ Out of Stock"}
                </button>

                <button
                  onClick={() => toggleFeatured(p.id, p.is_featured)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: p.is_featured ? "#fef9c3" : "#f5f5f5",
                    color: p.is_featured ? "#854d0e" : "#666",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {p.is_featured ? "★ Featured" : "☆ Feature"}
                </button>

                <Link
                  href={`/admin/products/${p.id}`}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#f5f5f5",
                    color: "black",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-block"
                  }}
                >
                  Edit
                </Link>

                <button
                  onClick={() => setDeleteTarget(p)}
                  disabled={deleting === p.id}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: deleting === p.id ? "not-allowed" : "pointer",
                    opacity: deleting === p.id ? 0.5 : 1
                  }}
                >
                  {deleting === p.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
