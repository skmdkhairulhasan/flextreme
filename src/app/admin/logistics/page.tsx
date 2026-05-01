"use client"
import { useEffect, useState } from "react"

type Order = {
  id: string
  name: string
  phone: string
  address: string
  product_name: string
  size?: string
  color?: string
  quantity: number
  total_price: number
  status: string
  created_at: string
}

type LogisticsEntry = {
  id?: string
  order_id: string
  delivery_charge: number
  travel_cost: number
  cod_tax: number
  notes: string
}

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
  const [filter, setFilter] = useState<"all" | "delivered" | "pending_cost">("pending_cost")
  const [editingOrders, setEditingOrders] = useState<Set<string>>(new Set())
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [ordersRes, logisticsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/logistics-costs"),
      ])

      const ordersData = await ordersRes.json()
      const logisticsData = await logisticsRes.json()

      setOrders(ordersData.orders || [])
      
      const map: Record<string, LogisticsEntry> = {}
      ;(logisticsData.costs || []).forEach((l: any) => {
        if (l.order_id) map[l.order_id] = l
      })
      setLogistics(map)
    } catch (e) {
      console.error("Failed to fetch data:", e)
    }
    setLoading(false)
  }

  async function saveLogistics(orderId: string, entry: Partial<LogisticsEntry>) {
    setSaving(orderId)
    
    const existing = logistics[orderId]
    const updated: LogisticsEntry = {
      ...{ delivery_charge: 0, travel_cost: 0, cod_tax: 0, notes: "" },
      ...existing,
      ...entry,
      order_id: orderId,
    }

    const allEmpty = !updated.delivery_charge && !updated.travel_cost && !updated.cod_tax && !updated.notes

    try {
      if (allEmpty) {
        await fetch(`/api/logistics-costs?order_id=${orderId}`, { method: "DELETE" })
        setLogistics(prev => { const n = { ...prev }; delete n[orderId]; return n })
      } else {
        await fetch("/api/logistics-costs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        })
        setLogistics(prev => ({ ...prev, [orderId]: updated }))
      }
    } catch (e) {
      console.error("Failed to save logistics:", e)
    }

    setSaving(null)
    setSaved(orderId)
    setEditingOrders(prev => { const s = new Set(prev); s.delete(orderId); return s })
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

  const activeStatuses = ["pending", "confirmed", "processing", "shipped", "delivered"]
  
  const filteredOrders = orders.filter(o => {
    if (filter === "delivered") return o.status === "delivered"
    if (filter === "pending_cost") return activeStatuses.includes(o.status) && (!logistics[o.id] || editingOrders.has(o.id))
    return activeStatuses.includes(o.status)
  })

  const grouped = groupByCustomer(filteredOrders)
  const phones = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length)

  const allActiveOrders = orders.filter(o => activeStatuses.includes(o.status))
  const totalRevenue = allActiveOrders.reduce((s, o) => s + o.total_price, 0)
  const totalLogisticsCosts = allActiveOrders.reduce((s, o) => s + totalCost(o.id), 0)
  const ordersWithCosts = allActiveOrders.filter(o => totalCost(o.id) > 0).length

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Logistics & Costs</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>Logistics & Costs</h1>
        <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          Track delivery charges and travel costs per customer delivery run
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1.5rem" }}>
          <p style={{ fontSize: "0.7rem", color: "#15803d", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>Total Orders</p>
          <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#16a34a" }}>{allActiveOrders.length}</p>
        </div>
        <div style={{ backgroundColor: "#dbeafe", border: "1px solid #93c5fd", padding: "1.5rem" }}>
          <p style={{ fontSize: "0.7rem", color: "#1e40af", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>With Costs</p>
          <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#2563eb" }}>{ordersWithCosts}</p>
        </div>
        <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a", padding: "1.5rem" }}>
          <p style={{ fontSize: "0.7rem", color: "#92400e", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>Total Revenue</p>
          <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#d97706" }}>BDT {totalRevenue.toLocaleString()}</p>
        </div>
        <div style={{ backgroundColor: "#fee2e2", border: "1px solid #fecaca", padding: "1.5rem" }}>
          <p style={{ fontSize: "0.7rem", color: "#991b1b", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>Logistics Costs</p>
          <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#dc2626" }}>BDT {totalLogisticsCosts.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ backgroundColor: "white", border: "2px solid #e0e0e0", marginBottom: "2rem" }}>
        <div style={{ display: "flex", borderBottom: "2px solid #e0e0e0", overflowX: "auto" }}>
          {[
            { id: "all", label: "All (" + allActiveOrders.length + ")" },
            { id: "pending_cost", label: "Missing Costs (" + allActiveOrders.filter(o => !logistics[o.id]).length + ")" },
            { id: "delivered", label: "Delivered (" + orders.filter(o => o.status === "delivered").length + ")" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              style={{
                padding: "0.6rem 1.1rem",
                fontWeight: 700,
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                border: "none",
                borderBottom: filter === tab.id ? "3px solid black" : "3px solid transparent",
                marginBottom: "-2px",
                backgroundColor: "transparent",
                cursor: "pointer",
                color: filter === tab.id ? "black" : "#999",
                whiteSpace: "nowrap"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {phones.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "#999" }}>
            No orders in this filter.
          </div>
        ) : (
          <div>
            {phones.map(phone => {
              const phoneOrders = grouped[phone]
              const isExpanded = expandedPhone === phone
              const firstOrder = phoneOrders[0]
              const totalOrderRevenue = phoneOrders.reduce((s, o) => s + o.total_price, 0)
              const totalOrderCosts = phoneOrders.reduce((s, o) => s + totalCost(o.id), 0)
              const netForPhone = totalOrderRevenue - totalOrderCosts

              return (
                <div key={phone} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <div
                    onClick={() => setExpandedPhone(isExpanded ? null : phone)}
                    style={{
                      padding: "1rem 1.5rem",
                      cursor: "pointer",
                      backgroundColor: isExpanded ? "#f9f9f9" : "white",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      alignItems: "center",
                      gap: "1rem"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{firstOrder.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#666" }}>{phone} • {phoneOrders.length} order{phoneOrders.length > 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: "0.25rem" }}>REVENUE</div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>BDT {totalOrderRevenue.toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: "0.25rem" }}>COSTS</div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#dc2626" }}>BDT {totalOrderCosts.toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: "0.25rem" }}>NET</div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: netForPhone >= 0 ? "#16a34a" : "#dc2626" }}>
                          BDT {netForPhone.toLocaleString()}
                        </div>
                      </div>
                      <div style={{ fontSize: "1.2rem", color: "#999" }}>{isExpanded ? "−" : "+"}</div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: "1rem 1.5rem", backgroundColor: "#fafafa" }}>
                      {phoneOrders.map(order => {
                        const costs = getLogisticsForOrder(order.id)
                        const isEditing = editingOrders.has(order.id)
                        const isSaving = saving === order.id
                        const isSaved = saved === order.id

                        return (
                          <div key={order.id} style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "white", border: "1px solid #e0e0e0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{order.product_name}</div>
                                <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" }}>
                                  Order #{order.id.slice(0, 8)}
                                  <span style={{ marginLeft: "0.4rem", fontSize: "0.7rem", fontWeight: 700, padding: "0.1rem 0.5rem", borderRadius: "20px", backgroundColor: order.status === "delivered" ? "#dcfce7" : "#f0f0f0", color: order.status === "delivered" ? "#16a34a" : "#666", textTransform: "uppercase" }}>
                                    {order.status}
                                  </span>
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>BDT {order.total_price.toLocaleString()}</div>
                                <div style={{ fontSize: "0.7rem", color: "#666" }}>Revenue</div>
                              </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, marginBottom: "0.3rem", color: "#555" }}>Delivery (BDT)</label>
                                <input
                                  type="number"
                                  value={costs.delivery_charge || ""}
                                  onChange={e => {
                                    setEditingOrders(prev => new Set(prev).add(order.id))
                                    saveLogistics(order.id, { delivery_charge: Number(e.target.value) || 0 })
                                  }}
                                  placeholder="0"
                                  disabled={isSaving}
                                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e0e0e0", fontSize: "0.82rem" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, marginBottom: "0.3rem", color: "#555" }}>Travel (BDT)</label>
                                <input
                                  type="number"
                                  value={costs.travel_cost || ""}
                                  onChange={e => {
                                    setEditingOrders(prev => new Set(prev).add(order.id))
                                    saveLogistics(order.id, { travel_cost: Number(e.target.value) || 0 })
                                  }}
                                  placeholder="0"
                                  disabled={isSaving}
                                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e0e0e0", fontSize: "0.82rem" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, marginBottom: "0.3rem", color: "#555" }}>COD Tax (BDT)</label>
                                <input
                                  type="number"
                                  value={costs.cod_tax || ""}
                                  onChange={e => {
                                    setEditingOrders(prev => new Set(prev).add(order.id))
                                    saveLogistics(order.id, { cod_tax: Number(e.target.value) || 0 })
                                  }}
                                  placeholder="0"
                                  disabled={isSaving}
                                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #e0e0e0", fontSize: "0.82rem" }}
                                />
                              </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid #f0f0f0" }}>
                              <div style={{ fontSize: "0.75rem", color: isSaved ? "#16a34a" : "#999" }}>
                                {isSaving ? "Saving..." : isSaved ? "Saved ✓" : "Auto-saves on change"}
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: "0.25rem" }}>NET REVENUE</div>
                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: netRevenue(order) >= 0 ? "#16a34a" : "#dc2626" }}>
                                  BDT {netRevenue(order).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
