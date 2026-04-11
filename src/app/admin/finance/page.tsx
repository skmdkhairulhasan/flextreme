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

type CostEntry = { id: string; label: string; amount: number; category: string; date: string; notes: string }
type FinanceData = {
  batches: ProductBatch[]
  expenses: CostEntry[]
}
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

const EXPENSE_CATEGORIES = [
  "Marketing / Ads",
  "Photography / Content",
  "Packaging",
  "Office / Tools",
  "Staff / Labour",
  "Website / Tech",
  "Other",
]

function uid() { return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7) }
function fmt(n: number) { return "BDT " + Math.round(n).toLocaleString() }
function pct(n: number, d: number) { return d > 0 ? (n / d * 100).toFixed(1) + "%" : "—" }

// ── outside component to avoid re-mount focus loss ──
function BatchRow({ batch, onChange, onDelete, onDeleteRequest }: { batch: ProductBatch; onChange: (b: ProductBatch) => void; onDelete: () => void; onDeleteRequest: () => void }) {
  const totalCost = (batch.production_cost || 0) + (batch.intl_shipping || 0) + (batch.customs || 0) + (batch.other || 0)
  const costPerUnit = batch.units > 0 ? totalCost / batch.units : 0
  const inp = (style?: React.CSSProperties) => ({ border: "1px solid #e0e0e0", padding: "0.4rem 0.6rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" as const, width: "100%", ...style })
  return (
    <div style={{ border: "1px solid #e0e0e0", marginBottom: "1rem", backgroundColor: "white" }}>
      <div style={{ backgroundColor: "#111", color: "white", padding: "0.75rem 1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <input value={batch.name} onChange={e => onChange({ ...batch, name: e.target.value })} placeholder="Batch name e.g. Compression Top — Batch 1" style={{ ...inp(), flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontWeight: 700 }} />
        <input type="date" value={batch.date} onChange={e => onChange({ ...batch, date: e.target.value })} style={{ ...inp({ width: "140px" }), background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }} />
        <button onClick={onDeleteRequest} style={{ padding: "0.35rem 0.75rem", backgroundColor: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.5)", color: "#f87171", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>Delete</button>
      </div>
      <div style={{ padding: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Total Units</label>
          <input type="number" min="0" value={batch.units || ""} onChange={e => onChange({ ...batch, units: Number(e.target.value) || 0 })} placeholder="e.g. 140" style={inp()} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Production Cost (BDT)</label>
          <input type="number" min="0" value={batch.production_cost || ""} onChange={e => onChange({ ...batch, production_cost: Number(e.target.value) || 0 })} placeholder="Total factory cost" style={inp()} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Intl. Shipping (BDT)</label>
          <input type="number" min="0" value={batch.intl_shipping || ""} onChange={e => onChange({ ...batch, intl_shipping: Number(e.target.value) || 0 })} placeholder="Air/sea freight" style={inp()} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Customs / Duty (BDT)</label>
          <input type="number" min="0" value={batch.customs || ""} onChange={e => onChange({ ...batch, customs: Number(e.target.value) || 0 })} placeholder="Import duty, tax" style={inp()} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Other Costs (BDT)</label>
          <input type="number" min="0" value={batch.other || ""} onChange={e => onChange({ ...batch, other: Number(e.target.value) || 0 })} placeholder="Any other cost" style={inp()} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#555", marginBottom: "0.3rem" }}>Notes</label>
          <input value={batch.notes} onChange={e => onChange({ ...batch, notes: e.target.value })} placeholder="Optional notes" style={inp()} />
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

function ExpenseRow({ exp, onChange, onDelete, onDeleteRequest }: { exp: CostEntry; onChange: (e: CostEntry) => void; onDelete: () => void; onDeleteRequest: () => void }) {
  const inp = (style?: React.CSSProperties) => ({ border: "1px solid #e0e0e0", padding: "0.4rem 0.6rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" as const, ...style })
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 150px 120px 36px", gap: "0.5rem", padding: "0.5rem 0.75rem", borderBottom: "1px solid #f5f5f5", alignItems: "center", minWidth: "530px" }}>
      <input value={exp.label} onChange={e => onChange({ ...exp, label: e.target.value })} placeholder="Expense description" style={{ ...inp(), width: "100%" }} />
      <select value={exp.category} onChange={e => onChange({ ...exp, category: e.target.value })} style={{ ...inp({ width: "100%", backgroundColor: "white" }) }}>
        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #e0e0e0" }}>
        <span style={{ padding: "0.4rem 0.5rem", backgroundColor: "#f5f5f5", fontSize: "0.72rem", color: "#666", borderRight: "1px solid #e0e0e0", whiteSpace: "nowrap" }}>BDT</span>
        <input type="number" min="0" value={exp.amount || ""} onChange={e => onChange({ ...exp, amount: Number(e.target.value) || 0 })} placeholder="0" style={{ border: "none", padding: "0.4rem 0.5rem", fontSize: "0.82rem", outline: "none", width: "80px" }} />
      </div>
      <input type="date" value={exp.date} onChange={e => onChange({ ...exp, date: e.target.value })} style={{ ...inp({ width: "100%" }) }} />
      <button onClick={onDeleteRequest} style={{ width: "26px", height: "26px", backgroundColor: "#fff0f0", border: "1px solid #ffcccc", color: "#cc0000", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>✕</button>
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

  // Live order data
  const [grossRevenue, setGrossRevenue] = useState(0)
  const [unitsSold, setUnitsSold] = useState(0)
  const [logisticsCost, setLogisticsCost] = useState(0)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const supabase = createClient()
    const [{ data: settingsData }, { data: ordersData }, { data: logData }] = await Promise.all([
      supabase.from("settings").select("value").eq("key", "finance_data").single(),
      supabase.from("orders").select("total_price, quantity, status"),
      supabase.from("logistics_costs").select("delivery_charge, travel_cost, cod_tax"),
    ])
    if (settingsData?.value) {
      const parsed: FinanceData = JSON.parse(settingsData.value)
      setBatches(parsed.batches || [])
      setExpenses(parsed.expenses || [])
    }
    const delivered = (ordersData || []).filter((o: any) => o.status === "delivered")
    setGrossRevenue(delivered.reduce((s: number, o: any) => s + Number(o.total_price), 0))
    setUnitsSold(delivered.reduce((s: number, o: any) => s + Number(o.quantity), 0))
    setLogisticsCost((logData || []).reduce((s: number, l: any) => s + (Number(l.delivery_charge)||0) + (Number(l.travel_cost)||0) + (Number(l.cod_tax)||0), 0))
    setLoading(false)
  }

  async function saveAll() {
    setSaving(true)
    const supabase = createClient()
    const data: FinanceData = { batches, expenses }
    await supabase.from("settings").upsert({ key: "finance_data", value: JSON.stringify(data) }, { onConflict: "key" })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Calculations
  const totalProductionCost = batches.reduce((s, b) => s + (b.production_cost || 0) + (b.intl_shipping || 0) + (b.customs || 0) + (b.other || 0), 0)
  const totalUnitsProduced = batches.reduce((s, b) => s + (b.units || 0), 0)
  const avgCostPerUnit = totalUnitsProduced > 0 ? totalProductionCost / totalUnitsProduced : 0
  const totalMarketing = expenses.filter(e => e.category === "Marketing / Ads").reduce((s, e) => s + (e.amount || 0), 0)
  const totalOtherExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0)

  const totalCOGS = unitsSold > 0 ? (avgCostPerUnit * unitsSold) : 0 // cost of goods sold
  const grossProfit = grossRevenue - totalCOGS
  const grossMargin = grossRevenue > 0 ? (grossProfit / grossRevenue * 100) : 0

  const netRevenue = grossRevenue - logisticsCost
  const netProfit = netRevenue - totalCOGS - totalOtherExpenses
  const netMargin = grossRevenue > 0 ? (netProfit / grossRevenue * 100) : 0

  const unitsRemaining = totalUnitsProduced - unitsSold
  const projectedRevenue = unitsRemaining > 0 && unitsSold > 0 ? (grossRevenue / unitsSold) * unitsRemaining : 0
  const projectedProfit = projectedRevenue - (avgCostPerUnit * unitsRemaining) - (totalOtherExpenses / Math.max(unitsSold, 1)) * unitsRemaining

  const totalInvested = totalProductionCost + totalOtherExpenses
  const roi = totalInvested > 0 ? ((netProfit / totalInvested) * 100) : 0

  // Expense breakdown by category
  const expByCategory = EXPENSE_CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0)
  })).filter(e => e.total > 0)

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>Loading finance data...</div>

  return (
    <div>
      <ConfirmModal
        open={!!confirmDelete}
        title="Are you sure?"
        message={confirmDelete ? "You are about to delete <strong>" + confirmDelete.label + "</strong>. This cannot be undone." : ""}
        onConfirm={() => { confirmDelete?.onConfirm(); setConfirmDelete(null) }}
        onCancel={() => setConfirmDelete(null)}
      />
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "1.35rem" : "1.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Business Finance</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.25rem" }}>Production costs, expenses, and full P&L overview.</p>
        </div>
        <button onClick={saveAll} disabled={saving} style={{ padding: "0.75rem 1.75rem", backgroundColor: saved ? "#16a34a" : "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: saving ? "not-allowed" : "pointer", textTransform: "uppercase", transition: "all 0.2s", minWidth: "120px" }}>
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save All"}
        </button>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div style={{ display: "flex", gap: "0", borderBottom: "2px solid black", marginBottom: "1.5rem", overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
        {[
          { id: "overview", label: "P&L Overview" },
          { id: "batches", label: "Product Batches (" + batches.length + ")" },
          { id: "expenses", label: "Other Expenses (" + expenses.length + ")" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ padding: "0.6rem 1.25rem", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", border: "none", borderBottom: activeTab === tab.id ? "3px solid black" : "3px solid transparent", marginBottom: "-2px", backgroundColor: "transparent", cursor: "pointer", color: activeTab === tab.id ? "black" : "#999", whiteSpace: "nowrap" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div>
          {/* Key metrics */}

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(175px, 1fr))", gap: isMobile ? "0.5rem" : "1rem", marginBottom: "1.25rem" }}>
            {[
              { label: "Gross Revenue", value: fmt(grossRevenue), sub: unitsSold + " units sold", color: "#111", bg: "white" },
              { label: "Cost of Goods Sold", value: fmt(totalCOGS), sub: fmt(avgCostPerUnit) + " per unit", color: "#dc2626", bg: "#fff5f5" },
              { label: "Gross Profit", value: fmt(grossProfit), sub: "Margin: " + grossMargin.toFixed(1) + "%", color: grossProfit >= 0 ? "#16a34a" : "#dc2626", bg: "#f0fdf4" },
              { label: "Logistics Costs", value: fmt(logisticsCost), sub: "From logistics page", color: "#f97316", bg: "#fff7ed" },
              { label: "Other Expenses", value: fmt(totalOtherExpenses), sub: "Marketing, packaging etc.", color: "#7c3aed", bg: "#faf5ff" },
              { label: "Net Profit", value: fmt(netProfit), sub: "Net margin: " + netMargin.toFixed(1) + "%", color: netProfit >= 0 ? "#16a34a" : "#dc2626", bg: netProfit >= 0 ? "#f0fdf4" : "#fff5f5" },
              { label: "Total Invested", value: fmt(totalInvested), sub: "Production + expenses", color: "#111", bg: "white" },
              { label: "ROI", value: roi.toFixed(1) + "%", sub: "Return on investment", color: roi >= 0 ? "#16a34a" : "#dc2626", bg: "white" },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: s.bg, border: "1px solid #e0e0e0", padding: isMobile ? "0.75rem" : "1.25rem" }}>
                <p style={{ fontSize: "0.65rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>{s.label}</p>
                <p style={{ fontSize: isMobile ? "1.05rem" : "1.35rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: isMobile ? "0.6rem" : "0.68rem", color: "#aaa", marginTop: "0.25rem" }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* P&L Statement */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "2px solid black" }}>
                Profit & Loss Statement
              </h2>
              <PLRow label="Gross Revenue" value={grossRevenue} bold />
              <PLRow label={"  Cost of Goods Sold (" + unitsSold + " units × " + fmt(avgCostPerUnit) + ")"} value={-totalCOGS} />
              <PLRow label="Gross Profit" value={grossProfit} bold border />
              <PLRow label="  Logistics / Delivery Costs" value={-logisticsCost} />
              {expByCategory.map(e => (
                <PLRow key={e.cat} label={"  " + e.cat} value={-e.total} />
              ))}
              <PLRow label="Total Expenses" value={-(logisticsCost + totalOtherExpenses)} border />
              <PLRow label="NET PROFIT" value={netProfit} bold big />
            </div>

            {/* Inventory + Projection */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
                <h2 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "2px solid black" }}>Inventory Status</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", textAlign: "center" }}>
                  {[
                    { label: "Produced", value: totalUnitsProduced, color: "#111" },
                    { label: "Sold", value: unitsSold, color: "#16a34a" },
                    { label: "Remaining", value: unitsRemaining, color: unitsRemaining > 0 ? "#f97316" : "#999" },
                  ].map(s => (
                    <div key={s.label} style={{ padding: "1rem", backgroundColor: "#f9f9f9", border: "1px solid #f0f0f0" }}>
                      <p style={{ fontSize: "1.75rem", fontWeight: 900, color: s.color }}>{s.value}</p>
                      <p style={{ fontSize: "0.68rem", color: "#999", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.2rem" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                {totalUnitsProduced > 0 && (
                  <div style={{ marginTop: "1rem", height: "8px", backgroundColor: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: pct(unitsSold, totalUnitsProduced), backgroundColor: "#16a34a", borderRadius: "4px", transition: "width 0.5s ease" }} />
                  </div>
                )}
                {totalUnitsProduced > 0 && <p style={{ fontSize: "0.7rem", color: "#999", marginTop: "0.4rem", textAlign: "center" }}>{pct(unitsSold, totalUnitsProduced)} sold</p>}
              </div>

              <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
                <h2 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "2px solid black" }}>Revenue Projection</h2>
                <p style={{ fontSize: "0.78rem", color: "#666", marginBottom: "1rem" }}>Based on your current avg selling price per unit ({unitsSold > 0 ? fmt(grossRevenue / unitsSold) : "—"})</p>
                {[
                  { label: "Revenue if all remaining sold", value: projectedRevenue },
                  { label: "Projected additional profit", value: projectedProfit },
                  { label: "Projected total revenue", value: grossRevenue + projectedRevenue },
                  { label: "Projected total net profit", value: netProfit + projectedProfit },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: i < 3 ? "1px solid #f5f5f5" : "none" }}>
                    <span style={{ fontSize: "0.78rem", color: "#555" }}>{r.label}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: r.value >= 0 ? "#16a34a" : "#dc2626" }}>{fmt(r.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expense breakdown */}
          {expByCategory.length > 0 && (
            <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>Expense Breakdown</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {expByCategory.sort((a, b) => b.total - a.total).map(e => (
                  <div key={e.cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{e.cat}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{fmt(e.total)} <span style={{ color: "#999", fontWeight: 400 }}>({pct(e.total, totalOtherExpenses)})</span></span>
                    </div>
                    <div style={{ height: "5px", backgroundColor: "#f5f5f5", borderRadius: "3px" }}>
                      <div style={{ height: "100%", width: pct(e.total, totalOtherExpenses), backgroundColor: "#7c3aed", borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BATCHES TAB ── */}
      {activeTab === "batches" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 700 }}>Product Batches</p>
              <p style={{ fontSize: "0.75rem", color: "#666" }}>Each batch = one order/shipment from manufacturer. Add production cost, international shipping, customs duty.</p>
            </div>
            <button onClick={() => setBatches(prev => [...prev, { id: uid(), name: "New Batch", units: 0, production_cost: 0, intl_shipping: 0, customs: 0, other: 0, date: new Date().toISOString().split("T")[0], notes: "" }])} style={{ padding: "0.6rem 1.25rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", textTransform: "uppercase" }}>
              + Add Batch
            </button>
          </div>
          {batches.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed #e0e0e0", color: "#999" }}>
              <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>No batches yet</p>
              <p style={{ fontSize: "0.82rem" }}>Add your first product batch to track production and shipping costs</p>
            </div>
          ) : batches.map(batch => (
            <BatchRow key={batch.id} batch={batch} onChange={updated => setBatches(prev => prev.map(b => b.id === batch.id ? updated : b))} onDelete={() => setBatches(prev => prev.filter(b => b.id !== batch.id))} onDeleteRequest={() => setConfirmDelete({ label: "batch: " + batch.name, onConfirm: () => setBatches(prev => prev.filter(b => b.id !== batch.id)) })} />
          ))}
          {batches.length > 0 && (
            <div style={{ padding: "1rem 1.25rem", backgroundColor: "#111", color: "white", display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.82rem" }}>Total Units: <strong>{totalUnitsProduced}</strong></span>
              <span style={{ fontSize: "0.82rem" }}>Total Production Cost: <strong>{fmt(totalProductionCost)}</strong></span>
              <span style={{ fontSize: "0.82rem" }}>Avg Cost/Unit: <strong>{fmt(avgCostPerUnit)}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* ── EXPENSES TAB ── */}
      {activeTab === "expenses" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 700 }}>Other Business Expenses</p>
              <p style={{ fontSize: "0.75rem", color: "#666" }}>Marketing, packaging, photography, tools, staff — anything that's not production or logistics.</p>
            </div>
            <button onClick={() => setExpenses(prev => [...prev, { id: uid(), label: "", category: "Marketing / Ads", amount: 0, date: new Date().toISOString().split("T")[0], notes: "" }])} style={{ padding: "0.6rem 1.25rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", textTransform: "uppercase" }}>
              + Add Expense
            </button>
          </div>
          {expenses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed #e0e0e0", color: "#999" }}>
              <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>No expenses yet</p>
              <p style={{ fontSize: "0.82rem" }}>Add marketing costs, packaging, photography, etc.</p>
            </div>
          ) : (
            <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 150px 120px 36px", gap: "0.5rem", padding: "0.5rem 0.75rem", backgroundColor: "black", color: "white", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", minWidth: "530px" }}>
                <span>Description</span><span>Category</span><span>Amount</span><span>Date</span><span></span>
              </div>
              {expenses.map(exp => (
                <ExpenseRow key={exp.id} exp={exp} onChange={updated => setExpenses(prev => prev.map(e => e.id === exp.id ? updated : e))} onDelete={() => setExpenses(prev => prev.filter(e => e.id !== exp.id))} onDeleteRequest={() => setConfirmDelete({ label: "expense: " + (exp.label || "untitled"), onConfirm: () => setExpenses(prev => prev.filter(e => e.id !== exp.id)) })} />
              ))}
              <div style={{ padding: "0.75rem 1rem", backgroundColor: "#111", color: "white", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <span style={{ fontSize: "0.82rem" }}>Total Expenses: <strong>{fmt(totalOtherExpenses)}</strong></span>
                <span style={{ fontSize: "0.82rem" }}>Marketing: <strong>{fmt(totalMarketing)}</strong> ({pct(totalMarketing, totalOtherExpenses)})</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PLRow({ label, value, bold, border, big }: { label: string; value: number; bold?: boolean; border?: boolean; big?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: border ? "1px solid #e0e0e0" : "none", borderTop: big ? "2px solid black" : "none", marginTop: big ? "0.5rem" : 0 }}>
      <span style={{ fontSize: big ? "0.9rem" : "0.82rem", fontWeight: bold ? 700 : 400, color: bold ? "#111" : "#555" }}>{label}</span>
      <span style={{ fontSize: big ? "1rem" : "0.85rem", fontWeight: bold ? 800 : 600, color: value >= 0 ? (bold ? "#111" : "#16a34a") : "#dc2626" }}>
        {value >= 0 ? "" : "−"}{fmt(Math.abs(value))}
      </span>
    </div>
  )
}
