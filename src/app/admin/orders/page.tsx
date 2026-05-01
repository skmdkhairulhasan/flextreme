"use client"
import { useEffect, useState } from "react"

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return mobile
}

const statusColors: Record<string, string> = {
  pending: "#f0a500", confirmed: "#2563eb", processing: "#7c3aed",
  shipped: "#0891b2", delivered: "#16a34a", cancelled: "#dc2626",
}
const statusBg: Record<string, string> = {
  pending: "#fef9c3", confirmed: "#dbeafe", processing: "#f3e8ff",
  shipped: "#e0f2fe", delivered: "#dcfce7", cancelled: "#fee2e2",
}

type Order = {
  id: string; name: string; phone: string; address: string
  product_name: string; size?: string; color?: string
  quantity: number; total_price: number; status: string
  notes?: string; created_at: string; product_id?: string
  tracking_url?: string; email?: string
}

type EditForm = { name: string; phone: string; address: string; notes: string; total_price: string }

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ name: "", phone: "", address: "", notes: "", total_price: "" })
  const [addressPopup, setAddressPopup] = useState<{ name: string; phone: string; address: string; notes?: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders")
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function startEdit(order: Order) {
    setEditingId(order.id)
    setEditForm({
      name: order.name,
      phone: order.phone,
      address: order.address,
      notes: order.notes || "",
      total_price: String(order.total_price)
    })
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          address: editForm.address.trim(),
          notes: editForm.notes.trim(),
          total_price: Number(editForm.total_price) || 0,
        }),
      })
      setOrders(prev => prev.map(o => o.id === editingId ? { ...o, ...editForm, total_price: Number(editForm.total_price) } : o))
      setEditingId(null)
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId)
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (e) {
      console.error(e)
    }
    setUpdating(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await fetch(`/api/orders?id=${deleteTarget.id}`, { method: "DELETE" })
      setOrders(prev => prev.filter(o => o.id !== deleteTarget.id))
    } catch (e) {
      console.error(e)
    }
    setDeleteTarget(null)
  }

  async function bulkDelete() {
    setBulkDeleting(true)
    try {
      await Promise.all(Array.from(selected).map(id =>
        fetch(`/api/orders?id=${id}`, { method: "DELETE" })
      ))
      setOrders(prev => prev.filter(o => !selected.has(o.id)))
      setSelected(new Set())
    } catch (e) {
      console.error(e)
    }
    setBulkDeleting(false)
  }

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter)
  const statusCounts: Record<string, number> = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  }

  if (loading) return <div style={{ padding: "2rem" }}><p>Loading orders...</p></div>

  return (
    <div style={{ padding: isMobile ? "1rem" : "2rem" }}>
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "white", padding: "2rem", maxWidth: "400px", width: "90%" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Delete Order?</h3>
            <p style={{ marginBottom: "1.5rem", color: "#666" }}>Delete {deleteTarget.label}? This cannot be undone.</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: "0.5rem 1rem", backgroundColor: "#f5f5f5", border: "none", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Address Popup Modal */}
      {addressPopup && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "white", padding: "2rem", maxWidth: "500px", width: "90%" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Delivery Information</h3>
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>Name:</p>
              <p style={{ fontSize: "0.875rem", color: "#666" }}>{addressPopup.name}</p>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>Phone:</p>
              <p style={{ fontSize: "0.875rem", color: "#666" }}>{addressPopup.phone}</p>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>Address:</p>
              <p style={{ fontSize: "0.875rem", color: "#666", whiteSpace: "pre-wrap" }}>{addressPopup.address}</p>
            </div>
            {addressPopup.notes && (
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>Notes:</p>
                <p style={{ fontSize: "0.875rem", color: "#666", whiteSpace: "pre-wrap" }}>{addressPopup.notes}</p>
              </div>
            )}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => copyAddress(addressPopup.address)} style={{ flex: 1, padding: "0.75rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>
                {copied ? "Copied ✓" : "Copy Address"}
              </button>
              <button onClick={() => setAddressPopup(null)} style={{ padding: "0.75rem 1.5rem", backgroundColor: "#f5f5f5", border: "none", fontWeight: 600, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>Orders</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.5rem" }}>{orders.length} total orders</p>
        </div>
        {selected.size > 0 && (
          <button onClick={bulkDelete} disabled={bulkDeleting} style={{ padding: "0.75rem 1.5rem", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", fontWeight: 700, cursor: bulkDeleting ? "not-allowed" : "pointer" }}>
            {bulkDeleting ? "Deleting..." : `Delete ${selected.size} Selected`}
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {(["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: filter === status ? "black" : "#f5f5f5",
              color: filter === status ? "white" : "#666",
              border: "1px solid #e0e0e0",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: filter === status ? 700 : 400,
              textTransform: "capitalize"
            }}
          >
            {status} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", border: "1px solid #e0e0e0", backgroundColor: "white" }}>
          <p style={{ color: "#999" }}>No {filter === "all" ? "" : filter} orders found.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0" }}>
          {filtered.map(order => {
            const isEditing = editingId === order.id

            return (
              <div key={order.id} style={{ padding: "1.5rem", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "start" }}>
                  <input
                    type="checkbox"
                    checked={selected.has(order.id)}
                    onChange={e => {
                      const next = new Set(selected)
                      if (e.target.checked) next.add(order.id)
                      else next.delete(order.id)
                      setSelected(next)
                    }}
                    style={{ marginTop: "0.25rem" }}
                  />

                  <div style={{ flex: 1 }}>
                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <input value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Name" style={{ padding: "0.5rem", border: "1px solid #e0e0e0", width: "100%" }} />
                        <input value={editForm.phone} onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone" style={{ padding: "0.5rem", border: "1px solid #e0e0e0", width: "100%" }} />
                        <textarea value={editForm.address} onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Address" rows={2} style={{ padding: "0.5rem", border: "1px solid #e0e0e0", width: "100%", fontFamily: "inherit" }} />
                        <textarea value={editForm.notes} onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes" rows={2} style={{ padding: "0.5rem", border: "1px solid #e0e0e0", width: "100%", fontFamily: "inherit" }} />
                        <input type="number" value={editForm.total_price} onChange={e => setEditForm(prev => ({ ...prev, total_price: e.target.value }))} placeholder="Price" style={{ padding: "0.5rem", border: "1px solid #e0e0e0", width: "150px" }} />
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button onClick={saveEdit} disabled={saving} style={{ padding: "0.5rem 1rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button onClick={() => setEditingId(null)} style={{ padding: "0.5rem 1rem", backgroundColor: "#f5f5f5", border: "none", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{order.name}</p>
                            <p style={{ fontSize: "0.75rem", color: "#666" }}>{order.phone}</p>
                            <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem", cursor: "pointer" }} onClick={() => setAddressPopup({ name: order.name, phone: order.phone, address: order.address, notes: order.notes })}>
                              📍 {order.address.slice(0, 40)}{order.address.length > 40 ? "..." : ""}
                            </p>
                          </div>
                          <select
                            value={order.status}
                            onChange={e => updateStatus(order.id, e.target.value)}
                            disabled={!!updating}
                            style={{ padding: "0.5rem", border: "1px solid #e0e0e0", fontSize: "0.75rem", fontWeight: 700, backgroundColor: statusBg[order.status], color: statusColors[order.status], cursor: "pointer" }}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div style={{ padding: "1rem", backgroundColor: "#f9f9f9", marginBottom: "0.75rem" }}>
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>{order.product_name}</p>
                          <div style={{ fontSize: "0.75rem", color: "#666" }}>
                            {order.size && <span>Size: {order.size}</span>}
                            {order.size && order.color && <span> • </span>}
                            {order.color && <span>Color: {order.color}</span>}
                            <span> • Qty: {order.quantity}</span>
                          </div>
                          <p style={{ fontSize: "1rem", fontWeight: 700, marginTop: "0.5rem" }}>BDT {order.total_price.toLocaleString()}</p>
                        </div>

                        {order.notes && (
                          <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.75rem", fontStyle: "italic" }}>
                            Note: {order.notes}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", flexWrap: "wrap" }}>
                          <button onClick={() => startEdit(order)} style={{ padding: "0.5rem 1rem", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => setDeleteTarget({ id: order.id, label: `order from ${order.name}` })} style={{ padding: "0.5rem 1rem", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", fontWeight: 600, cursor: "pointer" }}>Delete</button>
                          <span style={{ padding: "0.5rem", color: "#999" }}>{new Date(order.created_at).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
