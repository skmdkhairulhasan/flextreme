"use client"
import { useState, useEffect } from "react"
import { useCart } from "@/components/ui/Cart"
import Link from "next/link"
import { fbEvent } from "@/components/ui/FacebookPixel"

type DeliveryZone = { id: string; name: string; charge: string; days: string }
type DeliveryGroup = { id: string; name: string; zones: DeliveryZone[] }

export default function CheckoutPage() {
  const { items, total, count, clearCart } = useCart()
  const [mounted, setMounted] = useState(false)

  // Form fields
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")

  // Delivery
  const [deliveryOptions, setDeliveryOptions] = useState<{ name: string; price: number }[]>([])
  const [freeDelivery, setFreeDelivery] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("8801935962421")

  // FLEX100
  const [isFlex100, setIsFlex100] = useState(false)
  const [discountChecked, setDiscountChecked] = useState(false)
  const [customerName, setCustomerName] = useState("")

  // UI
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setMounted(true)
    loadSettings()
    if (items.length > 0) {
      fbEvent.initiateCheckout({ value: total, num_items: count })
    }
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      if (!data.settings || !Array.isArray(data.settings)) return

      const map: Record<string, string> = {}
      data.settings.forEach((s: any) => { if (s.key) map[s.key] = s.value })

      if (map.whatsapp_number) setWhatsappNumber(map.whatsapp_number)

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

  async function checkFlex100(ph: string) {
    if (!ph.trim()) return
    try {
      const res = await fetch(`/api/customer-check?phone=${encodeURIComponent(ph.trim())}`)
      const data = await res.json()
      setIsFlex100(data?.flex100 === true || data?.customer?.flex100 === 1 || data?.customer?.flex100 === true)
      setDiscountChecked(true)
      if (data?.customer?.name) setCustomerName(data.customer.name)
    } catch {
      setDiscountChecked(true)
    }
  }

  const deliveryFee = freeDelivery ? 0 : (deliveryOptions.find(o => o.name === selectedDelivery)?.price || 0)
  const subtotal = total // total from cart already = sum of item prices
  const orderTotal = subtotal + deliveryFee
  const discountedTotal = isFlex100 ? Math.round(orderTotal * 0.9) : orderTotal
  const discountAmount = isFlex100 ? Math.round(orderTotal * 0.1) : 0

  async function handlePlaceOrder() {
    if (!name.trim()) { setError("Please enter your full name"); return }
    if (!phone.trim()) { setError("Please enter your phone number"); return }
    if (!address.trim()) { setError("Please enter your delivery address"); return }
    if (deliveryOptions.length > 0 && !selectedDelivery) { setError("Please select a delivery option"); return }
    if (items.length === 0) { setError("Your cart is empty"); return }

    setLoading(true)
    setError("")

    try {
      // Create one order per cart item
      for (const item of items) {
        const itemTotal = isFlex100
          ? Math.round(item.price * item.quantity * 0.9)
          : item.price * item.quantity

        // Add proportional delivery fee to first item only, or split — simplest: add to each
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            notes: notes.trim(),
            product_id: item.productId,
            product_name: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            total_price: itemTotal,
            status: "pending",
          }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error || "Order failed")
        }
      }

      fbEvent.purchase({
        value: discountedTotal,
        order_id: "order_" + Date.now(),
        content_ids: items.map(i => i.productId),
      })

      clearCart()
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again or WhatsApp us.")
    } finally {
      setLoading(false)
    }
  }

  // ── Loading skeleton (before mount) ──
  if (!mounted) {
    return (
      <div style={{ paddingTop: "72px", minHeight: "100vh", backgroundColor: "#fafafa" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem" }}>
          <div style={{ height: "32px", backgroundColor: "#f0f0f0", borderRadius: "4px", width: "200px", marginBottom: "2rem" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr min(400px, 100%)", gap: "2rem" }}>
            <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "2rem", height: "500px" }} />
            <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "2rem", height: "400px" }} />
          </div>
        </div>
      </div>
    )
  }

  // ── Success screen ──
  if (success) {
    return (
      <div style={{ paddingTop: "72px", minHeight: "100vh", backgroundColor: "white" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>✓</div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "1rem" }}>Order Placed!</h1>
          <p style={{ color: "#555", lineHeight: 1.8, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
            Thank you <strong>{name}</strong>! Your order has been received.
          </p>
          <p style={{ color: "#555", lineHeight: 1.8, fontSize: "0.95rem", marginBottom: "2rem" }}>
            We will call you on <strong>{phone}</strong> to confirm shortly.
          </p>
          <div style={{ backgroundColor: "#f5f5f5", padding: "1.5rem", marginBottom: "2rem", textAlign: "left" }}>
            <p style={{ fontSize: "0.75rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>What happens next</p>
            {[
              "We'll call you to confirm your order",
              "Your order will be packed and dispatched",
              "Delivery in 1-5 business days depending on location",
              "Pay with cash when your order arrives",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                <span style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "var(--theme-btn-bg, black)", color: "var(--theme-btn-text, white)", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1rem" }}>{i + 1}</span>
                <p style={{ fontSize: "0.85rem", color: "#444", lineHeight: 1.5 }}>{step}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={"https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent("Hi! I just placed an order. My name is " + name + " and my phone is " + phone)}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", backgroundColor: "#25D366", color: "white", padding: "0.875rem 2rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", textDecoration: "none" }}
            >
              Confirm on WhatsApp
            </a>
            <Link href="/products" style={{ display: "inline-block", backgroundColor: "var(--theme-btn-bg, black)", color: "var(--theme-btn-text, white)", padding: "0.875rem 2rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", textDecoration: "none" }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Empty cart ──
  if (items.length === 0) {
    return (
      <div style={{ paddingTop: "72px", minHeight: "100vh", backgroundColor: "white" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>🛒</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "1rem" }}>Your cart is empty</h1>
          <p style={{ color: "#666", marginBottom: "2rem" }}>Add some products to your cart before checking out.</p>
          <Link href="/products" style={{ display: "inline-block", backgroundColor: "var(--theme-btn-bg, black)", color: "var(--theme-btn-text, white)", padding: "0.875rem 2rem", fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", textDecoration: "none", letterSpacing: "0.1em" }}>
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid #e0e0e0",
    padding: "0.875rem 1rem", fontSize: "0.95rem",
    outline: "none", boxSizing: "border-box",
  }
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.75rem", fontWeight: 700,
    marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em",
  }

  // ── Main checkout ──
  return (
    <div style={{ paddingTop: "72px", minHeight: "100vh", backgroundColor: "#fafafa" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem" }}>

        <div style={{ marginBottom: "2rem" }}>
          <Link href="/products" style={{ fontSize: "0.8rem", color: "#999", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>← Continue Shopping</Link>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginTop: "0.5rem" }}>Checkout</h1>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>{count} item{count !== 1 ? "s" : ""} in your cart</p>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .checkout-grid { grid-template-columns: 1fr !important; }
            .checkout-summary { position: static !important; }
          }
        `}</style>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr min(400px, 100%)", gap: "2rem", alignItems: "start" }}>

          {/* ── Left: Delivery form ── */}
          <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "2rem" }}>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "2px solid black" }}>
              Delivery Information
            </h2>

            {/* Name */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
            </div>

            {/* Phone + FLEX100 check */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={labelStyle}>Phone Number *</label>
              <input
                type="tel" value={phone}
                onChange={e => { setPhone(e.target.value); setDiscountChecked(false); setIsFlex100(false) }}
                onBlur={e => checkFlex100(e.target.value)}
                placeholder="01XXXXXXXXX"
                style={inputStyle}
              />
              <p style={{ fontSize: "0.72rem", color: "#999", marginTop: "0.3rem" }}>We will call this number to confirm your order</p>
              {discountChecked && isFlex100 && (
                <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fbbf24", padding: "0.75rem 0.875rem", marginTop: "0.5rem" }}>
                  <p style={{ fontSize: "0.85rem", color: "#92400e", fontWeight: 900, marginBottom: "0.2rem" }}>🥇 Welcome back{customerName ? ", " + customerName : ""}!</p>
                  <p style={{ fontSize: "0.75rem", color: "#92400e", fontWeight: 600 }}>FLEX100 Member — 10% lifetime discount applied ✓</p>
                </div>
              )}
            </div>

            {/* Address */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={labelStyle}>Delivery Address *</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="House/Flat No, Road, Area, District" rows={3}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            </div>

            {/* Delivery zone selector */}
            {deliveryOptions.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>{freeDelivery ? "Delivery" : "Delivery Area *"}</label>
                {freeDelivery ? (
                  <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.875rem 1rem", fontSize: "0.95rem", fontWeight: 700, color: "#16a34a" }}>
                    🚚 Free Delivery — No charge
                  </div>
                ) : (
                  <select value={selectedDelivery} onChange={e => setSelectedDelivery(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer", backgroundColor: "white" }}>
                    <option value="">Select your area</option>
                    {deliveryOptions.map(o => (
                      <option key={o.name} value={o.name}>
                        {o.name} — BDT {o.price}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={labelStyle}>Order Notes (Optional)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." style={inputStyle} />
            </div>

            {/* COD notice */}
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <span style={{ fontSize: "1.5rem" }}>💚</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#15803d" }}>Cash on Delivery</p>
                <p style={{ fontSize: "0.78rem", color: "#16a34a", lineHeight: 1.5 }}>Pay when your order arrives. No online payment needed.</p>
              </div>
            </div>

            {error && (
              <div style={{ backgroundColor: "#fff0f0", border: "1px solid #ffcccc", padding: "0.875rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem", color: "#cc0000" }}>
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              style={{ width: "100%", backgroundColor: loading ? "#444" : "black", color: "white", padding: "1.1rem", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", marginBottom: "0.75rem" }}
            >
              {loading ? "Placing Order..." : `Place Order — BDT ${discountedTotal.toLocaleString()}`}
            </button>

            <a
              href={"https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(
                "Hi! I want to place an order for " +
                items.map(i => i.name + " (" + i.size + "/" + i.color + " x" + i.quantity + ")").join(", ") +
                ". Total: BDT " + discountedTotal.toLocaleString()
              )}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "block", width: "100%", backgroundColor: "#25D366", color: "white", padding: "1rem", fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase", textDecoration: "none", textAlign: "center" }}
            >
              Or Order via WhatsApp
            </a>
          </div>

          {/* ── Right: Order summary ── */}
          <div className="checkout-summary" style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.75rem", position: "sticky", top: "88px" }}>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "2px solid black" }}>
              Order Summary ({count} item{count !== 1 ? "s" : ""})
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.25rem" }}>
              {items.map(item => (
                <div key={item.id} style={{ display: "flex", gap: "0.875rem", alignItems: "center" }}>
                  <div style={{ width: "56px", height: "70px", backgroundColor: "#f5f5f5", flexShrink: 0, overflow: "hidden" }}>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem", lineHeight: 1.3, marginBottom: "0.2rem" }}>{item.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "#888" }}>{item.size} · {item.color} · Qty {item.quantity}</p>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem", marginTop: "0.2rem" }}>BDT {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#666" }}>Subtotal</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>BDT {subtotal.toLocaleString()}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#666" }}>Delivery</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: freeDelivery ? "#16a34a" : "#111" }}>
                  {freeDelivery
                    ? "FREE"
                    : selectedDelivery
                      ? `BDT ${deliveryFee.toLocaleString()}`
                      : "Select area above"
                  }
                </span>
              </div>

              {isFlex100 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 700 }}>🥇 FLEX100 Discount (10%)</span>
                  <span style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 700 }}>-BDT {discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem 0", borderTop: "2px solid black" }}>
                <span style={{ fontWeight: 900, fontSize: "1rem", textTransform: "uppercase" }}>Total</span>
                <span style={{ fontWeight: 900, fontSize: "1.25rem" }}>BDT {discountedTotal.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ backgroundColor: "#f9f9f9", padding: "1rem", fontSize: "0.78rem", color: "#666", lineHeight: 1.7 }}>
              📦 Delivery info on our <a href="/delivery" style={{ color: "#111", fontWeight: 700 }}>Delivery page</a><br />
              💚 Cash on Delivery — pay on arrival
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
