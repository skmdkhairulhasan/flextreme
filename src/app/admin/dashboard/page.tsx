import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const [{ data: orders }, { data: products }, { data: reviews }, { data: logisticsData }, { data: customers }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("*"),
    supabase.from("reviews").select("rating, status"),
    supabase.from("logistics_costs").select("*"),
    supabase.from("customers").select("order_history"),
  ])

  const allOrders = orders || []
  const allProducts = products || []
  const allReviews = reviews || []

  // ── ORDER STATS ──
  const pending = allOrders.filter(o => o.status === "pending").length
  const confirmed = allOrders.filter(o => o.status === "confirmed").length
  const processing = allOrders.filter(o => o.status === "processing").length
  const shipped = allOrders.filter(o => o.status === "shipped").length
  const delivered = allOrders.filter(o => o.status === "delivered").length
  const liveCancelled = allOrders.filter(o => o.status === "cancelled").length
  const liveOrderIds = new Set(allOrders.map((o: any) => o.id))
  const archivedCancelled = (customers || []).reduce((count: number, c: any) => {
    const archived = (c.order_history || []).filter((h: any) =>
      h.status === "cancelled" && !liveOrderIds.has(h.id)
    )
    return count + archived.length
  }, 0)
  const cancelled = liveCancelled + archivedCancelled
  const totalOrders = allOrders.length + archivedCancelled
  const activeOrders = pending + confirmed + processing + shipped

  const revenue = allOrders.filter(o => o.status === "delivered").reduce((s: number, o: any) => s + Number(o.total_price), 0)
  const pendingRevenue = allOrders.filter(o => !["cancelled", "delivered"].includes(o.status)).reduce((s: number, o: any) => s + Number(o.total_price), 0)

  // Logistics costs
  const logMap: Record<string, any> = {}
  ;(logisticsData || []).forEach((l: any) => { logMap[l.order_id] = l })
  const totalLogisticsCost = allOrders.filter(o => o.status === "delivered").reduce((s: number, o: any) => {
    const l = logMap[o.id]
    return s + (l ? (Number(l.delivery_charge)||0) + (Number(l.travel_cost)||0) + (Number(l.cod_tax)||0) : 0)
  }, 0)
  const netRevenue = revenue - totalLogisticsCost
  const totalItemsSold = allOrders.filter(o => o.status === "delivered").reduce((s: number, o: any) => s + Number(o.quantity), 0)
  const avgOrderValue = delivered > 0 ? Math.round(revenue / delivered) : 0
  const cancellationRate = totalOrders > 0 ? Math.round((cancelled / totalOrders) * 100) : 0

  // ── MONTHLY REVENUE (last 6 months) ──
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleString("default", { month: "short" })
    const monthOrders = allOrders.filter((o: any) => {
      const od = new Date(o.created_at)
      return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear() && o.status === "delivered"
    })
    return { label, revenue: monthOrders.reduce((s: number, o: any) => s + Number(o.total_price), 0), orders: monthOrders.length }
  })
  const maxRev = Math.max(...monthlyData.map(m => m.revenue), 1)

  // ── PRODUCT STATS ──
  const totalProducts = allProducts.length
  const featuredProducts = allProducts.filter(p => p.is_featured).length
  // Live remaining stock per product (matrix - sold)
  const countedStatuses = ["confirmed", "processing", "shipped", "delivered"]
  function getLiveRemaining(p: any): number | null {
    const matrix: Record<string, number> = typeof p.stock_matrix === "object" && p.stock_matrix !== null ? p.stock_matrix : {}
    const hasMatrix = Object.keys(matrix).length > 0
    const productOrders = allOrders.filter((o: any) => o.product_id === p.id && countedStatuses.includes(o.status))
    if (hasMatrix) {
      const live: Record<string, number> = {}
      // Normalize all keys to lowercase_nospace
      Object.entries(matrix).forEach(([k, v]) => { live[k.toLowerCase().replace(/\s+/g, "")] = Number(v) || 0 })
      productOrders.forEach((o: any) => {
        const normKey = ((o.size || "").trim() + "_" + (o.color || "").trim()).toLowerCase().replace(/\s+/g, "")
        if (live[normKey] !== undefined) live[normKey] = Math.max(0, live[normKey] - (o.quantity || 1))
      })
      return Object.values(live).reduce((s: number, v: any) => s + (Number(v) || 0), 0)
    } else if (p.stock_quantity !== null && p.stock_quantity !== undefined && p.stock_quantity !== "") {
      const soldQty = productOrders.reduce((s: number, o: any) => s + (Number(o.quantity) || 1), 0)
      return Math.max(0, Number(p.stock_quantity) - soldQty)
    }
    return null
  }
  const outOfStock = allProducts.filter((p: any) => { const r = getLiveRemaining(p); return r !== null && r <= 0 }).length
  const lowStock = allProducts.filter((p: any) => { const r = getLiveRemaining(p); return r !== null && r > 0 && r <= (p.low_stock_alert || 5) }).length

  // ── TOP PRODUCTS ──
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {}
  allOrders.filter(o => o.status !== "cancelled").forEach((o: any) => {
    if (!productSales[o.product_id]) productSales[o.product_id] = { name: o.product_name, qty: 0, revenue: 0 }
    productSales[o.product_id].qty += Number(o.quantity)
    productSales[o.product_id].revenue += Number(o.total_price)
  })
  const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5)

  // ── REVIEWS ──
  const approvedReviews = allReviews.filter(r => r.status === "approved")
  const avgRating = approvedReviews.length > 0 ? (approvedReviews.reduce((s, r: any) => s + r.rating, 0) / approvedReviews.length).toFixed(1) : "—"
  const pendingReviews = allReviews.filter(r => r.status === "pending").length

  // ── RECENT ORDERS ──
  const recentOrders = allOrders.slice(0, 8)

  const statusColors: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#fef9c3", color: "#854d0e" },
    confirmed: { bg: "#dbeafe", color: "#1d4ed8" },
    processing: { bg: "#f3e8ff", color: "#7c3aed" },
    shipped: { bg: "#e0f2fe", color: "#0369a1" },
    delivered: { bg: "#dcfce7", color: "#16a34a" },
    cancelled: { bg: "#fee2e2", color: "#dc2626" },
  }

  return (
    <div>
      <style>{`
        @media (max-width: 767px) {
          .dash-metrics { grid-template-columns: 1fr 1fr !important; gap: 0.5rem !important; }
          .dash-metrics > div { padding: 0.75rem !important; }
          .dash-charts { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .dash-bottom { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .dash-recent-row { grid-template-columns: 1fr 80px !important; }
          .dash-recent-hide { display: none !important; }
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Dashboard</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.25rem" }}>Your Flextreme business overview</p>
        </div>
        <div style={{ fontSize: "0.78rem", color: "#999" }}>Updated: {new Date().toLocaleString()}</div>
      </div>

      {/* ── ALERTS ── */}
      {(outOfStock > 0 || lowStock > 0 || pendingReviews > 0 || pending > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {pending > 0 && (
            <div style={{ padding: "0.875rem 1.25rem", backgroundColor: "#fef9c3", border: "1px solid #fcd34d", borderLeft: "4px solid #f59e0b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#854d0e" }}>⚡ {pending} order{pending > 1 ? "s" : ""} waiting for confirmation</span>
              <Link href="/admin/orders" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#854d0e", textDecoration: "none", backgroundColor: "#fcd34d", padding: "0.3rem 0.75rem" }}>View Orders →</Link>
            </div>
          )}
          {outOfStock > 0 && (
            <div style={{ padding: "0.875rem 1.25rem", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderLeft: "4px solid #dc2626", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#dc2626" }}>🚫 {outOfStock} product{outOfStock > 1 ? "s" : ""} out of stock</span>
              <Link href="/admin/products" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#dc2626", textDecoration: "none", backgroundColor: "#fca5a5", padding: "0.3rem 0.75rem" }}>Manage →</Link>
            </div>
          )}
          {lowStock > 0 && (
            <div style={{ padding: "0.875rem 1.25rem", backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderLeft: "4px solid #f97316", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#c2410c" }}>⚠️ {lowStock} product{lowStock > 1 ? "s" : ""} running low on stock</span>
              <Link href="/admin/products" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#c2410c", textDecoration: "none", backgroundColor: "#fed7aa", padding: "0.3rem 0.75rem" }}>Check Stock →</Link>
            </div>
          )}
          {pendingReviews > 0 && (
            <div style={{ padding: "0.875rem 1.25rem", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderLeft: "4px solid #0284c7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0369a1" }}>💬 {pendingReviews} review{pendingReviews > 1 ? "s" : ""} waiting for approval</span>
              <Link href="/admin/reviews" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0369a1", textDecoration: "none", backgroundColor: "#bae6fd", padding: "0.3rem 0.75rem" }}>Review →</Link>
            </div>
          )}
        </div>
      )}

      {/* ── KEY METRICS ── */}
      <div className="dash-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total Orders", value: totalOrders, sub: activeOrders + " active", color: "#111", bg: "white" },
          { label: "Net Revenue", value: "BDT " + netRevenue.toLocaleString(), sub: "Gross BDT " + revenue.toLocaleString() + " − costs BDT " + totalLogisticsCost.toLocaleString(), color: "#16a34a", bg: "#f0fdf4" },
          { label: "Avg Order Value", value: "BDT " + avgOrderValue.toLocaleString(), sub: "Per delivered order", color: "#111", bg: "white" },
          { label: "Items Sold", value: totalItemsSold, sub: "Delivered orders", color: "#7c3aed", bg: "#faf5ff" },
          { label: "Delivered", value: delivered, sub: "Successfully", color: "#16a34a", bg: "white" },
          { label: "Cancelled", value: cancelled, sub: cancellationRate + "% cancel rate", color: "#dc2626", bg: "#fff5f5" },
          { label: "Avg Rating", value: avgRating, sub: approvedReviews.length + " reviews", color: "#f59e0b", bg: "#fffbeb" },
          { label: "Products", value: totalProducts, sub: featuredProducts + " featured", color: "#111", bg: "white" },
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: stat.bg, border: "1px solid #e0e0e0", padding: "1.25rem" }}>
            <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>{stat.label}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: "0.68rem", color: "#aaa", marginTop: "0.35rem" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── ORDER STATUS BREAKDOWN ── */}
      <div className="dash-charts" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem", marginBottom: "1.25rem" }}>

        {/* Status funnel */}
        <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>Order Status Breakdown</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {[
              { label: "Pending", count: pending, color: "#f59e0b" },
              { label: "Confirmed", count: confirmed, color: "#2563eb" },
              { label: "Processing", count: processing, color: "#7c3aed" },
              { label: "Shipped", count: shipped, color: "#0891b2" },
              { label: "Delivered", count: delivered, color: "#16a34a" },
              { label: "Cancelled", count: cancelled, color: "#dc2626" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: s.color }}>{s.count}</span>
                </div>
                <div style={{ height: "6px", backgroundColor: "#f5f5f5", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: totalOrders > 0 ? (s.count / totalOrders * 100) + "%" : "0%", backgroundColor: s.color, borderRadius: "3px", transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue chart */}
        <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>Monthly Revenue (Last 6 Months)</h2>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "120px" }}>
            {monthlyData.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", height: "100%" }}>
                <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <div style={{ width: "100%", backgroundColor: i === 5 ? "black" : "#e0e0e0", borderRadius: "3px 3px 0 0", height: maxRev > 0 ? Math.max(4, (m.revenue / maxRev) * 100) + "%" : "4%", transition: "height 0.5s ease", position: "relative" }}>
                    {m.revenue > 0 && (
                      <div style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "0.55rem", fontWeight: 700, color: "#666", whiteSpace: "nowrap" }}>
                        {m.revenue >= 1000 ? Math.round(m.revenue/1000) + "k" : m.revenue}
                      </div>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: "0.62rem", color: "#999", fontWeight: i === 5 ? 700 : 400 }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TOP PRODUCTS + LOW STOCK ── */}
      <div className="dash-bottom" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem", marginBottom: "1.25rem" }}>

        {/* Top selling */}
        <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>Top Selling Products</h2>
          </div>
          {topProducts.length === 0 ? (
            <p style={{ color: "#bbb", fontSize: "0.82rem", textAlign: "center", padding: "1.5rem 0" }}>No sales data yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {topProducts.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: i < topProducts.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: i === 0 ? "black" : "#f0f0f0", color: i === 0 ? "white" : "#999", fontSize: "0.68rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.78rem", fontWeight: 700 }}>{p.qty} sold</p>
                    <p style={{ fontSize: "0.68rem", color: "#999" }}>BDT {p.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock alerts */}
        <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>Stock Status</h2>
            <Link href="/admin/products" style={{ fontSize: "0.72rem", color: "#666", textDecoration: "none", fontWeight: 600 }}>Manage →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {allProducts.length === 0 ? (
              <p style={{ color: "#bbb", fontSize: "0.82rem", textAlign: "center", padding: "1rem 0" }}>No products yet</p>
            ) : allProducts.map((p: any) => {
              // Calculate remaining stock live from matrix - sold orders
              const matrix: Record<string, number> = p.stock_matrix || {}
              const hasMatrix = Object.keys(matrix).length > 0
              const countedStatuses = ["confirmed", "processing", "shipped", "delivered"]
              const productOrders = allOrders.filter((o: any) => o.product_id === p.id && countedStatuses.includes(o.status))

              let remaining: number | null = null
              const alert = p.low_stock_alert || 5

              if (hasMatrix) {
                const live: Record<string, number> = {}
                Object.entries(matrix).forEach(([k, v]) => { live[k.toLowerCase().replace(/\s+/g, "")] = Number(v) || 0 })
                productOrders.forEach((o: any) => {
                  const normKey = ((o.size || "").trim() + "_" + (o.color || "").trim()).toLowerCase().replace(/\s+/g, "")
                  if (live[normKey] !== undefined) live[normKey] = Math.max(0, live[normKey] - (Number(o.quantity) || 1))
                })
                remaining = Object.values(live).reduce((s: number, v: any) => s + (Number(v) || 0), 0)
              } else if (p.stock_quantity !== null && p.stock_quantity !== undefined && p.stock_quantity !== "") {
                const soldQty = productOrders.reduce((s: number, o: any) => s + (Number(o.quantity) || 1), 0)
                remaining = Math.max(0, Number(p.stock_quantity) - soldQty)
              }

              const isOut = remaining !== null && remaining <= 0
              const isLow = remaining !== null && remaining > 0 && remaining <= alert
              const dot = isOut ? "#dc2626" : isLow ? "#f97316" : "#16a34a"
              const badge = remaining === null ? "∞" : isOut ? "OUT" : isLow ? "LOW: " + remaining : "" + remaining

              return (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", backgroundColor: isOut ? "#fff5f5" : isLow ? "#fff7ed" : "#fafafa", border: "1px solid " + (isOut ? "#fca5a5" : isLow ? "#fed7aa" : "#f0f0f0") }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: dot, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: isOut ? "#dc2626" : isLow ? "#f97316" : "#16a34a", backgroundColor: isOut ? "#fee2e2" : isLow ? "#ffedd5" : "#dcfce7", padding: "0.15rem 0.5rem", borderRadius: "20px" }}>{badge}</span>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: "0.68rem", color: "#bbb", marginTop: "0.75rem" }}>Live remaining stock = original stock − confirmed/shipped/delivered orders.</p>
        </div>
      </div>

      {/* ── RECENT ORDERS ── */}
      <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Orders</h2>
          <Link href="/admin/orders" style={{ fontSize: "0.72rem", color: "#666", textDecoration: "none", fontWeight: 600 }}>View All ({totalOrders}) →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p style={{ color: "#bbb", fontSize: "0.82rem", textAlign: "center", padding: "1.5rem 0" }}>No orders yet</p>
        ) : (
          <div>
            <div className="dash-recent-row" style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 90px 110px", gap: "0.75rem", padding: "0.5rem 0.75rem", backgroundColor: "#f9f9f9", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999" }}>
              <span>Customer</span><span>Product</span><span>Amount</span><span>Qty</span><span>Status</span>
            </div>
            {recentOrders.map((o: any) => {
              const s = statusColors[o.status] || { bg: "#f5f5f5", color: "#999" }
              return (
                <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 90px 110px", gap: "0.75rem", padding: "0.75rem", borderTop: "1px solid #f5f5f5", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.82rem" }}>{o.name}</p>
                    <p style={{ fontSize: "0.68rem", color: "#999" }}>{o.phone}</p>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.product_name}</p>
                  <p style={{ fontSize: "0.82rem", fontWeight: 700 }}>BDT {Number(o.total_price).toLocaleString()}</p>
                  <p style={{ fontSize: "0.78rem", color: "#555" }}>×{o.quantity}</p>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, backgroundColor: s.bg, color: s.color, padding: "0.2rem 0.6rem", borderRadius: "20px", textTransform: "uppercase", display: "inline-block" }}>{o.status}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>Quick Actions</h2>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[
            { label: "Add Product", href: "/admin/products/new", bg: "black", color: "white" },
            { label: "View Orders", href: "/admin/orders", bg: "#f9f9f9", color: "black" },
            { label: "Logistics & Costs", href: "/admin/logistics", bg: "#f9f9f9", color: "black" },
            { label: "Manage Products", href: "/admin/products", bg: "#f9f9f9", color: "black" },
            { label: "Approve Reviews", href: "/admin/reviews", bg: "#f9f9f9", color: "black" },
            { label: "Site Settings", href: "/admin/settings", bg: "#f9f9f9", color: "black" },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ padding: "0.65rem 1.25rem", backgroundColor: a.bg, color: a.color, textDecoration: "none", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", border: "1px solid #e0e0e0" }}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
