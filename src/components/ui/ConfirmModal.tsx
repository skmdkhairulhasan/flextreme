"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ open, title, message, confirmLabel = "Yes, Delete", cancelLabel = "Cancel", danger = true, loading = false, onConfirm, onCancel }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!open || !mounted) return null

  const modal = (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{ backgroundColor: "white", padding: "1.75rem", maxWidth: "400px", width: "100%", border: "1px solid #e0e0e0", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{danger ? "🗑️" : "⚠️"}</div>
        <h3 style={{ fontWeight: 900, fontSize: "1rem", marginBottom: "0.5rem" }}>{title}</h3>
        <p style={{ color: "#555", fontSize: "0.85rem", marginBottom: "1.5rem", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: message }} />
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, padding: "0.875rem", backgroundColor: danger ? "#dc2626" : "black", color: "white", border: "none", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: "0.875rem", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1, padding: "0.875rem", backgroundColor: "white", border: "1px solid #e0e0e0", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem" }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
