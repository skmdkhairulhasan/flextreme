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
  const [deliveryOptions, setDeliveryOptions] = useState<{ name: string; price: number }[]>([])
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(false)

  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedDelivery, setSelectedDelivery] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [stockWarning, setStockWarning] = useState("")

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => { loadDeliverySettings() }, [])

  useEffect(() => {
    if (selectedSize && selectedColor && product.stock_matrix) {
      const key = `${selectedSize.trim()}_${selectedColor.trim()}`
      const matrix = product.stock_matrix as Record<string, number>
      const matchedKey = Object.keys(matrix).find(k => k.toLowerCase() === key.toLowerCase())
      const remaining = matchedKey !== undefined ? matrix[matchedKey] : undefined
      if (remaining !== undefined && remaining <= 0) {
        setStockWarning(`⚠️ "${selectedSize} / ${selectedColor}" is out of stock.`)
      } else if (remaining !== undefined && remaining <= 3) {
        setStockWarning(`⚡ Only ${remaining} left in ${selectedSize} / ${selectedColor}!`)
      } else {
        setStockWarning("")
      }
    } else {
      setStockWarning("")
    }
  }, [selectedSize, selectedColor, product.stock_matrix])

  async function loadDeliverySettings() {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      if (data.settings && Array.isArray(data.settings)) {
        const map: Record<string, string> = {}
        data.settings.forEach((s: any) => { if (s.key) map[s.key] = s.value })
        const freeDelivery = map.free_delivery === "true" || map.free_delivery === "1"
        setFreeDeliveryEnabled(freeDelivery)
        if (freeDelivery) {
          setDeliveryOptions([{ name: "Free Delivery", price: 0 }])
          setSelectedDelivery("Free Delivery")
        } else if (map.delivery_groups) {
          try {
            const groups: DeliveryGroup[] = JSON.parse(map.delivery_groups)
            const options: { name: string; price: number }[] = []
            groups.forEach(group => {
              group.zones.forEach(zone => {
                options.push({ name: `${group.name} - ${zone.name}`, price: parseFloat(zone.charge) || 0 })
              })
            })
            setDeliveryOptions(options)
          } catch (e) { console.error("Failed to parse delivery groups:", e) }
        }
      }
    } catch (e) { console.error("Failed to load settings:", e) }
  }

  function getStock(size: string, color: string): number | null {
    if (!product.stock_matrix) return null
    const key = `${size.trim()}_${color.trim()}`
    const matrix = product.stock_matrix as Record<string, number>
    const matchedKey = Object.keys(matrix).find(k => k.toLowerCase() === key.toLowerCase())
    return matchedKey !== undefined ? matrix[matchedKey] : null
  }

  function isSizeUnavailable(size: string): boolean {
    if (!product.stock_matrix || !product.colors || product.colors.length === 0) return false
    return product.colors.every(color => { const s = getStock(size, color); return s !== null && s <= 0 })
  }

  function isColorUnavailableForSize(color: string): boolean {
    if (!selectedSize || !product.stock_matrix) return false
    const stock = getStock(selectedSize, color)
    return stock !== null && stock <= 0
  }

  const selectedOption = deliveryOptions.find(o => o.name === selectedDelivery)
  const deliveryFee = freeDeliveryEnabled ? 0 : (selectedOption?.price || 0)
  const subtotal = product.price * quantity
  const total = subtotal + deliveryFee

  const currentComboOutOfStock =
    selectedSize && selectedColor && product.stock_matrix
      ? (getStock(selectedSize, selectedColor) ?? 1) <= 0
      : false

  function validateSelection(): string {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) return "Please select a size"
    if (product.colors && product.colors.length > 0 && !selectedColor) return "Please select a color"
    if (currentComboOutOfStock) return `"${selectedSize} / ${selectedColor}" is out of stock`
    if (!selectedDelivery) return "Please select a delivery option"
    return ""
  }

  function handleBuyNowClick() {
    const err = validateSelection()
    if (err) { setError(err); return }
    setError("")
    setShowOrderForm(true)
    setTimeout(() => {
      document.getElementById("order-details-form")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  async function handleSubmitOrder() {
    if (!name.trim()) { setError("Please enter your name"); return }
    if (!phone.trim()) { setError("Please enter your phone number"); return }
    if (!address.trim()) { setError("Please enter your delivery address"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          phone,
          address,
          notes,
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

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.7rem", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.05em", color: "#999", marginBottom: "0.75rem",
  }
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.75rem", border: "1px solid #e0e0e0",
    fontSize: "0.95rem", backgroundColor: "white", outline: "none", boxSizing: "border-box",
  }

  function SizeButton({ size }: { size: string }) {
    const isSelected = selectedSize === size
    const isUnavailable = isSizeUnavailable(size)
    return (
      <button
        onClick={() => { if (!isUnavailable) { setSelectedSize(isSelected ? "" : size); setError("") } }}
        title={isUnavailable ? "Out of stock in all colors" : size}
        style={{
          padding: "0.5rem 1rem", minWidth: "3rem",
          border: isSelected ? "2px solid black" : "1px solid #e0e0e0",
          backgroundColor: isSelected ? "black" : isUnavailable ? "#f5f5f5" : "white",
          color: isSelected ? "white" : isUnavailable ? "#bbb" : "black",
          fontWeight: 700, fontSize: "0.85rem",
          cursor: isUnavailable ? "not-allowed" : "pointer",
          textDecoration: isUnavailable ? "line-through" : "none",
          transition: "all 0.15s",
        }}
      >{size}</button>
    )
  }

  function ColorButton({ color }: { color: string }) {
    const isSelected = selectedColor === color
    const isUnavailableForSize = isColorUnavailableForSize(color)
    const looksLikeColor = /^#[0-9a-f]{3,6}$/i.test(color) ||
      /^(black|white|red|blue|green|gray|grey|navy|pink|yellow|purple|orange|brown|beige|olive|maroon|teal|cyan|magenta|lime|coral|indigo|violet|gold|silver|cream|charcoal|khaki)$/i.test(color)
    return (
      <button
        onClick={() => { setSelectedColor(isSelected ? "" : color); setError("") }}
        title={isUnavailableForSize ? "Out of stock in this size" : color}
        style={{
          padding: "0.5rem 1rem", minWidth: "3rem", position: "relative",
          border: isSelected ? "2px solid black" : "1px solid #e0e0e0",
          backgroundColor: isSelected ? "black" : "white",
          color: isSelected ? "white" : isUnavailableForSize ? "#bbb" : "black",
          fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
          transition: "all 0.15s", opacity: isUnavailableForSize ? 0.5 : 1,
        }}
      >
        {looksLikeColor && (
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color, border: "1px solid #ccc", marginRight: "6px", verticalAlign: "middle" }} />
        )}
        {color}
        {isUnavailableForSize && (
          <span style={{ position: "absolute", top: "50%", left: "8%", right: "8%", height: "1px", backgroundColor: "#bbb", transform: "translateY(-50%)" }} />
        )}
      </button>
    )
  }

  return (
    <div style={{ border: "1px solid #e0e0e0", backgroundColor: "white" }}>
      {/* Selection panel */}
      <div style={{ padding: "2rem" }}>
        {freeDeliveryEnabled && (
          <div style={{ backgroundColor: "#dcfce7", border: "1px solid #16a34a", padding: "0.75rem", marginBottom: "1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#16a34a" }}>🚚 FREE DELIVERY</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <label style={labelStyle}>
                Size{selectedSize && <span style={{ color: "black", marginLeft: "0.5rem", textTransform: "none", letterSpacing: 0 }}>— {selectedSize}</span>}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {product.sizes.map(size => <SizeButton key={size} size={size} />)}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div>
              <label style={labelStyle}>
                Color{selectedColor && <span style={{ color: "black", marginLeft: "0.5rem", textTransform: "none", letterSpacing: 0 }}>— {selectedColor}</span>}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {product.colors.map(color => <ColorButton key={color} color={color} />)}
              </div>
            </div>
          )}

          {stockWarning && (
            <div style={{ padding: "0.6rem 0.875rem", backgroundColor: currentComboOutOfStock ? "#fee2e2" : "#fef9c3", border: `1px solid ${currentComboOutOfStock ? "#fca5a5" : "#fcd34d"}`, fontSize: "0.85rem", fontWeight: 600, color: currentComboOutOfStock ? "#dc2626" : "#854d0e" }}>
              {stockWarning}
            </div>
          )}

          <div>
            <label style={labelStyle}>{freeDeliveryEnabled ? "Delivery" : "Delivery Area"}</label>
            <select value={selectedDelivery} onChange={e => { setSelectedDelivery(e.target.value); setError("") }}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #e0e0e0", fontSize: "0.95rem", backgroundColor: "white", cursor: "pointer" }}>
              <option value="">Select delivery option</option>
              {deliveryOptions.map(option => (
                <option key={option.name} value={option.name}>
                  {freeDeliveryEnabled ? option.name : `${option.name} — BDT ${option.price}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Quantity</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ padding: "0.75rem 1.5rem", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0", cursor: "pointer", fontWeight: 700, fontSize: "1.25rem" }}>−</button>
              <input type="number" value={quantity} min="1"
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ flex: 1, textAlign: "center", padding: "0.75rem", border: "1px solid #e0e0e0", fontSize: "1rem", fontWeight: 700 }} />
              <button onClick={() => setQuantity(quantity + 1)}
                style={{ padding: "0.75rem 1.5rem", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0", cursor: "pointer", fontWeight: 700, fontSize: "1.25rem" }}>+</button>
            </div>
          </div>

          <div style={{ paddingTop: "1rem", borderTop: "1px solid #e0e0e0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.95rem" }}>
              <span>Product ({quantity}x)</span><span>BDT {subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.95rem" }}>
              <span>Delivery</span>
              <span>{freeDeliveryEnabled ? <strong style={{ color: "#16a34a" }}>FREE</strong> : selectedDelivery ? `BDT ${deliveryFee.toLocaleString()}` : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.75rem", borderTop: "2px solid black", fontSize: "1.25rem", fontWeight: 900 }}>
              <span>Total</span><span>BDT {total.toLocaleString()}</span>
            </div>
          </div>

          {error && !showOrderForm && (
            <div style={{ padding: "0.6rem 0.875rem", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", fontSize: "0.85rem", fontWeight: 600, color: "#dc2626" }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleBuyNowClick}
            disabled={currentComboOutOfStock}
            style={{
              width: "100%", padding: "1rem",
              backgroundColor: currentComboOutOfStock ? "#e0e0e0" : "black",
              color: currentComboOutOfStock ? "#999" : "white",
              border: "none", fontSize: "1rem", fontWeight: 700,
              cursor: currentComboOutOfStock ? "not-allowed" : "pointer",
              textTransform: "uppercase", letterSpacing: "0.05em",
            }}
          >
            {currentComboOutOfStock ? "Out of Stock" : `Buy Now — BDT ${total.toLocaleString()}`}
          </button>
        </div>
      </div>

      {/* Order details — appears after Buy Now clicked */}
      {showOrderForm && (
        <div id="order-details-form" style={{ borderTop: "2px solid black", padding: "2rem", backgroundColor: "#fafafa" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: "1.5rem" }}>
            Delivery Details
          </p>

          <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1rem", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ color: "#999" }}>Product</span><span style={{ fontWeight: 700 }}>{product.name}</span>
            </div>
            {selectedSize && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}><span style={{ color: "#999" }}>Size</span><span>{selectedSize}</span></div>}
            {selectedColor && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}><span style={{ color: "#999" }}>Color</span><span>{selectedColor}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}><span style={{ color: "#999" }}>Qty</span><span>{quantity}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem", borderTop: "1px solid #e0e0e0", fontWeight: 900 }}>
              <span>Total</span><span>BDT {total.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" type="tel" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Delivery Address *</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address including area, district" rows={3}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={labelStyle}>Order Notes (optional)</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." style={inputStyle} />
            </div>

            {error && (
              <div style={{ padding: "0.6rem 0.875rem", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", fontSize: "0.85rem", fontWeight: 600, color: "#dc2626" }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => { setShowOrderForm(false); setError("") }}
                style={{ flex: 1, padding: "0.875rem", backgroundColor: "white", color: "black", border: "1px solid #e0e0e0", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>
                ← Back
              </button>
              <button onClick={handleSubmitOrder} disabled={loading}
                style={{ flex: 2, padding: "0.875rem", backgroundColor: loading ? "#555" : "black", color: "white", border: "none", fontSize: "0.95rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {loading ? "Placing Order..." : `Confirm Order — BDT ${total.toLocaleString()}`}
              </button>
            </div>

            <p style={{ fontSize: "0.75rem", color: "#999", textAlign: "center" }}>
              💵 Cash on Delivery · Pay when it arrives
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
