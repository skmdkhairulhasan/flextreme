"use client"
import { useState, useEffect } from "react"
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

type OrderFormProps = {
  product: {
    id: string
    name: string
    price: number
    sizes?: string[]
    colors?: string[]
    stock_matrix?: any
  }
}

export default function OrderForm({ product }: OrderFormProps) {
  const { addItem } = useCart()
  const [deliveryOptions, setDeliveryOptions] = useState<{name: string; price: number}[]>([])
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(false)
  
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedDelivery, setSelectedDelivery] = useState("")
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    loadDeliverySettings()
  }, [])

  async function loadDeliverySettings() {
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
          // Free delivery mode
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

  const selectedOption = deliveryOptions.find(o => o.name === selectedDelivery)
  const deliveryFee = freeDeliveryEnabled ? 0 : (selectedOption?.price || 0)
  const subtotal = product.price * quantity
  const total = subtotal + deliveryFee

  function handleAddToCart() {
    // Validation
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("Please select a size")
      return
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert("Please select a color")
      return
    }
    if (!selectedDelivery) {
      alert("Please select delivery option")
      return
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: total, // Include delivery in price
      size: selectedSize,
      color: selectedColor,
      quantity,
      image: "",
      slug: ""
    })

    alert("Added to cart!")
  }

  const labelStyle = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "#999",
    marginBottom: "0.5rem"
  }

  const selectStyle = {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #e0e0e0",
    fontSize: "0.95rem",
    backgroundColor: "white",
    cursor: "pointer"
  }

  return (
    <div style={{ border: "1px solid #e0e0e0", padding: "2rem", backgroundColor: "white" }}>
      {/* Free Delivery Badge */}
      {freeDeliveryEnabled && (
        <div style={{ 
          backgroundColor: "#dcfce7", 
          border: "1px solid #16a34a", 
          padding: "0.75rem", 
          marginBottom: "1.5rem",
          textAlign: "center"
        }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#16a34a" }}>
            🚚 FREE DELIVERY
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Size Selection */}
        {product.sizes && product.sizes.length > 0 && (
          <div>
            <label style={labelStyle}>Size</label>
            <select
              value={selectedSize}
              onChange={e => setSelectedSize(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select Size</option>
              {product.sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}

        {/* Color Selection */}
        {product.colors && product.colors.length > 0 && (
          <div>
            <label style={labelStyle}>Color</label>
            <select
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select Color</option>
              {product.colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
        )}

        {/* Delivery Selection */}
        <div>
          <label style={labelStyle}>
            {freeDeliveryEnabled ? "Delivery" : "Delivery Area"}
          </label>
          <select
            value={selectedDelivery}
            onChange={e => setSelectedDelivery(e.target.value)}
            style={selectStyle}
          >
            <option value="">Select delivery option</option>
            {deliveryOptions.map(option => (
              <option key={option.name} value={option.name}>
                {freeDeliveryEnabled 
                  ? option.name 
                  : `${option.name} — BDT ${option.price}`
                }
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label style={labelStyle}>Quantity</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#f5f5f5",
                border: "1px solid #e0e0e0",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "1.25rem"
              }}
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              style={{
                flex: 1,
                textAlign: "center",
                padding: "0.75rem",
                border: "1px solid #e0e0e0",
                fontSize: "1rem",
                fontWeight: 700
              }}
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#f5f5f5",
                border: "1px solid #e0e0e0",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "1.25rem"
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div style={{ paddingTop: "1rem", borderTop: "1px solid #e0e0e0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.95rem" }}>
            <span>Product ({quantity}x)</span>
            <span>BDT {subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.95rem" }}>
            <span>Delivery</span>
            <span>
              {freeDeliveryEnabled 
                ? <strong style={{ color: "#16a34a" }}>FREE</strong>
                : selectedDelivery ? `BDT ${deliveryFee.toLocaleString()}` : "—"
              }
            </span>
          </div>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            paddingTop: "0.75rem",
            borderTop: "2px solid black",
            fontSize: "1.25rem",
            fontWeight: 900
          }}>
            <span>Total</span>
            <span>BDT {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          style={{
            width: "100%",
            padding: "1rem",
            backgroundColor: "black",
            color: "white",
            border: "none",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}
        >
          Add to Cart — BDT {total.toLocaleString()}
        </button>
      </div>
    </div>
  )
}
