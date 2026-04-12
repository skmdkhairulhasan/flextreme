"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { createClient } from "@/lib/supabase/client"

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check(); window.addEventListener("resize", check)
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
const allStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]

type Order = {
  id: string; name: string; phone: string; address: string
  product_name: string; size: string; color: string
  quantity: number; total_price: number; status: string
  notes: string; created_at: string; product_id: string
  tracking_url?: string
}

type EditForm = { name: string; phone: string; address: string; notes: string; total_price: string }
type DeleteTarget = { id: string; label: string } | null

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ name: "", phone: "", address: "", notes: "", total_price: "" })
  const [saving, setSaving] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const supabase = createClient()
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
    setOrders((data || []) as Order[])
    setLoading(false)
  }

  function startEdit(order: Order) {
    setEditingId(order.id)
    setEditForm({ name: order.name, phone: order.phone, address: order.address, notes: order.notes || "", total_price: String(order.total_price) })
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("orders").update({
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      address: editForm.address.trim(),
      notes: editForm.notes.trim(),
      total_price: Number(editForm.total_price) || 0,
    }).eq("id", editingId)
    setOrders(prev => prev.map(o => o.id === editingId ? { ...o, ...editForm, total_price: Number(editForm.total_price) } : o))
    setEditingId(null)
    setSaving(false)
  }

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId)
    const supabase = createClient()
    const order = orders.find(o => o.id === orderId)
    const prevStatus = order?.status
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)
    const counted = ["confirmed", "processing", "shipped", "delivered"]
    // Stock is NEVER modified by order status changes
    // Main stock = what admin sets manually, always fixed
    // Available stock = main stock - confirmed/delivered orders (calculated in stock page)
    // Cancelling reduces sold count automatically since stock page reads live orders
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    setUpdating(null)
    // Recalculate customer stats after status change
    if (order?.phone) await recalculateCustomer(supabase, order.phone)
  }

  async function archiveOrderToCustomer(supabase: any, order: any) {
    try {
      // Get existing customer
      const { data: cust } = await supabase
        .from("customers").select("order_history").eq("phone", order.phone).single()
      if (!cust) return
      const history = cust.order_history || []
      // Add this order as a snapshot (won't be lost when order is deleted)
      const snapshot = {
        id: order.id,
        product_name: order.product_name,
        size: order.size || "",
        color: order.color || "",
        quantity: order.quantity || 1,
        total_price: order.total_price,
        status: order.status,
        created_at: order.created_at,
        deleted: true,  // mark as deleted order
      }
      // Avoid duplicates
      const exists = history.find((h: any) => h.id === order.id)
      if (!exists) {
        await supabase.from("customers")
          .update({ order_history: [...history, snapshot] })
          .eq("phone", order.phone)
      }
    } catch {}
  }

  async function recalculateCustomer(supabase: any, phone: string) {
    try {
      const { data: custOrders } = await supabase
        .from("orders")
        .select("total_price, status")
        .eq("phone", phone)
      if (!custOrders) return
      const counted = ["confirmed", "processing", "shipped", "delivered"]
      const totalOrders = custOrders.filter((o: any) => counted.includes(o.status)).length
      const totalSpent = custOrders.filter((o: any) => counted.includes(o.status))
        .reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0)
      await supabase.from("customers")
        .update({ total_orders: totalOrders, total_spent: totalSpent })
        .eq("phone", phone)
    } catch {}
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const supabase = createClient()
    if (deleteTarget.id === "__bulk__") {
      setBulkDeleting(true)
      const bulkOrders = orders.filter(o => selected.has(o.id))
      const affectedPhones = [...new Set(bulkOrders.map(o => o.phone).filter(Boolean))]
      // Save snapshots to customer records before deleting
      for (const o of bulkOrders) if (o.phone) await archiveOrderToCustomer(supabase, o)
      await supabase.from("orders").delete().in("id", Array.from(selected))
      setOrders(prev => prev.filter(o => !selected.has(o.id)))
      setSelected(new Set())
      setBulkDeleting(false)
      for (const phone of affectedPhones) await recalculateCustomer(supabase, phone)
    } else {
      const deletedOrder = orders.find(o => o.id === deleteTarget.id)
      // Save order snapshot to customer record before deleting
      if (deletedOrder?.phone) await archiveOrderToCustomer(supabase, deletedOrder)
      await supabase.from("orders").delete().eq("id", deleteTarget.id)
      setOrders(prev => prev.filter(o => o.id !== deleteTarget.id))
      setSelected(prev => { const s = new Set(prev); s.delete(deleteTarget.id); return s })
      if (deletedOrder?.phone) await recalculateCustomer(supabase, deletedOrder.phone)
    }
    setDeleteTarget(null)
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  function toggleSelectAll() {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(o => o.id)))
  }

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter)
  const counts = allStatuses.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc }, {} as Record<string, number>)

  const inp = (extra?: any) => ({ border: "1px solid #e0e0e0", padding: "0.5rem 0.75rem", fontSize: "0.85rem", outline: "none", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit", ...extra })

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>Loading...</div>

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>

      {/* Delete confirmation modal — portal to escape overflow:hidden */}
      {deleteTarget && typeof document !== "undefined" && createPortal(
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "white", padding: "1.75rem", maxWidth: "400px", width: "100%", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🗑️</div>
            <h3 style={{ fontWeight: 900, fontSize: "1rem", marginBottom: "0.5rem" }}>Delete Order?</h3>
            <p style={{ color: "#555", fontSize: "0.85rem", marginBottom: "0.25rem" }}>{deleteTarget.label}</p>
            <p style={{ color: "#999", fontSize: "0.78rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>This will permanently delete the order. <strong>Cannot be undone.</strong></p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={confirmDelete} disabled={bulkDeleting} style={{ flex: 1, padding: "0.75rem", backgroundColor: "#dc2626", color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>
                {bulkDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "0.75rem", backgroundColor: "white", border: "1px solid #e0e0e0", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit order modal */}
      {editingId && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "white", padding: "1.75rem", maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontWeight: 900, fontSize: "1rem", textTransform: "uppercase", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "2px solid black" }}>Edit Order Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.3rem", color: "#555" }}>Customer Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inp()} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.3rem", color: "#555" }}>Phone Number</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} style={inp()} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.3rem", color: "#555" }}>Delivery Address</label>
                <textarea value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} rows={3} style={{ ...inp(), resize: "vertical" as const }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.3rem", color: "#555" }}>Order Total (BDT)</label>
                <input type="number" value={editForm.total_price} onChange={e => setEditForm(f => ({ ...f, total_price: e.target.value }))} style={inp()} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.3rem", color: "#555" }}>Notes</label>
                <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" style={inp()} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={saveEdit} disabled={saving} style={{ flex: 1, padding: "0.875rem", backgroundColor: saving ? "#444" : "black", color: "white", border: "none", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: "0.85rem" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "0.875rem", backgroundColor: "white", border: "1px solid #e0e0e0", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "1.35rem" : "1.75rem", fontWeight: 900, textTransform: "uppercase" }}>Orders</h1>
          <p style={{ color: "#666", fontSize: "0.8rem" }}>{orders.length} total</p>
        </div>
        {selected.size > 0 && (
          <button onClick={() => setDeleteTarget({ id: "__bulk__", label: selected.size + " orders selected" })} style={{ padding: "0.6rem 1rem", backgroundColor: "#dc2626", color: "white", border: "none", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}>
            🗑 Delete {selected.size}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", overflowX: "auto", touchAction: "pan-x" as any, overscrollBehaviorX: "contain" as any, WebkitOverflowScrolling: "touch" as any, borderBottom: "2px solid black", marginBottom: "0.875rem", WebkitOverflowScrolling: "touch" as any, }}>
        {[{ id: "all", label: "All (" + orders.length + ")" }, ...allStatuses.map(s => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1) + " (" + counts[s] + ")" }))].map(tab => (
          <button key={tab.id} onClick={() => { setFilter(tab.id); setSelected(new Set()) }} style={{ padding: isMobile ? "0.5rem 0.75rem" : "0.6rem 1rem", fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", border: "none", borderBottom: filter === tab.id ? "3px solid black" : "3px solid transparent", marginBottom: "-2px", backgroundColor: "transparent", cursor: "pointer", color: filter === tab.id ? "black" : "#999", whiteSpace: "nowrap" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Select all */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", backgroundColor: "#f9f9f9", border: "1px solid #e0e0e0", marginBottom: "0.5rem", fontSize: "0.75rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: 600 }}>
            <input type="checkbox" checked={selected.size === filtered.length} onChange={toggleSelectAll} style={{ width: "14px", height: "14px" }} />
            Select all
          </label>
          {selected.size > 0 && <span style={{ color: "#dc2626", fontWeight: 600 }}>{selected.size} selected</span>}
        </div>
      )}

      {/* MOBILE cards */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>No orders.</div>}
          {filtered.map(order => (
            <div key={order.id} style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "0.875rem", borderLeft: "3px solid " + (statusColors[order.status] || "#e0e0e0") }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)} style={{ width: "14px", height: "14px" }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.88rem" }}>{order.name}</p>
                    <p style={{ fontSize: "0.72rem", color: "#888" }}>{order.phone}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 800, fontSize: "0.9rem" }}>BDT {Number(order.total_price).toLocaleString()}</p>
                  <p style={{ fontSize: "0.65rem", color: "#bbb" }}>{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                </div>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#555", marginBottom: "0.2rem" }}>{order.product_name}</p>
              <p style={{ fontSize: "0.7rem", color: "#999", marginBottom: "0.75rem" }}>{order.size} · {order.color} · Qty {order.quantity}</p>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, backgroundColor: statusBg[order.status] || "#f0f0f0", color: statusColors[order.status] || "#666", padding: "0.2rem 0.6rem", borderRadius: "20px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{order.status}</span>
                <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} disabled={updating === order.id} style={{ flex: 1, padding: "0.4rem", fontSize: "0.78rem", border: "1px solid #e0e0e0", backgroundColor: "white", outline: "none" }}>
                  {allStatuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <input
                type="text"
                placeholder="Add tracking URL..."
                defaultValue={order.tracking_url || ""}
                onBlur={async e => {
                  const url = e.target.value.trim()
                  if (url === (order.tracking_url || "")) return
                  const supabase = createClient()
                  await supabase.from("orders").update({ tracking_url: url }).eq("id", order.id)
                }}
                style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.35rem 0.5rem", fontSize: "0.72rem", outline: "none", marginBottom: "0.4rem", boxSizing: "border-box" as const }}
              />
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button onClick={() => startEdit(order)} style={{ flex: 1, padding: "0.45rem", fontSize: "0.72rem", fontWeight: 700, backgroundColor: "black", color: "white", border: "none", cursor: "pointer", textTransform: "uppercase" }}>✏️ Edit</button>
                <button onClick={() => setDeleteTarget({ id: order.id, label: order.name + " — " + order.product_name })} style={{ padding: "0.45rem 0.75rem", fontSize: "0.72rem", fontWeight: 700, backgroundColor: "#fff0f0", border: "1px solid #ffcccc", color: "#cc0000", cursor: "pointer" }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DESKTOP */
        <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>No orders.</div>
          ) : filtered.map((order) => (
            <div key={order.id} style={{ padding: "1rem 1.25rem", borderTop: "1px solid #f0f0f0", display: "grid", gridTemplateColumns: "28px 1fr auto", gap: "1rem", alignItems: "start", backgroundColor: selected.has(order.id) ? "#fff9f9" : "white" }}>
              <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)} style={{ width: "15px", height: "15px", marginTop: "4px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{order.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "#888" }}>{order.phone}</p>
                  <p style={{ fontSize: "0.7rem", color: "#bbb" }}>{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.85rem" }}>{order.product_name}</p>
                  <p style={{ fontSize: "0.75rem", color: "#888" }}>Size: {order.size} · Color: {order.color} · Qty: {order.quantity}</p>
                  {order.notes && <p style={{ fontSize: "0.7rem", color: "#999", fontStyle: "italic" }}>Note: {order.notes}</p>}
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: "0.95rem" }}>BDT {Number(order.total_price).toLocaleString()}</p>
                  <p style={{ fontSize: "0.7rem", color: "#bbb", wordBreak: "break-all" }}>{order.address}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: statusColors[order.status], backgroundColor: statusBg[order.status], padding: "0.2rem 0.6rem", borderRadius: "20px", textTransform: "uppercase", display: "inline-block" }}>{order.status}</span>
                  <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} disabled={updating === order.id} style={{ padding: "0.35rem 0.5rem", fontSize: "0.75rem", border: "1px solid #e0e0e0", outline: "none", backgroundColor: "white" }}>
                    {allStatuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Tracking URL..."
                    defaultValue={order.tracking_url || ""}
                    onBlur={async e => {
                      const url = e.target.value.trim()
                      if (url === (order.tracking_url || "")) return
                      const supabase = createClient()
                      await supabase.from("orders").update({ tracking_url: url }).eq("id", order.id)
                    }}
                    style={{ border: "1px solid #e0e0e0", padding: "0.3rem 0.5rem", fontSize: "0.65rem", outline: "none", width: "100%", boxSizing: "border-box" as const }}
                  />
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <button onClick={() => startEdit(order)} style={{ flex: 1, padding: "0.3rem 0.5rem", fontSize: "0.65rem", fontWeight: 700, backgroundColor: "black", color: "white", border: "none", cursor: "pointer", textTransform: "uppercase" }}>Edit</button>
                    <button onClick={() => setDeleteTarget({ id: order.id, label: order.name + " — " + order.product_name })} style={{ padding: "0.3rem 0.6rem", fontSize: "0.65rem", fontWeight: 700, backgroundColor: "#fff0f0", border: "1px solid #ffcccc", color: "#cc0000", cursor: "pointer" }}>Del</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
