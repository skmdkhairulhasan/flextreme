import Link from "next/link"
import sql from "@/lib/db"

export const dynamic = "force-dynamic"

async function getData() {
  try {
    const [orders, products, reviews, statsRow] = await Promise.all([
      sql`SELECT * FROM orders ORDER BY created_at DESC`,
      sql`SELECT id, name, is_featured, in_stock, price FROM products ORDER BY created_at DESC`,
      sql`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        ORDER BY r.created_at DESC
      `,
      sql`
        SELECT
          (SELECT COUNT(*) FROM products) AS product_count,
          (SELECT COUNT(*) FROM orders) AS order_count,
          (SELECT COUNT(*) FROM reviews) AS review_count,
          (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE approved = true) AS avg_rating,
          (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status IN ('confirmed','processing','shipped','delivered')) AS total_revenue
      `,
    ])
    const s = statsRow[0]
    return {
      orders,
      products,
      reviews,
      stats: {
        productCount: Number(s?.product_count || 0),
        orderCount: Number(s?.order_count || 0),
        reviewCount: Number(s?.review_count || 0),
        avgRating: Math.round(Number(s?.avg_rating || 0) * 10) / 10,
        totalRevenue: Number(s?.total_revenue || 0),
      },
    }
  } catch (e) {
    console.error("Dashboard data error:", e)
    return { orders: [], products: [], reviews: [], stats: { productCount: 0, orderCount: 0, reviewCount: 0, avgRating: 0, totalRevenue: 0 } }
  }
}

export default async function AdminDashboard() {
  const { orders, products, reviews, stats } = await getData()

  const pending = orders.filter((o: any) => o.status === "pending").length
  const confirmed = orders.filter((o: any) => o.status === "confirmed").length
  const shipped = orders.filter((o: any) => o.status === "shipped").length
  const delivered = orders.filter((o: any) => o.status === "delivered").length
  const revenue = orders.filter((o: any) => o.status === "delivered").reduce((s: number, o: any) => s + Number(o.total_price || 0), 0)

  const pendingReviews = reviews.filter((r: any) => !r.approved && r.approved !== true).length
  const approvedReviews = reviews.filter((r: any) => r.approved === true).length

  const recentOrders = orders.slice(0, 10)

  const statusColors: Record<string, { bg: string; color: string }> = {
    pending:    { bg: "#fef9c3", color: "#854d0e" },
    confirmed:  { bg: "#dbeafe", color: "#1d4ed8" },
    processing: { bg: "#f3e8ff", color: "#7c3aed" },
    shipped:    { bg: "#e0f2fe", color: "#0369a1" },
    delivered:  { bg: "#dcfce7", color: "#16a34a" },
    cancelled:  { bg: "#fee2e2", color: "#dc2626" },
  }

  return (
    <div style={{ padding: "2rem" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>Dashboard</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.25rem" }}>Flextreme business overview</p>
        </div>
        <div style={{ fontSize: "0.78rem", color: "#999" }}>
          {new Date().toLocaleDateString("en-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* ── Action Notifications ── always visible if there's anything to act on */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem" }}>
        {pending > 0 && (
          <div style={{ padding: "1rem 1.25rem", backgroundColor: "#fef9c3", border: "1px solid #fcd34d", borderLeft: "4px solid #f59e0b", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#854d0e" }}>
              ⚡ {pending} new order{pending > 1 ? "s" : ""} waiting for confirmation
            </span>
            <Link href="/admin/orders?status=pending" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#854d0e", textDecoration: "none", backgroundColor: "#fcd34d", padding: "0.35rem 0.875rem", whiteSpace: "nowrap" }}>
              Confirm Now →
            </Link>
          </div>
        )}

        {confirmed > 0 && (
          <div style={{ padding: "1rem 1.25rem", backgroundColor: "#dbeafe", border: "1px solid #93c5fd", borderLeft: "4px solid #3b82f6", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1d4ed8" }}>
              📦 {confirmed} confirmed order{confirmed > 1 ? "s" : ""} ready to process
            </span>
            <Link href="/admin/orders?status=confirmed" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1d4ed8", textDecoration: "none", backgroundColor: "#93c5fd", padding: "0.35rem 0.875rem", whiteSpace: "nowrap" }}>
              Process →
            </Link>
          </div>
        )}

        {shipped > 0 && (
          <div style={{ padding: "1rem 1.25rem", backgroundColor: "#e0f2fe", border: "1px solid #7dd3fc", borderLeft: "4px solid #0284c7", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0369a1" }}>
              🚚 {shipped} order{shipped > 1 ? "s" : ""} in transit — mark as delivered when done
            </span>
            <Link href="/admin/orders?status=shipped" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0369a1", textDecoration: "none", backgroundColor: "#7dd3fc", padding: "0.35rem 0.875rem", whiteSpace: "nowrap" }}>
              View →
            </Link>
          </div>
        )}

        {pendingReviews > 0 && (
          <div style={{ padding: "1rem 1.25rem", backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderLeft: "4px solid #22c55e", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#15803d" }}>
              💬 {pendingReviews} review{pendingReviews > 1 ? "s" : ""} waiting for your approval
            </span>
            <Link href="/admin/reviews" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#15803d", textDecoration: "none", backgroundColor: "#86efac", padding: "0.35rem 0.875rem", whiteSpace: "nowrap" }}>
              Approve →
            </Link>
          </div>
        )}

        {pending === 0 && confirmed === 0 && shipped === 0 && pendingReviews === 0 && (
          <div style={{ padding: "1rem 1.25rem", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderLeft: "4px solid #16a34a" }}>
            <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#15803d" }}>✓ All caught up — no pending actions</span>
          </div>
        )}
      </div>

      {/* ── Stats Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Orders",   value: stats.orderCount,                       sub: `${pending} pending`,             color: "#111",    bg: "white" },
          { label: "Revenue",        value: `BDT ${revenue.toLocaleString()}`,       sub: `${delivered} delivered`,         color: "#16a34a", bg: "#f0fdf4" },
          { label: "Products",       value: stats.productCount,                      sub: "In catalog",                     color: "#111",    bg: "white" },
          { label: "Reviews",        value: approvedReviews,                         sub: `${pendingReviews} pending`,      color: "#f59e0b", bg: "#fffbeb" },
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: stat.bg, border: "1px solid #e0e0e0", padding: "1.5rem" }}>
            <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>{stat.label}</p>
            <p style={{ fontSize: "2rem", fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: "0.7rem", color: "#aaa", marginTop: "0.5rem" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Order pipeline ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
        {[
          { label: "Pending",    count: pending,    href: "/admin/orders?status=pending",    ...statusColors.pending },
          { label: "Confirmed",  count: confirmed,  href: "/admin/orders?status=confirmed",  ...statusColors.confirmed },
          { label: "Shipped",    count: shipped,    href: "/admin/orders?status=shipped",    ...statusColors.shipped },
          { label: "Delivered",  count: delivered,  href: "/admin/orders?status=delivered",  ...statusColors.delivered },
        ].map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none", display: "block", backgroundColor: s.bg, border: `1px solid ${s.color}40`, padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 900, color: s.color }}>{s.count}</p>
            <p style={{ fontSize: "0.65rem", fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
          </Link>
        ))}
      </div>

      {/* ── Recent Orders ── */}
      <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase" }}>Recent Orders</h2>
          <Link href="/admin/orders" style={{ fontSize: "0.75rem", color: "#666", textDecoration: "none", fontWeight: 600 }}>View All ({stats.orderCount}) →</Link>
        </div>

        {recentOrders.length === 0 ? (
          <p style={{ color: "#bbb", fontSize: "0.875rem", textAlign: "center", padding: "2rem 0" }}>No orders yet</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9f9f9", borderBottom: "2px solid #e0e0e0" }}>
                  {["Customer", "Product", "Amount", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#999" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o: any) => {
                  const s = statusColors[o.status] || { bg: "#f5f5f5", color: "#999" }
                  return (
                    <tr key={o.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                      <td style={{ padding: "0.875rem" }}>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{o.name}</p>
                        <p style={{ fontSize: "0.72rem", color: "#999" }}>{o.phone}</p>
                      </td>
                      <td style={{ padding: "0.875rem", fontSize: "0.875rem", color: "#555" }}>{o.product_name}</td>
                      <td style={{ padding: "0.875rem", fontSize: "0.875rem", fontWeight: 700 }}>BDT {Number(o.total_price || 0).toLocaleString()}</td>
                      <td style={{ padding: "0.875rem" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, backgroundColor: s.bg, color: s.color, padding: "0.25rem 0.65rem", borderRadius: "20px", textTransform: "uppercase" }}>{o.status}</span>
                      </td>
                      <td style={{ padding: "0.875rem", fontSize: "0.72rem", color: "#999", whiteSpace: "nowrap" }}>
                        {new Date(o.created_at).toLocaleDateString("en-BD", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "1.5rem" }}>Quick Actions</h2>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[
            { label: "📋 Orders",    href: "/admin/orders" },
            { label: "📦 Products",  href: "/admin/products" },
            { label: "💬 Reviews",   href: "/admin/reviews" },
            { label: "👥 Customers", href: "/admin/customers" },
            { label: "⚙️ Settings",  href: "/admin/settings" },
            { label: "📊 Finance",   href: "/admin/finance" },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ padding: "0.75rem 1.25rem", backgroundColor: "#f9f9f9", color: "black", textDecoration: "none", fontWeight: 700, fontSize: "0.82rem", border: "1px solid #e0e0e0" }}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
