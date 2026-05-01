"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/components/ui/Cart"

type DeliveryZone = {
  id: string
  name: string
  charge: string
  days: string
}

type DeliveryGroup = {
  id: string
  name: string
  zones: DeliveryZone[]
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [deliveryOptions, setDeliveryOptions] = useState<{name: string; price: number}[]>([])
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(false)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedDelivery, setSelectedDelivery] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      
      if (data.settings && Array.isArray(data.settings)) {
        const map: Record<string,string> = {}
        data.settings.forEach((s: any) => { if (s.key) map[s.key] = s.value })
        
        // Check free delivery toggle
        const freeDelivery = map.free_delivery === "true" || map.free_delivery === "1"
        setFreeDeliveryEnabled(freeDelivery)
        
        if (freeDelivery) {
          // Free delivery mode - single option
          setDeliveryOptions([{ name: "Free Delivery", price: 0 }])
          setSelectedDelivery("Free Delivery")
        } else {
          // Normal mode - load delivery groups
          if (map.delivery_groups) {
            try {
              const groups: DeliveryGroup[] = JSON.parse(map.delivery_groups)
              const options: {name: string; price: number}[] = []
              
              groups.forEach(group => {
                group.zones.forEach(zone => {
                  options.push({
                    name: `${group.name} - ${zone.name}`,
                    price: parseFloat(zone.charge) || 0
                  })
                })
              })
              
              setDeliveryOptions(options)
            } catch (e) {
              console.error("Failed to parse delivery groups:", e)
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load settings:", e)
    }
  }

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.price) || 0
    const quantity = Number(item.quantity) || 0
    return sum + (price * quantity)
  }, 0)
  
  const selectedOption = deliveryOptions.find(o => o.name === selectedDelivery)
  const deliveryFee = freeDeliveryEnabled ? 0 : (selectedOption?.price || 0)
  const total = subtotal + deliveryFee

  async function placeOrder() {
    if (!name.trim()) { setError("Please enter your name"); return }
    if (!phone.trim()) { setError("Please enter your phone"); return }
    if (!selectedDelivery) { setError("Please select delivery option"); return }
    if (!address.trim()) { setError("Please enter your address"); return }

    setLoading(true)
    setError("")

    try {
      const orderPromises = items.map((item, index) => {
        const itemPrice = Number(item.price) || 0
        const itemQty = Number(item.quantity) || 0
        const itemTotal = (itemPrice * itemQty) + (index === 0 ? deliveryFee : 0)
        
        return fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            address: `${selectedDelivery} — ${address.trim()}`,
            product_name: item.name,
            product_id: item.productId,
            size: item.size || null,
            color: item.color || null,
            quantity: itemQty,
            total_price: itemTotal,
            notes: notes.trim() || null,
            status: "pending",
          })
        })
      })

      await Promise.all(orderPromises)
      clearCart()
      router.push("/order-success")
    } catch (e: any) {
      setError("Failed to place order. Please try again.")
      console.error(e)
    }

    setLoading(false)
  }

  if (items.length === 0) {
    return (
      <div style={{ paddingTop: "100px", paddingBottom: "4rem", paddingLeft: "1.5rem", paddingRight: "1.5rem", textAlign: "center", minHeight: "50vh" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "1rem" }}>Your cart is empty</h2>
        <a href="/products" style={{ color: "blue", textDecoration: "underline" }}>Continue Shopping</a>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: "100px", paddingBottom: "2rem", paddingLeft: "1.5rem", paddingRight: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "2rem" }}>Checkout</h1>

      {/* Free Delivery Banner */}
      {freeDeliveryEnabled && (
        <div style={{ backgroundColor: "#dcfce7", border: "2px solid #16a34a", padding: "1rem", marginBottom: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "#16a34a", marginBottom: "0.25rem" }}>
            🚚 FREE DELIVERY!
          </p>
          <p style={{ fontSize: "0.875rem", color: "#15803d" }}>
            No delivery charges on all orders
          </p>
        </div>
      )}

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fee2e2", color: "#dc2626", marginBottom: "2rem", border: "1px solid #fca5a5" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: "2rem" }}>
        
        <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Delivery Information</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #e0e0e0", fontSize: "1rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #e0e0e0", fontSize: "1rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>
                {freeDeliveryEnabled ? "Delivery Option *" : "Delivery Area *"}
              </label>
              <select
                value={selectedDelivery}
                onChange={e => setSelectedDelivery(e.target.value)}
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #e0e0e0", fontSize: "1rem" }}
              >
                <option value="">Select delivery option</option>
                {deliveryOptions.map(option => (
                  <option key={option.name} value={option.name}>
                    {freeDeliveryEnabled 
                      ? option.name 
                      : `${option.name} — Delivery: BDT ${option.price}`
                    }
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>Delivery Address *</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="House/flat no, road, area"
                rows={3}
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #e0e0e0", fontSize: "1rem", fontFamily: "inherit" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>Order Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special instructions..."
                rows={2}
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #e0e0e0", fontSize: "1rem", fontFamily: "inherit" }}
              />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Order Summary</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
            {items.map(item => {
              const itemPrice = Number(item.price) || 0
              const itemQty = Number(item.quantity) || 0
              const itemTotal = itemPrice * itemQty
              
              return (
                <div key={`${item.productId}-${item.size}-${item.color}`} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{itemQty} × {item.name} {item.size && item.color && `(${item.size}/${item.color})`}</span>
                  <span>BDT {itemTotal.toLocaleString()}</span>
                </div>
              )
            })}
          </div>

          <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "1rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span>Subtotal</span>
              <span>BDT {subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span>Delivery</span>
              <span>
                {freeDeliveryEnabled 
                  ? <strong style={{ color: "#16a34a" }}>FREE</strong>
                  : selectedDelivery ? `BDT ${deliveryFee.toLocaleString()}` : "—"
                }
              </span>
            </div>
          </div>

          <div style={{ borderTop: "2px solid black", paddingTop: "1rem", display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 900 }}>
            <span>Total</span>
            <span>BDT {total.toLocaleString()}</span>
          </div>

          <button
            onClick={placeOrder}
            disabled={loading || subtotal === 0}
            style={{
              width: "100%",
              padding: "1rem",
              backgroundColor: loading || subtotal === 0 ? "#999" : "black",
              color: "white",
              border: "none",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: loading || subtotal === 0 ? "not-allowed" : "pointer",
              marginTop: "1.5rem"
            }}
          >
            {loading ? "Placing Order..." : `Place Order — BDT ${total.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  )
}
