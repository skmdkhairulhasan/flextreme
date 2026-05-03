"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/components/ui/Cart"

type DeliveryZone = { id: string; name: string; charge: string; days: string }
type DeliveryGroup = { id: string; name: string; zones: DeliveryZone[] }

type OrderFormProps = {
  product: {
    id: string
    name: string
    price: number
    images?: string[]
    slug?: string
    sizes?: string[]
    colors?: string[]
    stock_matrix?: Record<string, number> | null
    in_stock?: boolean
  }
}

// ── Colour name → CSS color ───────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  black: "#111111", white: "#ffffff", red: "#ef4444", blue: "#3b82f6",
  navy: "#1e3a5f", green: "#22c55e", gray: "#9ca3af", grey: "#9ca3af",
  pink: "#ec4899", yellow: "#eab308", purple: "#a855f7", orange: "#f97316",
  brown: "#92400e", beige: "#d4b483", olive: "#6b7c34", maroon: "#7f1d1d",
  teal: "#14b8a6", cyan: "#06b6d4", magenta: "#e879f9", lime: "#84cc16",
  coral: "#f87171", indigo: "#6366f1", violet: "#8b5cf6", gold: "#f59e0b",
  silver: "#d1d5db", cream: "#fef9c3", charcoal: "#374151", khaki: "#c4b17a",
  "royal blue": "#2563eb", "sky blue": "#38bdf8", "light blue": "#93c5fd",
  "dark blue": "#1e40af", "light gray": "#e5e7eb", "dark gray": "#374151",
  "off white": "#fafafa", "hot pink": "#ec4899",
}

function getCssColor(name: string): string | null {
  const lower = name.toLowerCase().trim()
  if (/^#[0-9a-f]{3,6}$/i.test(lower)) return lower
  return COLOR_MAP[lower] || null
}

function needsDarkBorder(css: string): boolean {
  // white/cream/beige/very light colors need a visible border
  return ["#ffffff", "#fafafa", "#fef9c3", "#d4b483", "#e5e7eb", "#d1d5db", "#c4b17a"].includes(css.toLowerCase())
}

export default function OrderForm({ product }: OrderFormProps) {
  const router = useRouter()
  const { addItem } = useCart()

  const [deliveryOptions, setDeliveryOptions] = useState<{ name: string; price: number }[]>([])
  const [freeDelivery, setFreeDelivery] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState("")

  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [isFlex100, setIsFlex100] = useState(false)
  const [flex100Name, setFlex100Name] = useState("")
  const [flex100Checked, setFlex100Checked] = useState(false)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => { loadDelivery() }, [])

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

  // ── Stock helpers ─────────────────────────────────────────────────────────
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

  // Current combo stock status
  const currentStock = (selectedSize && selectedColor) ? getStock(selectedSize, selectedColor) : null
  const comboOOS = currentStock !== null && currentStock <= 0
  const comboLow = currentStock !== null && currentStock > 0 && currentStock <= 5
  const comboGood = currentStock !== null && currentStock > 5

  // Stock badge for the selected combo
  function StockBadge() {
    if (!selectedSize || !selectedColor) return null
    if (comboOOS) return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.875rem", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", fontSize: "0.82rem", fontWeight: 700, color: "#dc2626" }}>
        ⚠️ Out of stock in this size/color
      </div>
    )
    if (comboLow) return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.875rem", backgroundColor: "#fef9c3", border: "1px solid #fcd34d", fontSize: "0.82rem", fontWeight: 700, color: "#854d0e" }}>
        ⚡ Only {currentStock} left!
      </div>
    )
    if (comboGood) return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.875rem", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "0.82rem", fontWeight: 700, color: "#16a34a" }}>
        ✓ {currentStock} in stock
      </div>
    )
    return null
  }

  const deliveryFee = freeDelivery ? 0 : (deliveryOptions.find(o => o.name === selectedDelivery)?.price || 0)
  const subtotal = product.price * quantity
  const rawTotal = subtotal + deliveryFee
  const discountAmount = isFlex100 ? Math.round(rawTotal * 0.1) : 0
  const total = rawTotal - discountAmount

  async function checkFlex100(ph: string) {
    if (!ph.trim()) return
    try {
      const res = await fetch(`/api/customer-check?phone=${encodeURIComponent(ph.trim())}`)
      const data = await res.json()
      const isF = data?.flex100 === true || data?.customer?.flex100 === 1 || data?.customer?.flex100 === true
      setIsFlex100(isF)
      setFlex100Checked(true)
      if (data?.customer?.name) setFlex100Name(data.customer.name)
    } catch {
      setFlex100Checked(true)
    }
  }

  function validateSelections(): string {
    if (product.sizes?.length && !selectedSize) return "Please select a size"
    if (product.colors?.length && !selectedColor) return "Please select a color"
    if (comboOOS) return `"${selectedSize} / ${selectedColor}" is out of stock`
    return ""
  }

  function handleAddToCart() {
    const err = validateSelections()
    if (err) { setError(err); return }
    setError("")
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: selectedColor,
      quantity,
      image: product.images?.[0] || "",
      slug: product.slug || "",
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2500)
  }

  async function handlePlaceOrder() {
    const selErr = validateSelections()
    if (selErr) { setError(selErr); return }
    if (!selectedDelivery) { setError("Please select a delivery option"); return }
    if (!name.trim()) { setError("Please enter your name"); return }
    if (!phone.trim()) { setError("Please enter your phone number"); return }
    if (!address.trim()) { setError("Please enter your delivery address"); return }

    setError("")
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

  // ── Size button ───────────────────────────────────────────────────────────
  function SizeBtn({ size }: { size: string }) {
    const active = selectedSize === size
    const oos = isSizeOOS(size)
    return (
      <button
        onClick={() => { if (!oos) { setSelectedSize(active ? "" : size); setError("") } }}
        disabled={oos}
        title={oos ? "Out of stock" : size}
        style={{
          padding: "0.5rem 1rem", minWidth: "3rem",
          border: active ? "2px solid black" : "1px solid #d0d0d0",
          backgroundColor: active ? "black" : oos ? "#f5f5f5" : "white",
          color: active ? "white" : oos ? "#ccc" : "black",
          fontWeight: 700, fontSize: "0.85rem",
          cursor: oos ? "not-allowed" : "pointer",
          textDecoration: oos ? "line-through" : "none",
          transition: "all 0.12s", position: "relative",
        }}
      >
        {size}
        {/* Diagonal slash for OOS */}
        {oos && (
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span style={{ position: "absolute", top: "50%", left: "10%", right: "10%", height: "1px", backgroundColor: "#ccc", transform: "rotate(-25deg)" }} />
          </span>
        )}
      </button>
    )
  }

  // ── Color button — large swatch circle + name ─────────────────────────────
  function ColorBtn({ color }: { color: string }) {
    const active = selectedColor === color
    const oos = isColorOOS(color)
    const css = getCssColor(color)
    const hasSwatch = css !== null
    const darkBorder = hasSwatch && needsDarkBorder(css!)
    const isLight = hasSwatch && (css === "#ffffff" || css === "#fafafa")

    return (
      <button
        onClick={() => { setSelectedColor(active ? "" : color); setError("") }}
        title={oos ? `Out of stock in ${selectedSize || "this size"}` : color}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
          padding: "0.6rem 0.5rem", minWidth: "56px", maxWidth: "72px",
          border: active ? "2px solid black" : "1px solid transparent",
          backgroundColor: "transparent",
          cursor: "pointer", opacity: oos ? 0.4 : 1,
          transition: "all 0.12s", position: "relative",
        }}
      >
        {/* Swatch circle */}
        <span style={{
          width: "36px", height: "36px", borderRadius: "50%",
          backgroundColor: hasSwatch ? css! : "transparent",
          border: active
            ? "3px solid black"
            : darkBorder
              ? "2px solid #ccc"
              : "2px solid rgba(0,0,0,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: active ? "0 0 0 2px white inset" : "none",
          position: "relative", flexShrink: 0,
          // Fallback background with color name if no CSS color found
          ...(!hasSwatch ? { background: "linear-gradient(135deg, #f0f0f0 50%, #ddd 50%)" } : {}),
        }}>
          {/* OOS diagonal line through circle */}
          {oos && (
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ position: "absolute", width: "140%", height: "1.5px", backgroundColor: isLight ? "#999" : "rgba(255,255,255,0.7)", transform: "rotate(-45deg)" }} />
            </span>
          )}
          {/* Checkmark for active */}
          {active && !oos && (
            <span style={{ color: isLight ? "black" : "white", fontSize: "0.8rem", fontWeight: 900, lineHeight: 1 }}>✓</span>
          )}
        </span>

        {/* Color name label */}
        <span style={{
          fontSize: "0.65rem", fontWeight: active ? 700 : 500,
          color: active ? "black" : "#666",
          textTransform: "uppercase", letterSpacing: "0.04em",
          textAlign: "center", lineHeight: 1.2, maxWidth: "64px",
          wordBreak: "break-word",
        }}>
          {color}
        </span>
      </button>
    )
  }

  return (
    <div style={{ border: "1px solid #e0e0e0", backgroundColor: "white" }}>

      {/* ── Selections ── */}
      <div style={{ padding: "1.5rem", borderBottom: "1px solid #e0e0e0" }}>

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
                Size{selectedSize && <span style={{ color: "black", textTransform: "none", letterSpacing: 0, marginLeft: "0.4rem" }}>— {selectedSize}</span>}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {product.sizes.map(s => <SizeBtn key={s} size={s} />)}
              </div>
            </div>
          )}

          {/* Colors — swatch style */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <label style={label}>
                Color{selectedColor && <span style={{ color: "black", textTransform: "none", letterSpacing: 0, marginLeft: "0.4rem" }}>— {selectedColor}</span>}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginLeft: "-0.25rem" }}>
                {product.colors.map(c => <ColorBtn key={c} color={c} />)}
              </div>
            </div>
          )}

          {/* Per-combo stock badge */}
          <StockBadge />

          {/* Delivery */}
          <div>
            <label style={label}>{freeDelivery ? "Delivery" : "Delivery Area"}</label>
            <select value={selectedDelivery} onChange={e => { setSelectedDelivery(e.target.value); setError("") }}
              style={{ ...input, cursor: "pointer" }}>
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
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{ padding: "0.7rem 1.25rem", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0", cursor: "pointer", fontWeight: 700, fontSize: "1.1rem" }}>−</button>
              <input type="number" value={quantity} min="1"
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ flex: 1, textAlign: "center", padding: "0.7rem", border: "1px solid #e0e0e0", fontSize: "1rem", fontWeight: 700, outline: "none" }} />
              <button onClick={() => setQuantity(q => q + 1)}
                style={{ padding: "0.7rem 1.25rem", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0", cursor: "pointer", fontWeight: 700, fontSize: "1.1rem" }}>+</button>
            </div>
          </div>

          {/* Price summary */}
          <div style={{ paddingTop: "0.875rem", borderTop: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.9rem", color: "#555" }}>
              <span>Product ({quantity}×)</span><span>BDT {subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.9rem", color: "#555" }}>
              <span>Delivery</span>
              <span>{freeDelivery ? <strong style={{ color: "#16a34a" }}>FREE</strong> : selectedDelivery ? `BDT ${deliveryFee.toLocaleString()}` : "—"}</span>
            </div>
            {isFlex100 && discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.9rem", color: "#16a34a", fontWeight: 700 }}>
                <span>🥇 FLEX100 Discount (10%)</span><span>-BDT {discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.75rem", borderTop: "2px solid black", fontSize: "1.2rem", fontWeight: 900 }}>
              <span>Total</span><span>BDT {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={comboOOS}
            style={{
              width: "100%", padding: "0.875rem",
              backgroundColor: addedToCart ? "#16a34a" : comboOOS ? "#e0e0e0" : "white",
              color: addedToCart ? "white" : comboOOS ? "#999" : "black",
              border: comboOOS ? "1px solid #e0e0e0" : "2px solid black",
              fontSize: "0.9rem", fontWeight: 700,
              cursor: comboOOS ? "not-allowed" : "pointer",
              textTransform: "uppercase", letterSpacing: "0.08em",
              transition: "all 0.2s",
            }}
          >
            {addedToCart ? "✓ Added to Cart!" : comboOOS ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* ── Direct COD order ── */}
      <div style={{ padding: "1.5rem" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", marginBottom: "1.25rem" }}>
          Or Place Order Directly
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={label}>Full Name *</label>
            <input value={name} onChange={e => { setName(e.target.value); setError("") }} placeholder="Your name" style={input} />
          </div>
          <div>
            <label style={label}>Phone Number *</label>
            <input value={phone} onChange={e => { setPhone(e.target.value); setError(""); setFlex100Checked(false); setIsFlex100(false) }} onBlur={e => checkFlex100(e.target.value)} placeholder="01XXXXXXXXX" type="tel" style={input} />
          </div>
          {flex100Checked && isFlex100 && (
            <div style={{ padding: "0.75rem 1rem", backgroundColor: "#fef9c3", border: "1px solid #fcd34d", borderLeft: "4px solid #f59e0b" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#854d0e" }}>
                🎉 Welcome back{flex100Name ? ", " + flex100Name : ""}! FLEX100 member — <span style={{ color: "#16a34a" }}>10% lifetime discount applied ✓</span>
              </p>
            </div>
          )}

          <div>
            <label style={label}>Delivery Address *</label>
            <textarea value={address} onChange={e => { setAddress(e.target.value); setError("") }}
              placeholder="House, Road, Area, District" rows={3}
              style={{ ...input, resize: "vertical" }} />
          </div>
          <div>
            <label style={label}>Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions..." style={input} />
          </div>
        </div>

        {error && (
          <div style={{ margin: "1rem 0 0", padding: "0.65rem 0.875rem", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", fontSize: "0.85rem", fontWeight: 600, color: "#dc2626" }}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={loading || comboOOS}
          style={{
            width: "100%", marginTop: "1.25rem", padding: "1rem",
            backgroundColor: (loading || comboOOS) ? "#888" : "black",
            color: "white", border: "none",
            fontSize: "0.95rem", fontWeight: 700,
            cursor: (loading || comboOOS) ? "not-allowed" : "pointer",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}
        >
          {loading ? "Placing Order..." : comboOOS ? "Out of Stock" : `Place Order — BDT ${total.toLocaleString()}`}
        </button>

        <p style={{ fontSize: "0.72rem", color: "#999", textAlign: "center", marginTop: "0.75rem" }}>
          💵 Cash on Delivery · Pay when it arrives
        </p>
      </div>
    </div>
  )
}
