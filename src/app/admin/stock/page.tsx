"use client"
import React from "react"
import { useEffect, useState } from "react"

type Product = {
  id: string
  name: string
  images: string[]
  sizes: string[]
  colors: string[]
  stock_matrix: Record<string, number> | null
  stock_quantity: number | null
  low_stock_alert: number | null
  in_stock: boolean
  category: string
}

type Order = {
  product_id: string
  size: string
  color: string
  quantity: number
  status: string
}

function matrixKey(size: string, color: string) {
  return size.trim() + "_" + color.trim()
}

function StockTable({
  product,
  soldMatrix,
  matrix,
  lowAlert,
  onMatrixChange,
  onAlertChange,
  onSave,
  saving,
  saved,
}: {
  product: Product
  soldMatrix: Record<string, number>
  matrix: Record<string, number>
  lowAlert: number
  onMatrixChange: (m: Record<string, number>) => void
  onAlertChange: (n: number) => void
  onSave: () => void
  saving: boolean
  saved: boolean
}) {
  const sizes = product.sizes || []
  const colors = product.colors || []
  const totalStock = Object.values(matrix).reduce((s, v) => s + (Number(v) || 0), 0)
  const totalSold = Object.values(soldMatrix).reduce((s, v) => s + (Number(v) || 0), 0)

  if (!sizes.length || !colors.length) {
    return (
      <div style={{ padding: "1rem", color: "#999", fontSize: "0.82rem", fontStyle: "italic" }}>
        No sizes or colors configured on this product.
      </div>
    )
  }

  function setVal(size: string, color: string, val: string) {
    const k = matrixKey(size, color)
    const next = { ...matrix }
    if (val === "" || val === undefined) {
      delete next[k]
    } else {
      next[k] = Math.max(0, Number(val) || 0)
    }
    onMatrixChange(next)
  }

  function getVal(size: string, color: string): string {
    const k = matrixKey(size, color)
    if (matrix[k] !== undefined) return String(matrix[k])
    const found = Object.keys(matrix).find(mk => mk.toLowerCase() === k.toLowerCase())
    return found ? String(matrix[found]) : ""
  }

  function getSold(size: string, color: string): number {
    const k = matrixKey(size, color)
    const found = Object.keys(soldMatrix).find(mk => mk.toLowerCase() === k.toLowerCase())
    return found ? (soldMatrix[found] || 0) : 0
  }

  function getRemaining(size: string, color: string): number | null {
    const v = getVal(size, color)
    if (v === "") return null
    return Math.max(0, Number(v) - getSold(size, color))
  }

  const colW = "1fr "
  const gridCols = "110px " + colW.repeat(colors.length) + "80px"

  return (
    <div style={{ border: "1px solid #e0e0e0", backgroundColor: "white" }}>
      <div style={{ padding: "1rem", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {product.images?.[0] && (
              <img src={product.images[0]} alt={product.name} style={{ width: "50px", height: "50px", objectFit: "cover", border: "1px solid #e0e0e0" }} />
            )}
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.25rem" }}>{product.name}</h3>
              <p style={{ fontSize: "0.75rem", color: "#999" }}>{product.category}</p>
            </div>
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              padding: "0.5rem 1.5rem",
              backgroundColor: saved ? "#16a34a" : saving ? "#999" : "black",
              color: "white",
              border: "none",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              textTransform: "uppercase"
            }}
          >
            {saved ? "Saved ✓" : saving ? "Saving..." : "Save"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "#666" }}>
          <span>Total Stock: <strong>{totalStock}</strong></span>
          <span>Sold: <strong>{totalSold}</strong></span>
          <span>Remaining: <strong>{totalStock - totalSold}</strong></span>
        </div>
      </div>

      <div style={{ padding: "1rem", overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: "0.5rem", minWidth: "600px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.75rem", padding: "0.5rem", color: "#999" }}>SIZE / COLOR</div>
          {colors.map(color => (
            <div key={color} style={{ fontWeight: 700, fontSize: "0.75rem", padding: "0.5rem", textAlign: "center", color: "#999" }}>
              {color}
            </div>
          ))}
          <div style={{ fontWeight: 700, fontSize: "0.75rem", padding: "0.5rem", textAlign: "center", color: "#999" }}>TOTAL</div>

          {sizes.map(size => {
            const rowTotal = colors.reduce((sum, color) => {
              const v = getVal(size, color)
              return sum + (v === "" ? 0 : Number(v))
            }, 0)
            
            return (
              <React.Fragment key={size}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", padding: "0.5rem", backgroundColor: "#f9f9f9" }}>
                  {size}
                </div>
                {colors.map(color => {
                  const sold = getSold(size, color)
                  const remaining = getRemaining(size, color)
                  const val = getVal(size, color)
                  
                  return (
                    <div key={color} style={{ position: "relative" }}>
                      <input
                        type="number"
                        value={val}
                        onChange={e => setVal(size, color, e.target.value)}
                        placeholder="0"
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          border: "1px solid #e0e0e0",
                          fontSize: "0.85rem",
                          textAlign: "center"
                        }}
                      />
                      {sold > 0 && (
                        <div style={{ fontSize: "0.65rem", color: "#dc2626", marginTop: "0.25rem", textAlign: "center" }}>
                          Sold: {sold} | Left: {remaining !== null ? remaining : "-"}
                        </div>
                      )}
                    </div>
                  )
                })}
                <div style={{ fontWeight: 700, fontSize: "0.85rem", padding: "0.5rem", textAlign: "center", backgroundColor: "#f9f9f9" }}>
                  {rowTotal}
                </div>
              </React.Fragment>
            )
          })}
        </div>

        <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "#0369a1" }}>
            Low Stock Alert Threshold
          </label>
          <input
            type="number"
            value={lowAlert}
            onChange={e => onAlertChange(Number(e.target.value) || 0)}
            style={{ width: "150px", padding: "0.5rem", border: "1px solid #bae6fd", fontSize: "0.85rem" }}
          />
          <p style={{ fontSize: "0.7rem", color: "#0369a1", marginTop: "0.5rem" }}>
            You'll be alerted when stock for any size/color falls below this number.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminStock() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMatrices, setEditingMatrices] = useState<Record<string, Record<string, number>>>({})
  const [editingAlerts, setEditingAlerts] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/orders"),
      ])

      const productsData = await productsRes.json()
      const ordersData = await ordersRes.json()

      const prods = productsData.products || []
      const ords = ordersData.orders || []

      setProducts(prods)
      setOrders(ords)

      const matrices: Record<string, Record<string, number>> = {}
      const alerts: Record<string, number> = {}

      prods.forEach((p: Product) => {
        matrices[p.id] = p.stock_matrix || {}
        alerts[p.id] = p.low_stock_alert ?? 5
      })

      setEditingMatrices(matrices)
      setEditingAlerts(alerts)
    } catch (e) {
      console.error("Failed to load stock data:", e)
    }
    setLoading(false)
  }

  async function saveProduct(productId: string) {
    setSaving(prev => ({ ...prev, [productId]: true }))

    try {
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          stock_matrix: editingMatrices[productId],
          low_stock_alert: editingAlerts[productId],
        }),
      })

      setSaved(prev => ({ ...prev, [productId]: true }))
      setTimeout(() => {
        setSaved(prev => ({ ...prev, [productId]: false }))
      }, 2000)
    } catch (e) {
      console.error("Save failed:", e)
    }

    setSaving(prev => ({ ...prev, [productId]: false }))
  }

  function getSoldMatrix(product: Product): Record<string, number> {
    const sold: Record<string, number> = {}
    const counted = ["confirmed", "processing", "shipped", "delivered"]

    orders.forEach(order => {
      if (order.product_id === product.id && counted.includes(order.status)) {
        const k = matrixKey(order.size || "", order.color || "")
        sold[k] = (sold[k] || 0) + (order.quantity || 1)
      }
    })

    return sold
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Stock Management</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>Stock Management</h1>
        <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          Manage inventory for each product size and color
        </p>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", border: "1px solid #e0e0e0", backgroundColor: "white" }}>
          <p style={{ color: "#999" }}>No products found. Add products first.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {products.map(product => (
            <StockTable
              key={product.id}
              product={product}
              soldMatrix={getSoldMatrix(product)}
              matrix={editingMatrices[product.id] || {}}
              lowAlert={editingAlerts[product.id] || 5}
              onMatrixChange={m => setEditingMatrices(prev => ({ ...prev, [product.id]: m }))}
              onAlertChange={n => setEditingAlerts(prev => ({ ...prev, [product.id]: n }))}
              onSave={() => saveProduct(product.id)}
              saving={saving[product.id] || false}
              saved={saved[product.id] || false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
