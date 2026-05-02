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
    stock_matrix?: Record<string, number> | null
  }
}

export default function OrderForm({ product }: OrderFormProps) {
  const { addItem } = useCart()
  const [deliveryOptions, setDeliveryOptions] = useState<{ name: string; price: number }[]>([])
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(false)

  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedDelivery, setSelectedDelivery] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [stockWarning, setStockWarning] = useState("")

  useEffect(() => {
    loadDeliverySettings()
  }, [])

  // Re-check stock warning whenever size or color changes
  useEffect(() => {
    if (selectedSize && selectedColor && product.stock_matrix) {
      const key = `${selectedSize.trim()}_${selectedColor.trim()}`
      const matrix = product.stock_matrix as Record<string, number>
      const matchedKey = Object.keys(matrix).find(
        k => k.toLowerCase() === key.toLowerCase()
      )
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
        } else {
          if (map.delivery_groups) {
            try {
              const groups: DeliveryGroup[] = JSON.parse(map.delivery_groups)
              const options: { name: string; price: number }[] = []
              groups.forEach(group => {
                group.zones.forEach(zone => {
                  options.push({
                    name: `${group.name} - ${zone.name}`,
                    price: parseFloat(zone.charge) || 0,
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

  // Get remaining stock for a given size+color combination
  function getStock(size: string, color: string): number | null {
    if (!product.stock_matrix) return null
    const key = `${size.trim()}_${color.trim()}`
    const matrix = product.stock_matrix as Record<string, number>
    const matchedKey = Object.keys(matrix).find(
      k => k.toLowerCase() === key.toLowerCase()
    )
    return matchedKey !== undefined ? matrix[matchedKey] : null
  }

  // Is this size out of stock for ALL colors? (grey it out)
  function isSizeUnavailable(size: string): boolean {
    if (!product.stock_matrix || !product.colors || product.colors.length === 0) return false
    return product.colors.every(color => {
      const stock = getStock(size, color)
      return stock !== null && stock <= 0
    })
  }

  // Is this color out of stock for the currently selected size?
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

  function handleAddToCart() {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("Please select a size")
      return
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert("Please select a color")
      return
    }
    if (currentComboOutOfStock) {
      alert(`⚠️ "${selectedSize} / ${selectedColor}" is out of stock. Please choose a different combination.`)
      return
    }
    if (!selectedDelivery) {
      alert("Please select delivery option")
      return
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: total,
      size: selectedSize,
      color: selectedColor,
      quantity,
      image: "",
      slug: "",
    })

    alert("Added to cart!")
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#999",
    marginBottom: "0.75rem",
  }

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #e0e0e0",
    fontSize: "0.95rem",
    backgroundColor: "white",
    cursor: "pointer",
  }

  function SizeButton({ size }: { size: string }) {
    const isSelected = selectedSize === size
    const isUnavailable = isSizeUnavailable(size)

    return (
      <button
        onClick={() => !isUnavailable && setSelectedSize(isSelected ? "" : size)}
        title={isUnavailable ? "Out of stock in all colors" : size}
        style={{
          padding: "0.5rem 1rem",
          minWidth: "3rem",
          border: isSelected ? "2px solid black" : "1px solid #e0e0e0",
          backgroundColor: isSelected ? "black" : isUnavailable ? "#f5f5f5" : "white",
          color: isSelected ? "white" : isUnavailable ? "#bbb" : "black",
          fontWeight: 700,
          fontSize: "0.85rem",
          cursor: isUnavailable ? "not-allowed" : "pointer",
          textDecoration: isUnavailable ? "line-through" : "none",
          transition: "all 0.15s",
          position: "relative",
        }}
      >
        {size}
      </button>
    )
  }

  function ColorButton({ color }: { color: string }) {
    const isSelected = selectedColor === color
    const isUnavailableForSize = isColorUnavailableForSize(color)

    // Try to detect if color is a hex code or CSS color name
    const looksLikeColor =
      /^#[0-9a-f]{3,6}$/i.test(color) ||
      /^(black|white|red|blue|green|gray|grey|navy|pink|yellow|purple|orange|brown|beige|olive|maroon|teal|cyan|magenta|lime|coral|indigo|violet|gold|silver|cream|charcoal|khaki)$/i.test(color)

    return (
      <button
        onClick={() => setSelectedColor(isSelected ? "" : color)}
        title={isUnavailableForSize ? `Out of stock in this size` : color}
        style={{
          padding: "0.5rem 1rem",
          minWidth: "3rem",
          border: isSelected ? "2px solid black" : "1px solid #e0e0e0",
          backgroundColor: isSelected ? "black" : "white",
          color: isSelected ? "white" : isUnavailableForSize ? "#bbb" : "black",
          fontWeight: 600,
          fontSize: "0.85rem",
          cursor: "pointer",
          transition: "all 0.15s",
          position: "relative",
          opacity: isUnavailableForSize ? 0.5 : 1,
        }}
      >
        {looksLikeColor && (
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: color,
              border: "1px solid #ccc",
              marginRight: "6px",
              verticalAlign: "middle",
            }}
          />
        )}
        {color}
        {isUnavailableForSize && (
          <span style={{
            position: "absolute",
            top: "50%",
            left: "8%",
            right: "8%",
            height: "1px",
            backgroundColor: "#bbb",
            transform: "translateY(-50%)",
          }} />
        )}
      </button>
    )
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
          textAlign: "center",
        }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#16a34a" }}>
            🚚 FREE DELIVERY
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Size Selection — buttons */}
        {product.sizes && product.sizes.length > 0 && (
          <div>
            <label style={labelStyle}>
              Size{selectedSize && <span style={{ color: "black", marginLeft: "0.5rem", textTransform: "none", letterSpacing: 0 }}>— {selectedSize}</span>}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {product.sizes.map(size => (
                <SizeButton key={size} size={size} />
              ))}
            </div>
          </div>
        )}

        {/* Color Selection — buttons */}
        {product.colors && product.colors.length > 0 && (
          <div>
            <label style={labelStyle}>
              Color{selectedColor && <span style={{ color: "black", marginLeft: "0.5rem", textTransform: "none", letterSpacing: 0 }}>— {selectedColor}</span>}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {product.colors.map(color => (
                <ColorButton key={color} color={color} />
              ))}
            </div>
          </div>
        )}

        {/* Stock warning */}
        {stockWarning && (
          <div style={{
            padding: "0.6rem 0.875rem",
            backgroundColor: currentComboOutOfStock ? "#fee2e2" : "#fef9c3",
            border: `1px solid ${currentComboOutOfStock ? "#fca5a5" : "#fcd34d"}`,
            fontSize: "0.85rem",
            fontWeight: 600,
            color: currentComboOutOfStock ? "#dc2626" : "#854d0e",
          }}>
            {stockWarning}
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
                  : `${option.name} — BDT ${option.price}`}
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
                fontSize: "1.25rem",
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
                fontWeight: 700,
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
                fontSize: "1.25rem",
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
                : selectedDelivery ? `BDT ${deliveryFee.toLocaleString()}` : "—"}
            </span>
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: "0.75rem",
            borderTop: "2px solid black",
            fontSize: "1.25rem",
            fontWeight: 900,
          }}>
            <span>Total</span>
            <span>BDT {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={currentComboOutOfStock}
          style={{
            width: "100%",
            padding: "1rem",
            backgroundColor: currentComboOutOfStock ? "#e0e0e0" : "black",
            color: currentComboOutOfStock ? "#999" : "white",
            border: "none",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: currentComboOutOfStock ? "not-allowed" : "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            transition: "background-color 0.15s",
          }}
        >
          {currentComboOutOfStock
            ? "Out of Stock"
            : `Add to Cart — BDT ${total.toLocaleString()}`}
        </button>
      </div>
    </div>
  )
}
