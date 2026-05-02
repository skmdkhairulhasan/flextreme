"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type DeliveryZone = { id: string; name: string; charge: string; days: string }
type DeliveryGroup = { id: string; name: string; zones: DeliveryZone[] }

type OrderFormProps = {
  product: {
    id: string
    name: string
    price: number
    sizes?: string[]
    colors?: string[]
    stock_matrix?: Record<string, number> | null
    in_stock?: boolean
  }
}

export default function OrderForm({ product }: OrderFormProps) {
  const router = useRouter()

  // Delivery
  const [deliveryOptions, setDeliveryOptions] = useState<{ name: string; price: number }[]>([])
  const [freeDelivery, setFreeDelivery] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState("")

  // Selections
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)

  // Customer info
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")

  // UI state
  const [stockWarning, setStockWarning] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadDelivery() }, [])

  useEffect(() => {
    if (!selectedSize || !selectedColor || !product.stock_matrix) { setStockWarning(""); return }
    const key = `${selectedSize.trim()}_${selectedColor.trim()}`
    const matrix = product.stock_matrix as Record<string, number>
    const mk = Object.keys(matrix).find(k => k.toLowerCase() === key.toLowerCase())
    const rem = mk !== undefined ? matrix[mk] : undefined
    if (rem !== undefined && rem <= 0) {
      setStockWarning(`⚠️ "${selectedSize} / ${selectedColor}" is out of stock.`)
    } else if (rem !== undefined && rem <= 3) {
      setStockWarning(`⚡ Only ${rem} left in ${selectedSize} / ${selectedColor}!`)
    } else {
      setStockWarning("")
    }
  }, [selectedSize, selectedColor, product.stock_matrix])

  async function loadDelivery() {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      if (!data.settings || !Array.isArray(data.settings)) return
      const map: Record<string, string> = {}
      data.settings.forEach((s: any) => { if (s.key) map[s.key] = s.value })
      const isFree = map.free_delivery === "true" || map.free_delivery === "1"
      setFreeDelivery(isFree)
      if (isFree) {
        setDeliveryOptions([{ name: "Free Delivery", price: 0 }])
        setSelectedDelivery("Free Delivery")
      } else if (map.delivery_groups) {
        try {
          const groups: DeliveryGroup[] = JSON.parse(map.delivery_groups)
          const opts: { name: string; price: number }[] = []
          groups.forEach(g => g.zones.forEach(z => {
            opts.push({ name: `${g.name} - ${z.name}`, price: parseFloat(z.charge) || 0 })
          }))
          setDeliveryOptions(opts)
        } catch {}
      }
    } catch {}
  }

  // Stock helpers
  function getStock(size: string, color: string): number | null {
    if (!product.stock_matrix) return null
    const key = `${size.trim()}_${color.trim()}`
    const matrix = product.stock_matrix as Record<string, number>
    const mk = Object.keys(matrix).find(k => k.toLowerCase() === key.toLowerCase())
    return mk !== undefined ? matrix[mk] : null
  }

  function isSizeOOS(size: string): boolean {
    if (!product.stock_matrix || !product.colors?.length) return false
    return product.colors.every(c => { const s = getStock(size, c); return s !== null && s <= 0 })
  }

  function isColorOOS(color: string): boolean {
    if (!selectedSize || !product.stock_matrix) return false
    const s = getStock(selectedSize, color)
    return s !== null && s <= 0
  }

  const comboOOS = !!(selectedSize && selectedColor && product.stock_matrix &&
    (getStock(selectedSize, selectedColor) ?? 1) <= 0)

  const deliveryFee = freeDelivery ? 0 : (deliveryOptions.find(o => o.name === selectedDelivery)?.price || 0)
  const subtotal = product.price * quantity
  const total = subtotal + deliveryFee

  async function handleSubmit() {
    setError("")
    if (product.sizes?.length && !selectedSize) { setError("Please select a size"); return }
    if (product.colors?.length && !selectedColor) { setError("Please select a color"); return }
    if (comboOOS) { setError(`"${selectedSize} / ${selectedColor}" is out of stock`); return }
    if (!selectedDelivery) { setError("Please select a delivery option"); return }
    if (!name.trim()) { setError("Please enter your name"); return }
    if (!phone.trim()) { setError("Please enter your phone number"); return }
    if (!address.trim()) { setError("Please enter your delivery address"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim(),
          product_id: product.id,
          product_name: product.name,
          size: selectedSize,
          color: selectedColor,
          quantity,
          total_price: total,
          status: "pending",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Order failed")
      router.push(`/order-success?id=${data.order.id}`)
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  // ── Styles ──
  const label: React.CSSProperties = {
    display: "block", fontSize: "0.7rem", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.08em",
    color: "#999", marginBottom: "0.6rem",
  }
  const input: React.CSSProperties = {
    width: "100%", padding: "0.75rem", border: "1px solid #e0e0e0",
    fontSize: "0.95rem", backgroundColor: "white",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  }

  function SizeBtn({ size }: { size: string }) {
    const active = selectedSize === size
    const oos = isSizeOOS(size)
    return (
      <button
        onClick={() => { if (!oos) { setSelectedSize(active ? "" : size); setError("") } }}
        disabled={oos}
        title={oos ? "Out of stock" : size}
        style={{
          padding: "0.45rem 0.9rem", minWidth: "2.75rem",
          border: active ? "2px solid black" : "1px solid #e0e0e0",
          backgroundColor: active ? "black" : oos ? "#f5f5f5" : "white",
          color: active ? "white" : oos ? "#ccc" : "black",
          fontWeight: 700, fontSize: "0.82rem",
          cursor: oos ? "not-allowed" : "pointer",
          textDecoration: oos ? "line-through" : "none",
          transition: "all 0.12s",
        }}
      >{size}</button>
    )
  }

  function ColorBtn({ color }: { color: string }) {
    const active = selectedColor === color
    const oos = isColorOOS(color)
    const looksLikeColor = /^#[0-9a-f]{3,6}$/i.test(color) ||
      /^(black|white|red|blue|green|gray|grey|navy|pink|yellow|purple|orange|brown|beige|olive|maroon|teal|cyan|magenta|lime|coral|indigo|violet|gold|silver|cream|charcoal|khaki)$/i.test(color)
    return (
      <button
        onClick={() => { setSelectedColor(active ? "" : color); setError("") }}
        title={oos ? `Out of stock in ${selectedSize}` : color}
        style={{
          padding: "0.45rem 0.9rem", minWidth: "2.75rem", position: "relative",
          border: active ? "2px solid black" : "1px solid #e0e0e0",
          backgroundColor: active ? "black" : "white",
          color: active ? "white" : oos ? "#ccc" : "black",
          fontWeight: 600, fontSize: "0.82rem",
          cursor: "pointer", opacity: oos ? 0.45 : 1,
          transition: "all 0.12s",
        }}
      >
        {looksLikeColor && (
          <span style={{
            display: "inline-block", width: "9px", height: "9px",
            borderRadius: "50%", backgroundColor: color,
            border: "1px solid rgba(0,0,0,0.15)",
            marginRight: "5px", verticalAlign: "middle",
          }} />
        )}
        {color}
        {oos && (
          <span style={{
            position: "absolute", top: "50%", left: "6%", right: "6%",
            height: "1px", backgroundColor: "#bbb", transform: "translateY(-50%)",
          }} />
        )}
      </button>
    )
  }

  return (
    <div style={{ border: "1px solid #e0e0e0", backgroundColor: "white" }}>

      {/* ── Top: Variant + Delivery + Qty ── */}
      <div style={{ padding: "1.75rem", borderBottom: "1px solid #e0e0e0" }}>

        {freeDelivery && (
          <div style={{ backgroundColor: "#dcfce7", border: "1px solid #16a34a", padding: "0.6rem 1rem", marginBottom: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#16a34a" }}>🚚 FREE DELIVERY</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <label style={label}>
                Size
                {selectedSize && <span style={{ color: "black", textTransform: "none", letterSpacing: 0, marginLeft: "0.4rem" }}>— {selectedSize}</span>}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {product.sizes.map(s => <SizeBtn key={s} size={s} />)}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <label style={label}>
                Color
                {selectedColor && <span style={{ color: "black", textTransform: "none", letterSpacing: 0, marginLeft: "0.4rem" }}>— {selectedColor}</span>}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {product.colors.map(c => <ColorBtn key={c} color={c} />)}
              </div>
            </div>
          )}

          {/* Stock warning */}
          {stockWarning && (
            <div style={{
              padding: "0.5rem 0.875rem", fontSize: "0.82rem", fontWeight: 600,
              backgroundColor: comboOOS ? "#fee2e2" : "#fef9c3",
              border: `1px solid ${comboOOS ? "#fca5a5" : "#fcd34d"}`,
              color: comboOOS ? "#dc2626" : "#854d0e",
            }}>
              {stockWarning}
            </div>
          )}

          {/* Delivery */}
          <div>
            <label style={label}>{freeDelivery ? "Delivery" : "Delivery Area"}</label>
            <select
              value={selectedDelivery}
              onChange={e => { setSelectedDelivery(e.target.value); setError("") }}
              style={{ ...input, cursor: "pointer" }}
            >
              <option value="">Select delivery option</option>
              {deliveryOptions.map(o => (
                <option key={o.name} value={o.name}>
                  {freeDelivery ? o.name : `${o.name} — BDT ${o.price}`}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label style={label}>Quantity</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{ padding: "0.7rem 1.25rem", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0", cursor: "pointer", fontWeight: 700, fontSize: "1.1rem" }}
              >−</button>
              <input
                type="number" value={quantity} min="1"
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ flex: 1, textAlign: "center", padding: "0.7rem", border: "1px solid #e0e0e0", fontSize: "1rem", fontWeight: 700, outline: "none" }}
              />
              <button
                onClick={() => setQuantity(q => q + 1)}
                style={{ padding: "0.7rem 1.25rem", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0", cursor: "pointer", fontWeight: 700, fontSize: "1.1rem" }}
              >+</button>
            </div>
          </div>

          {/* Price summary */}
          <div style={{ paddingTop: "0.875rem", borderTop: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.9rem", color: "#555" }}>
              <span>Product ({quantity}×)</span>
              <span>BDT {subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.9rem", color: "#555" }}>
              <span>Delivery</span>
              <span>
                {freeDelivery
                  ? <strong style={{ color: "#16a34a" }}>FREE</strong>
                  : selectedDelivery ? `BDT ${deliveryFee.toLocaleString()}` : "—"
                }
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.75rem", borderTop: "2px solid black", fontSize: "1.2rem", fontWeight: 900 }}>
              <span>Total</span>
              <span>BDT {total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom: Customer details ── */}
      <div style={{ padding: "1.75rem" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", marginBottom: "1.25rem" }}>
          Delivery Details
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={label}>Full Name *</label>
            <input
              value={name} onChange={e => { setName(e.target.value); setError("") }}
              placeholder="Your name" style={input}
            />
          </div>

          <div>
            <label style={label}>Phone Number *</label>
            <input
              value={phone} onChange={e => { setPhone(e.target.value); setError("") }}
              placeholder="01XXXXXXXXX" type="tel" style={input}
            />
          </div>

          <div>
            <label style={label}>Delivery Address *</label>
            <textarea
              value={address} onChange={e => { setAddress(e.target.value); setError("") }}
              placeholder="Full address — house, road, area, district"
              rows={3}
              style={{ ...input, resize: "vertical" }}
            />
          </div>

          <div>
            <label style={label}>Order Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <input
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Special instructions, colour preference, etc."
              style={input}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            margin: "1rem 0 0", padding: "0.65rem 0.875rem",
            backgroundColor: "#fee2e2", border: "1px solid #fca5a5",
            fontSize: "0.85rem", fontWeight: 600, color: "#dc2626",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Place Order */}
        <button
          onClick={handleSubmit}
          disabled={loading || comboOOS}
          style={{
            width: "100%", marginTop: "1.25rem", padding: "1rem",
            backgroundColor: (loading || comboOOS) ? "#888" : "black",
            color: "white", border: "none",
            fontSize: "0.95rem", fontWeight: 700,
            cursor: (loading || comboOOS) ? "not-allowed" : "pointer",
            textTransform: "uppercase", letterSpacing: "0.08em",
            transition: "background-color 0.15s",
          }}
        >
          {loading ? "Placing Order..." : comboOOS ? "Out of Stock" : `Place Order — BDT ${total.toLocaleString()}`}
        </button>

        <p style={{ fontSize: "0.72rem", color: "#999", textAlign: "center", marginTop: "0.75rem" }}>
          💵 Cash on Delivery · Pay when it arrives at your door
        </p>
      </div>
    </div>
  )
}
