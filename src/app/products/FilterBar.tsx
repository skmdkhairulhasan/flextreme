"use client"
import { useState, useEffect, useRef } from "react"

type CategoryGroup = { id: string; name: string; subcategories: string[] }

function formatLabel(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

export default function FilterBar({ categoryGroups }: { categoryGroups: CategoryGroup[] }) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeSubcategory, setActiveSubcategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentGroup = categoryGroups.find(g => g.name === activeCategory)
  const hasSubcats = currentGroup && (currentGroup.subcategories || []).length > 0

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Filter + sort products
  useEffect(() => {
    const grid = document.getElementById("products-grid")
    if (!grid) return
    const cards = Array.from(grid.children) as HTMLElement[]
    cards.forEach(card => {
      const link = card.querySelector("a") as HTMLAnchorElement | null
      if (!link) return
      const catEl = link.querySelector("p") as HTMLElement | null
      const nameEl = link.querySelector("h3") as HTMLElement | null
      const cat = (catEl?.textContent || "").toLowerCase()
      const name = (nameEl?.textContent || "").toLowerCase()
      const subcat = (card.getAttribute("data-subcategory") || "").toLowerCase()
      let show = true
      if (activeCategory !== "all") show = cat.includes(activeCategory.toLowerCase())
      if (show && activeSubcategory !== "all") {
        if (subcat) show = subcat.includes(activeSubcategory.toLowerCase())
        else show = name.includes(activeSubcategory.toLowerCase()) || cat.includes(activeSubcategory.toLowerCase())
      }
      card.style.display = show ? "" : "none"
    })
    if (sortBy !== "newest") {
      const visible = cards.filter(c => c.style.display !== "none")
      visible.sort((a, b) => {
        const aP = parseFloat((a.querySelector("span")?.textContent || "0").replace(/[^0-9.]/g, ""))
        const bP = parseFloat((b.querySelector("span")?.textContent || "0").replace(/[^0-9.]/g, ""))
        return sortBy === "price-asc" ? aP - bP : bP - aP
      })
      visible.forEach(c => grid.appendChild(c))
    }
  }, [activeCategory, activeSubcategory, sortBy])

  function handleCategoryClick(cat: string) {
    setActiveCategory(cat)
    setActiveSubcategory("all")
  }

  // Build active filter label
  const categoryLabel = activeCategory === "all" ? "All" : formatLabel(activeCategory)
  const sortLabel = sortBy === "newest" ? "Newest" : sortBy === "price-asc" ? "Price ↑" : "Price ↓"
  const isFiltered = activeCategory !== "all" || activeSubcategory !== "all" || sortBy !== "newest"

  return (
    <div style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: "white", position: "sticky", top: "72px", zIndex: 40 }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px" }}>

        {/* Active filter summary */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#888", fontWeight: 600 }}>
          <span style={{ color: "#111", fontWeight: 700 }}>{categoryLabel}</span>
          {activeSubcategory !== "all" && <><span>·</span><span style={{ color: "#555" }}>{formatLabel(activeSubcategory)}</span></>}
          <span>·</span>
          <span>{sortLabel}</span>
        </div>

        {/* Filter button */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.45rem 1rem",
              border: isFiltered ? "1.5px solid black" : "1px solid #e0e0e0",
              backgroundColor: isFiltered ? "black" : "white",
              color: isFiltered ? "white" : "#333",
              fontSize: "0.75rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.05em",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filter
            {isFiltered && <span style={{ fontSize: "0.6rem", backgroundColor: "white", color: "black", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>!</span>}
          </button>

          {/* Dropdown panel */}
          {open && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              backgroundColor: "white", border: "1px solid #e0e0e0",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              minWidth: "240px", zIndex: 100, padding: "1.25rem",
            }}>
              {/* Category */}
              <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", marginBottom: "0.6rem" }}>Category</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1.25rem" }}>
                {[{ id: "all", name: "all" }, ...categoryGroups].map(g => (
                  <button key={g.id} onClick={() => handleCategoryClick(g.name)}
                    style={{
                      padding: "0.3rem 0.75rem", fontSize: "0.73rem", fontWeight: 600,
                      border: "1px solid " + (activeCategory === g.name ? "black" : "#e0e0e0"),
                      backgroundColor: activeCategory === g.name ? "black" : "white",
                      color: activeCategory === g.name ? "white" : "#555",
                      cursor: "pointer", transition: "all 0.12s",
                    }}
                  >
                    {g.name === "all" ? "All" : formatLabel(g.name)}
                  </button>
                ))}
              </div>

              {/* Subcategories */}
              {hasSubcats && (
                <>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", marginBottom: "0.6rem" }}>Type</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1.25rem" }}>
                    {[{ id: "all", label: "All" }, ...(currentGroup?.subcategories || []).map(s => ({ id: s, label: formatLabel(s) }))].map(sub => (
                      <button key={sub.id} onClick={() => setActiveSubcategory(sub.id)}
                        style={{
                          padding: "0.3rem 0.75rem", fontSize: "0.73rem", fontWeight: 600,
                          border: "1px solid " + (activeSubcategory === sub.id ? "black" : "#e0e0e0"),
                          backgroundColor: activeSubcategory === sub.id ? "black" : "white",
                          color: activeSubcategory === sub.id ? "white" : "#555",
                          cursor: "pointer", transition: "all 0.12s",
                        }}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Sort */}
              <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", marginBottom: "0.6rem" }}>Sort By</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1.25rem" }}>
                {[
                  { value: "newest", label: "Newest" },
                  { value: "price-asc", label: "Price: Low → High" },
                  { value: "price-desc", label: "Price: High → Low" },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setSortBy(opt.value)}
                    style={{
                      padding: "0.45rem 0.75rem", fontSize: "0.75rem", fontWeight: 600,
                      border: "1px solid " + (sortBy === opt.value ? "black" : "#f0f0f0"),
                      backgroundColor: sortBy === opt.value ? "black" : "white",
                      color: sortBy === opt.value ? "white" : "#555",
                      cursor: "pointer", textAlign: "left", transition: "all 0.12s",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Reset */}
              {isFiltered && (
                <button
                  onClick={() => { setActiveCategory("all"); setActiveSubcategory("all"); setSortBy("newest"); setOpen(false) }}
                  style={{ width: "100%", padding: "0.5rem", fontSize: "0.72rem", fontWeight: 700, border: "1px solid #e0e0e0", backgroundColor: "white", color: "#888", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
