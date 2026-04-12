"use client"
import { useState, useEffect } from "react"
import { Product } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { upsertCustomer } from "@/lib/upsertCustomer"
import { useCart } from "@/components/ui/Cart"
import { fbEvent } from "@/components/ui/FacebookPixel"

export default function OrderForm({ product }: { product: Product & { stock_matrix?: Record<string, number>, low_stock_alert?: number } }) {
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [cartAdded, setCartAdded] = useState(false)
  const [isFlex100, setIsFlex100] = useState(false)
  const [discountChecked, setDiscountChecked] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    fbEvent.viewContent({ content_name: product.name, content_ids: [product.id], value: product.price })
  }, [product.id])

  const basePrice = product.price * quantity
  const totalPrice = isFlex100 ? Math.round(basePrice * 0.9) : basePrice

  function getVariantStock(): number | null {
    const matrix = product.stock_matrix
    if (!matrix || !selectedSize || !selectedColor) return null
    const rawKey = selectedSize.trim() + "_" + selectedColor.trim()
    const matchedKey = Object.keys(matrix).find(
      k => k.toLowerCase() === rawKey.toLowerCase()
    ) || rawKey
    const v = matrix[matchedKey]
    return v !== undefined ? v : null
  }
  const variantStock = getVariantStock()
  const lowAlert = product.low_stock_alert || 5
  const isVariantOut = variantStock !== null && variantStock <= 0
  const isVariantLow = variantStock !== null && variantStock > 0 && variantStock <= lowAlert
  const maxQty = variantStock !== null ? Math.max(0, variantStock) : 999

  function handleAddToCart() {
    if (!selectedSize) { setError("Please select a size first"); return }
    if (!selectedColor) { setError("Please select a color first"); return }
    if (isVariantOut) { setError("This size/color is out of stock"); return }
    setError("")
    fbEvent.addToCart({
      content_name: product.name,
      content_ids: [product.id],
      value: product.price * quantity,
    })
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: (product.images || [])[0] || "",
      size: selectedSize,
      color: selectedColor,
      quantity,
      slug: product.slug,
    })
    setCartAdded(true)
    setTimeout(() => setCartAdded(false), 2500)
  }

  async function handleSubmit() {
    if (!selectedSize) { setError("Please select a size"); return }
    if (!selectedColor) { setError("Please select a color"); return }
    if (isVariantOut) { setError("Sorry, this size/color combination is out of stock"); return }
    if (!name.trim()) { setError("Please enter your name"); return }
    if (!phone.trim()) { setError("Please enter your phone number"); return }
    if (!address.trim()) { setError("Please enter your address"); return }
    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { error: dbError } = await supabase.from("orders").insert({
        name: name.trim(), phone: phone.trim(), address: address.trim(),
        product_id: product.id, product_name: product.name,
        size: selectedSize, color: selectedColor, quantity, total_price: totalPrice,
        notes: notes.trim(), status: "pending",
      })
      if (dbError) throw dbError
      // Auto-create/update customer record
      await upsertCustomer(supabase, { name: name.trim(), phone: phone.trim(), totalPrice })
      fbEvent.purchase({
        value: totalPrice,
        order_id: product.id + "_" + Date.now(),
        content_ids: [product.id],
      })
      setSuccess(true)
    } catch (err) {
      setError("Something went wrong. Please try again or WhatsApp us.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ border: "2px solid black", padding: "2.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.75rem" }}>Order Placed!</h3>
        <p style={{ color: "#555", lineHeight: 1.7, marginBottom: "0.5rem" }}>Thank you <strong>{name}</strong>! Your order for <strong>{product.name}</strong> has been received.</p>
        <p style={{ color: "#555", lineHeight: 1.7, marginBottom: "1.5rem" }}>We will call you on <strong>{phone}</strong> to confirm shortly.</p>
        <div style={{ backgroundColor: "#f5f5f5", padding: "1rem", marginBottom: "1.5rem", textAlign: "left" }}>
          <p style={{ fontSize: "0.8rem", color: "#999", marginBottom: "0.25rem" }}>Order Summary</p>
          <p style={{ fontWeight: 700 }}>{product.name}</p>
          <p style={{ fontSize: "0.9rem", color: "#555" }}>Size: {selectedSize} | Color: {selectedColor} | Qty: {quantity}</p>
          <p style={{ fontWeight: 700, marginTop: "0.5rem" }}>Total: BDT {totalPrice.toLocaleString()}</p>
        </div>
        <a href={"https://wa.me/8801935962421?text=" + encodeURIComponent("Hi! I just placed an order for " + product.name + ". My name is " + name)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", backgroundColor: "#25D366", color: "white", padding: "0.875rem 2rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", textDecoration: "none" }}>Confirm on WhatsApp</a>
      </div>
    )
  }

  return (
    <div>
      {/* Size */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Size {selectedSize && "— " + selectedSize}</p>
          <a href="/size-guide" style={{ fontSize: "0.75rem", color: "#999", textDecoration: "underline" }}>Size Guide</a>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {product.sizes.map(size => (
            <button key={size} onClick={() => setSelectedSize(size)} style={{ width: "52px", height: "52px", border: selectedSize === size ? "2px solid black" : "1px solid #e0e0e0", backgroundColor: selectedSize === size ? "black" : "white", color: selectedSize === size ? "white" : "black", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>{size}</button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Color {selectedColor && "— " + selectedColor}</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {product.colors.map(color => (
            <button key={color} onClick={() => setSelectedColor(color)} style={{ padding: "0.5rem 1.25rem", border: selectedColor === color ? "2px solid black" : "1px solid #e0e0e0", backgroundColor: selectedColor === color ? "black" : "white", color: selectedColor === color ? "white" : "black", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>{color}</button>
          ))}
        </div>
      </div>

      {/* Stock badge — shows after both selected */}
      {selectedSize && selectedColor && variantStock !== null && (
        <div style={{ marginBottom: "1rem", padding: "0.5rem 0.875rem", display: "inline-block", backgroundColor: isVariantOut ? "#fee2e2" : isVariantLow ? "#fffbeb" : "#f0fdf4", border: "1px solid " + (isVariantOut ? "#fca5a5" : isVariantLow ? "#fde68a" : "#bbf7d0"), fontSize: "0.78rem", fontWeight: 700, color: isVariantOut ? "#dc2626" : isVariantLow ? "#d97706" : "#16a34a" }}>
          {isVariantOut ? "⚠️ Out of stock in this size/color" : isVariantLow ? "⚡ Only " + variantStock + " left!" : "✓ " + variantStock + " in stock"}
        </div>
      )}

      {/* Quantity */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Quantity</p>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: "44px", height: "44px", border: "1px solid #e0e0e0", backgroundColor: "white", fontSize: "1.25rem", cursor: "pointer" }}>−</button>
          <div style={{ width: "60px", height: "44px", border: "1px solid #e0e0e0", borderLeft: "none", borderRight: "none", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{quantity}</div>
          <button onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} disabled={variantStock !== null && quantity >= variantStock} style={{ width: "44px", height: "44px", border: "1px solid #e0e0e0", backgroundColor: "white", fontSize: "1.25rem", cursor: (variantStock !== null && quantity >= variantStock) ? "not-allowed" : "pointer", opacity: (variantStock !== null && quantity >= variantStock) ? 0.4 : 1 }}>+</button>
          <span style={{ marginLeft: "1rem", fontWeight: 700, fontSize: "1.1rem" }}>BDT {totalPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* ── ADD TO CART BUTTON ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button
          onClick={handleAddToCart}
          disabled={isVariantOut}
          style={{
            padding: "0.9rem 1rem",
            backgroundColor: cartAdded ? "#16a34a" : "white",
            color: cartAdded ? "white" : "black",
            border: "2px solid " + (cartAdded ? "#16a34a" : "black"),
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: isVariantOut ? "not-allowed" : "pointer",
            opacity: isVariantOut ? 0.5 : 1,
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          {cartAdded ? (
            <>✓ Added to Cart</>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Add to Cart
            </>
          )}
        </button>

        <button
          onClick={() => {
            if (!selectedSize) { setError("Please select a size first"); return }
            if (!selectedColor) { setError("Please select a color first"); return }
            setError("")
            // scroll to order form
            document.getElementById("order-form-section")?.scrollIntoView({ behavior: "smooth" })
          }}
          style={{
            padding: "0.9rem 1rem",
            backgroundColor: "black",
            color: "white",
            border: "2px solid black",
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Buy Now (COD)
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }} />
        <span style={{ fontSize: "0.72rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Or place order directly below</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }} />
      </div>

      {/* Delivery info */}
      <div id="order-form-section" style={{ borderTop: "1px solid #e0e0e0", paddingTop: "1.5rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem", color: "#999" }}>Delivery Information</p>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase" }}>Full Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 1rem", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" as const }} />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase" }}>Phone Number *</label>
          <input type="tel" value={phone}
            onChange={e => { setPhone(e.target.value); setDiscountChecked(false); setIsFlex100(false) }}
            onBlur={async e => {
              const ph = e.target.value.trim()
              if (!ph) return
              const supabase = createClient()
              const { data } = await supabase.from("customers").select("flex100, name").eq("phone", ph).single()
              setIsFlex100(data?.flex100 === true)
              setDiscountChecked(true)
              if (data?.name && !name) setName(data.name)
            }}
            placeholder="01XXXXXXXXX" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 1rem", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" as const }} />
          {discountChecked && isFlex100 && (
            <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fbbf24", padding: "0.75rem 0.875rem", marginTop: "0.5rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#92400e", fontWeight: 900, marginBottom: "0.2rem" }}>🥇 Welcome back{name ? ", " + name : ""}!</p>
              <p style={{ fontSize: "0.75rem", color: "#92400e", fontWeight: 600 }}>FLEX100 Member — 10% lifetime discount applied ✓</p>
            </div>
          )}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase" }}>Delivery Address *</label>
          <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="House/Flat, Road, Area, District" rows={3} style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 1rem", fontSize: "0.95rem", outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const, fontFamily: "inherit" }} />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase" }}>Notes (Optional)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 1rem", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" as const }} />
        </div>
      </div>

      {error && <div style={{ backgroundColor: "#fff0f0", border: "1px solid #ffcccc", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#cc0000" }}>{error}</div>}

      <div style={{ backgroundColor: "#f5f5f5", padding: "1rem", marginBottom: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>🚚</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.2rem" }}>Cash on Delivery</p>
          <p style={{ fontSize: "0.8rem", color: "#666", lineHeight: 1.5 }}>Pay when your order arrives. No advance payment needed.</p>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || isVariantOut}
        style={{ width: "100%", backgroundColor: loading ? "#333" : "black", color: "white", padding: "1.1rem", fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.15em", textTransform: "uppercase", border: "none", cursor: loading || isVariantOut ? "not-allowed" : "pointer", marginBottom: "1rem", opacity: isVariantOut ? 0.5 : 1 }}
      >
        {loading ? "Placing Order..." : "Place Order — BDT " + totalPrice.toLocaleString()}
      </button>

      <a href={"https://wa.me/8801935962421?text=" + encodeURIComponent("Hi! I want to order " + product.name)} target="_blank" rel="noopener noreferrer" style={{ display: "block", width: "100%", backgroundColor: "#25D366", color: "white", padding: "1rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", textDecoration: "none", textAlign: "center" as const, boxSizing: "border-box" as const }}>
        Or Order via WhatsApp
      </a>
    </div>
  )
}
