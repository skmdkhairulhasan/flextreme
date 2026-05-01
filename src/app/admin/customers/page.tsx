"use client"
import { useEffect, useState } from "react"

type Customer = {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
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
  created_at: string
}

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "flex100" | "vip" | "repeat" | "cancelled">("all")
  const [search, setSearch] = useState("")
  const [selectAll, setSelectAll] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [customersRes, ordersRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/orders"),
      ])

      const customersData = await customersRes.json()
      const ordersData = await ordersRes.json()

      setCustomers(customersData.customers || [])
      setOrders(ordersData.orders || [])
    } catch (e) {
      console.error("Failed to fetch data:", e)
    }
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

  // Customer of the Month (highest spend this month)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthlySpend = customers.map(c => ({
    ...c,
    monthSpend: orders
      .filter(o => o.phone === c.phone && o.created_at.startsWith(thisMonth) && o.status === "delivered")
      .reduce((sum, o) => sum + o.total_price, 0)
  }))
  const customerOfMonth = monthlySpend.sort((a, b) => b.monthSpend - a.monthSpend)[0]

  // Customer of the Year (highest total spend)
  const customerOfYear = [...customers].sort((a, b) => b.total_spent - a.total_spent)[0]

  // Filters
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

  // Search
  if (search) {
    filtered = filtered.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    )
  }

  // Copy to clipboard (Excel compatible)
  function copyToClipboard() {
    const headers = ["Name", "Phone", "Email", "Orders", "Total Spent", "FLEX100", "VIP"]
    const rows = filtered.map(c => [
      c.name,
      c.phone,
      c.email || "",
      c.total_orders,
      c.total_spent,
      c.flex100 ? "Yes" : "No",
      c.vip ? "Yes" : "No"
    ])
    
    const tsv = [headers, ...rows].map(row => row.join("\t")).join("\n")
    navigator.clipboard.writeText(tsv).then(() => {
      alert(`Copied ${filtered.length} customers to clipboard! Paste into Excel.`)
    })
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Customers</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? "1rem" : "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>Customers</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            {customers.length} total • {activeCustomers.length} active
          </p>
        </div>
        
        {/* Export Button */}
        <button
          onClick={copyToClipboard}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.8rem",
            textTransform: "uppercase"
          }}
        >
          📋 Copy {filtered.length} to Clipboard
        </button>
      </div>

      {/* Customer of Month/Year Badges */}
      {(customerOfMonth || customerOfYear) && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
          {customerOfMonth && customerOfMonth.monthSpend > 0 && (
            <div style={{ backgroundColor: "#fef3c7", border: "2px solid #fbbf24", padding: "1.5rem" }}>
              <p style={{ fontSize: "0.7rem", color: "#92400e", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>
                🏆 Customer of the Month
              </p>
              <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "#d97706" }}>{customerOfMonth.name}</p>
              <p style={{ fontSize: "0.875rem", color: "#92400e", marginTop: "0.25rem" }}>
                BDT {customerOfMonth.monthSpend.toLocaleString()} this month
              </p>
            </div>
          )}

          {customerOfYear && customerOfYear.total_spent > 0 && (
            <div style={{ backgroundColor: "#fce7f3", border: "2px solid #f472b6", padding: "1.5rem" }}>
              <p style={{ fontSize: "0.7rem", color: "#9f1239", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>
                👑 Customer of the Year
              </p>
              <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "#db2777" }}>{customerOfYear.name}</p>
              <p style={{ fontSize: "0.875rem", color: "#9f1239", marginTop: "0.25rem" }}>
                BDT {customerOfYear.total_spent.toLocaleString()} all-time
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: "2rem" }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or phone..."
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "0.75rem",
            border: "1px solid #e0e0e0",
            fontSize: "0.95rem"
          }}
        />
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "All", value: customers.length, color: "#111", bg: "#f5f5f5" },
          { label: "Active", value: activeCustomers.length, color: "#16a34a", bg: "#dcfce7" },
          { label: "FLEX100", value: flex100Customers.length, color: "#7c3aed", bg: "#f3e8ff" },
          { label: "VIP", value: vipCustomers.length, color: "#dc2626", bg: "#fee2e2" },
          { label: "Repeat", value: repeatCustomers.length, color: "#0369a1", bg: "#e0f2fe" },
          { label: "Cancelled", value: cancelledCustomers.length, color: "#dc2626", bg: "#fee2e2" },
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: stat.bg, border: "1px solid " + stat.color + "40", padding: "1rem" }}>
            <p style={{ fontSize: "0.7rem", color: stat.color, marginBottom: "0.5rem", fontWeight: 700 }}>{stat.label.toUpperCase()}</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 900, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ backgroundColor: "white", border: "2px solid #e0e0e0", marginBottom: "2rem" }}>
        <div style={{ display: "flex", borderBottom: "2px solid #e0e0e0", overflowX: "auto" }}>
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "flex100", label: "FLEX100" },
            { id: "vip", label: "VIP" },
            { id: "repeat", label: "Repeat" },
            { id: "cancelled", label: "Cancelled" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              style={{
                padding: "0.75rem 1.5rem",
                fontWeight: 700,
                fontSize: "0.75rem",
                textTransform: "uppercase",
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

        {/* Customer List */}
        {filtered.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "#999" }}>
            No customers found.
          </div>
        ) : (
          <div>
            {filtered.map(customer => {
              const isRepeat = getOrderCount(customer.phone) >= 2
              const isCancelled = hasCancelledOrder(customer.phone)
              const customerOrders = getCustomerOrders(customer.phone)

              return (
                <div
                  key={customer.id}
                  onClick={() => setSelected(selected?.id === customer.id ? null : customer)}
                  style={{
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid #f0f0f0",
                    cursor: "pointer",
                    backgroundColor: selected?.id === customer.id ? "#f9f9f9" : "white"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                    <div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{customer.name}</span>
                        {customer.flex100 && <span style={{ fontSize: "0.6rem", fontWeight: 900, backgroundColor: "#f3e8ff", color: "#7c3aed", padding: "0.1rem 0.45rem", borderRadius: "10px" }}>FLEX100</span>}
                        {customer.vip && <span style={{ fontSize: "0.6rem", fontWeight: 900, backgroundColor: "#fee2e2", color: "#dc2626", padding: "0.1rem 0.45rem", borderRadius: "10px" }}>VIP</span>}
                        {isRepeat && <span style={{ fontSize: "0.6rem", fontWeight: 900, backgroundColor: "#e0f2fe", color: "#0369a1", padding: "0.1rem 0.45rem", borderRadius: "10px" }}>REPEAT</span>}
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "#666" }}>{customer.phone}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>BDT {customer.total_spent.toLocaleString()}</p>
                      <p style={{ fontSize: "0.75rem", color: "#666" }}>{customer.total_orders} orders</p>
                    </div>
                  </div>

                  {selected?.id === customer.id && (
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e0e0e0" }}>
                      {customer.email && (
                        <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
                          📧 {customer.email}
                        </p>
                      )}

                      <h4 style={{ fontSize: "0.8rem", fontWeight: 700, marginTop: "1rem", marginBottom: "0.75rem" }}>ORDER HISTORY</h4>
                      {customerOrders.length === 0 ? (
                        <p style={{ fontSize: "0.875rem", color: "#999" }}>No orders yet</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {customerOrders.slice(0, 5).map(order => (
                            <div key={order.id} style={{ fontSize: "0.75rem", display: "flex", justifyContent: "space-between", padding: "0.5rem", backgroundColor: "#f9f9f9" }}>
                              <span>
                                {new Date(order.created_at).toLocaleDateString()}
                                <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", fontWeight: 700, padding: "0.1rem 0.5rem", borderRadius: "10px", backgroundColor: order.status === "delivered" ? "#dcfce7" : "#f0f0f0", color: order.status === "delivered" ? "#16a34a" : "#666" }}>
                                  {order.status}
                                </span>
                              </span>
                              <span style={{ fontWeight: 600 }}>BDT {order.total_price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
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
