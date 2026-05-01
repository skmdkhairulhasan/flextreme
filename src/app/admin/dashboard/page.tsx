import { apiFetchServer } from "@/lib/api/server"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function getData() {
  try {
    const [ordersRes, productsRes, reviewsRes, statsRes] = await Promise.all([
      apiFetchServer<{ orders: any[] }>("/api/orders"),
      apiFetchServer<{ products: any[] }>("/api/products"),
      apiFetchServer<{ reviews: any[] }>("/api/reviews"),
      apiFetchServer<{ productCount: number; orderCount: number; reviewCount: number; avgRating: number }>("/api/stats"),
    ])

    const defaultStats = { productCount: 0, orderCount: 0, reviewCount: 0, avgRating: 0 }

    return {
      orders: ordersRes?.orders || [],
      products: productsRes?.products || [],
      reviews: reviewsRes?.reviews || [],
      stats: { ...defaultStats, ...(statsRes || {}) },
    }
  } catch (e) {
    return {
      orders: [],
      products: [],
      reviews: [],
      stats: { productCount: 0, orderCount: 0, reviewCount: 0, avgRating: 0 },
    }
  }
}

export default async function AdminDashboard() {
  const { orders, products, reviews, stats } = await getData()

  const pending = orders.filter(o => o.status === "pending").length
  const delivered = orders.filter(o => o.status === "delivered").length
  const revenue = orders.filter(o => o.status === "delivered").reduce((s: number, o: any) => s + Number(o.total_price || 0), 0)
  const approvedReviews = reviews.filter(r => r.status === "approved")
  const pendingReviews = reviews.filter(r => r.status === "pending").length
  const recentOrders = orders.slice(0, 8)
  const statusColors: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#fef9c3", color: "#854d0e" },
    confirmed: { bg: "#dbeafe", color: "#1d4ed8" },
    processing: { bg: "#f3e8ff", color: "#7c3aed" },
    shipped: { bg: "#e0f2fe", color: "#0369a1" },
    delivered: { bg: "#dcfce7", color: "#16a34a" },
    cancelled: { bg: "#fee2e2", color: "#dc2626" },
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>Dashboard</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.25rem" }}>Your Flextreme business overview</p>
        </div>
        <div style={{ fontSize: "0.78rem", color: "#999" }}>Updated: {new Date().toLocaleString()}</div>
      </div>

      {(pending > 0 || pendingReviews > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem" }}>
          {pending > 0 && (
            <div style={{ padding: "1rem 1.25rem", backgroundColor: "#fef9c3", border: "1px solid #fcd34d", borderLeft: "4px solid #f59e0b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#854d0e" }}>⚡ {pending} order{pending > 1 ? "s" : ""} waiting for confirmation</span>
              <Link href="/admin/orders" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#854d0e", textDecoration: "none", backgroundColor: "#fcd34d", padding: "0.3rem 0.75rem" }}>View Orders →</Link>
            </div>
          )}
          {pendingReviews > 0 && (
            <div style={{ padding: "1rem 1.25rem", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderLeft: "4px solid #0284c7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0369a1" }}>💬 {pendingReviews} review{pendingReviews > 1 ? "s" : ""} waiting for approval</span>
              <Link href="/admin/reviews" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0369a1", textDecoration: "none", backgroundColor: "#bae6fd", padding: "0.3rem 0.75rem" }}>Review →</Link>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Orders", value: stats.orderCount, sub: `${pending} pending`, color: "#111", bg: "white" },
          { label: "Revenue", value: `BDT ${revenue.toLocaleString()}`, sub: `${delivered} delivered`, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Products", value: stats.productCount, sub: "In catalog", color: "#111", bg: "white" },
          { label: "Avg Rating", value: stats.avgRating.toFixed(1), sub: `${approvedReviews.length} reviews`, color: "#f59e0b", bg: "#fffbeb" },
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: stat.bg, border: "1px solid #e0e0e0", padding: "1.5rem" }}>
            <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>{stat.label}</p>
            <p style={{ fontSize: "2rem", fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: "0.7rem", color: "#aaa", marginTop: "0.5rem" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase" }}>Recent Orders</h2>
          <Link href="/admin/orders" style={{ fontSize: "0.75rem", color: "#666", textDecoration: "none", fontWeight: 600 }}>View All ({stats.orderCount}) →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p style={{ color: "#bbb", fontSize: "0.875rem", textAlign: "center", padding: "2rem 0" }}>No orders yet</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9f9f9", borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#999" }}>Customer</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#999" }}>Product</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#999" }}>Amount</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#999" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o: any) => {
                  const s = statusColors[o.status] || { bg: "#f5f5f5", color: "#999" }
                  return (
                    <tr key={o.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                      <td style={{ padding: "1rem" }}>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{o.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "#999" }}>{o.phone}</p>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#555" }}>{o.product_name}</td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: 700 }}>BDT {Number(o.total_price || 0).toLocaleString()}</td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, backgroundColor: s.bg, color: s.color, padding: "0.25rem 0.75rem", borderRadius: "20px", textTransform: "uppercase" }}>{o.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "1.5rem" }}>Quick Actions</h2>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[
            { label: "View Orders", href: "/admin/orders" },
            { label: "Manage Products", href: "/admin/products" },
            { label: "Approve Reviews", href: "/admin/reviews" },
            { label: "View Customers", href: "/admin/customers" },
            { label: "Site Settings", href: "/admin/settings" },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ padding: "0.75rem 1.5rem", backgroundColor: "#f9f9f9", color: "black", textDecoration: "none", fontWeight: 700, fontSize: "0.875rem", border: "1px solid #e0e0e0" }}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
