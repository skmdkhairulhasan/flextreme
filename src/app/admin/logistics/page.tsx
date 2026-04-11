"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Order = {
  id: string
  name: string
  phone: string
  address: string
  product_name: string
  size: string
  color: string
  quantity: number
  total_price: number
  status: string
  created_at: string
}

type LogisticsEntry = {
  order_id: string
  delivery_charge: number
  travel_cost: number
  cod_tax: number
  notes: string
}

// Group orders by customer phone (same phone = same delivery run)
function groupByCustomer(orders: Order[]) {
  const groups: Record<string, Order[]> = {}
  orders.forEach(o => {
    const key = o.phone.trim()
    if (!groups[key]) groups[key] = []
    groups[key].push(o)
  })
  return groups
}

export default function LogisticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [logistics, setLogistics] = useState<Record<string, LogisticsEntry>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "delivered" | "pending_cost">("delivered")
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const supabase = createClient()
    const [{ data: ordersData }, { data: logisticsData }] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("logistics_costs").select("*"),
    ])
    setOrders(ordersData || [])
    const map: Record<string, LogisticsEntry> = {}
    logisticsData?.forEach((l: any) => { map[l.order_id] = l })
    setLogistics(map)
    setLoading(false)
  }

  async function saveLogistics(orderId: string, entry: Partial<LogisticsEntry>) {
    setSaving(orderId)
    const supabase = createClient()
    const existing = logistics[orderId]
    const updated: LogisticsEntry = {
      order_id: orderId,
      delivery_charge: 0,
      travel_cost: 0,
      cod_tax: 0,
      notes: "",
      ...existing,
      ...entry,
    }
    await supabase.from("logistics_costs").upsert(updated, { onConflict: "order_id" })
    setLogistics(prev => ({ ...prev, [orderId]: updated }))
    setSaving(null)
    setSaved(orderId)
    setTimeout(() => setSaved(null), 2000)
  }

  function getLogisticsForOrder(orderId: string): LogisticsEntry {
    return logistics[orderId] || { order_id: orderId, delivery_charge: 0, travel_cost: 0, cod_tax: 0, notes: "" }
  }

  function totalCost(orderId: string) {
    const l = getLogisticsForOrder(orderId)
    return (l.delivery_charge || 0) + (l.travel_cost || 0) + (l.cod_tax || 0)
  }

  function netRevenue(order: Order) {
    return order.total_price - totalCost(order.id)
  }

  // Filter orders
  const activeStatuses = ["confirmed", "processing", "shipped", "delivered"]
  const filteredOrders = orders.filter(o => {
    if (filter === "delivered") return o.status === "delivered"
    if (filter === "pending_cost") return activeStatuses.includes(o.status) && totalCost(o.id) === 0
    return activeStatuses.includes(o.status)
  })

  // Group by customer phone
  const grouped = groupByCustomer(filteredOrders)
  const customerPhones = Object.keys(grouped)

  // Summary stats
  const allActiveOrders = orders.filter(o => activeStatuses.includes(o.status))
  const totalRevenue = allActiveOrders.reduce((s, o) => s + o.total_price, 0)
  const totalLogisticsCosts = allActiveOrders.reduce((s, o) => s + totalCost(o.id), 0)
  const netRev = totalRevenue - totalLogisticsCosts
  const avgMargin = totalRevenue > 0 ? Math.round((netRev / totalRevenue) * 100) : 0
  const ordersWithCosts = allActiveOrders.filter(o => totalCost(o.id) > 0).length

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>Loading logistics data...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Logistics & Costs</h1>
        <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.25rem" }}>Track delivery charges, travel costs and COD taxes to calculate real net revenue.</p>
      </div>

      {/* Summary cards */}
      <style>{`@media(max-width:767px){.logi-cards{grid-template-columns:1fr 1fr!important;gap:0.5rem!important}.logi-cards>div{padding:0.75rem!important}.logi-cards p:nth-child(2){font-size:1rem!important}}`}</style>
      <div className="logi-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Gross Revenue", value: "BDT " + totalRevenue.toLocaleString(), sub: "Before costs", color: "#111", bg: "white" },
          { label: "Total Logistics Cost", value: "BDT " + totalLogisticsCosts.toLocaleString(), sub: "Delivery + Travel + COD tax", color: "#dc2626", bg: "#fff5f5" },
          { label: "Net Revenue", value: "BDT " + netRev.toLocaleString(), sub: "What you actually made", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Avg Margin", value: avgMargin + "%", sub: "Net/Gross ratio", color: avgMargin >= 70 ? "#16a34a" : avgMargin >= 50 ? "#d97706" : "#dc2626", bg: "white" },
          { label: "Costs Entered", value: ordersWithCosts + "/" + allActiveOrders.length, sub: "Orders with costs logged", color: "#7c3aed", bg: "#faf5ff" },
        ].map((s, i) => (
          <div key={i} style={{ backgroundColor: s.bg, border: "1px solid #e0e0e0", padding: "1.25rem" }}>
            <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>{s.label}</p>
            <p style={{ fontSize: "1.35rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: "0.68rem", color: "#aaa", marginTop: "0.3rem" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs — scrollable on mobile */}
      <div style={{ display: "flex", gap: "0", borderBottom: "2px solid black", marginBottom: "1.25rem", overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
        {[
          { id: "delivered", label: "Delivered Orders" },
          { id: "all", label: "All Active Orders" },
          { id: "pending_cost", label: "Missing Costs (" + allActiveOrders.filter(o => totalCost(o.id) === 0).length + ")" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id as any)} style={{ padding: "0.6rem 1.1rem", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", border: "none", borderBottom: filter === tab.id ? "3px solid black" : "3px solid transparent", marginBottom: "-2px", backgroundColor: "transparent", cursor: "pointer", color: filter === tab.id ? "black" : "#999", whiteSpace: "nowrap" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {customerPhones.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", border: "1px dashed #e0e0e0", color: "#999" }}>
          No orders in this filter.
        </div>
      )}

      {/* Customer groups */}
      {customerPhones.map(phone => {
        const customerOrders = grouped[phone]
        const customerName = customerOrders[0].name
        const customerTotal = customerOrders.reduce((s, o) => s + o.total_price, 0)
        const customerCosts = customerOrders.reduce((s, o) => s + totalCost(o.id), 0)
        const customerNet = customerTotal - customerCosts
        const isExpanded = expandedPhone === phone

        return (
          <div key={phone} style={{ border: "1px solid #e0e0e0", marginBottom: "1rem", backgroundColor: "white" }}>

            {/* Customer header — click to expand */}
            <div
              onClick={() => setExpandedPhone(isExpanded ? null : phone)}
              style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", backgroundColor: isExpanded ? "#f9f9f9" : "white", gap: "1rem", flexWrap: "wrap" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "black", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.85rem", flexShrink: 0 }}>
                  {customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{customerName}</p>
                  <p style={{ fontSize: "0.75rem", color: "#888" }}>{phone} · {customerOrders.length} order{customerOrders.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", marginBottom: "0.1rem" }}>Order Total</p>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>BDT {customerTotal.toLocaleString()}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", marginBottom: "0.1rem" }}>Total Costs</p>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#dc2626" }}>BDT {customerCosts.toLocaleString()}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", marginBottom: "0.1rem" }}>Net Revenue</p>
                  <p style={{ fontWeight: 900, fontSize: "1rem", color: customerNet >= 0 ? "#16a34a" : "#dc2626" }}>BDT {customerNet.toLocaleString()}</p>
                </div>
                <div style={{ fontSize: "1.25rem", color: "#999" }}>{isExpanded ? "▲" : "▼"}</div>
              </div>
            </div>

            {/* Expanded order rows */}
            {isExpanded && customerOrders.map((order, idx) => {
              const l = getLogisticsForOrder(order.id)
              const cost = totalCost(order.id)
              const net = netRevenue(order)
              const isSaving = saving === order.id
              const isSaved = saved === order.id

              return (
                <div key={order.id} style={{ borderTop: "1px solid #f0f0f0", padding: "1.25rem", backgroundColor: idx % 2 === 0 ? "white" : "#fafafa" }}>
                  {/* Order info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{order.product_name}</p>
                      <p style={{ fontSize: "0.75rem", color: "#888" }}>
                        {order.size} · {order.color} · Qty {order.quantity} ·
                        <span style={{ marginLeft: "0.4rem", fontSize: "0.7rem", fontWeight: 700, padding: "0.1rem 0.5rem", borderRadius: "20px", backgroundColor: order.status === "delivered" ? "#dcfce7" : "#f0f0f0", color: order.status === "delivered" ? "#16a34a" : "#666", textTransform: "uppercase" }}>{order.status}</span>
                      </p>
                      <p style={{ fontSize: "0.7rem", color: "#bbb", marginTop: "0.2rem" }}>{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase" }}>Sale Price</p>
                      <p style={{ fontWeight: 900, fontSize: "1.1rem" }}>BDT {order.total_price.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Cost inputs */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <CostInput
                      label="Delivery Charge"
                      hint="Courier fee paid"
                      value={l.delivery_charge}
                      onChange={v => setLogistics(prev => ({ ...prev, [order.id]: { ...getLogisticsForOrder(order.id), delivery_charge: v } }))}
                    />
                    <CostInput
                      label="Travel Cost"
                      hint="Your cost to reach courier"
                      value={l.travel_cost}
                      onChange={v => setLogistics(prev => ({ ...prev, [order.id]: { ...getLogisticsForOrder(order.id), travel_cost: v } }))}
                    />
                    <CostInput
                      label="COD Tax / Fee"
                      hint="Cash collection fee"
                      value={l.cod_tax}
                      onChange={v => setLogistics(prev => ({ ...prev, [order.id]: { ...getLogisticsForOrder(order.id), cod_tax: v } }))}
                    />
                    <div>
                      <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", color: "#555" }}>Notes</label>
                      <input
                        value={l.notes || ""}
                        onChange={e => setLogistics(prev => ({ ...prev, [order.id]: { ...getLogisticsForOrder(order.id), notes: e.target.value } }))}
                        placeholder="Any notes..."
                        style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.45rem 0.6rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" as const }}
                      />
                    </div>
                  </div>

                  {/* Summary row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f9f9f9", padding: "0.75rem 1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.78rem", color: "#666" }}>Total Costs: <strong style={{ color: "#dc2626" }}>BDT {cost.toLocaleString()}</strong></span>
                      <span style={{ fontSize: "0.78rem" }}>Net: <strong style={{ color: net >= 0 ? "#16a34a" : "#dc2626", fontSize: "0.9rem" }}>BDT {net.toLocaleString()}</strong></span>
                      {order.total_price > 0 && <span style={{ fontSize: "0.78rem", color: "#888" }}>Margin: <strong>{Math.round((net / order.total_price) * 100)}%</strong></span>}
                    </div>
                    <button
                      onClick={() => saveLogistics(order.id, getLogisticsForOrder(order.id))}
                      disabled={isSaving}
                      style={{ padding: "0.4rem 1.25rem", backgroundColor: isSaved ? "#16a34a" : "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.72rem", cursor: isSaving ? "not-allowed" : "pointer", textTransform: "uppercase", minWidth: "80px", transition: "all 0.2s" }}
                    >
                      {isSaving ? "Saving..." : isSaved ? "Saved ✓" : "Save Costs"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function CostInput({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", color: "#555" }}>{label}</label>
      <p style={{ fontSize: "0.62rem", color: "#aaa", marginBottom: "0.3rem" }}>{hint}</p>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #e0e0e0" }}>
        <span style={{ padding: "0.45rem 0.5rem", backgroundColor: "#f5f5f5", fontSize: "0.75rem", color: "#666", borderRight: "1px solid #e0e0e0", whiteSpace: "nowrap" }}>BDT</span>
        <input
          type="number"
          min="0"
          value={value || ""}
          onChange={e => onChange(Number(e.target.value) || 0)}
          placeholder="0"
          style={{ flex: 1, border: "none", padding: "0.45rem 0.6rem", fontSize: "0.88rem", outline: "none", width: "100%", boxSizing: "border-box" as const }}
        />
      </div>
    </div>
  )
}
