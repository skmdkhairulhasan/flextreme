"use client"
import { useEffect, useState } from "react"

type ProductBatch = {
  id: string
  name: string
  units: number
  production_cost: number
  intl_shipping: number
  customs: number
  other: number
  date: string
  notes: string
}

type CostEntry = {
  id: string
  label: string
  amount: number
  category: string
  date: string
  notes: string
}

type FinanceData = {
  batches: ProductBatch[]
  expenses: CostEntry[]
}

const EXPENSE_CATEGORIES = [
  "Marketing",
  "Packaging",
  "Photography",
  "Tools",
  "Staff",
  "Rent",
  "Utilities",
  "Other",
]

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

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function fmt(n: number) {
  return "BDT " + n.toLocaleString()
}

function BatchRow({ batch, onChange, onDeleteRequest }: {
  batch: ProductBatch
  onChange: (b: ProductBatch) => void
  onDeleteRequest: () => void
}) {
  const totalCost = (batch.production_cost || 0) + (batch.intl_shipping || 0) + (batch.customs || 0) + (batch.other || 0)
  const costPerUnit = batch.units > 0 ? totalCost / batch.units : 0
  
  const inp = (style?: React.CSSProperties) => ({
    border: "1px solid #e0e0e0",
    padding: "0.4rem 0.6rem",
    fontSize: "0.82rem",
    outline: "none",
    boxSizing: "border-box" as const,
    width: "100%",
    ...style
  })

  return (
    <div style={{ border: "1px solid #e0e0e0", marginBottom: "1rem", backgroundColor: "white" }}>
      <div style={{ backgroundColor: "#111", color: "white", padding: "0.75rem 1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <input
          value={batch.name}
          onChange={e => onChange({ ...batch, name: e.target.value })}
          placeholder="Batch name e.g. Compression Top — Batch 1"
          style={{
            ...inp(),
            flex: 1,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            fontWeight: 700
          }}
        />
        <input
          type="date"
          value={batch.date}
          onChange={e => onChange({ ...batch, date: e.target.value })}
          style={{
            ...inp({ width: "140px" }),
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white"
          }}
        />
        <button
          onClick={onDeleteRequest}
          style={{
            padding: "0.35rem 0.75rem",
            backgroundColor: "rgba(239,68,68,0.3)",
            border: "1px solid rgba(239,68,68,0.5)",
            color: "#f87171",
            fontSize: "0.72rem",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Delete
        </button>
      </div>
      
      <div style={{ padding: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Total Units</label>
          <input
            type="number"
            min="0"
            value={batch.units || ""}
            onChange={e => onChange({ ...batch, units: Number(e.target.value) || 0 })}
            placeholder="e.g. 140"
            style={inp()}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Production Cost (BDT)</label>
          <input
            type="number"
            min="0"
            value={batch.production_cost || ""}
            onChange={e => onChange({ ...batch, production_cost: Number(e.target.value) || 0 })}
            placeholder="Total factory cost"
            style={inp()}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Intl. Shipping (BDT)</label>
          <input
            type="number"
            min="0"
            value={batch.intl_shipping || ""}
            onChange={e => onChange({ ...batch, intl_shipping: Number(e.target.value) || 0 })}
            placeholder="Air/sea freight"
            style={inp()}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Customs / Duty (BDT)</label>
          <input
            type="number"
            min="0"
            value={batch.customs || ""}
            onChange={e => onChange({ ...batch, customs: Number(e.target.value) || 0 })}
            placeholder="Import duty, tax"
            style={inp()}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Other Costs (BDT)</label>
          <input
            type="number"
            min="0"
            value={batch.other || ""}
            onChange={e => onChange({ ...batch, other: Number(e.target.value) || 0 })}
            placeholder="Any other cost"
            style={inp()}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Notes</label>
          <input
            value={batch.notes}
            onChange={e => onChange({ ...batch, notes: e.target.value })}
            placeholder="Optional notes"
            style={inp()}
          />
        </div>
      </div>
      
      <div style={{ padding: "0.6rem 1rem", backgroundColor: "#f9f9f9", borderTop: "1px solid #f0f0f0", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.78rem" }}>Total Cost: <strong style={{ color: "#dc2626" }}>{fmt(totalCost)}</strong></span>
        <span style={{ fontSize: "0.78rem" }}>Cost Per Unit: <strong>{fmt(costPerUnit)}</strong></span>
        <span style={{ fontSize: "0.78rem" }}>Units: <strong>{batch.units}</strong></span>
      </div>
    </div>
  )
}

function ExpenseRow({ exp, onChange, onDeleteRequest }: {
  exp: CostEntry
  onChange: (e: CostEntry) => void
  onDeleteRequest: () => void
}) {
  const inp = (style?: React.CSSProperties) => ({
    border: "1px solid #e0e0e0",
    padding: "0.4rem 0.6rem",
    fontSize: "0.82rem",
    outline: "none",
    boxSizing: "border-box" as const,
    ...style
  })

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 150px 120px 36px", gap: "0.5rem", padding: "0.5rem 0.75rem", borderBottom: "1px solid #f5f5f5", alignItems: "center", minWidth: "530px" }}>
      <input
        value={exp.label}
        onChange={e => onChange({ ...exp, label: e.target.value })}
        placeholder="Expense description"
        style={{ ...inp(), width: "100%" }}
      />
      <select
        value={exp.category}
        onChange={e => onChange({ ...exp, category: e.target.value })}
        style={{ ...inp({ width: "100%", backgroundColor: "white" }) }}
      >
        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #e0e0e0" }}>
        <span style={{ padding: "0.4rem 0.5rem", backgroundColor: "#f5f5f5", fontSize: "0.72rem", color: "#666", borderRight: "1px solid #e0e0e0", whiteSpace: "nowrap" }}>BDT</span>
        <input
          type="number"
          min="0"
          value={exp.amount || ""}
          onChange={e => onChange({ ...exp, amount: Number(e.target.value) || 0 })}
          placeholder="0"
          style={{ border: "none", padding: "0.4rem 0.5rem", fontSize: "0.82rem", outline: "none", width: "80px" }}
        />
      </div>
      <input
        type="date"
        value={exp.date}
        onChange={e => onChange({ ...exp, date: e.target.value })}
        style={{ ...inp({ width: "100%" }) }}
      />
      <button
        onClick={onDeleteRequest}
        style={{
          width: "26px",
          height: "26px",
          backgroundColor: "#fff0f0",
          border: "1px solid #ffcccc",
          color: "#cc0000",
          cursor: "pointer",
          fontSize: "0.7rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900
        }}
      >
        ✕
      </button>
    </div>
  )
}

export default function FinancePage() {
  const [batches, setBatches] = useState<ProductBatch[]>([])
  const [expenses, setExpenses] = useState<CostEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "batches" | "expenses">("overview")
  const [confirmDelete, setConfirmDelete] = useState<{ label: string; onConfirm: () => void } | null>(null)
  const isMobile = useIsMobile()

  const [grossRevenue, setGrossRevenue] = useState(0)
  const [unitsSold, setUnitsSold] = useState(0)
  const [logisticsCost, setLogisticsCost] = useState(0)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [settingsRes, ordersRes, logRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/orders"),
        fetch("/api/logistics-costs"),
      ])

      const settingsData = await settingsRes.json()
      const ordersData = await ordersRes.json()
      const logData = await logRes.json()

      const financeSettings = (settingsData.settings || []).find((s: any) => s.key === "finance_data")
      if (financeSettings?.value) {
        const parsed: FinanceData = JSON.parse(financeSettings.value)
        setBatches(parsed.batches || [])
        setExpenses(parsed.expenses || [])
      }

      const delivered = (ordersData.orders || []).filter((o: any) => o.status === "delivered")
      setGrossRevenue(delivered.reduce((s: number, o: any) => s + Number(o.total_price || 0), 0))
      setUnitsSold(delivered.reduce((s: number, o: any) => s + Number(o.quantity || 0), 0))
      
      const costs = (logData.costs || [])
      setLogisticsCost(costs.reduce((s: number, l: any) => 
        s + (Number(l.delivery_charge) || 0) + (Number(l.travel_cost) || 0) + (Number(l.cod_tax) || 0) + (Number(l.other_costs) || 0), 0
      ))
    } catch (e) {
      console.error("Failed to fetch finance data:", e)
    }
    setLoading(false)
  }

  async function saveAll() {
    setSaving(true)
    try {
      const financeData: FinanceData = { batches, expenses }
      
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "finance_data",
          value: JSON.stringify(financeData)
        })
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error("Failed to save:", e)
    }
    setSaving(false)
  }

  const totalProductionCost = batches.reduce((s, b) => 
    s + (b.production_cost || 0) + (b.intl_shipping || 0) + (b.customs || 0) + (b.other || 0), 0
  )
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const netProfit = grossRevenue - totalProductionCost - totalExpenses - logisticsCost
  const revenuePerUnit = unitsSold > 0 ? grossRevenue / unitsSold : 0
  const totalUnits = batches.reduce((s, b) => s + (b.units || 0), 0)
  const costPerUnit = totalUnits > 0 ? totalProductionCost / totalUnits : 0

  const expByCategory = EXPENSE_CATEGORIES.map(cat => ({
    category: cat,
    amount: expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0)
  })).filter(c => c.amount > 0)

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Finance</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? "1rem" : "2rem" }}>
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "white", padding: "2rem", maxWidth: "400px", width: "90%" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Delete {confirmDelete.label}?</h3>
            <p style={{ marginBottom: "1.5rem", color: "#666" }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: "0.5rem 1rem", backgroundColor: "#f5f5f5", border: "none", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button
                onClick={() => {
                  confirmDelete.onConfirm()
                  setConfirmDelete(null)
                }}
                style={{ padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, textTransform: "uppercase" }}>Finance</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.5rem" }}>Production costs, expenses, and profit tracking</p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: saved ? "#16a34a" : saving ? "#999" : "black",
            color: "white",
            border: "none",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: "0.8rem",
            textTransform: "uppercase"
          }}
        >
          {saved ? "Saved ✓" : saving ? "Saving..." : "Save All"}
        </button>
      </div>

      <div style={{ backgroundColor: "white", border: "2px solid #e0e0e0", marginBottom: "2rem" }}>
        <div style={{ display: "flex", borderBottom: "2px solid #e0e0e0", overflowX: "auto" }}>
          {[
            { id: "overview", label: "Overview" },
            { id: "batches", label: `Production (${batches.length})` },
            { id: "expenses", label: `Expenses (${expenses.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "0.75rem 1.5rem",
                fontWeight: 700,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid black" : "3px solid transparent",
                marginBottom: "-2px",
                backgroundColor: "transparent",
                cursor: "pointer",
                color: activeTab === tab.id ? "black" : "#999"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div style={{ padding: isMobile ? "1rem" : "2rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1.5rem" }}>
                <p style={{ fontSize: "0.7rem", color: "#15803d", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>Gross Revenue</p>
                <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#16a34a" }}>{fmt(grossRevenue)}</p>
                <p style={{ fontSize: "0.75rem", color: "#16a34a", marginTop: "0.5rem" }}>{unitsSold} units sold</p>
              </div>

              <div style={{ backgroundColor: "#fee2e2", border: "1px solid #fecaca", padding: "1.5rem" }}>
                <p style={{ fontSize: "0.7rem", color: "#991b1b", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>Production Costs</p>
                <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#dc2626" }}>{fmt(totalProductionCost)}</p>
                <p style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "0.5rem" }}>{batches.length} batches</p>
              </div>

              <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a", padding: "1.5rem" }}>
                <p style={{ fontSize: "0.7rem", color: "#92400e", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>Expenses</p>
                <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#d97706" }}>{fmt(totalExpenses)}</p>
                <p style={{ fontSize: "0.75rem", color: "#d97706", marginTop: "0.5rem" }}>{expenses.length} entries</p>
              </div>

              <div style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa", padding: "1.5rem" }}>
                <p style={{ fontSize: "0.7rem", color: "#9a3412", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>Logistics Costs</p>
                <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#ea580c" }}>{fmt(logisticsCost)}</p>
              </div>

              <div style={{ backgroundColor: netProfit >= 0 ? "#f0fdf4" : "#fee2e2", border: netProfit >= 0 ? "1px solid #bbf7d0" : "1px solid #fecaca", padding: "1.5rem" }}>
                <p style={{ fontSize: "0.7rem", color: netProfit >= 0 ? "#15803d" : "#991b1b", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>Net Profit</p>
                <p style={{ fontSize: "1.75rem", fontWeight: 900, color: netProfit >= 0 ? "#16a34a" : "#dc2626" }}>{fmt(netProfit)}</p>
                <p style={{ fontSize: "0.75rem", color: netProfit >= 0 ? "#16a34a" : "#dc2626", marginTop: "0.5rem" }}>
                  {netProfit >= 0 ? "Profitable" : "Loss"}
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
              <div style={{ backgroundColor: "#f9f9f9", padding: "1.5rem", border: "1px solid #e0e0e0" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase", color: "#666" }}>Revenue Per Unit</p>
                <p style={{ fontSize: "1.5rem", fontWeight: 900 }}>{fmt(revenuePerUnit)}</p>
              </div>
              <div style={{ backgroundColor: "#f9f9f9", padding: "1.5rem", border: "1px solid #e0e0e0" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase", color: "#666" }}>Cost Per Unit</p>
                <p style={{ fontSize: "1.5rem", fontWeight: 900 }}>{fmt(costPerUnit)}</p>
              </div>
            </div>

            {expByCategory.length > 0 && (
              <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem", textTransform: "uppercase" }}>Expenses Breakdown</h3>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                  {expByCategory.map(c => (
                    <div key={c.category} style={{ padding: "1rem", backgroundColor: "#f9f9f9" }}>
                      <p style={{ fontSize: "0.7rem", color: "#666", marginBottom: "0.5rem" }}>{c.category}</p>
                      <p style={{ fontSize: "1.25rem", fontWeight: 900 }}>{fmt(c.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "batches" && (
          <div style={{ padding: isMobile ? "1rem" : "2rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.5rem" }}>Production Batches</h2>
              <p style={{ fontSize: "0.75rem", color: "#666" }}>Each batch = one order/shipment from manufacturer. Add production cost, international shipping, customs duty.</p>
            </div>
            <button
              onClick={() => setBatches(prev => [...prev, {
                id: uid(),
                name: "New Batch",
                units: 0,
                production_cost: 0,
                intl_shipping: 0,
                customs: 0,
                other: 0,
                date: new Date().toISOString().split("T")[0],
                notes: ""
              }])}
              style={{ padding: "0.6rem 1.25rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", textTransform: "uppercase", marginBottom: "1.5rem" }}
            >
              + Add Batch
            </button>

            {batches.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", border: "2px dashed #e0e0e0" }}>
                <p style={{ fontSize: "0.82rem" }}>Add your first product batch to track production and shipping costs</p>
              </div>
            ) : (
              batches.map(batch => (
                <BatchRow
                  key={batch.id}
                  batch={batch}
                  onChange={updated => setBatches(prev => prev.map(b => b.id === batch.id ? updated : b))}
                  onDeleteRequest={() => setConfirmDelete({
                    label: batch.name,
                    onConfirm: () => setBatches(prev => prev.filter(b => b.id !== batch.id))
                  })}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "expenses" && (
          <div style={{ padding: isMobile ? "1rem" : "2rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.5rem" }}>Business Expenses</h2>
              <p style={{ fontSize: "0.75rem", color: "#666" }}>Marketing, packaging, photography, tools, staff — anything that's not production or logistics.</p>
            </div>
            <button
              onClick={() => setExpenses(prev => [...prev, {
                id: uid(),
                label: "",
                amount: 0,
                category: "Marketing",
                date: new Date().toISOString().split("T")[0],
                notes: ""
              }])}
              style={{ padding: "0.6rem 1.25rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", textTransform: "uppercase", marginBottom: "1.5rem" }}
            >
              + Add Expense
            </button>

            {expenses.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", border: "2px dashed #e0e0e0" }}>
                <p style={{ fontSize: "0.82rem" }}>Add marketing costs, packaging, photography, etc.</p>
              </div>
            ) : (
              <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", overflowX: "auto" }}>
                {expenses.map(exp => (
                  <ExpenseRow
                    key={exp.id}
                    exp={exp}
                    onChange={updated => setExpenses(prev => prev.map(e => e.id === exp.id ? updated : e))}
                    onDeleteRequest={() => setConfirmDelete({
                      label: `expense "${exp.label || "Untitled"}"`,
                      onConfirm: () => setExpenses(prev => prev.filter(e => e.id !== exp.id))
                    })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
