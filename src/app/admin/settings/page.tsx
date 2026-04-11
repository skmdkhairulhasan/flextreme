"use client"
import ConfirmModal from "@/components/ui/ConfirmModal"

// ── TYPE DECLARATIONS ──
type DeliveryZone = { id: string; name: string; charge: string; days: string }
type DeliveryGroup = { id: string; name: string; zones: DeliveryZone[] }
type FaqItem = { id: string; question: string; answer: string }
type ColorTheme = { primary: string; accent: string; bg: string; text: string; btnBg: string; btnText: string }

// ── CONFIRM HELPER ──
// All components call this to get a promise-based confirmation
// Simple confirm state type
type ConfirmState = { title: string; message: string; onOk: () => void } | null

// ── DELIVERY EDITOR ──
interface DeliveryEditorProps {
  groups: DeliveryGroup[]
  saving: boolean
  saved: boolean
  onUpdate: (g: DeliveryGroup[]) => void
  onSave: () => void
}
function DeliveryEditor({ groups, saving, saved, onUpdate, onSave, requestConfirm }: DeliveryEditorProps & { requestConfirm: (msg: string, onOk: () => void) => void }) {
  function addGroup() {
    onUpdate([...groups, { id: "g_" + Date.now(), name: "New Group", zones: [] }])
  }
  function deleteGroup(id: string) {
    const g = groups.find(g => g.id === id)
    requestConfirm("Delete group <strong>" + (g?.name || "this group") + "</strong> and all its cities? Cannot be undone.", () => {
      onUpdate(groups.filter(g => g.id !== id))
    })
  }
  function updateGroupName(id: string, name: string) {
    onUpdate(groups.map(g => g.id === id ? { ...g, name } : g))
  }
  function addZone(groupId: string) {
    onUpdate(groups.map(g => g.id !== groupId ? g : {
      ...g, zones: [...g.zones, { id: "z_" + Date.now(), name: "New City", charge: "", days: "" }]
    }))
  }
  function deleteZone(groupId: string, zoneId: string) {
    const g = groups.find(g => g.id === groupId)
    const z = g?.zones.find(z => z.id === zoneId)
    requestConfirm("Delete city <strong>" + (z?.name || "this city") + "</strong>? Cannot be undone.", () => {
      onUpdate(groups.map(g => g.id !== groupId ? g : { ...g, zones: g.zones.filter(z => z.id !== zoneId) }))
    })
  }
  function updateZone(groupId: string, zoneId: string, field: keyof DeliveryZone, value: string) {
    onUpdate(groups.map(g => g.id !== groupId ? g : {
      ...g, zones: g.zones.map(z => z.id !== zoneId ? z : { ...z, [field]: value })
    }))
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.02em" }}>Delivery Zones</h2>
          <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.2rem" }}>Add groups (divisions) and zones (cities) with charges and estimated delivery days.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={addGroup} style={{ padding: "0.6rem 1.25rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", cursor: "pointer" }}>+ Add Group</button>
          <button onClick={onSave} disabled={saving} style={{ padding: "0.6rem 1.25rem", backgroundColor: saved ? "#16a34a" : "#111", color: "white", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: saving ? "not-allowed" : "pointer", minWidth: "100px", transition: "all 0.2s" }}>
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save All"}
          </button>
        </div>
      </div>
      {groups.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed #e0e0e0", color: "#999" }}>
          No delivery zones yet. Click "+ Add Group" to create a division.
        </div>
      )}
      {groups.map(group => (
        <div key={group.id} style={{ border: "1px solid #e0e0e0", marginBottom: "1.5rem", backgroundColor: "white" }}>
          {/* Group header */}
          <div style={{ backgroundColor: "#111", color: "white", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              value={group.name}
              onChange={e => updateGroupName(group.id, e.target.value)}
              placeholder="Group name e.g. Dhaka Division"
              style={{ flex: 1, minWidth: "120px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "0.35rem 0.75rem", fontSize: "0.85rem", fontWeight: 700, outline: "none" }}
            />
            <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
              <button onClick={() => addZone(group.id)} style={{ padding: "0.4rem 0.65rem", backgroundColor: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ City</button>
              <button onClick={() => deleteGroup(group.id)} style={{ padding: "0.4rem 0.65rem", backgroundColor: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Delete</button>
            </div>
          </div>
          {/* Column headers */}
          {group.zones.length > 0 && (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 36px", backgroundColor: "#f5f5f5", borderBottom: "1px solid #e0e0e0", minWidth: "360px" }}>
                {["City / Area", "Charge (BDT)", "Days", ""].map((h, i) => (
                  <div key={i} style={{ padding: "0.4rem 0.6rem", fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", color: "#666" }}>{h}</div>
                ))}
              </div>
              {group.zones.map((zone, idx) => (
                <div key={zone.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 36px", borderBottom: "1px solid #f5f5f5", backgroundColor: idx % 2 === 0 ? "white" : "#fafafa", alignItems: "center", minWidth: "360px" }}>
                  <div style={{ padding: "0.3rem 0.5rem" }}>
                    <input value={zone.name} onChange={e => updateZone(group.id, zone.id, "name", e.target.value)} placeholder="City name" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.35rem 0.5rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                  <div style={{ padding: "0.3rem 0.4rem" }}>
                    <input value={zone.charge} onChange={e => updateZone(group.id, zone.id, "charge", e.target.value)} placeholder="60" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.35rem 0.4rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                  <div style={{ padding: "0.3rem 0.4rem" }}>
                    <input value={zone.days} onChange={e => updateZone(group.id, zone.id, "days", e.target.value)} placeholder="1-2" style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.35rem 0.4rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                  <div style={{ padding: "0.3rem 0.25rem", display: "flex", justifyContent: "center" }}>
                    <button onClick={() => deleteZone(group.id, zone.id)} style={{ width: "24px", height: "24px", backgroundColor: "#fff0f0", border: "1px solid #ffcccc", color: "#cc0000", cursor: "pointer", fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {group.zones.length === 0 && (
            <div style={{ padding: "1rem", textAlign: "center", color: "#bbb", fontSize: "0.8rem" }}>No cities yet. Click "+ Add City".</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── FAQ EDITOR ──
interface FaqEditorProps {
  faqs: FaqItem[]
  saving: boolean
  saved: boolean
  onUpdate: (f: FaqItem[]) => void
  onSave: () => void
}
function FaqEditor({ faqs, saving, saved, onUpdate, onSave, requestConfirm }: FaqEditorProps & { requestConfirm: (msg: string, onOk: () => void) => void }) {
  function addFaq() {
    onUpdate([...faqs, { id: "faq_" + Date.now(), question: "", answer: "" }])
  }
  function deleteFaq(id: string) {
    const faq = faqs.find(f => f.id === id)
    requestConfirm("Delete FAQ: <strong>" + (faq?.question || "this question") + "</strong>? Cannot be undone.", () => {
      onUpdate(faqs.filter(f => f.id !== id))
    })
  }
  function updateFaq(id: string, field: "question" | "answer", value: string) {
    onUpdate(faqs.map(f => f.id === id ? { ...f, [field]: value } : f))
  }
  function moveFaq(id: string, dir: -1 | 1) {
    const idx = faqs.findIndex(f => f.id === id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= faqs.length) return
    const next = [...faqs]
    ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
    onUpdate(next)
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.02em" }}>Frequently Asked Questions</h2>
          <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.2rem" }}>Shown on the Delivery page. Drag to reorder using the ↑↓ buttons.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={addFaq} style={{ padding: "0.6rem 1.25rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", cursor: "pointer" }}>+ Add Question</button>
          <button onClick={onSave} disabled={saving} style={{ padding: "0.6rem 1.25rem", backgroundColor: saved ? "#16a34a" : "#111", color: "white", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: saving ? "not-allowed" : "pointer", minWidth: "100px", transition: "all 0.2s" }}>
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save All"}
          </button>
        </div>
      </div>
      {faqs.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed #e0e0e0", color: "#999" }}>
          No FAQs yet. Click "+ Add Question" to create one.
        </div>
      )}
      {faqs.map((faq, idx) => (
        <div key={faq.id} style={{ border: "1px solid #e0e0e0", marginBottom: "0.75rem", backgroundColor: "white" }}>
          <div style={{ padding: "0.75rem 1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flexShrink: 0 }}>
              <button onClick={() => moveFaq(faq.id, -1)} disabled={idx === 0} style={{ width: "24px", height: "24px", border: "1px solid #e0e0e0", backgroundColor: "white", cursor: idx === 0 ? "not-allowed" : "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center", opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
              <button onClick={() => moveFaq(faq.id, 1)} disabled={idx === faqs.length - 1} style={{ width: "24px", height: "24px", border: "1px solid #e0e0e0", backgroundColor: "white", cursor: idx === faqs.length - 1 ? "not-allowed" : "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center", opacity: idx === faqs.length - 1 ? 0.3 : 1 }}>↓</button>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", whiteSpace: "nowrap" }}>Q{idx + 1}</span>
                <input
                  value={faq.question}
                  onChange={e => updateFaq(faq.id, "question", e.target.value)}
                  placeholder="Type your question here..."
                  style={{ flex: 1, border: "1px solid #e0e0e0", padding: "0.45rem 0.75rem", fontSize: "0.875rem", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", whiteSpace: "nowrap", marginTop: "0.5rem" }}>A</span>
                <textarea
                  value={faq.answer}
                  onChange={e => updateFaq(faq.id, "answer", e.target.value)}
                  placeholder="Type the answer here..."
                  rows={2}
                  style={{ flex: 1, border: "1px solid #e0e0e0", padding: "0.45rem 0.75rem", fontSize: "0.82rem", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <button onClick={() => deleteFaq(faq.id)} style={{ width: "28px", height: "28px", backgroundColor: "#fff0f0", border: "1px solid #ffcccc", color: "#cc0000", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>✕</button>
          </div>
        </div>
      ))}
      {faqs.length > 0 && (
        <p style={{ fontSize: "0.7rem", color: "#999", marginTop: "0.5rem" }}>These FAQs appear on the Delivery page of your website.</p>
      )}
    </div>
  )
}

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import HeroImageEditor from "@/components/admin/HeroImageEditor"

// ── TYPES ──
type SizeColumn = { id: string; name: string; description: string }
type SizeRow = { id: string; label: string; values: Record<string, string> }
type CategoryGroup = { id: string; name: string; subcategories: string[] }
type SizeTable = { id: string; name: string; unit: string; columns: SizeColumn[]; rows: SizeRow[] }


const makeTable = (name: string): SizeTable => ({
  id: "table_" + Date.now() + "_" + Math.random().toString(36).slice(2),
  name,
  unit: "inches",
  columns: [
    { id: "chest", name: "Chest", description: "Measure around the fullest part of your chest." },
    { id: "waist", name: "Waist", description: "Measure around your natural waistline." },
    { id: "hips", name: "Hips", description: "Measure around the fullest part of your hips." },
  ],
  rows: [
    { id: "xs", label: "XS", values: {} },
    { id: "s", label: "S", values: {} },
    { id: "m", label: "M", values: {} },
    { id: "l", label: "L", values: {} },
    { id: "xl", label: "XL", values: {} },
    { id: "xxl", label: "XXL", values: {} },
  ]
})

const DEFAULT_TABLES: SizeTable[] = [makeTable("Compression Top")]

// ── SIZE TABLE EDITOR — outside parent to prevent focus loss ──
interface TableEditorProps {
  table: SizeTable
  saving: boolean
  saved: boolean
  onUpdate: (t: SizeTable) => void
  onDelete: () => void
  onSave: () => void
  requestConfirm: (message: string, onOk: () => void) => void
}

function SizeTableEditor({ table, saving, saved, onUpdate, onDelete, onSave, requestConfirm }: TableEditorProps) {
  const colCount = table.columns.length
  const gridCols = "110px " + "1fr ".repeat(colCount) + "34px"

  function updateTableName(name: string) { onUpdate({ ...table, name }) }
  function updateUnit(unit: string) { onUpdate({ ...table, unit }) }

  function addRow() {
    const row: SizeRow = { id: "r_" + Date.now(), label: "New Size", values: {} }
    onUpdate({ ...table, rows: [...table.rows, row] })
  }
  function deleteRow(id: string) {
    const row = table.rows.find(r => r.id === id)
    requestConfirm("Delete row <strong>" + (row?.label || "this row") + "</strong>? Cannot be undone.", () => {
      onUpdate({ ...table, rows: table.rows.filter(r => r.id !== id) })
    })
  }
  function updateRow(id: string, field: string, value: string) {
    onUpdate({
      ...table, rows: table.rows.map(r =>
        r.id !== id ? r : field === "label" ? { ...r, label: value } : { ...r, values: { ...r.values, [field]: value } }
      )
    })
  }

  function addColumn() {
    const col: SizeColumn = { id: "c_" + Date.now(), name: "New Column", description: "" }
    onUpdate({ ...table, columns: [...table.columns, col] })
  }
  function deleteColumn(id: string) {
    const col = table.columns.find(c => c.id === id)
    requestConfirm("Delete column <strong>" + (col?.name || "this column") + "</strong>? All data will be lost.", () => {
      onUpdate({
        ...table,
        columns: table.columns.filter(c => c.id !== id),
        rows: table.rows.map(r => { const v = { ...r.values }; delete v[id]; return { ...r, values: v } })
      })
    })
  }
  function updateColumnName(id: string, name: string) {
    onUpdate({ ...table, columns: table.columns.map(c => c.id === id ? { ...c, name } : c) })
  }
  function updateColumnDesc(id: string, description: string) {
    onUpdate({ ...table, columns: table.columns.map(c => c.id === id ? { ...c, description } : c) })
  }

  return (
    <div style={{ border: "1px solid #e0e0e0", marginBottom: "2rem", backgroundColor: "white" }}>

      {/* Table header bar */}
      <div style={{ backgroundColor: "#111", color: "white", padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "200px" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>Table Name</span>
          <input
            value={table.name}
            onChange={e => updateTableName(e.target.value)}
            style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "0.4rem 0.75rem", fontSize: "0.9rem", fontWeight: 700, outline: "none", minWidth: 0 }}
            placeholder="e.g. Compression Top, Hoodie, Regular T-Shirt..."
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.2)", overflow: "hidden" }}>
            <button onClick={() => updateUnit("inches")} style={{ padding: "0.35rem 0.65rem", fontSize: "0.7rem", fontWeight: 700, backgroundColor: table.unit === "inches" ? "white" : "transparent", color: table.unit === "inches" ? "black" : "white", border: "none", cursor: "pointer" }}>Inches</button>
            <button onClick={() => updateUnit("cm")} style={{ padding: "0.35rem 0.65rem", fontSize: "0.7rem", fontWeight: 700, backgroundColor: table.unit === "cm" ? "white" : "transparent", color: table.unit === "cm" ? "black" : "white", border: "none", cursor: "pointer" }}>CM</button>
          </div>
          <button onClick={addRow} style={{ padding: "0.35rem 0.75rem", backgroundColor: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>+ Row</button>
          <button onClick={addColumn} style={{ padding: "0.35rem 0.75rem", backgroundColor: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>+ Column</button>
          <button onClick={onSave} disabled={saving} style={{ padding: "0.35rem 1rem", backgroundColor: saved ? "#16a34a" : "white", color: saved ? "white" : "black", border: "none", fontSize: "0.7rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", minWidth: "70px", transition: "all 0.2s" }}>
            {saving ? "..." : saved ? "Saved ✓" : "Save"}
          </button>
          <button onClick={() => requestConfirm("Delete table <strong>" + table.name + "</strong> and ALL its data? Cannot be undone.", onDelete)} title="Delete this table" style={{ padding: "0.35rem 0.65rem", backgroundColor: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>Delete Table</button>
        </div>
      </div>

      {table.columns.length === 0 && (
        <div style={{ padding: "1.5rem", textAlign: "center", color: "#999", fontSize: "0.82rem", backgroundColor: "#fafafa" }}>
          No columns yet. Click <strong>+ Column</strong> to add measurement columns like Chest, Height, Weight, etc.
        </div>
      )}

      {table.columns.length > 0 && (
        <div style={{ overflowX: "auto" }}>

          {/* Column name row */}
          <div style={{ display: "grid", gridTemplateColumns: gridCols, backgroundColor: "#f0f0f0", borderBottom: "1px solid #e0e0e0", minWidth: "500px" }}>
            <div style={{ padding: "0.5rem 0.6rem", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666", display: "flex", alignItems: "center" }}>Size Label</div>
            {table.columns.map(col => (
              <div key={col.id} style={{ padding: "0.3rem 0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <input
                  value={col.name}
                  onChange={e => updateColumnName(col.id, e.target.value)}
                  placeholder="Column name"
                  style={{ flex: 1, border: "1px solid #ccc", padding: "0.3rem 0.5rem", fontSize: "0.78rem", fontWeight: 700, outline: "none", minWidth: 0, backgroundColor: "white" }}
                />
                <button onClick={() => deleteColumn(col.id)} title="Remove column" style={{ width: "22px", height: "22px", backgroundColor: "#fff0f0", border: "1px solid #ffcccc", color: "#cc0000", cursor: "pointer", fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 900 }}>✕</button>
              </div>
            ))}
            <div />
          </div>

          {/* Column description row */}
          <div style={{ display: "grid", gridTemplateColumns: gridCols, backgroundColor: "#fafafa", borderBottom: "2px solid #e0e0e0", minWidth: "500px" }}>
            <div style={{ padding: "0.4rem 0.6rem", fontSize: "0.62rem", color: "#aaa", fontStyle: "italic", display: "flex", alignItems: "center" }}>How to measure</div>
            {table.columns.map(col => (
              <div key={col.id} style={{ padding: "0.3rem 0.4rem" }}>
                <input
                  value={col.description}
                  onChange={e => updateColumnDesc(col.id, e.target.value)}
                  placeholder={"Description for " + col.name + " (shown on size guide page)"}
                  style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.3rem 0.5rem", fontSize: "0.68rem", color: "#666", outline: "none", boxSizing: "border-box", fontStyle: "italic", backgroundColor: "white" }}
                />
              </div>
            ))}
            <div />
          </div>

          {/* Data rows */}
          {table.rows.map((row, idx) => (
            <div key={row.id} style={{ display: "grid", gridTemplateColumns: gridCols, borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "white" : "#fafafa", alignItems: "center", minWidth: "500px" }}>
              <div style={{ padding: "0.3rem 0.4rem" }}>
                <input
                  value={row.label}
                  onChange={e => updateRow(row.id, "label", e.target.value)}
                  placeholder="XS, S, M..."
                  style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.35rem 0.5rem", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              {table.columns.map(col => (
                <div key={col.id} style={{ padding: "0.3rem 0.4rem" }}>
                  <input
                    value={row.values[col.id] || ""}
                    onChange={e => updateRow(row.id, col.id, e.target.value)}
                    placeholder="e.g. 36-38"
                    style={{ width: "100%", border: "1px solid #e0e0e0", padding: "0.35rem 0.5rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div style={{ padding: "0.3rem 0.25rem", display: "flex", justifyContent: "center" }}>
                <button onClick={() => deleteRow(row.id)} title="Delete row" style={{ width: "24px", height: "24px", backgroundColor: "#fff0f0", border: "1px solid #ffcccc", color: "#cc0000", cursor: "pointer", fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>✕</button>
              </div>
            </div>
          ))}

          {table.rows.length === 0 && (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#bbb", fontSize: "0.82rem" }}>
              No rows. Click <strong>+ Row</strong> to add sizes.
            </div>
          )}

        </div>
      )}

      {/* Live preview */}
      {table.rows.length > 0 && table.columns.length > 0 && (
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #f0f0f0", backgroundColor: "#fafafa" }}>
          <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#999", marginBottom: "0.6rem", letterSpacing: "0.08em" }}>Preview — as shown on site</p>
          <div style={{ overflowX: "auto", border: "1px solid #e0e0e0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ backgroundColor: "black", color: "white" }}>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Size</th>
                  {table.columns.map(col => (
                    <th key={col.id} style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{col.name} ({table.unit})</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={row.id} style={{ backgroundColor: i % 2 === 0 ? "white" : "#f9f9f9" }}>
                    <td style={{ padding: "0.5rem 0.75rem", fontWeight: 700 }}>{row.label || "—"}</td>
                    {table.columns.map(col => (
                      <td key={col.id} style={{ padding: "0.5rem 0.75rem", color: "#555" }}>{row.values[col.id] ? row.values[col.id] + " " + table.unit : "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const DEFAULT_SIZES: SizeRow[] = [
  { id: "xs", label: "XS", values: {} },
  { id: "s", label: "S", values: {} },
  { id: "m", label: "M", values: {} },
  { id: "l", label: "L", values: {} },
  { id: "xl", label: "XL", values: {} },
  { id: "xxl", label: "XXL", values: {} },
]
const DEFAULT_COLUMNS: SizeColumn[] = [
  { id: "chest", name: "Chest", description: "Measure around the fullest part of your chest, keeping the tape horizontal." },
  { id: "waist", name: "Waist", description: "Measure around your natural waistline, at the narrowest part of your torso." },
  { id: "hips", name: "Hips", description: "Measure around the fullest part of your hips and seat." },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onOk: () => void } | null>(null)
  function requestConfirm(message: string, onOk: () => void) {
    setConfirmState({ title: "Are you sure?", message, onOk })
  }
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [sizeTables, setSizeTables] = useState<SizeTable[]>(DEFAULT_TABLES)
  const [tablesSaving, setTablesSaving] = useState(false)
  const [tablesSaved, setTablesSaved] = useState(false)
  const [categories, setCategories] = useState<CategoryGroup[]>([
    { id: "cat_tops", name: "tops", subcategories: ["compression top", "hoodie", "tank top"] },
    { id: "cat_bottoms", name: "bottoms", subcategories: ["shorts", "joggers", "leggings"] },
    { id: "cat_accessories", name: "accessories", subcategories: [] },
  ])
  const [catSaving, setCatSaving] = useState(false)
  const [catSaved, setCatSaved] = useState(false)
  const [deliveryGroups, setDeliveryGroups] = useState<DeliveryGroup[]>([])
  const [deliverySaving, setDeliverySaving] = useState(false)
  const [deliverySaved, setDeliverySaved] = useState(false)
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [faqSaving, setFaqSaving] = useState(false)
  const [faqSaved, setFaqSaved] = useState(false)
  const [activeTab, setActiveTab] = useState("hero")

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    const supabase = createClient()
    const { data } = await supabase.from("settings").select("*")
    const map: Record<string, string> = {}
    data?.forEach((s: any) => { map[s.key] = s.value })
    setSettings(map)
    // Load size tables
    if (map.size_tables) {
      setSizeTables(JSON.parse(map.size_tables))
    } else if (map.size_rows) {
      // Migrate old single-table format
      const oldRows = JSON.parse(map.size_rows)
      const oldCols = map.size_columns ? JSON.parse(map.size_columns) : [
        { id: "chest", name: "Chest", description: "" },
        { id: "waist", name: "Waist", description: "" },
        { id: "hips", name: "Hips", description: "" },
      ]
      const migratedRows = oldRows.map((row: any) => ({
        id: row.id, label: row.label,
        values: row.values || { chest: row.chest || "", waist: row.waist || "", hips: row.hips || "" }
      }))
      setSizeTables([{ id: "table_legacy", name: "Size Guide", unit: map.size_unit || "inches", columns: oldCols, rows: migratedRows }])
    }
    // Load product categories — handle old string[] and new CategoryGroup[] formats
    if (map.product_categories) {
      try {
        const parsed = JSON.parse(map.product_categories)
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          // Migrate old string[] to CategoryGroup[]
          setCategories(parsed.map((name: string) => ({ id: "cat_" + name.replace(/\s+/g,"-"), name, subcategories: [] })))
        } else {
          setCategories(parsed)
        }
      } catch {}
    }
    // Load delivery groups
    if (map.delivery_groups) {
      setDeliveryGroups(JSON.parse(map.delivery_groups))
    } else {
      // Migrate old fixed delivery keys
      setDeliveryGroups([
        { id: "dhaka", name: "Dhaka Division", zones: [
          { id: "dhaka_city", name: "Dhaka City", charge: map.delivery_dhaka_city || "", days: "1-2" },
          { id: "dhaka_district", name: "Dhaka District", charge: map.delivery_dhaka_district || "", days: "2-3" },
          { id: "narayanganj", name: "Narayanganj", charge: map.delivery_narayanganj || "", days: "2-3" },
          { id: "gazipur", name: "Gazipur", charge: map.delivery_gazipur || "", days: "2-3" },
          { id: "mymensingh", name: "Mymensingh", charge: map.delivery_mymensingh || "", days: "2-3" },
        ]},
        { id: "chittagong", name: "Chittagong Division", zones: [
          { id: "chittagong", name: "Chittagong", charge: map.delivery_chittagong || "", days: "3-4" },
          { id: "comilla", name: "Comilla", charge: map.delivery_comilla || "", days: "2-3" },
        ]},
        { id: "others", name: "Other Divisions", zones: [
          { id: "sylhet", name: "Sylhet", charge: map.delivery_sylhet || "", days: "3-4" },
          { id: "rajshahi", name: "Rajshahi", charge: map.delivery_rajshahi || "", days: "3-4" },
          { id: "khulna", name: "Khulna", charge: map.delivery_khulna || "", days: "3-4" },
          { id: "jessore", name: "Jessore", charge: map.delivery_jessore || "", days: "3-4" },
          { id: "bogra", name: "Bogra", charge: map.delivery_bogra || "", days: "3-5" },
          { id: "barisal", name: "Barisal", charge: map.delivery_barisal || "", days: "3-5" },
          { id: "rangpur", name: "Rangpur", charge: map.delivery_rangpur || "", days: "3-5" },
          { id: "other", name: "All Other Districts", charge: map.delivery_other || "", days: "3-5" },
        ]},
      ])
    }
    // Load FAQs
    if (map.faqs) setFaqs(JSON.parse(map.faqs))
    else setFaqs([
      { id: "faq1", question: "How do I place an order?", answer: "Simply visit our Products page, choose your item, select size and color, fill in your details and click Order Now. We confirm via WhatsApp and deliver Cash on Delivery." },
      { id: "faq2", question: "What payment methods do you accept?", answer: "We accept Cash on Delivery (COD) only. Pay when your order arrives at your door — no advance payment needed." },
      { id: "faq3", question: "How long does delivery take?", answer: "Dhaka City: 1-2 days. Dhaka District: 2-3 days. Other cities: 3-5 days depending on location." },
      { id: "faq4", question: "Can I return or exchange my order?", answer: "Yes! If there is any issue with your order, contact us on WhatsApp within 48 hours of receiving it and we will arrange an exchange or refund." },
    ])
    setLoading(false)
  }

  async function saveSetting(key: string, value: string) {
    setSaving(key)
    const supabase = createClient()
    await supabase.from("settings").upsert({ key, value }, { onConflict: "key" })
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  async function saveTables() {
    setTablesSaving(true)
    const supabase = createClient()
    await supabase.from("settings").upsert({ key: "size_tables", value: JSON.stringify(sizeTables) }, { onConflict: "key" })
    setTablesSaving(false)
    setTablesSaved(true)
    setTimeout(() => setTablesSaved(false), 2000)
  }

  async function saveCategories() {
    setCatSaving(true)
    const supabase = createClient()
    await supabase.from("settings").upsert({ key: "product_categories", value: JSON.stringify(categories) }, { onConflict: "key" })
    setCatSaving(false); setCatSaved(true)
    setTimeout(() => setCatSaved(false), 2000)
  }

  async function saveDelivery() {
    setDeliverySaving(true)
    const supabase = createClient()
    await supabase.from("settings").upsert({ key: "delivery_groups", value: JSON.stringify(deliveryGroups) }, { onConflict: "key" })
    setDeliverySaving(false); setDeliverySaved(true)
    setTimeout(() => setDeliverySaved(false), 2000)
  }
  async function saveFaqs() {
    setFaqSaving(true)
    const supabase = createClient()
    await supabase.from("settings").upsert({ key: "faqs", value: JSON.stringify(faqs) }, { onConflict: "key" })
    setFaqSaving(false); setFaqSaved(true)
    setTimeout(() => setFaqSaved(false), 2000)
  }

  function updateTable(id: string, updated: SizeTable) {
    setSizeTables(prev => prev.map(t => t.id === id ? updated : t))
  }
  function deleteTable(id: string) {
    setSizeTables(prev => prev.filter(t => t.id !== id))
  }
  async function addTable() {
    setSizeTables(prev => [...prev, makeTable("New Size Table")])
  }

  function SettingRow({ label, settingKey, multiline = false, hint = "" }: { label: string; settingKey: string; multiline?: boolean; hint?: string }) {
    const [val, setVal] = useState(settings[settingKey] || "")
    const taRef = useRef<HTMLTextAreaElement>(null)
    const isSaving = saving === settingKey
    const isSaved = saved === settingKey

    useEffect(() => { setVal(settings[settingKey] || "") }, [settings[settingKey]])

    // Convert stored markdown to HTML for display
    function toHTML(text: string) {
      return text
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/_(.+?)_/g, "<em>$1</em>")
        .replace(/&lt;u&gt;(.+?)&lt;\/u&gt;/g, "<u>$1</u>")
        .replace(/\n/g, "<br>")
    }

    // Convert HTML back to markdown for storage
    function toMarkdown(html: string) {
      return html
        .replace(/<br\s*\/?>/gi, "\n")          // br → newline first
        .replace(/<div><br\s*\/?><\/div>/gi, "\n")
        .replace(/<div>/gi, "\n").replace(/<\/div>/gi, "")
        .replace(/<p><br\s*\/?><\/p>/gi, "\n")
        .replace(/<p>/gi, "").replace(/<\/p>/gi, "\n")
        .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
        .replace(/<b>(.*?)<\/b>/gi, "**$1**")
        .replace(/<em>(.*?)<\/em>/gi, "_$1_")
        .replace(/<i>(.*?)<\/i>/gi, "_$1_")
        .replace(/<u>(.*?)<\/u>/gi, "<u>$1</u>")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")  // max 2 consecutive newlines
        .trim()
    }

    function execCmd(cmd: string, value?: string) {
      // Find the contenteditable div inside the editor container and focus it
      const editor = document.querySelector("[data-editor=\"" + settingKey + "\"]") as HTMLElement
      if (editor) editor.focus()
      document.execCommand(cmd, false, value)
    }

    function handleSave() {
      saveSetting(settingKey, val)
    }

    const btnStyle = (active?: boolean): React.CSSProperties => ({
      width: "30px", height: "28px", border: "1px solid #e0e0e0",
      backgroundColor: active ? "#111" : "white",
      color: active ? "white" : "#333",
      cursor: "pointer", fontSize: "0.78rem", fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: "4px", flexShrink: 0, transition: "all 0.1s",
    })

    return (
      <div style={{ padding: "1rem 0", borderBottom: "1px solid #f5f5f5" }}>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem", color: "#444" }}>{label}</label>
        {hint && <p style={{ fontSize: "0.68rem", color: "#aaa", marginBottom: "0.5rem" }}>{hint}</p>}
        {multiline ? (
          <div style={{ border: "1px solid #e0e0e0", borderRadius: "6px", overflow: "hidden", backgroundColor: "white" }}>
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: "2px", padding: "6px 8px", borderBottom: "1px solid #f0f0f0", backgroundColor: "#fafafa", flexWrap: "wrap" }}>
              <button onMouseDown={e => { e.preventDefault(); execCmd("bold") }} style={btnStyle()} title="Bold"><strong>B</strong></button>
              <button onMouseDown={e => { e.preventDefault(); execCmd("italic") }} style={btnStyle()} title="Italic"><em>I</em></button>
              <button onMouseDown={e => { e.preventDefault(); execCmd("underline") }} style={btnStyle()} title="Underline"><u>U</u></button>
              <div style={{ width: "1px", height: "20px", backgroundColor: "#e0e0e0", margin: "0 4px" }} />
              <button onMouseDown={e => { e.preventDefault(); execCmd("insertHTML", "<br>") }} style={btnStyle()} title="Line break">↵</button>
              <button onMouseDown={e => { e.preventDefault(); execCmd("removeFormat") }} style={{ ...btnStyle(), fontSize: "0.65rem", width: "auto", padding: "0 6px" }} title="Clear format">Clear</button>
              <div style={{ flex: 1 }} />
              <button
                onMouseDown={e => { e.preventDefault(); handleSave() }}
                disabled={isSaving}
                style={{ padding: "0.2rem 0.75rem", backgroundColor: isSaved ? "#16a34a" : "#111", color: "white", border: "none", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", borderRadius: "4px", transition: "all 0.2s" }}
              >
                {isSaving ? "..." : isSaved ? "Saved ✓" : "Save"}
              </button>
            </div>
            {/* Editor */}
            <RichEditor
              key={settingKey}
              value={val}
              onChange={setVal}
              toHTML={toHTML}
              toMarkdown={toMarkdown}
            />
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              style={{ flex: 1, border: "1px solid #e0e0e0", padding: "0.6rem 0.75rem", fontSize: "0.875rem", outline: "none", borderRadius: "4px", boxSizing: "border-box" }}
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{ padding: "0.5rem 1.25rem", backgroundColor: isSaved ? "#16a34a" : "black", color: "white", border: "none", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", borderRadius: "4px", transition: "all 0.2s", whiteSpace: "nowrap" }}
            >
              {isSaving ? "..." : isSaved ? "Saved ✓" : "Save"}
            </button>
          </div>
        )}
      </div>
    )
  }

  function HeroBgUploader() {
    const [uploading, setUploading] = useState(false)
    const [uploadMsg, setUploadMsg] = useState("")
    const imgRef = useRef<HTMLInputElement>(null)
    const vidRef = useRef<HTMLInputElement>(null)
    const bgType = settings.hero_bg_type || "color"
    const bgOpacity = settings.hero_bg_opacity || "1"
    const overlayOpacity = settings.hero_overlay_opacity || "0.6"
    const showWatermark = settings.hero_show_watermark || "true"
    const watermarkSize = settings.hero_watermark_size || "75"
    const watermarkOpacity = settings.hero_watermark_opacity || "0.045"

    async function uploadFile(file: File, type: "image" | "video") {
      setUploading(true); setUploadMsg("Uploading " + type + "...")
      const supabase = createClient()
      const ext = file.name.split(".").pop()
      const fileName = "hero-" + type + "-" + Date.now() + "." + ext
      const { error } = await supabase.storage.from("products").upload(fileName, file, { upsert: true })
      if (error) { setUploadMsg("Error: " + error.message); setUploading(false); return }
      const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName)
      await saveSetting(type === "image" ? "hero_bg_image" : "hero_bg_video", urlData.publicUrl)
      await saveSetting("hero_bg_type", type)
      setUploadMsg(type + " uploaded!")
      setUploading(false)
      setTimeout(() => setUploadMsg(""), 3000)
    }

    function Slider({ label, settingKey, min, max, step, value, display }: { label: string; settingKey: string; min: number; max: number; step: number; value: string; display: string }) {
      return (
        <div>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.3rem", color: "#555" }}>{label} — {display}</label>
          <input type="range" min={min} max={max} step={step} value={value} onChange={e => saveSetting(settingKey, e.target.value)} style={{ width: "100%" }} />
        </div>
      )
    }

    return (
      <div style={{ padding: "1rem 0", borderBottom: "1px solid #f5f5f5" }}>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", color: "#444" }}>Hero Background</label>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {[{ value: "color", label: "Black" }, { value: "image", label: "Image" }, { value: "video", label: "Video" }].map(opt => (
            <button key={opt.value} onClick={() => saveSetting("hero_bg_type", opt.value)} style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 600, border: "1px solid #e0e0e0", backgroundColor: bgType === opt.value ? "black" : "white", color: bgType === opt.value ? "white" : "black", cursor: "pointer", textTransform: "uppercase", transition: "all 0.2s" }}>
              {opt.label}
            </button>
          ))}
        </div>
        <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files && uploadFile(e.target.files[0], "image")} />
        <input ref={vidRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => e.target.files && uploadFile(e.target.files[0], "video")} />
        {bgType === "image" && (
          <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#f9f9f9", border: "1px solid #e0e0e0" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
              <button onClick={() => imgRef.current?.click()} disabled={uploading} style={{ padding: "0.6rem 1.25rem", backgroundColor: "black", color: "white", border: "none", fontSize: "0.8rem", fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", textTransform: "uppercase" }}>
                {uploading ? "Uploading..." : settings.hero_bg_image ? "Replace Image" : "Upload Image"}
              </button>
              {settings.hero_bg_image && <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600 }}>Image uploaded ✓</span>}
            </div>
            {settings.hero_bg_image && (
              <HeroImageEditor imageUrl={settings.hero_bg_image} initialScale={parseFloat(settings.hero_bg_scale || "1")} initialPosX={parseFloat(settings.hero_bg_pos_x || "50")} initialPosY={parseFloat(settings.hero_bg_pos_y || "50")} onSave={async (scale, posX, posY) => { await saveSetting("hero_bg_scale", scale.toString()); await saveSetting("hero_bg_pos_x", posX.toString()); await saveSetting("hero_bg_pos_y", posY.toString()) }} />
            )}
            <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Slider label="Image Opacity" settingKey="hero_bg_opacity" min={0} max={1} step={0.05} value={bgOpacity} display={Math.round(parseFloat(bgOpacity) * 100) + "%"} />
              <Slider label="Dark Overlay" settingKey="hero_overlay_opacity" min={0} max={1} step={0.05} value={overlayOpacity} display={Math.round(parseFloat(overlayOpacity) * 100) + "%"} />
            </div>
          </div>
        )}
        {bgType === "video" && (
          <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#f9f9f9", border: "1px solid #e0e0e0" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
              <button onClick={() => vidRef.current?.click()} disabled={uploading} style={{ padding: "0.6rem 1.25rem", backgroundColor: "black", color: "white", border: "none", fontSize: "0.8rem", fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", textTransform: "uppercase" }}>
                {uploading ? "Uploading..." : settings.hero_bg_video ? "Replace Video" : "Upload Video"}
              </button>
              {settings.hero_bg_video && <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600 }}>Video set ✓</span>}
            </div>
            {settings.hero_bg_video && <video src={settings.hero_bg_video} muted style={{ width: "100%", maxHeight: "120px", objectFit: "cover", border: "1px solid #e0e0e0", marginBottom: "1rem" }} />}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Slider label="Video Opacity" settingKey="hero_bg_opacity" min={0} max={1} step={0.05} value={bgOpacity} display={Math.round(parseFloat(bgOpacity) * 100) + "%"} />
              <Slider label="Dark Overlay" settingKey="hero_overlay_opacity" min={0} max={1} step={0.05} value={overlayOpacity} display={Math.round(parseFloat(overlayOpacity) * 100) + "%"} />
            </div>
          </div>
        )}
        {uploadMsg && <div style={{ padding: "0.6rem 1rem", backgroundColor: uploadMsg.includes("Error") ? "#fff0f0" : "#f0fdf4", border: "1px solid " + (uploadMsg.includes("Error") ? "#ffcccc" : "#bbf7d0"), fontSize: "0.8rem", color: uploadMsg.includes("Error") ? "#cc0000" : "#15803d", marginBottom: "1rem" }}>{uploadMsg}</div>}
        <div style={{ marginTop: "1.25rem", padding: "1rem", backgroundColor: "#f9f9f9", border: "1px solid #e0e0e0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.85rem" }}>Logo Watermark</p>
              <p style={{ fontSize: "0.72rem", color: "#999" }}>Ghost FX logo behind hero text</p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input type="checkbox" checked={showWatermark === "true"} onChange={e => saveSetting("hero_show_watermark", e.target.checked ? "true" : "false")} style={{ width: "16px", height: "16px" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{showWatermark === "true" ? "ON" : "OFF"}</span>
            </label>
          </div>
          {showWatermark === "true" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Slider label="Logo Size" settingKey="hero_watermark_size" min={20} max={150} step={5} value={watermarkSize} display={watermarkSize + "vw"} />
              <Slider label="Logo Opacity" settingKey="hero_watermark_opacity" min={0} max={0.3} step={0.005} value={watermarkOpacity} display={Math.round(parseFloat(watermarkOpacity) * 100) + "%"} />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── CURSOR SELECTOR ──
  function CursorSelector() {
    const current = settings.cursor_type || "logo"
    const options = [
      { value: "logo", label: "FLEX Logo", desc: "Flextreme FLEX logo cursor, auto-adapts to background" },
      { value: "dumbbell", label: "Dumbbell", desc: "Classic dumbbell SVG cursor" },
      { value: "normal", label: "Normal", desc: "Default browser cursor" },
    ]
    return (
      <div style={{ padding: "1rem 0", borderBottom: "1px solid #f5f5f5" }}>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", color: "#444" }}>Cursor Style</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => saveSetting("cursor_type", opt.value)} style={{ padding: "1rem", border: "2px solid " + (current === opt.value ? "black" : "#e0e0e0"), backgroundColor: current === opt.value ? "#f5f5f5" : "white", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                {opt.value === "logo" ? "🔲" : opt.value === "dumbbell" ? "🏋️" : "🖱️"}
              </div>
              <p style={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.2rem" }}>{opt.label}</p>
              <p style={{ fontSize: "0.68rem", color: "#999" }}>{opt.desc}</p>
              {current === opt.value && <p style={{ fontSize: "0.65rem", color: "#16a34a", fontWeight: 700, marginTop: "0.4rem" }}>✓ Active</p>}
            </button>
          ))}
        </div>
        <p style={{ fontSize: "0.7rem", color: "#999", marginTop: "0.75rem" }}>Change takes effect on next page load.</p>
      </div>
    )
  }

  // ── COLOR THEME ──
  function ColorThemeEditor() {
    const presets = [
      { name: "Classic Black", primary: "#000000", accent: "#ffffff", bg: "#ffffff", text: "#000000", btnBg: "#000000", btnText: "#ffffff" },
      { name: "Deep Navy", primary: "#0f172a", accent: "#3b82f6", bg: "#f8fafc", text: "#0f172a", btnBg: "#0f172a", btnText: "#ffffff" },
      { name: "Forest Green", primary: "#14532d", accent: "#16a34a", bg: "#f0fdf4", text: "#14532d", btnBg: "#15803d", btnText: "#ffffff" },
      { name: "Crimson Red", primary: "#7f1d1d", accent: "#dc2626", bg: "#fff5f5", text: "#1a1a1a", btnBg: "#dc2626", btnText: "#ffffff" },
      { name: "Royal Purple", primary: "#3b0764", accent: "#9333ea", bg: "#faf5ff", text: "#1a1a1a", btnBg: "#7c3aed", btnText: "#ffffff" },
      { name: "Midnight Blue", primary: "#1e1b4b", accent: "#6366f1", bg: "#eef2ff", text: "#1e1b4b", btnBg: "#4f46e5", btnText: "#ffffff" },
    ]
    const currentTheme = settings.color_theme ? JSON.parse(settings.color_theme) : presets[0]
    const [custom, setCustom] = useState<ColorTheme>(currentTheme)

    async function applyPreset(preset: typeof presets[0]) {
      const theme: ColorTheme = { primary: preset.primary, accent: preset.accent, bg: preset.bg, text: preset.text, btnBg: preset.btnBg, btnText: preset.btnText }
      setCustom(theme)
      await saveSetting("color_theme", JSON.stringify(theme))
    }

    async function saveCustom() {
      await saveSetting("color_theme", JSON.stringify(custom))
    }

    return (
      <div style={{ padding: "1rem 0", borderBottom: "1px solid #f5f5f5" }}>
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", color: "#444" }}>Color Theme</label>
        <p style={{ fontSize: "0.75rem", color: "#666", marginBottom: "1rem" }}>Choose a preset or customize individual colors. Changes apply site-wide.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {presets.map(p => {
            const isActive = settings.color_theme && JSON.parse(settings.color_theme).primary === p.primary
            return (
              <button key={p.name} onClick={() => applyPreset(p)} style={{ padding: "0.75rem", border: "2px solid " + (isActive ? "black" : "#e0e0e0"), backgroundColor: p.bg, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: p.primary, border: "1px solid rgba(0,0,0,0.1)" }} />
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: p.accent, border: "1px solid rgba(0,0,0,0.1)" }} />
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: p.btnBg, border: "1px solid rgba(0,0,0,0.1)" }} />
                </div>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: p.text }}>{p.name}</p>
                {isActive && <p style={{ fontSize: "0.62rem", color: "#16a34a", fontWeight: 700 }}>✓ Active</p>}
              </button>
            )
          })}
        </div>
        <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #e0e0e0", padding: "1.25rem" }}>
          <p style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: "1rem", textTransform: "uppercase" }}>Custom Colors</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: "1rem" }}>
            {([
              { key: "primary", label: "Primary (Navbar/Footer)" },
              { key: "accent", label: "Accent (Highlights)" },
              { key: "bg", label: "Page Background" },
              { key: "text", label: "Body Text" },
              { key: "btnBg", label: "Button Background" },
              { key: "btnText", label: "Button Text" },
            ] as { key: keyof ColorTheme; label: string }[]).map(({ key, label }) => (
              <div key={String(key)}>
                <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem", color: "#555" }}>{label}</label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input type="color" value={custom[key]} onChange={e => setCustom((prev: ColorTheme) => ({ ...prev, [key]: e.target.value }))} style={{ width: "40px", height: "36px", padding: "2px", border: "1px solid #e0e0e0", cursor: "pointer" }} />
                  <input value={custom[key]} onChange={e => setCustom((prev: ColorTheme) => ({ ...prev, [key]: e.target.value }))} style={{ flex: 1, border: "1px solid #e0e0e0", padding: "0.4rem 0.6rem", fontSize: "0.75rem", fontFamily: "monospace", outline: "none" }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <button onClick={saveCustom} style={{ padding: "0.6rem 1.5rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", cursor: "pointer" }}>Apply Custom Colors</button>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.7rem", color: "#666" }}>Preview:</span>
              <div style={{ padding: "0.4rem 1rem", backgroundColor: custom.btnBg, color: custom.btnText, fontSize: "0.7rem", fontWeight: 700, border: "1px solid " + custom.primary }}>Button</div>
              <div style={{ width: "24px", height: "24px", backgroundColor: custom.primary, border: "1px solid #e0e0e0" }} />
              <div style={{ width: "24px", height: "24px", backgroundColor: custom.accent, border: "1px solid #e0e0e0" }} />
            </div>
          </div>
        </div>
        <p style={{ fontSize: "0.7rem", color: "#16a34a", marginTop: "0.75rem", fontWeight: 600 }}>✓ Color changes apply automatically on next page load — no manual refresh needed.</p>
      </div>
    )
  }

  // ── SIZE GUIDE EDITOR ──


  const tabs = [
    { id: "hero", label: "Hero" },
    { id: "appearance", label: "Appearance" },
    { id: "sizes", label: "Size Guide" },
    { id: "categories", label: "Categories" },
    { id: "delivery", label: "Delivery & FAQ" },
    { id: "about", label: "About Page" },
    { id: "content", label: "Content" },
    { id: "social", label: "Social" },
  ]

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>Loading settings...</div>

  return (
    <div>
      {/* Global confirm modal for all destructive actions */}
      {confirmState && (
        <ConfirmModal
          open={true}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={() => { confirmState.onOk(); setConfirmState(null) }}
          onCancel={() => setConfirmState(null)}
        />
      )}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Settings</h1>
        <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.25rem" }}>Manage your website without touching code.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "2px solid black", marginBottom: "1.5rem", overflowX: "auto" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "0.75rem 1.25rem", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", border: "none", borderBottom: activeTab === tab.id ? "3px solid black" : "3px solid transparent", marginBottom: "-2px", backgroundColor: "transparent", cursor: "pointer", color: activeTab === tab.id ? "black" : "#999", whiteSpace: "nowrap", transition: "color 0.2s" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* HERO TAB */}
      {activeTab === "hero" && (
        <Section title="Hero Section" subtitle="Background, watermark and headline text">
          <HeroBgUploader />
          <SettingRow label="Badge Text" settingKey="hero_badge" hint="Small text above the headline" />
          <SettingRow label="Main Headline" settingKey="hero_headline" hint="Use | to split lines e.g. WORK|HARD.|FLEX|EXTREME." />
          <SettingRow label="Tagline" settingKey="hero_tagline" multiline hint="Subtext below the headline" />
        </Section>
      )}

      {/* APPEARANCE TAB */}
      {activeTab === "appearance" && (
        <Section title="Appearance" subtitle="Cursor style and color theme">
          <CursorSelector />
          <ColorThemeEditor />
        </Section>
      )}

      {/* SIZES TAB */}
      {activeTab === "sizes" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.02em" }}>Size Guide Tables</h2>
              <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.2rem" }}>Create multiple tables for different product types. Each table has its own columns, descriptions and measurements.</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={addTable} style={{ padding: "0.6rem 1.25rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.05em" }}>+ Add New Table</button>
              <button onClick={saveTables} disabled={tablesSaving} style={{ padding: "0.6rem 1.25rem", backgroundColor: tablesSaved ? "#16a34a" : "#111", color: "white", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: tablesSaving ? "not-allowed" : "pointer", minWidth: "100px", transition: "all 0.2s" }}>
                {tablesSaving ? "Saving..." : tablesSaved ? "All Saved ✓" : "Save All Tables"}
              </button>
            </div>
          </div>
          {sizeTables.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed #e0e0e0", color: "#999" }}>
              <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No size tables yet</p>
              <p style={{ fontSize: "0.82rem" }}>Click "+ Add New Table" to create a size guide for your products</p>
            </div>
          )}
          {sizeTables.map(table => (
            <SizeTableEditor
              key={table.id}
              table={table}
              saving={tablesSaving}
              saved={tablesSaved}
              onUpdate={updated => updateTable(table.id, updated)}
              onDelete={() => deleteTable(table.id)}
              onSave={saveTables}
              requestConfirm={requestConfirm}
            />
          ))}
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === "categories" && (
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.02em" }}>Product Categories</h2>
            <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.2rem" }}>Manage all product categories. These are used to classify products and appear in footer navigation and filters.</p>
          </div>
          <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <CategoriesEditor
              categories={categories}
              saving={catSaving}
              saved={catSaved}
              onUpdate={setCategories}
              onSave={saveCategories}
              requestConfirm={requestConfirm}
            />
          </div>
          <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #e0e0e0", padding: "1.25rem" }}>
            <p style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: "0.5rem" }}>How categories work:</p>
            <ul style={{ fontSize: "0.78rem", color: "#666", lineHeight: 1.8, paddingLeft: "1.25rem" }}>
              <li>Categories you add here appear as options when editing a product</li>
              <li>The footer Shop section links update automatically</li>
              <li>Customers can filter products by category on the Products page</li>
              <li>Featured products are shown on the homepage regardless of category</li>
            </ul>
          </div>
        </div>
      )}

      {/* DELIVERY & FAQ TAB */}
      {activeTab === "delivery" && (
        <div>
          {/* Free Delivery Toggle */}
          <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.25rem" }}>Free Delivery Mode</h2>
                <p style={{ fontSize: "0.8rem", color: "#666" }}>When ON — hides the delivery charges table and shows a "Free Delivery Nationwide" banner instead.</p>
              </div>
              <button
                onClick={async () => {
                  const current = settings.free_delivery === "true"
                  await saveSetting("free_delivery", current ? "false" : "true")
                }}
                style={{
                  padding: "0.65rem 1.5rem",
                  backgroundColor: settings.free_delivery === "true" ? "#16a34a" : "#e0e0e0",
                  color: settings.free_delivery === "true" ? "white" : "#666",
                  border: "none", fontWeight: 900, fontSize: "0.85rem",
                  cursor: "pointer", borderRadius: "6px", transition: "all 0.2s",
                  minWidth: "120px"
                }}
              >
                {settings.free_delivery === "true" ? "✓ FREE DELIVERY ON" : "FREE DELIVERY OFF"}
              </button>
            </div>
          </div>

          <DeliveryEditor
            groups={deliveryGroups}
            saving={deliverySaving}
            saved={deliverySaved}
            onUpdate={setDeliveryGroups}
            onSave={saveDelivery}
            requestConfirm={requestConfirm}
          />
          <div style={{ marginTop: "2rem" }}>
            <FaqEditor
              faqs={faqs}
              saving={faqSaving}
              saved={faqSaved}
              onUpdate={setFaqs}
              onSave={saveFaqs}
              requestConfirm={requestConfirm}
            />
          </div>
        </div>
      )}

      {/* ABOUT TAB */}
      {activeTab === "about" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Section title="Hero Section" subtitle="Big headline and intro text at the top of About page">
            <SettingRow label="Hero Headline" settingKey="about_hero_headline" hint="Use | to split lines e.g. Born From|The Grind." />
            <SettingRow label="Hero Subtext" settingKey="about_hero_sub" multiline hint="Short intro paragraph under the headline" />
          </Section>
          <Section title="Brand Story" subtitle="The 'How It Started' section">
            <SettingRow label="Story Section Title" settingKey="about_story_title" hint="e.g. The Problem We Solved" />
            <SettingRow label="Paragraph 1" settingKey="about_story_body1" multiline />
            <SettingRow label="Paragraph 2 (Brand Story)" settingKey="brand_story" multiline />
            <SettingRow label="Paragraph 3" settingKey="about_story_body3" multiline />
          </Section>

          <Section title="Values Section" subtitle="The numbered value cards (Performance First, etc.)">
            <SettingRow label="Section Title" settingKey="about_values_title" hint="e.g. Our Values" />
            <AboutValuesEditor settings={settings} saveSetting={saveSetting} requestConfirm={requestConfirm} />
          </Section>
          <Section title="Team Section" subtitle="Founder, Design Team, Community cards">
            <SettingRow label="Section Title" settingKey="about_team_title" hint="e.g. Behind Flextreme" />
            <AboutTeamEditor settings={settings} saveSetting={saveSetting} requestConfirm={requestConfirm} />
          </Section>
          <Section title="CTA Section" subtitle="The final call-to-action at the bottom">
            <SettingRow label="CTA Headline" settingKey="about_cta_headline" hint="Use | to split lines e.g. Join The|Movement." />
            <SettingRow label="CTA Subtext" settingKey="about_cta_sub" multiline />
          </Section>
        </div>
      )}

      {/* CONTENT TAB */}
      {activeTab === "content" && (
        <>
          <Section title="About Page" subtitle="Text shown on the About page">
            <SettingRow label="Short Brand Story" settingKey="about_story" multiline />
            <SettingRow label="Full Brand Story" settingKey="brand_story" multiline />
          </Section>
          <div style={{ marginTop: "1.5rem" }}>
            <Section title="Call to Action" subtitle="Final section on the homepage">
              <SettingRow label="CTA Headline" settingKey="cta_headline" />
              <SettingRow label="CTA Subtext" settingKey="cta_subtext" multiline />
            </Section>
          </div>
        </>
      )}

      {/* SOCIAL TAB */}
      {activeTab === "social" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Section title="Contact" subtitle="WhatsApp number shown in footer and chatbot">
            <SettingRow label="WhatsApp Number" settingKey="whatsapp_number" hint="Numbers only, no + sign. e.g. 8801935962421" />
          </Section>
          <Section title="Social Media" subtitle="Toggle each platform on or off. Leave URL blank to hide the button.">
            <div style={{ marginBottom: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "#f9f9f9", border: "1px solid #e0e0e0", fontSize: "0.78rem", color: "#666" }}>
              💡 <strong>Tip:</strong> Leave any URL blank to hide that social button from the website. Fill it in to show it.
            </div>
            {[
              { key: "instagram_url", label: "Instagram", icon: "📸", placeholder: "https://instagram.com/yourpage" },
              { key: "facebook_url", label: "Facebook", icon: "👍", placeholder: "https://facebook.com/yourpage" },
              { key: "tiktok_url", label: "TikTok", icon: "🎵", placeholder: "https://tiktok.com/@yourpage" },
              { key: "youtube_url", label: "YouTube", icon: "▶️", placeholder: "https://youtube.com/@yourchannel" },
              { key: "twitter_url", label: "Twitter / X", icon: "🐦", placeholder: "https://twitter.com/yourpage" },
            ].map(({ key, label, icon, placeholder }) => (
              <SocialRow key={key} label={label} icon={icon} settingKey={key} placeholder={placeholder} settings={settings} saveSetting={saveSetting} saving={saving} saved={saved} />
            ))}
          </Section>
          <Section title="Store Info" subtitle="Shown in footer contact section">
            <SettingRow label="Store Email" settingKey="store_email" hint="e.g. hello@flextremefit.com — shown as clickable link in footer" />
            <SettingRow label="Store Phone" settingKey="store_phone" hint="e.g. +8801935962421 — shown as clickable link in footer" />
            <SettingRow label="Store Address" settingKey="store_address" multiline hint="e.g. Dhaka, Bangladesh — shown in footer" />
            <SettingRow label="Footer Tagline" settingKey="footer_tagline" hint="Short brand description shown under logo in footer" />
          </Section>
        </div>
      )}
    </div>
  )
}

// ── PRODUCT CATEGORIES EDITOR ──
interface CategoriesEditorProps {
  categories: CategoryGroup[]
  saving: boolean
  saved: boolean
  onUpdate: (c: CategoryGroup[]) => void
  onSave: () => void
}
function CategoriesEditor({ categories, saving, saved, onUpdate, onSave, requestConfirm }: CategoriesEditorProps & { requestConfirm: (msg: string, onOk: () => void) => void }) {
  const [newCat, setNewCat] = useState("")
  const [newSubcats, setNewSubcats] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  function formatLabel(s: string) { return s.replace(/-/g, " ").replace(/\w/g, c => c.toUpperCase()) }

  function addCategory() {
    const val = newCat.trim().toLowerCase().replace(/\s+/g, "-")
    if (!val || categories.find(c => c.name === val)) return
    onUpdate([...categories, { id: "cat_" + val + "_" + Date.now(), name: val, subcategories: [] }])
    setNewCat("")
  }

  function removeCategory(id: string) {
    const cat = categories.find(c => c.id === id)
    requestConfirm("Delete category <strong>" + (cat?.name || "this category") + "</strong> and all its subcategories?", () => {
      onUpdate(categories.filter(c => c.id !== id))
    })
  }

  function addSubcategory(catId: string) {
    const val = (newSubcats[catId] || "").trim().toLowerCase()
    if (!val) return
    onUpdate(categories.map(c => c.id === catId ? { ...c, subcategories: [...(c.subcategories || []), val] } : c))
    setNewSubcats(prev => ({ ...prev, [catId]: "" }))
  }

  function removeSubcategory(catId: string, sub: string) {
    onUpdate(categories.map(c => c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s !== sub) } : c))
  }

  function moveUp(i: number) {
    if (i === 0) return
    const next = [...categories]; [next[i-1], next[i]] = [next[i], next[i-1]]; onUpdate(next)
  }
  function moveDown(i: number) {
    if (i === categories.length - 1) return
    const next = [...categories]; [next[i], next[i+1]] = [next[i+1], next[i]]; onUpdate(next)
  }
  return (
    <div style={{ padding: "1rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.78rem", color: "#666" }}>
          Add categories and subcategories. Subcategories help customers filter products (e.g. Tops → Compression Top, Hoodie, Tank Top).
        </p>
        <button onClick={onSave} disabled={saving} style={{ padding: "0.45rem 1.25rem", backgroundColor: saved ? "#16a34a" : "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.72rem", cursor: saving ? "not-allowed" : "pointer", minWidth: "80px", transition: "all 0.2s", flexShrink: 0 }}>
          {saving ? "..." : saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      {/* Add new category */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <input
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addCategory()}
          placeholder="New category name (e.g. tops, hoodies)..."
          style={{ flex: 1, border: "1px solid #e0e0e0", padding: "0.5rem 0.75rem", fontSize: "0.82rem", outline: "none" }}
        />
        <button onClick={addCategory} style={{ padding: "0.5rem 1.25rem", backgroundColor: "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>+ Add Category</button>
      </div>

      {/* Category list with subcategories */}
      {categories.length === 0 ? (
        <div style={{ padding: "1.5rem", textAlign: "center", border: "2px dashed #e0e0e0", color: "#999", fontSize: "0.82rem" }}>
          No categories yet. Add your first one above.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {categories.map((cat, i) => (
            <div key={cat.id} style={{ border: "1px solid #e0e0e0", backgroundColor: "white" }}>
              {/* Category header row */}
              <div style={{ display: "flex", alignItems: "center", padding: "0.6rem 0.75rem", gap: "0.5rem", backgroundColor: "#f9f9f9", borderBottom: expanded === cat.id ? "1px solid #e0e0e0" : "none" }}>
                <button onClick={() => setExpanded(expanded === cat.id ? null : cat.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: 0, color: "#666" }}>{expanded === cat.id ? "▼" : "▶"}</button>
                <span style={{ flex: 1, fontWeight: 700, fontSize: "0.88rem", textTransform: "capitalize" }}>{formatLabel(cat.name)}</span>
                <span style={{ fontSize: "0.68rem", color: "#aaa", fontFamily: "monospace", marginRight: "0.5rem" }}>{cat.name}</span>
                <span style={{ fontSize: "0.68rem", color: "#888", backgroundColor: "#eee", padding: "0.15rem 0.5rem", borderRadius: "10px" }}>{(cat.subcategories || []).length} subs</span>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button onClick={() => moveUp(i)} disabled={i === 0} style={{ width: "28px", height: "28px", border: "1px solid #e0e0e0", background: "white", cursor: i === 0 ? "not-allowed" : "pointer", fontSize: "0.75rem", opacity: i === 0 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
                  <button onClick={() => moveDown(i)} disabled={i === categories.length-1} style={{ width: "28px", height: "28px", border: "1px solid #e0e0e0", background: "white", cursor: i === categories.length-1 ? "not-allowed" : "pointer", fontSize: "0.75rem", opacity: i === categories.length-1 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>↓</button>
                  <button onClick={() => removeCategory(cat.id)} style={{ width: "28px", height: "28px", backgroundColor: "#fff0f0", border: "1px solid #ffcccc", color: "#cc0000", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>✕</button>
                </div>
              </div>

              {/* Subcategories panel — expanded */}
              {expanded === cat.id && (
                <div style={{ padding: "0.75rem" }}>
                  <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "#999", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Subcategories</p>
                  {(cat.subcategories || []).length === 0 ? (
                    <p style={{ fontSize: "0.75rem", color: "#bbb", fontStyle: "italic", marginBottom: "0.5rem" }}>No subcategories yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.75rem" }}>
                      {(cat.subcategories || []).map(sub => (
                        <span key={sub} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.6rem", border: "1px solid #e0e0e0", backgroundColor: "#f5f5f5", fontSize: "0.75rem", borderRadius: "20px" }}>
                          {formatLabel(sub)}
                          <button onClick={() => removeSubcategory(cat.id, sub)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cc0000", fontSize: "0.75rem", padding: 0, lineHeight: 1 }}>✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Add subcategory */}
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <input
                      value={newSubcats[cat.id] || ""}
                      onChange={e => setNewSubcats(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && addSubcategory(cat.id)}
                      placeholder="Add subcategory (e.g. compression top, hoodie)..."
                      style={{ flex: 1, border: "1px solid #e0e0e0", padding: "0.4rem 0.65rem", fontSize: "0.78rem", outline: "none" }}
                    />
                    <button onClick={() => addSubcategory(cat.id)} style={{ padding: "0.4rem 1rem", backgroundColor: "#f0f0f0", border: "1px solid #e0e0e0", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>+ Add</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: "0.7rem", color: "#aaa", marginTop: "1rem" }}>
        Tip: Click ▶ to expand a category and add subcategories. These appear as filters on the Products page.
      </p>
    </div>
  )
}


function AboutValuesEditor({ settings, saveSetting, requestConfirm }: { settings: Record<string,string>; saveSetting: (k:string,v:string)=>void; requestConfirm: (msg: string, onOk: () => void) => void }) {
  const defaultVals = [
    { number: "01", title: "Performance First", description: "Every design decision starts with one question — does this make you perform better?" },
    { number: "02", title: "Built for Real Athletes", description: "We are athletes who make performance wear that happens to look elite." },
    { number: "03", title: "No Compromise Quality", description: "Premium fabrics, precision stitching, and rigorous testing." },
    { number: "04", title: "Accessible Excellence", description: "Premium does not have to mean unaffordable." },
  ]
  const [values, setValues] = useState(() => {
    try { return settings.about_values ? JSON.parse(settings.about_values) : defaultVals } catch { return defaultVals }
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    try { if (settings.about_values) setValues(JSON.parse(settings.about_values)) } catch {}
  }, [settings.about_values])
  async function save() { setSaving(true); await saveSetting("about_values", JSON.stringify(values)); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  function add() {
    setValues([...values, { number: String(values.length+1).padStart(2,"0"), title: "New Value", description: "" }])
  }
  function remove(i: number) {
    const v = values[i]
    requestConfirm("Remove value card <strong>" + (v?.title || "this value") + "</strong>?", () => {
      setValues(values.filter((_: any, j: number) => j !== i))
    })
  }
  return (
    <div style={{ padding: "0.75rem 0" }}>
      {values.map((v: any, i: number) => (
        <div key={i} style={{ border: "1px solid #e0e0e0", padding: "0.875rem", marginBottom: "0.75rem", display: "grid", gridTemplateColumns: "60px 1fr 2fr 32px", gap: "0.5rem", alignItems: "start" }}>
          <input value={v.number} onChange={e => setValues(values.map((x: any, j: number) => j===i ? {...x, number: e.target.value} : x))} placeholder="01" style={{ border: "1px solid #e0e0e0", padding: "0.4rem", fontSize: "0.82rem", outline: "none", width: "100%", textAlign: "center", fontWeight: 700 }} />
          <input value={v.title} onChange={e => setValues(values.map((x: any, j: number) => j===i ? {...x, title: e.target.value} : x))} placeholder="Title" style={{ border: "1px solid #e0e0e0", padding: "0.4rem 0.6rem", fontSize: "0.82rem", outline: "none", width: "100%", boxSizing: "border-box" as const }} />
          <input value={v.description} onChange={e => setValues(values.map((x: any, j: number) => j===i ? {...x, description: e.target.value} : x))} placeholder="Description" style={{ border: "1px solid #e0e0e0", padding: "0.4rem 0.6rem", fontSize: "0.82rem", outline: "none", width: "100%", boxSizing: "border-box" as const }} />
          <button onClick={() => remove(i)} style={{ width: "32px", height: "32px", backgroundColor: "#fff0f0", border: "1px solid #ffcccc", color: "#cc0000", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>✕</button>
        </div>
      ))}
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <button onClick={add} style={{ padding: "0.45rem 1rem", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>+ Add Value</button>
        <button onClick={save} disabled={saving} style={{ padding: "0.45rem 1.25rem", backgroundColor: saved ? "#16a34a" : "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.72rem", cursor: "pointer", transition: "all 0.2s" }}>{saving ? "..." : saved ? "Saved ✓" : "Save Values"}</button>
      </div>
    </div>
  )
}

// ── ABOUT PAGE TEAM EDITOR ──
function AboutTeamEditor({ settings, saveSetting, requestConfirm }: { settings: Record<string,string>; saveSetting: (k:string,v:string)=>void; requestConfirm: (msg: string, onOk: () => void) => void }) {
  const defaultTeam = [
    { name: "The Founder", role: "Athlete and Visionary", description: "Started Flextreme after years of frustration with gym wear that looked good but performed poorly." },
    { name: "The Design Team", role: "Performance Designers", description: "Athletes themselves, designing gear they actually want to wear." },
    { name: "The Community", role: "Our Growing Community", description: "Our biggest team. Real people, real training, real results." },
  ]
  const [team, setTeam] = useState(() => {
    try { return settings.about_team ? JSON.parse(settings.about_team) : defaultTeam } catch { return defaultTeam }
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    try { if (settings.about_team) setTeam(JSON.parse(settings.about_team)) } catch {}
  }, [settings.about_team])
  async function save() { setSaving(true); await saveSetting("about_team", JSON.stringify(team)); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  function add() {
    setTeam([...team, { name: "New Member", role: "", description: "" }])
  }
  function remove(i: number) {
    const m = team[i]
    requestConfirm("Remove <strong>" + (m?.name || "this member") + "</strong> from the About page?", () => {
      setTeam(team.filter((_: any, j: number) => j !== i))
    })
  }
  return (
    <div style={{ padding: "0.75rem 0" }}>
      {team.map((m: any, i: number) => (
        <div key={i} style={{ border: "1px solid #e0e0e0", padding: "1rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input value={m.name} onChange={e => setTeam(team.map((x: any, j: number) => j===i ? {...x, name: e.target.value} : x))} placeholder="Name" style={{ border: "1px solid #e0e0e0", padding: "0.4rem 0.6rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" as const, width: "100%" }} />
            <input value={m.role} onChange={e => setTeam(team.map((x: any, j: number) => j===i ? {...x, role: e.target.value} : x))} placeholder="Role / Title" style={{ border: "1px solid #e0e0e0", padding: "0.4rem 0.6rem", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" as const, width: "100%" }} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <textarea value={m.description} onChange={e => setTeam(team.map((x: any, j: number) => j===i ? {...x, description: e.target.value} : x))} placeholder="Description" rows={2} style={{ flex: 1, border: "1px solid #e0e0e0", padding: "0.4rem 0.6rem", fontSize: "0.82rem", outline: "none", resize: "vertical" as const, fontFamily: "inherit" }} />
            <button onClick={() => remove(i)} style={{ width: "28px", height: "28px", backgroundColor: "#fff0f0", border: "1px solid #ffcccc", color: "#cc0000", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>✕</button>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={add} style={{ padding: "0.45rem 1rem", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>+ Add Person</button>
        <button onClick={save} disabled={saving} style={{ padding: "0.45rem 1.25rem", backgroundColor: saved ? "#16a34a" : "black", color: "white", border: "none", fontWeight: 700, fontSize: "0.72rem", cursor: "pointer", transition: "all 0.2s" }}>{saving ? "..." : saved ? "Saved ✓" : "Save Team"}</button>
      </div>
    </div>
  )
}

function SocialRow({ label, icon, settingKey, placeholder, settings, saveSetting, saving, saved }: {
  label: string; icon: string; settingKey: string; placeholder: string
  settings: Record<string,string>; saveSetting: (k:string,v:string)=>Promise<void>
  saving: string|null; saved: string|null
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span>{icon}</span>{label}
      </label>
      <input
        defaultValue={settings[settingKey] || ""}
        onBlur={e => { if (e.target.value !== (settings[settingKey] || "")) saveSetting(settingKey, e.target.value) }}
        placeholder={placeholder}
        style={{ border: "1px solid #e0e0e0", padding: "0.45rem 0.75rem", fontSize: "0.82rem", outline: "none", width: "100%", boxSizing: "border-box" as const }}
      />
      <span style={{ fontSize: "0.72rem", color: saved === settingKey ? "#16a34a" : "transparent", whiteSpace: "nowrap", fontWeight: 700 }}>
        {saved === settingKey ? "Saved ✓" : saving === settingKey ? "..." : "·"}
      </span>
    </div>
  )
}

function RichEditor({ value, onChange, toHTML, toMarkdown }: {
  value: string
  onChange: (v: string) => void
  toHTML: (t: string) => string
  toMarkdown: (h: string) => string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const lastVal = useRef(value)

  useEffect(() => {
    // Only update DOM if value changed externally (e.g. settings loaded from DB)
    if (ref.current && value !== lastVal.current) {
      const newHTML = toHTML(value)
      if (ref.current.innerHTML !== newHTML) {
        ref.current.innerHTML = newHTML
        lastVal.current = value
      }
    }
  }, [value])

  useEffect(() => {
    // Set initial content on mount
    if (ref.current) {
      ref.current.innerHTML = toHTML(value)
      lastVal.current = value
    }
  }, [])

  function handleInput() {
    if (ref.current) {
      const md = toMarkdown(ref.current.innerHTML)
      lastVal.current = md
      onChange(md)
    }
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleInput}
      style={{ minHeight: "100px", padding: "0.75rem", fontSize: "0.875rem", lineHeight: 1.7, outline: "none", fontFamily: "inherit", color: "#111" }}
    />
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "2px solid black" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h2>
        <p style={{ fontSize: "0.8rem", color: "#999", marginTop: "0.2rem" }}>{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
