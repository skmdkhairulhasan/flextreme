"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

function ConfirmModal({ open, title, message, onConfirm, onCancel }: any) {
  if (!open) return null
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ backgroundColor: "white", padding: "2rem", maxWidth: "400px", width: "90%" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>{title}</h3>
        <p style={{ marginBottom: "1.5rem", color: "#666" }}>{message}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "0.5rem 1rem", backgroundColor: "#f5f5f5", border: "none", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// Toast
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", backgroundColor: "#f0fdf4", border: "1px solid #86efac", color: "#15803d", padding: "0.875rem 1.5rem", fontWeight: 700, fontSize: "0.875rem", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 99999, whiteSpace: "nowrap" }}>
      {msg}
    </div>
  )
}

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState("")
  const router = useRouter()

  // Drag state
  const dragIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products")
      const data = await res.json()
      setProducts(data.products || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent, index: number) {
    dragIndex.current = index
    e.dataTransfer.effectAllowed = "move"
    // Ghost image
    const el = e.currentTarget as HTMLElement
    e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOver(index)
  }

  function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault()
    const fromIndex = dragIndex.current
    if (fromIndex === null || fromIndex === toIndex) {
      setDragOver(null)
      return
    }

    const reordered = [...products]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    setProducts(reordered)
    setDragOver(null)
    dragIndex.current = null

    // Save new order
    saveOrder(reordered)
  }

  function handleDragEnd() {
    setDragOver(null)
    dragIndex.current = null
  }

  async function saveOrder(ordered: any[]) {
    setSaving(true)
    try {
      // Update sort_order for each product
      await Promise.all(
        ordered.map((p, i) =>
          fetch("/api/products", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: p.id, sort_order: i + 1 }),
          })
        )
      )
      setToast("✓ Order saved")
    } catch {
      setToast("Failed to save order")
    }
    setSaving(false)
  }

  // ── Move with buttons (mobile friendly) ───────────────────────────────────
  function moveUp(index: number) {
    if (index === 0) return
    const reordered = [...products]
    ;[reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]]
    setProducts(reordered)
    saveOrder(reordered)
  }

  function moveDown(index: number) {
    if (index === products.length - 1) return
    const reordered = [...products]
    ;[reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]]
    setProducts(reordered)
    saveOrder(reordered)
  }

  async function confirmDeleteProduct() {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)
    try {
      const res = await fetch(`/api/products?id=${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) setProducts(prev => prev.filter(p => p.id !== deleteTarget.id))
    } catch (e) { console.error(e) }
    setDeleting(null)
    setDeleteTarget(null)
  }

  async function toggleStock(id: string, current: boolean) {
    try {
      await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, in_stock: !current }) })
      setProducts(prev => prev.map(p => p.id === id ? { ...p, in_stock: !current } : p))
    } catch (e) { console.error(e) }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, is_featured: !current }) })
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_featured: !current } : p))
    } catch (e) { console.error(e) }
  }

  if (loading) return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontWeight: 900, textTransform: "uppercase" }}>Products</h1>
      <p style={{ color: "#999", marginTop: "1rem" }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ padding: "2rem" }}>
      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product?"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? This cannot be undone.` : ""}
        onConfirm={confirmDeleteProduct}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.5rem" }}>Products</h1>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>
            {products.length} products · <span style={{ color: "#999" }}>Drag ☰ to reorder</span>
            {saving && <span style={{ color: "#f59e0b", marginLeft: "0.5rem" }}>Saving order...</span>}
          </p>
        </div>
        <button onClick={() => router.push("/admin/products/new")}
          style={{ padding: "0.75rem 1.5rem", backgroundColor: "black", color: "white", border: "none", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>
          + Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", border: "1px solid #e0e0e0", backgroundColor: "white" }}>
          <p style={{ color: "#999", marginBottom: "1.5rem" }}>No products yet.</p>
          <button onClick={() => router.push("/admin/products/new")}
            style={{ padding: "0.75rem 1.5rem", backgroundColor: "black", color: "white", border: "none", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer" }}>
            Add Product
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {products.map((p, index) => (
            <div
              key={p.id}
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={e => handleDragOver(e, index)}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                border: dragOver === index ? "2px dashed #f59e0b" : "1px solid #e0e0e0",
                backgroundColor: dragOver === index ? "#fffbeb" : "white",
                padding: "1rem 1.25rem",
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                flexWrap: "wrap",
                transition: "all 0.15s",
                cursor: "grab",
                opacity: dragIndex.current === index ? 0.5 : 1,
              }}
            >
              {/* Drag handle + position buttons */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", flexShrink: 0 }}>
                {/* Up/down buttons for mobile */}
                <button onClick={() => moveUp(index)} disabled={index === 0}
                  style={{ background: "none", border: "1px solid #e0e0e0", width: "26px", height: "22px", cursor: index === 0 ? "not-allowed" : "pointer", opacity: index === 0 ? 0.3 : 1, fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ▲
                </button>
                {/* Drag handle */}
                <span style={{ color: "#ccc", fontSize: "1.1rem", lineHeight: 1, cursor: "grab", userSelect: "none", padding: "0.1rem 0.3rem" }}>☰</span>
                <button onClick={() => moveDown(index)} disabled={index === products.length - 1}
                  style={{ background: "none", border: "1px solid #e0e0e0", width: "26px", height: "22px", cursor: index === products.length - 1 ? "not-allowed" : "pointer", opacity: index === products.length - 1 ? 0.3 : 1, fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ▼
                </button>
              </div>

              {/* Position number */}
              <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "#ccc", minWidth: "20px", textAlign: "center" }}>
                {index + 1}
              </span>

              {/* Image */}
              {p.images && p.images[0] && (
                <img src={p.images[0]} alt={p.name}
                  style={{ width: "64px", height: "64px", objectFit: "cover", border: "1px solid #e0e0e0", flexShrink: 0 }} />
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: "160px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>{p.name}</h3>
                <p style={{ fontSize: "0.75rem", color: "#999", marginBottom: "0.25rem" }}>{p.slug}</p>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>BDT {p.price?.toLocaleString()}</span>
                  {p.original_price && <span style={{ fontSize: "0.8rem", color: "#999", textDecoration: "line-through" }}>BDT {p.original_price?.toLocaleString()}</span>}
                  {p.category && <span style={{ fontSize: "0.68rem", backgroundColor: "#f5f5f5", padding: "0.15rem 0.45rem" }}>{p.category}</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", flexShrink: 0 }}>
                <button onClick={() => toggleStock(p.id, p.in_stock !== false)}
                  style={{ padding: "0.4rem 0.75rem", backgroundColor: p.in_stock !== false ? "#dcfce7" : "#fee2e2", color: p.in_stock !== false ? "#16a34a" : "#dc2626", border: "none", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>
                  {p.in_stock !== false ? "✓ In Stock" : "✗ OOS"}
                </button>

                <button onClick={() => toggleFeatured(p.id, p.is_featured)}
                  style={{ padding: "0.4rem 0.75rem", backgroundColor: p.is_featured ? "#fef9c3" : "#f5f5f5", color: p.is_featured ? "#854d0e" : "#666", border: "none", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>
                  {p.is_featured ? "★ Featured" : "☆ Feature"}
                </button>

                <Link href={`/admin/products/${p.id}`}
                  style={{ padding: "0.4rem 0.75rem", backgroundColor: "#f5f5f5", color: "black", border: "none", fontSize: "0.72rem", fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
                  Edit
                </Link>

                <button onClick={() => setDeleteTarget(p)} disabled={deleting === p.id}
                  style={{ padding: "0.4rem 0.75rem", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", fontSize: "0.72rem", fontWeight: 700, cursor: deleting === p.id ? "not-allowed" : "pointer", opacity: deleting === p.id ? 0.5 : 1 }}>
                  {deleting === p.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
