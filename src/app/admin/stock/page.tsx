"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

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

// Key format: "Size_Color"
function matrixKey(size: string, color: string) {
  return size.trim() + "_" + color.trim()
}

// Outside component — prevents focus loss on re-render
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
    // try exact, then case-insensitive
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
    <div>
      {/* Controls row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", backgroundColor: "#f9f9f9", borderBottom: "1px solid #e0e0e0", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.78rem" }}>
          <span>Total Stock: <strong style={{ color: "#0369a1" }}>{totalStock}</strong></span>
          <span>Total Sold: <strong style={{ color: "#16a34a" }}>{totalSold}</strong></span>
          <span>Remaining: <strong style={{ color: totalStock - totalSold <= 0 ? "#dc2626" : "#111" }}>{totalStock - totalSold}</strong></span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "#555" }}>Low Stock Alert:</label>
          <input
            type="number"
            min="1"
            value={lowAlert || ""}
            onChange={e => onAlertChange(Number(e.target.value) || 5)}
            style={{ width: "55px", border: "1px solid #e0e0e0", padding: "0.3rem 0.5rem", fontSize: "0.82rem", outline: "none", textAlign: "center" }}
          />
          <button
            onClick={onSave}
            disabled={saving}
            style={{ padding: "0.4rem 1.25rem", backgroundColor: saved ? "#16a34a" : "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.72rem", cursor: saving ? "not-allowed" : "pointer", textTransform: "uppercase", minWidth: "80px", transition: "all 0.2s" }}
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        {/* Header — colors */}
        <div style={{ display: "grid", gridTemplateColumns: gridCols, backgroundColor: "#000", color: "white", minWidth: "400px" }}>
          <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>Size</div>
          {colors.map(c => (
            <div key={c} style={{ padding: "0.5rem 0.6rem", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", textAlign: "center" }}>{c}</div>
          ))}
          <div style={{ padding: "0.5rem 0.6rem", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", textAlign: "center", backgroundColor: "#333" }}>Total</div>
        </div>

        {/* Size rows — 3 sub-rows: Stock / Sold / Remaining */}
        {sizes.map((size, si) => {
          const rowTotal = colors.reduce((s, c) => {
            const v = getVal(size, c)
            return s + (v === "" ? 0 : Number(v))
          }, 0)
          const rowSold = colors.reduce((s, c) => s + getSold(size, c), 0)
          const rowRemaining = rowTotal - rowSold

          return (
            <div key={size} style={{ borderBottom: "2px solid #e0e0e0", backgroundColor: si % 2 === 0 ? "white" : "#fafafa" }}>
              {/* Stock input row */}
              <div style={{ display: "grid", gridTemplateColumns: gridCols, alignItems: "center", minWidth: "400px" }}>
                <div style={{ padding: "0.5rem 0.75rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.88rem" }}>{size}</span>
                  <div style={{ fontSize: "0.6rem", color: "#aaa", textTransform: "uppercase", marginTop: "0.1rem" }}>Stock</div>
                </div>
                {colors.map(color => {
                  const v = getVal(size, color)
                  const n = v === "" ? null : Number(v)
                  const sold = getSold(size, color)
                  const remaining = n !== null ? Math.max(0, n - sold) : null
                  const isOut = remaining !== null && remaining === 0
                  const isLow = remaining !== null && remaining > 0 && remaining <= lowAlert
                  return (
                    <div key={color} style={{ padding: "0.35rem 0.3rem", textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        value={v}
                        onChange={e => setVal(size, color, e.target.value)}
                        placeholder="∞"
                        style={{
                          width: "64px",
                          border: "1px solid " + (isOut ? "#fca5a5" : isLow ? "#fed7aa" : "#e0e0e0"),
                          padding: "0.35rem 0.4rem",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          textAlign: "center",
                          outline: "none",
                          backgroundColor: isOut ? "#fff5f5" : isLow ? "#fffbeb" : "white",
                          color: isOut ? "#dc2626" : isLow ? "#d97706" : "#111",
                          boxSizing: "border-box" as const,
                        }}
                      />
                    </div>
                  )
                })}
                <div style={{ padding: "0.35rem 0.6rem", textAlign: "center", fontWeight: 700, fontSize: "0.85rem", backgroundColor: "#f0f0f0" }}>
                  {rowTotal || "—"}
                </div>
              </div>

              {/* Sold row */}
              <div style={{ display: "grid", gridTemplateColumns: gridCols, alignItems: "center", minWidth: "400px", backgroundColor: "rgba(22,163,74,0.04)" }}>
                <div style={{ padding: "0.25rem 0.75rem" }}>
                  <div style={{ fontSize: "0.6rem", color: "#16a34a", textTransform: "uppercase", fontWeight: 700 }}>Sold</div>
                </div>
                {colors.map(color => (
                  <div key={color} style={{ padding: "0.25rem 0.3rem", textAlign: "center", fontSize: "0.78rem", color: "#16a34a", fontWeight: 600 }}>
                    {getSold(size, color) || "—"}
                  </div>
                ))}
                <div style={{ padding: "0.25rem 0.6rem", textAlign: "center", fontSize: "0.78rem", color: "#16a34a", fontWeight: 700, backgroundColor: "#f0f0f0" }}>
                  {rowSold || "—"}
                </div>
              </div>

              {/* Remaining row */}
              <div style={{ display: "grid", gridTemplateColumns: gridCols, alignItems: "center", minWidth: "400px", backgroundColor: "rgba(0,0,0,0.02)" }}>
                <div style={{ padding: "0.25rem 0.75rem 0.5rem" }}>
                  <div style={{ fontSize: "0.6rem", color: "#666", textTransform: "uppercase", fontWeight: 700 }}>Left</div>
                </div>
                {colors.map(color => {
                  const rem = getRemaining(size, color)
                  const isOut = rem !== null && rem === 0
                  const isLow = rem !== null && rem > 0 && rem <= lowAlert
                  return (
                    <div key={color} style={{ padding: "0.25rem 0.3rem 0.5rem", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: isOut ? "#dc2626" : isLow ? "#d97706" : rem !== null ? "#0369a1" : "#ccc" }}>
                      {rem !== null ? (isOut ? "OUT" : rem) : "∞"}
                    </div>
                  )
                })}
                <div style={{ padding: "0.25rem 0.6rem 0.5rem", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: rowRemaining <= 0 && rowTotal > 0 ? "#dc2626" : "#0369a1", backgroundColor: "#f0f0f0" }}>
                  {rowTotal > 0 ? (rowRemaining <= 0 ? "OUT" : rowRemaining) : "∞"}
                </div>
              </div>
            </div>
          )
        })}

        {/* Column totals */}
        <div style={{ display: "grid", gridTemplateColumns: gridCols, backgroundColor: "#111", color: "white", minWidth: "400px" }}>
          <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" }}>Color Total</div>
          {colors.map(color => {
            const colTotal = sizes.reduce((s, sz) => {
              const v = getVal(sz, color)
              return s + (v === "" ? 0 : Number(v))
            }, 0)
            const colSold = sizes.reduce((s, sz) => s + getSold(sz, color), 0)
            return (
              <div key={color} style={{ padding: "0.5rem 0.3rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{colTotal}</div>
                <div style={{ fontSize: "0.62rem", color: "#aaa" }}>{colSold} sold</div>
              </div>
            )
          })}
          <div style={{ padding: "0.5rem 0.6rem", textAlign: "center", backgroundColor: "#000" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 900 }}>{totalStock}</div>
            <div style={{ fontSize: "0.62rem", color: "#aaa" }}>{totalSold} sold</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [soldData, setSoldData] = useState<Record<string, Record<string, number>>>({})
  const [matrices, setMatrices] = useState<Record<string, Record<string, number>>>({})
  const [alerts, setAlerts] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const supabase = createClient()
    const [{ data: prods }, { data: orders }] = await Promise.all([
      supabase.from("products").select("id, name, images, sizes, colors, stock_matrix, stock_quantity, low_stock_alert, in_stock, category").order("name"),
      supabase.from("orders").select("product_id, size, color, quantity, status"),
    ])

    const productList = prods || []
    setProducts(productList)

    // Build initial matrices from DB
    const mats: Record<string, Record<string, number>> = {}
    const alrt: Record<string, number> = {}
    productList.forEach((p: Product) => {
      mats[p.id] = p.stock_matrix || {}
      alrt[p.id] = p.low_stock_alert || 5
    })
    setMatrices(mats)
    setAlerts(alrt)

    // Calculate sold per product per size_color from confirmed+ orders
    const sold: Record<string, Record<string, number>> = {}
    const countedStatuses = ["confirmed", "processing", "shipped", "delivered"]
    ;(orders || []).filter((o: Order) => countedStatuses.includes(o.status)).forEach((o: Order) => {
      if (!sold[o.product_id]) sold[o.product_id] = {}
      const k = matrixKey(o.size || "", o.color || "")
      sold[o.product_id][k] = (sold[o.product_id][k] || 0) + (o.quantity || 1)
    })
    setSoldData(sold)
    setLoading(false)
  }

  async function saveProduct(productId: string) {
    setSaving(productId)
    const supabase = createClient()
    const matrix = matrices[productId] || {}
    const lowAlert = alerts[productId] || 5
    const totalQty = Object.values(matrix).reduce((s, v) => s + (Number(v) || 0), 0)

    await supabase.from("products").update({
      stock_matrix: matrix,
      stock_quantity: totalQty > 0 ? totalQty : null,
      low_stock_alert: lowAlert,
      in_stock: totalQty > 0 || Object.keys(matrix).length === 0,
    }).eq("id", productId)

    setSaving(null)
    setSaved(productId)
    setTimeout(() => setSaved(null), 2000)
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  // Summary
  const totalUnits = Object.values(matrices).reduce((s, m) => s + Object.values(m).reduce((s2, v) => s2 + (Number(v) || 0), 0), 0)
  const totalSoldAll = Object.values(soldData).reduce((s, m) => s + Object.values(m).reduce((s2, v) => s2 + (Number(v) || 0), 0), 0)

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>Loading stock data...</div>

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Stock Management</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.25rem" }}>Set your initial stock per size & color. Sold quantities are calculated from confirmed orders automatically.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.82rem", backgroundColor: "white", border: "1px solid #e0e0e0", padding: "0.75rem 1.25rem" }}>
            <span>Total Stock: <strong style={{ color: "#0369a1" }}>{totalUnits}</strong></span>
            <span>Total Sold: <strong style={{ color: "#16a34a" }}>{totalSoldAll}</strong></span>
            <span>Remaining: <strong>{totalUnits - totalSoldAll}</strong></span>
          </div>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search products..."
        style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 1rem", fontSize: "0.875rem", outline: "none", marginBottom: "1.25rem", boxSizing: "border-box" as const }}
      />



      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", border: "1px dashed #e0e0e0", color: "#999" }}>No products found.</div>
      )}

      {filtered.map(product => (
        <div key={product.id} style={{ border: "1px solid #e0e0e0", marginBottom: "1.5rem", backgroundColor: "white" }}>
          {/* Product header */}
          <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ width: "48px", height: "48px", backgroundColor: "#f5f5f5", flexShrink: 0, overflow: "hidden" }}>
              {product.images?.[0] && <img src={product.images[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, fontSize: "0.95rem" }}>{product.name}</p>
              <p style={{ fontSize: "0.72rem", color: "#999" }}>{product.category} · {(product.sizes || []).join(", ")} · {(product.colors || []).join(", ")}</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              {(() => {
                const m = matrices[product.id] || {}
                const sold = soldData[product.id] || {}
                const total = Object.values(m).reduce((s, v) => s + (Number(v) || 0), 0)
                const soldTotal = Object.values(sold).reduce((s, v) => s + (Number(v) || 0), 0)
                const remaining = total - soldTotal
                const hasLow = Object.keys(m).some(k => {
                  const rem = (m[k] || 0) - (sold[k] || 0)
                  return rem >= 0 && rem <= (alerts[product.id] || 5) && m[k] > 0
                })
                return (
                  <>
                    {total === 0 && <span style={{ fontSize: "0.72rem", color: "#999", fontStyle: "italic" }}>No stock set</span>}
                    {total > 0 && remaining <= 0 && <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#dc2626", backgroundColor: "#fee2e2", padding: "0.2rem 0.6rem" }}>OUT OF STOCK</span>}
                    {total > 0 && remaining > 0 && hasLow && <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#d97706", backgroundColor: "#fffbeb", padding: "0.2rem 0.6rem" }}>⚠️ LOW STOCK</span>}
                    {total > 0 && remaining > 0 && !hasLow && <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a", backgroundColor: "#f0fdf4", padding: "0.2rem 0.6rem" }}>✓ IN STOCK</span>}
                  </>
                )
              })()}
            </div>
          </div>

          <StockTable
            product={product}
            soldMatrix={soldData[product.id] || {}}
            matrix={matrices[product.id] || {}}
            lowAlert={alerts[product.id] || 5}
            onMatrixChange={m => setMatrices(prev => ({ ...prev, [product.id]: m }))}
            onAlertChange={n => setAlerts(prev => ({ ...prev, [product.id]: n }))}
            onSave={() => saveProduct(product.id)}
            saving={saving === product.id}
            saved={saved === product.id}
          />
        </div>
      ))}
    </div>
  )
}
