"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import ConfirmModal from "@/components/ui/ConfirmModal"

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

type Customer = {
  id: string
  name: string
  phone: string
  flex100: boolean
  vip: boolean
  total_orders: number
  total_spent: number
  created_at: string
  order_history?: OrderSnapshot[]  // archived orders that were deleted
}
type OrderSnapshot = {
  id: string
  product_name: string
  size: string
  color: string
  quantity: number
  total_price: number
  status: string
  created_at: string
  deleted: boolean
}

type Order = {
  id: string
  phone: string
  product_name: string
  size?: string
  color?: string
  quantity?: number
  total_price: number
  status: string
  created_at: string
}

function formatDate(iso: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

export default function AdminCustomers() {
  const supabase = createClient()
  const isMobile = useIsMobile()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [tableError, setTableError] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: cust, error: custErr }, { data: ord }] = await Promise.all([
      supabase.from("customers").select("*").order("total_spent", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
    ])
    if (custErr && custErr.code === "42P01") { setTableError(true); setLoading(false); return }

    // If customers table is empty but orders exist, rebuild from orders
    let customerList = cust || []
    if (customerList.length === 0 && ord && ord.length > 0) {
      // Auto-rebuild customers from orders
      const phoneMap: Record<string, any> = {}
      ;(ord || []).forEach((o: any) => {
        if (!o.phone) return
        const customerName = o.name || o.customer_name || "Unknown"
        if (!phoneMap[o.phone]) {
          phoneMap[o.phone] = { name: customerName, phone: o.phone, total_orders: 0, total_spent: 0 }
        } else {
          // Keep most recent name
          if (customerName !== "Unknown") phoneMap[o.phone].name = customerName
        }
        // Count all non-cancelled, non-pending orders for totals
        const counted = ["confirmed", "processing", "shipped", "delivered"].includes(o.status)
        if (counted) {
          phoneMap[o.phone].total_orders++
          phoneMap[o.phone].total_spent += Number(o.total_price || 0)
        }
      })
      // Insert missing customers
      const toInsert = Object.values(phoneMap).map((c: any, i: number) => ({
        name: c.name,
        phone: c.phone,
        total_orders: c.total_orders,
        total_spent: c.total_spent,
        flex100: i < 100,
        vip: false,
      }))
      if (toInsert.length > 0) {
        const { data: inserted } = await supabase.from("customers").insert(toInsert).select()
        customerList = inserted || toInsert as any
      }
    }

    setCustomers(customerList)
    setOrders(ord || [])
    setLoading(false)
  }

  function ordersOf(phone: string) {
    const liveOrders = orders.filter(o => o.phone === phone)
    const liveIds = new Set(liveOrders.map(o => o.id))
    // Merge with archived snapshots (deleted orders)
    const customer = customers.find(c => c.phone === phone)
    const archived = (customer?.order_history || [])
      .filter((h: OrderSnapshot) => !liveIds.has(h.id))  // avoid dupes
    const all = [...liveOrders, ...archived]
    return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  async function toggleFlex(c: Customer) {
    await supabase.from("customers").update({ flex100: !c.flex100 }).eq("id", c.id)
    setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, flex100: !x.flex100 } : x))
  }

  async function toggleVip(c: Customer) {
    await supabase.from("customers").update({ vip: !c.vip }).eq("id", c.id)
    setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, vip: !x.vip } : x))
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from("customers").delete().eq("id", deleteTarget.id)
    setCustomers(prev => prev.filter(c => c.id !== deleteTarget.id))
    setDeleting(false)
    setDeleteTarget(null)
  }

  // Derived segments
  // Check BOTH live orders AND archived snapshots for cancelled status
  const cancelledPhones = new Set([
    ...orders.filter(o => o.status === "cancelled").map(o => o.phone),
    ...customers.filter(c =>
      (c.order_history || []).some((h: OrderSnapshot) => h.status === "cancelled")
    ).map(c => c.phone),
  ])
  const cancelledCustomers = customers.filter(c => cancelledPhones.has(c.phone))
  const repeatCustomers = customers.filter(c => c.total_orders >= 2)

  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()
  const customerOfMonth = [...customers]
    .filter(c => { const d = new Date(c.created_at); return d.getMonth() === thisMonth && d.getFullYear() === thisYear })
    .sort((a, b) => b.total_spent - a.total_spent)[0]
  const customerOfYear = [...customers].sort((a, b) => b.total_spent - a.total_spent)[0]

  let filtered = customers
  if (tab === "flex100") filtered = customers.filter(c => c.flex100)
  if (tab === "vip") filtered = customers.filter(c => c.vip)
  if (tab === "cancelled") filtered = cancelledCustomers
  if (tab === "repeat") filtered = repeatCustomers
  if (tab === "month") filtered = customerOfMonth ? [customerOfMonth] : []
  if (tab === "year") filtered = customerOfYear ? [customerOfYear] : []

  if (search) {
    filtered = filtered.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    )
  }

  const statusColor: Record<string, string> = {
    delivered: "#16a34a", shipped: "#0ea5e9", confirmed: "#f59e0b",
    processing: "#8b5cf6", cancelled: "#dc2626", pending: "#999",
  }

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>Loading customers...</div>
  
  if (tableError) return (
    <div style={{ padding: "2rem", backgroundColor: "#fff0f0", border: "1px solid #ffcccc" }}>
      <h2 style={{ color: "#cc0000", marginBottom: "0.75rem" }}>Customers table not found</h2>
      <p style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>Run this SQL in your Supabase dashboard → SQL Editor:</p>
      <pre style={{ backgroundColor: "#1e1e1e", color: "#4ade80", padding: "1rem", fontSize: "0.78rem", overflowX: "auto" }}>{`CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  phone text UNIQUE,
  flex100 boolean DEFAULT false,
  vip boolean DEFAULT false,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);`}</pre>
      <p style={{ fontSize: "0.82rem", marginTop: "0.75rem", color: "#666" }}>After running the SQL, refresh this page and customers will be auto-imported from your orders.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Customer?"
        message={deleteTarget ? "Permanently delete <strong>" + deleteTarget.name + "</strong>? This cannot be undone." : ""}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "1.35rem" : "1.75rem", fontWeight: 900, textTransform: "uppercase" }}>Customers</h1>
          <p style={{ color: "#666", fontSize: "0.8rem" }}>{customers.length} total customers</p>
        </div>
        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or phone..."
          style={{ border: "1px solid #e0e0e0", padding: "0.5rem 0.875rem", fontSize: "0.82rem", outline: "none", width: isMobile ? "100%" : "220px" }}
        />
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5,1fr)", gap: "0.6rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total", value: customers.length, color: "#111" },
          { label: "🥇 FLEX100", value: customers.filter(c => c.flex100).length, color: "#92400e", bg: "#fef3c7" },
          { label: "VIP", value: customers.filter(c => c.vip).length, color: "#7c3aed", bg: "#f3e8ff" },
          { label: "Repeat", value: repeatCustomers.length, color: "#0369a1", bg: "#e0f2fe" },
          { label: "Cancelled", value: cancelledCustomers.length, color: "#dc2626", bg: "#fee2e2" },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: s.bg || "white", border: "1px solid #e0e0e0", padding: "0.75rem", textAlign: "center" }}>
            <p style={{ fontSize: isMobile ? "1.3rem" : "1.5rem", fontWeight: 900, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "0.65rem", color: s.color, textTransform: "uppercase", fontWeight: 700 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", overflowX: "auto", borderBottom: "2px solid black", marginBottom: "1rem" }}>
        {[
          { id: "all", label: "All" },
          { id: "flex100", label: "🥇 FLEX100" },
          { id: "vip", label: "VIP" },
          { id: "repeat", label: "Repeat" },
          { id: "cancelled", label: "Cancelled" },
          { id: "month", label: "⭐ Month" },
          { id: "year", label: "🏆 Year" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "0.55rem 0.875rem", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase",
            border: "none", borderBottom: tab === t.id ? "3px solid black" : "3px solid transparent",
            marginBottom: "-2px", backgroundColor: "transparent", cursor: "pointer",
            color: tab === t.id ? "black" : "#999", whiteSpace: "nowrap",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", overflowX: "auto" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 80px 100px" : "1fr 80px 120px 120px 80px 80px 180px", gap: "0.75rem", padding: "0.6rem 1rem", backgroundColor: "black", color: "white", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>
          <span>Customer</span>
          <span>Orders</span>
          <span>Spent</span>
          {!isMobile && <><span>Tags</span><span>F100</span><span>VIP</span><span>Actions</span></>}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "#999", fontSize: "0.85rem" }}>No customers found.</div>
        )}

        {filtered.map(c => {
          const hasCancel = cancelledPhones.has(c.phone)
          const isRepeat = c.total_orders >= 2
          return (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 80px 100px" : "1fr 80px 120px 120px 80px 80px 180px", gap: "0.75rem", padding: "0.875rem 1rem", borderTop: "1px solid #f0f0f0", alignItems: "center" }}>

              {/* Name + phone */}
              <div onClick={() => setSelected(c)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{c.name}</p>
                  {c.flex100 && <span style={{ fontSize: "0.6rem", fontWeight: 900, backgroundColor: "#fbbf24", color: "#78350f", padding: "0.1rem 0.45rem", borderRadius: "10px", border: "1px solid #f59e0b", letterSpacing: "0.05em" }}>FLEX100</span>}
                  {c.vip && <span style={{ fontSize: "0.6rem", fontWeight: 900, backgroundColor: "#e9d5ff", color: "#7c3aed", padding: "0.1rem 0.45rem", borderRadius: "10px" }}>VIP</span>}
                  {isRepeat && <span style={{ fontSize: "0.6rem", fontWeight: 900, backgroundColor: "#e0f2fe", color: "#0369a1", padding: "0.1rem 0.45rem", borderRadius: "10px" }}>REPEAT</span>}
                  {hasCancel && <span style={{ fontSize: "0.6rem", fontWeight: 900, backgroundColor: "#fee2e2", color: "#dc2626", padding: "0.1rem 0.45rem", borderRadius: "10px" }}>⚠ CANCEL</span>}
                </div>
                <p style={{ fontSize: "0.72rem", color: "#999" }}>{c.phone}</p>
                <p style={{ fontSize: "0.68rem", color: "#bbb" }}>Since {formatDate(c.created_at).split(" ")[0] + " " + formatDate(c.created_at).split(" ")[1] + " " + formatDate(c.created_at).split(" ")[2]}</p>
              </div>

              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{c.total_orders}</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>BDT {c.total_spent?.toLocaleString()}</div>

              {!isMobile && (
                <>
                  {/* Tags col */}
                  <div style={{ fontSize: "0.72rem", color: "#888" }}>
                    {c.total_orders >= 5 ? "Loyal" : c.total_orders >= 2 ? "Returning" : "New"}
                  </div>

                  {/* F100 toggle — gold */}
                  <button onClick={() => toggleFlex(c)} style={{
                    padding: "0.4rem 0.5rem", fontSize: "0.68rem", fontWeight: 900,
                    border: c.flex100 ? "1px solid #f59e0b" : "1px solid #e0e0e0",
                    background: c.flex100 ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : "white",
                    color: c.flex100 ? "#78350f" : "#aaa",
                    cursor: "pointer", borderRadius: "4px",
                    boxShadow: c.flex100 ? "0 2px 6px rgba(245,158,11,0.4)" : "none",
                  }}>
                    {c.flex100 ? "🥇" : "F100"}
                  </button>

                  {/* VIP toggle */}
                  <button onClick={() => toggleVip(c)} style={{
                    padding: "0.4rem 0.5rem", fontSize: "0.68rem", fontWeight: 900,
                    border: c.vip ? "1px solid #9333ea" : "1px solid #e0e0e0",
                    background: c.vip ? "#f3e8ff" : "white",
                    color: c.vip ? "#7c3aed" : "#aaa",
                    cursor: "pointer", borderRadius: "4px",
                  }}>
                    VIP
                  </button>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <a href={"https://wa.me/" + c.phone} target="_blank" rel="noreferrer" style={{ padding: "0.4rem 0.5rem", fontSize: "0.7rem", fontWeight: 700, border: "1px solid #e0e0e0", textDecoration: "none", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>WA</a>
                    <button onClick={() => setSelected(c)} style={{ padding: "0.4rem 0.5rem", fontSize: "0.7rem", fontWeight: 700, border: "1px solid #e0e0e0", background: "white", cursor: "pointer" }}>View</button>
                    <button onClick={() => setDeleteTarget({ id: c.id, name: c.name })} style={{ padding: "0.4rem 0.5rem", fontSize: "0.7rem", fontWeight: 700, border: "1px solid #ffcccc", background: "#fff0f0", color: "#cc0000", cursor: "pointer" }}>Del</button>
                  </div>
                </>
              )}

              {/* Mobile: show actions inline */}
              {isMobile && (
                <div style={{ display: "flex", gap: "0.3rem", flexDirection: "column" }}>
                  <button onClick={() => toggleFlex(c)} style={{ padding: "0.3rem", fontSize: "0.65rem", fontWeight: 900, border: c.flex100 ? "1px solid #f59e0b" : "1px solid #e0e0e0", background: c.flex100 ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : "white", color: c.flex100 ? "#78350f" : "#aaa", cursor: "pointer" }}>
                    {c.flex100 ? "🥇 F100" : "F100"}
                  </button>
                  <button onClick={() => setSelected(c)} style={{ padding: "0.3rem", fontSize: "0.65rem", fontWeight: 700, border: "1px solid #e0e0e0", background: "white", cursor: "pointer" }}>Orders</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CUSTOMER DETAIL POPUP */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }} onClick={() => setSelected(null)}>
          <div style={{ background: "white", padding: "1.5rem", width: "100%", maxWidth: "480px", maxHeight: "85vh", overflowY: "auto", borderRadius: "8px" }} onClick={e => e.stopPropagation()}>

            {/* Customer header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontWeight: 900, fontSize: "1.1rem", marginBottom: "0.2rem" }}>{selected.name}</h2>
                <p style={{ color: "#666", fontSize: "0.82rem" }}>{selected.phone}</p>
                <p style={{ color: "#999", fontSize: "0.72rem" }}>Customer since {formatDate(selected.created_at)}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#999" }}>✕</button>
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              {selected.flex100 && <span style={{ fontSize: "0.72rem", fontWeight: 900, backgroundColor: "#fbbf24", color: "#78350f", padding: "0.25rem 0.75rem", borderRadius: "20px", border: "1px solid #f59e0b" }}>🥇 FLEX100 — First 100 Customer</span>}
              {selected.vip && <span style={{ fontSize: "0.72rem", fontWeight: 900, backgroundColor: "#e9d5ff", color: "#7c3aed", padding: "0.25rem 0.75rem", borderRadius: "20px" }}>VIP</span>}
              {selected.total_orders >= 2 && <span style={{ fontSize: "0.72rem", fontWeight: 900, backgroundColor: "#e0f2fe", color: "#0369a1", padding: "0.25rem 0.75rem", borderRadius: "20px" }}>Repeat Customer</span>}
              {cancelledPhones.has(selected.phone) && <span style={{ fontSize: "0.72rem", fontWeight: 900, backgroundColor: "#fee2e2", color: "#dc2626", padding: "0.25rem 0.75rem", borderRadius: "20px" }}>Has Cancelled Order</span>}
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ backgroundColor: "#f9f9f9", padding: "0.75rem", textAlign: "center", border: "1px solid #e0e0e0" }}>
                <p style={{ fontSize: "1.5rem", fontWeight: 900 }}>{selected.total_orders}</p>
                <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase" }}>Total Orders</p>
              </div>
              <div style={{ backgroundColor: "#f9f9f9", padding: "0.75rem", textAlign: "center", border: "1px solid #e0e0e0" }}>
                <p style={{ fontSize: "1.25rem", fontWeight: 900 }}>BDT {selected.total_spent?.toLocaleString()}</p>
                <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase" }}>Total Spent</p>
              </div>
            </div>

            {/* WhatsApp */}
            <a href={"https://wa.me/" + selected.phone} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", padding: "0.6rem", backgroundColor: "#16a34a", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "0.82rem", borderRadius: "6px", marginBottom: "1.25rem" }}>
              💬 Send WhatsApp Message
            </a>

            {/* Order Timeline */}
            <h3 style={{ fontWeight: 900, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", borderBottom: "2px solid black", paddingBottom: "0.4rem" }}>
              Order Timeline ({ordersOf(selected.phone).length})
            </h3>

            {ordersOf(selected.phone).length === 0 ? (
              <p style={{ color: "#999", fontSize: "0.82rem", textAlign: "center", padding: "1rem" }}>No orders found for this phone number.</p>
            ) : (
              ordersOf(selected.phone).map((o, i) => (
                <div key={o.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", opacity: (o as any).deleted ? 0.7 : 1 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                      <p style={{ fontWeight: 700, fontSize: "0.85rem" }}>{o.product_name}</p>
                      {(o as any).deleted && <span style={{ fontSize: "0.6rem", backgroundColor: "#f0f0f0", color: "#999", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>deleted</span>}
                    </div>
                    {(o.size || o.color) && (
                      <p style={{ fontSize: "0.72rem", color: "#888", marginBottom: "0.2rem" }}>
                        {[o.size, o.color].filter(Boolean).join(" · ")}
                        {o.quantity && o.quantity > 1 ? " × " + o.quantity : ""}
                      </p>
                    )}
                    <p style={{ fontSize: "0.72rem", color: "#999" }}>{formatDate(o.created_at)}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: "0.82rem" }}>BDT {Number(o.total_price).toLocaleString()}</p>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, backgroundColor: statusColor[o.status] ? statusColor[o.status] + "20" : "#f0f0f0", color: statusColor[o.status] || "#666", padding: "0.15rem 0.5rem", borderRadius: "10px", textTransform: "uppercase" }}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  )
}
