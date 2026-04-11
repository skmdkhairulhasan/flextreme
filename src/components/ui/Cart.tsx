"use client"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import ConfirmModal from "@/components/ui/ConfirmModal"
import { useRouter } from "next/navigation"

type CartItem = {
  id: string
  productId: string
  name: string
  price: number
  image: string
  size: string
  color: string
  quantity: number
  slug: string
}

type CartContextType = {
  items: CartItem[]
  count: number
  total: number
  addItem: (item: Omit<CartItem, "id">) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  isOpen: boolean
  setOpen: (v: boolean) => void
}

const CartContext = createContext<CartContextType | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be inside CartProvider")
  return ctx
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("flextreme_cart")
      if (saved) setItems(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem("flextreme_cart", JSON.stringify(items)) } catch {}
  }, [items])

  function addItem(item: Omit<CartItem, "id">) {
    const id = item.productId + "_" + item.size + "_" + item.color
    setItems(prev => {
      const existing = prev.find(i => i.id === id)
      if (existing) return prev.map(i => i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i)
      return [...prev, { ...item, id }]
    })
    setOpen(true)
  }

  function removeItem(id: string) { setItems(prev => prev.filter(i => i.id !== id)) }
  function updateQty(id: string, qty: number) {
    if (qty < 1) { removeItem(id); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }
  function clearCart() { setItems([]) }

  const count = items.reduce((s, i) => s + i.quantity, 0)
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, count, total, addItem, removeItem, updateQty, clearCart, isOpen, setOpen }}>
      {children}
    </CartContext.Provider>
  )
}

function CheckoutButton({ setOpen }: { setOpen: (v: boolean) => void }) {
  const router = useRouter()
  function go() {
    setOpen(false)
    router.push("/checkout")
  }
  return (
    <button onClick={go} style={{ display: "block", width: "100%", backgroundColor: "black", color: "white", padding: "1rem", textAlign: "center", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "var(--chat-cursor,auto)", marginBottom: "0.75rem" }}>
      Proceed to Checkout
    </button>
  )
}

export function CartDrawer() {
  const { items, count, total, removeItem, updateQty, clearCart, isOpen, setOpen } = useCart()
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null) // item.id to remove
  const [clearConfirm, setClearConfirm] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  return (
    <>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .cart-drawer { animation: slideIn 0.3s cubic-bezier(0.32,0,0,1) forwards; }
        .cart-overlay { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      {isOpen && (
        <>
          {/* Overlay */}
          <div className="cart-overlay" onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99998 }} />

          {/* Drawer */}
          <div className="cart-drawer" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 100vw)", backgroundColor: "white", zIndex: 99999, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)" }}>

            {/* Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <h2 style={{ fontWeight: 900, fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Your Cart</h2>
                <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.15rem" }}>{count} {count === 1 ? "item" : "items"}</p>
              </div>
<button onClick={() => setOpen(false)} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid #e0e0e0", background: "white", fontSize: "1rem", cursor: "var(--chat-cursor,auto)", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 0" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛒</div>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>Your cart is empty</p>
                  <p style={{ color: "#999", fontSize: "0.82rem" }}>Add some items to get started!</p>
                  <button onClick={() => setOpen(false)} style={{ marginTop: "1.5rem", padding: "0.75rem 2rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", cursor: "var(--chat-cursor,auto)", letterSpacing: "0.1em" }}>Continue Shopping</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {items.map(item => (
                    <div key={item.id} style={{ display: "flex", gap: "0.875rem", paddingBottom: "1rem", borderBottom: "1px solid #f5f5f5" }}>
                      <a href={"/products/" + item.slug} onClick={() => setOpen(false)}>
                        <img src={item.image} alt={item.name} style={{ width: "72px", height: "90px", objectFit: "cover", flexShrink: 0, backgroundColor: "#f5f5f5" }} />
                      </a>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={"/products/" + item.slug} onClick={() => setOpen(false)} style={{ textDecoration: "none", color: "inherit" }}>
                          <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.25rem", lineHeight: 1.3 }}>{item.name}</p>
                        </a>
                        <p style={{ fontSize: "0.75rem", color: "#888", marginBottom: "0.5rem" }}>{item.size} · {item.color}</p>
                        <p style={{ fontWeight: 800, fontSize: "0.875rem", marginBottom: "0.75rem" }}>BDT {(item.price * item.quantity).toLocaleString()}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ display: "flex", border: "1px solid #e0e0e0", overflow: "hidden" }}>
                            <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: "28px", height: "28px", border: "none", background: "white", cursor: "var(--chat-cursor,auto)", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                            <span style={{ width: "32px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.82rem", fontWeight: 700, borderLeft: "1px solid #e0e0e0", borderRight: "1px solid #e0e0e0" }}>{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: "28px", height: "28px", border: "none", background: "white", cursor: "var(--chat-cursor,auto)", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                          </div>
                          <button onClick={() => setRemoveConfirm(item.id)} style={{ fontSize: "0.7rem", color: "#cc0000", background: "none", border: "none", cursor: "var(--chat-cursor,auto)", textDecoration: "underline", padding: 0 }}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "#666" }}>Subtotal ({count} items)</span>
                  <span style={{ fontWeight: 900, fontSize: "1.1rem" }}>BDT {total.toLocaleString()}</span>
                </div>
                <p style={{ fontSize: "0.72rem", color: "#999", marginBottom: "1rem", textAlign: "center" }}>Delivery charges calculated at checkout · Cash on Delivery</p>
                <CheckoutButton setOpen={setOpen} />
                <button onClick={() => setClearConfirm(true)} style={{ width: "100%", padding: "0.6rem", backgroundColor: "white", color: "#666", border: "1px solid #e0e0e0", fontSize: "0.75rem", cursor: "var(--chat-cursor,auto)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Clear Cart
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

export function CartButton() {
  const { count, setOpen } = useCart()
  return (
    <button
      onClick={() => setOpen(true)}
      style={{ position: "relative", width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "white", border: "none", cursor: "var(--chat-cursor,auto)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.12)", flexShrink: 0 }}
      title="View Cart"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      {count > 0 && (
        <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "black", color: "white", fontSize: "0.6rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  )
}
