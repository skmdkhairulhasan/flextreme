"use client"
import { useEffect, useState, useCallback } from "react"

type Customer = {
  id: string
  name: string
  phone: string
  email?: string
  flex100: boolean
  vip: boolean
  total_orders: number
  total_spent: number
  created_at: string
}

type Order = {
  id: string
  phone: string
  status: string
  total_price: number
  product_name?: string
  created_at: string
}

// ── In-page Toast ─────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }: { message: string; type: "success" | "error" | "info"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  const colors = {
    success: { bg: "#f0fdf4", border: "#86efac", color: "#15803d" },
    error:   { bg: "#fee2e2", border: "#fca5a5", color: "#dc2626" },
    info:    { bg: "#f0f9ff", border: "#7dd3fc", color: "#0369a1" },
  }[type]

  return (
    <div style={{
      position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
      backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
      color: colors.color, padding: "0.875rem 1.5rem",
      fontWeight: 700, fontSize: "0.875rem",
      boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      zIndex: 99999, whiteSpace: "nowrap",
      animation: "toastIn 0.2s ease-out",
    }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      {message}
    </div>
  )
}

function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const show = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type })
  }, [])
  const hide = useCallback(() => setToast(null), [])
  return { toast, show, hide }
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ customer, onSave, onClose }: { customer: Customer; onSave: (updated: Customer) => void; onClose: () => void }) {
  const [name, setName] = useState(customer.name)
  const [phone, setPhone] = useState(customer.phone)
  const [email, setEmail] = useState(customer.email || "")
  const [flex100, setFlex100] = useState(customer.flex100)
  const [vip, setVip] = useState(customer.vip)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    if (!name.trim()) { setError("Name is required"); return }
    if (!phone.trim()) { setError("Phone is required"); return }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id, name: name.trim(), phone: phone.trim(), email: email.trim() || null, flex100, vip }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      onSave({ ...customer, name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, flex100, vip })
    } catch (e: any) {
      setError(e.message || "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.75rem", border: "1px solid #e0e0e0",
    fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
  }
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.7rem", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.06em", color: "#999", marginBottom: "0.4rem",
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ backgroundColor: "white", width: "100%", maxWidth: "460px", padding: "2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase" }}>Edit Customer</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#999" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phone *</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={inputStyle} placeholder="optional" />
          </div>

          {/* Badge toggles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <button
              onClick={() => setFlex100(f => !f)}
              style={{
                padding: "0.875rem", border: flex100 ? "2px solid #7c3aed" : "1px solid #e0e0e0",
                backgroundColor: flex100 ? "#f3e8ff" : "white",
                color: flex100 ? "#7c3aed" : "#999",
                fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              }}
            >
              {flex100 ? "✓" : "○"} FLEX100
            </button>
            <button
              onClick={() => setVip(v => !v)}
              style={{
                padding: "0.875rem", border: vip ? "2px solid #dc2626" : "1px solid #e0e0e0",
                backgroundColor: vip ? "#fee2e2" : "white",
                color: vip ? "#dc2626" : "#999",
                fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              }}
            >
              {vip ? "✓" : "○"} VIP
            </button>
          </div>

          {flex100 && (
            <p style={{ fontSize: "0.72rem", color: "#7c3aed", backgroundColor: "#f3e8ff", padding: "0.5rem 0.75rem", fontWeight: 600 }}>
              FLEX100 = 10% lifetime discount on all orders at checkout
            </p>
          )}
        </div>

        {error && (
          <div style={{ margin: "1rem 0", padding: "0.65rem 0.875rem", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", fontSize: "0.82rem", color: "#dc2626", fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.875rem", backgroundColor: "white", border: "1px solid #e0e0e0", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "0.875rem", backgroundColor: saving ? "#555" : "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "flex100" | "vip" | "repeat" | "cancelled">("all")
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast, show: showToast, hide: hideToast } = useToast()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [cr, or] = await Promise.all([fetch("/api/customers"), fetch("/api/orders")])
      const cd = await cr.json()
      const od = await or.json()
      setCustomers(cd.customers || [])
      setOrders(od.orders || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function getCustomerOrders(phone: string) {
    return orders.filter(o => o.phone === phone)
  }

  function getOrderCount(phone: string) {
    return orders.filter(o => o.phone === phone && ["confirmed", "processing", "shipped", "delivered"].includes(o.status)).length
  }

  function hasCancelledOrder(phone: string) {
    return orders.some(o => o.phone === phone && o.status === "cancelled")
  }

  // ── Badge quick-toggle ──
  async function toggleBadge(customer: Customer, badge: "flex100" | "vip") {
    const updated = { ...customer, [badge]: !customer[badge] }
    setCustomers(prev => prev.map(c => c.id === customer.id ? updated : c))
    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id, [badge]: !customer[badge] }),
      })
      if (!res.ok) throw new Error("Failed")
      showToast(`${badge === "flex100" ? "FLEX100" : "VIP"} badge ${!customer[badge] ? "added" : "removed"} for ${customer.name}`, "success")
    } catch {
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c))
      showToast("Failed to update badge", "error")
    }
  }

  // ── Delete ──
  async function deleteCustomer(customer: Customer) {
    setDeletingId(customer.id)
    try {
      const res = await fetch(`/api/customers?id=${customer.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      setCustomers(prev => prev.filter(c => c.id !== customer.id))
      if (selected === customer.id) setSelected(null)
      showToast(`${customer.name} deleted`, "success")
    } catch {
      showToast("Failed to delete customer", "error")
    } finally {
      setDeletingId(null)
    }
  }

  // ── Copy to clipboard (in-page toast) ──
  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`✓ ${label} copied`, "info")
    }).catch(() => {
      showToast("Copy failed — try manually", "error")
    })
  }

  function exportToClipboard() {
    const headers = ["Name", "Phone", "Email", "Orders", "Total Spent", "FLEX100", "VIP"]
    const rows = filtered.map(c => [c.name, c.phone, c.email || "", c.total_orders, c.total_spent, c.flex100 ? "Yes" : "No", c.vip ? "Yes" : "No"])
    const tsv = [headers, ...rows].map(row => row.join("\t")).join("\n")
    navigator.clipboard.writeText(tsv).then(() => {
      showToast(`✓ ${filtered.length} customers copied — paste into Excel`, "info")
    }).catch(() => showToast("Copy failed", "error"))
  }

  // ── Filters ──
  const activeCustomers = customers.filter(c => c.total_orders > 0)
  const flex100Customers = customers.filter(c => c.flex100)
  const vipCustomers = customers.filter(c => c.vip)
  const repeatCustomers = customers.filter(c => getOrderCount(c.phone) >= 2)
  const cancelledCustomers = customers.filter(c => hasCancelledOrder(c.phone))

  let filtered = customers
  if (filter === "active") filtered = activeCustomers
  if (filter === "flex100") filtered = flex100Customers
  if (filter === "vip") filtered = vipCustomers
  if (filter === "repeat") filtered = repeatCustomers
  if (filter === "cancelled") filtered = cancelledCustomers
  if (search) {
    filtered = filtered.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
    )
  }

  // ── Customer of month/year ──
  const thisMonth = new Date().toISOString().slice(0, 7)
  const customerOfMonth = [...customers].sort((a, b) => {
    const as = orders.filter(o => o.phone === a.phone && o.created_at?.startsWith(thisMonth) && o.status === "delivered").reduce((s, o) => s + Number(o.total_price), 0)
    const bs = orders.filter(o => o.phone === b.phone && o.created_at?.startsWith(thisMonth) && o.status === "delivered").reduce((s, o) => s + Number(o.total_price), 0)
    return bs - as
  })[0]
  const customerOfYear = [...customers].sort((a, b) => b.total_spent - a.total_spent)[0]

  const statusColors: Record<string, string> = { pending: "#fef9c3", confirmed: "#dbeafe", processing: "#f3e8ff", shipped: "#e0f2fe", delivered: "#dcfce7", cancelled: "#fee2e2" }
  const statusTextColors: Record<string, string> = { pending: "#854d0e", confirmed: "#1d4ed8", processing: "#7c3aed", shipped: "#0369a1", delivered: "#16a34a", cancelled: "#dc2626" }

  if (loading) {
    return <div style={{ padding: "2rem" }}><h1 style={{ fontWeight: 900, textTransform: "uppercase" }}>Customers</h1><p style={{ color: "#999", marginTop: "1rem" }}>Loading...</p></div>
  }

  return (
    <div style={{ padding: "2rem" }}>
      {toast && <Toast message={toast.message} type={toast.type} onDone={hideToast} />}
      {editing && (
        <EditModal
          customer={editing}
          onClose={() => setEditing(null)}
          onSave={updated => {
            setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))
            setEditing(null)
            showToast(`${updated.name} updated`, "success")
          }}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>Customers</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.5rem" }}>{customers.length} total · {activeCustomers.length} active</p>
        </div>
        <button
          onClick={exportToClipboard}
          style={{ padding: "0.75rem 1.5rem", backgroundColor: "#16a34a", color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem", textTransform: "uppercase" }}
        >
          📋 Export {filtered.length} to Excel
        </button>
      </div>

      {/* Customer of month/year */}
      {(customerOfMonth?.total_spent > 0 || customerOfYear?.total_spent > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {customerOfMonth?.total_spent > 0 && (
            <div style={{ backgroundColor: "#fef3c7", border: "2px solid #fbbf24", padding: "1.5rem" }}>
              <p style={{ fontSize: "0.7rem", color: "#92400e", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>🏆 Customer of the Month</p>
              <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "#d97706" }}>{customerOfMonth.name}</p>
              <p style={{ fontSize: "0.875rem", color: "#92400e", marginTop: "0.25rem" }}>BDT {customerOfMonth.total_spent.toLocaleString()}</p>
            </div>
          )}
          {customerOfYear?.total_spent > 0 && (
            <div style={{ backgroundColor: "#fce7f3", border: "2px solid #f472b6", padding: "1.5rem" }}>
              <p style={{ fontSize: "0.7rem", color: "#9f1239", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>👑 Customer of the Year</p>
              <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "#db2777" }}>{customerOfYear.name}</p>
              <p style={{ fontSize: "0.875rem", color: "#9f1239", marginTop: "0.25rem" }}>BDT {customerOfYear.total_spent.toLocaleString()} all-time</p>
            </div>
          )}
        </div>
      )}

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
        {[
          { label: "All",       value: customers.length,        color: "#111",    bg: "#f5f5f5",  id: "all" },
          { label: "Active",    value: activeCustomers.length,  color: "#16a34a", bg: "#dcfce7",  id: "active" },
          { label: "FLEX100",   value: flex100Customers.length, color: "#7c3aed", bg: "#f3e8ff",  id: "flex100" },
          { label: "VIP",       value: vipCustomers.length,     color: "#dc2626", bg: "#fee2e2",  id: "vip" },
          { label: "Repeat",    value: repeatCustomers.length,  color: "#0369a1", bg: "#e0f2fe",  id: "repeat" },
          { label: "Cancelled", value: cancelledCustomers.length,color:"#dc2626", bg: "#fee2e2",  id: "cancelled" },
        ].map(stat => (
          <div key={stat.label} onClick={() => setFilter(stat.id as any)} style={{ backgroundColor: filter === stat.id ? stat.color : stat.bg, border: `1px solid ${stat.color}40`, padding: "1rem", cursor: "pointer", transition: "all 0.15s" }}>
            <p style={{ fontSize: "0.65rem", color: filter === stat.id ? "rgba(255,255,255,0.8)" : stat.color, marginBottom: "0.4rem", fontWeight: 700, textTransform: "uppercase" }}>{stat.label}</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 900, color: filter === stat.id ? "white" : stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: "1.25rem" }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name or phone..."
          style={{ width: "100%", maxWidth: "400px", padding: "0.75rem", border: "1px solid #e0e0e0", fontSize: "0.95rem", outline: "none" }}
        />
      </div>

      {/* Customer list */}
      <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "#999" }}>No customers found.</div>
        ) : filtered.map(customer => {
          const isRepeat = getOrderCount(customer.phone) >= 2
          const isCancelled = hasCancelledOrder(customer.phone)
          const isSelected = selected === customer.id
          const customerOrders = getCustomerOrders(customer.phone)

          return (
            <div key={customer.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              {/* Customer row */}
              <div
                onClick={() => setSelected(isSelected ? null : customer.id)}
                style={{ padding: "1rem 1.25rem", cursor: "pointer", backgroundColor: isSelected ? "#fafafa" : "white", display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{customer.name}</span>
                    {customer.flex100 && <span style={{ fontSize: "0.6rem", fontWeight: 900, backgroundColor: "#f3e8ff", color: "#7c3aed", padding: "0.1rem 0.45rem", borderRadius: "10px" }}>FLEX100</span>}
                    {customer.vip && <span style={{ fontSize: "0.6rem", fontWeight: 900, backgroundColor: "#fee2e2", color: "#dc2626", padding: "0.1rem 0.45rem", borderRadius: "10px" }}>VIP</span>}
                    {isRepeat && <span style={{ fontSize: "0.6rem", fontWeight: 900, backgroundColor: "#e0f2fe", color: "#0369a1", padding: "0.1rem 0.45rem", borderRadius: "10px" }}>REPEAT</span>}
                    {isCancelled && <span style={{ fontSize: "0.6rem", fontWeight: 900, backgroundColor: "#fee2e2", color: "#dc2626", padding: "0.1rem 0.45rem", borderRadius: "10px" }}>CANCELLED</span>}
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#666" }}>{customer.phone}</p>
                  {customer.email && <p style={{ fontSize: "0.75rem", color: "#999" }}>{customer.email}</p>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>BDT {customer.total_spent.toLocaleString()}</p>
                  <p style={{ fontSize: "0.72rem", color: "#999" }}>{customer.total_orders} orders</p>
                </div>
              </div>

              {/* Expanded detail */}
              {isSelected && (
                <div style={{ padding: "1.25rem 1.25rem 1.5rem", borderTop: "1px solid #f0f0f0", backgroundColor: "#fafafa" }}>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                    <button
                      onClick={e => { e.stopPropagation(); setEditing(customer) }}
                      style={{ padding: "0.5rem 1rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", textTransform: "uppercase" }}
                    >
                      ✏️ Edit
                    </button>

                    <button
                      onClick={e => { e.stopPropagation(); toggleBadge(customer, "flex100") }}
                      style={{ padding: "0.5rem 1rem", backgroundColor: customer.flex100 ? "#f3e8ff" : "white", color: customer.flex100 ? "#7c3aed" : "#999", border: customer.flex100 ? "1px solid #c4b5fd" : "1px solid #e0e0e0", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}
                    >
                      {customer.flex100 ? "✓ FLEX100 ON" : "○ FLEX100 OFF"}
                    </button>

                    <button
                      onClick={e => { e.stopPropagation(); toggleBadge(customer, "vip") }}
                      style={{ padding: "0.5rem 1rem", backgroundColor: customer.vip ? "#fee2e2" : "white", color: customer.vip ? "#dc2626" : "#999", border: customer.vip ? "1px solid #fca5a5" : "1px solid #e0e0e0", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}
                    >
                      {customer.vip ? "✓ VIP ON" : "○ VIP OFF"}
                    </button>

                    <button
                      onClick={e => { e.stopPropagation(); copyToClipboard(customer.phone, "Phone number") }}
                      style={{ padding: "0.5rem 1rem", backgroundColor: "white", color: "#555", border: "1px solid #e0e0e0", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}
                    >
                      📋 Copy Phone
                    </button>

                    {customer.email && (
                      <button
                        onClick={e => { e.stopPropagation(); copyToClipboard(customer.email!, "Email") }}
                        style={{ padding: "0.5rem 1rem", backgroundColor: "white", color: "#555", border: "1px solid #e0e0e0", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}
                      >
                        📋 Copy Email
                      </button>
                    )}

                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (!confirm(`Delete ${customer.name}? This cannot be undone.`)) return
                        deleteCustomer(customer)
                      }}
                      disabled={deletingId === customer.id}
                      style={{ padding: "0.5rem 1rem", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", fontWeight: 700, fontSize: "0.75rem", cursor: deletingId === customer.id ? "not-allowed" : "pointer", marginLeft: "auto" }}
                    >
                      {deletingId === customer.id ? "Deleting..." : "🗑 Delete"}
                    </button>
                  </div>

                  {/* Order history */}
                  <h4 style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: "0.75rem" }}>Order History</h4>
                  {customerOrders.length === 0 ? (
                    <p style={{ fontSize: "0.875rem", color: "#bbb" }}>No orders yet</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {customerOrders.slice(0, 8).map(order => (
                        <div key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", backgroundColor: "white", border: "1px solid #f0f0f0", gap: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "10px", backgroundColor: statusColors[order.status] || "#f5f5f5", color: statusTextColors[order.status] || "#666", whiteSpace: "nowrap", flexShrink: 0 }}>
                              {order.status}
                            </span>
                            <span style={{ fontSize: "0.78rem", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {order.product_name || "Order"}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                            <span style={{ fontWeight: 700, fontSize: "0.82rem" }}>BDT {Number(order.total_price).toLocaleString()}</span>
                            <span style={{ fontSize: "0.7rem", color: "#bbb" }}>{new Date(order.created_at).toLocaleDateString("en-BD", { month: "short", day: "numeric" })}</span>
                          </div>
                        </div>
                      ))}
                      {customerOrders.length > 8 && (
                        <p style={{ fontSize: "0.72rem", color: "#999", textAlign: "center", paddingTop: "0.25rem" }}>+{customerOrders.length - 8} more orders</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
