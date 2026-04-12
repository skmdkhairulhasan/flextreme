"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
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

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>(["tops", "bottoms", "accessories"]) // flat list of category names
  const [categoryGroups, setCategoryGroups] = useState<{id:string;name:string;subcategories:string[]}[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [filter, setFilter] = useState("all")
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const supabase = createClient()
    const [{ data: prods }, { data: settings }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("settings").select("value").eq("key", "product_categories").single(),
    ])
    setProducts(prods || [])
    if (settings?.value) {
      try {
        const parsed = JSON.parse(settings.value)
        if (parsed.length > 0 && typeof parsed[0] === "object") {
          setCategoryGroups(parsed)
          setCategories(parsed.map((g: any) => g.name))
        } else {
          setCategories(parsed)
          setCategoryGroups(parsed.map((name: string) => ({ id: name, name, subcategories: [] })))
        }
      } catch {}
    }
    setLoading(false)
  }

  async function confirmDeleteProduct() {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)
    const supabase = createClient()
    await supabase.from("products").delete().eq("id", deleteTarget.id)
    setProducts(prev => prev.filter(p => p.id !== deleteTarget.id))
    setDeleting(null)
    setDeleteTarget(null)
  }

  async function toggleStock(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from("products").update({ in_stock: !current }).eq("id", id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, in_stock: !current } : p))
  }

  async function toggleFeatured(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from("products").update({ is_featured: !current }).eq("id", id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_featured: !current } : p))
  }

  async function changeCategory(id: string, category: string) {
    const supabase = createClient()
    await supabase.from("products").update({ category, subcategory: "" }).eq("id", id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, category, subcategory: "" } : p))
  }

  async function changeSubcategory(id: string, subcategory: string) {
    const supabase = createClient()
    await supabase.from("products").update({ subcategory }).eq("id", id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, subcategory } : p))
  }

  function formatCat(cat: string) {
    return cat ? cat.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "—"
  }

  const filtered = filter === "all" ? products
    : filter === "featured" ? products.filter(p => p.is_featured)
    : filter === "out_of_stock" ? products.filter(p => !p.in_stock)
    : products.filter(p => p.category === filter)

  const featuredCount = products.filter(p => p.is_featured).length

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>Loading...</div>

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product?"
        message={deleteTarget ? "You are about to permanently delete <strong>" + deleteTarget.name + "</strong>. This cannot be undone." : ""}
        loading={!!deleting}
        onConfirm={confirmDeleteProduct}
        onCancel={() => setDeleteTarget(null)}
      />
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "1.35rem" : "1.75rem", fontWeight: 900, textTransform: "uppercase" }}>Products</h1>
          <p style={{ color: "#666", fontSize: "0.8rem" }}>{products.length} total · {featuredCount} featured</p>
        </div>
        <button onClick={() => router.push("/admin/products/new")} style={{ backgroundColor: "black", color: "white", padding: "0.65rem 1.25rem", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", border: "none", cursor: "pointer" }}>
          + Add Product
        </button>
      </div>

      {/* Stats — 2 col on mobile */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "0.6rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total", value: products.length, color: "#111" },
          { label: "Featured", value: featuredCount, color: "#854d0e" },
          { label: "In Stock", value: products.filter(p => p.in_stock).length, color: "#16a34a" },
          { label: "Out of Stock", value: products.filter(p => !p.in_stock).length, color: "#dc2626" },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "0.75rem", textAlign: "center" }}>
            <p style={{ fontSize: isMobile ? "1.3rem" : "1.5rem", fontWeight: 900, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "0.65rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs — scrollable */}
      <div style={{ display: "flex", overflowX: "auto", touchAction: "pan-x" as any, overscrollBehaviorX: "contain" as any, WebkitOverflowScrolling: "touch" as any, borderBottom: "2px solid black", marginBottom: "1rem", }}>
        {[
          { id: "all", label: "All (" + products.length + ")" },
          { id: "featured", label: "Featured" },
          ...categories.map(c => ({ id: c, label: formatCat(c) })),
          { id: "out_of_stock", label: "Out of Stock" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)} style={{ padding: "0.55rem 0.875rem", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", border: "none", borderBottom: filter === tab.id ? "3px solid black" : "3px solid transparent", marginBottom: "-2px", backgroundColor: "transparent", cursor: "pointer", color: filter === tab.id ? "black" : "#999", whiteSpace: "nowrap" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* MOBILE: Card layout */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>No products.</div>}
          {filtered.map(p => (
            <div key={p.id} style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "0.875rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ width: "56px", height: "56px", backgroundColor: "#f5f5f5", flexShrink: 0, overflow: "hidden" }}>
                  {p.images?.[0] ? <img src={p.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.15rem" }}>{p.name}</p>
                  <p style={{ fontSize: "0.72rem", color: "#999" }}>{formatCat(p.category)}</p>
                  <p style={{ fontWeight: 700, fontSize: "0.85rem", marginTop: "0.2rem" }}>BDT {Number(p.price).toLocaleString()}</p>
                </div>
              </div>
              {/* Actions row */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button onClick={() => toggleStock(p.id, p.in_stock)} style={{ flex: 1, padding: "0.5rem", fontSize: "0.7rem", fontWeight: 700, border: "1px solid #e0e0e0", backgroundColor: p.in_stock ? "#dcfce7" : "#fee2e2", color: p.in_stock ? "#16a34a" : "#dc2626", cursor: "pointer", textTransform: "uppercase" }}>
                  {p.in_stock ? "In Stock" : "Out"}
                </button>
                <button onClick={() => toggleFeatured(p.id, p.is_featured)} style={{ flex: 1, padding: "0.5rem", fontSize: "0.7rem", fontWeight: 700, border: "1px solid " + (p.is_featured ? "#fcd34d" : "#e0e0e0"), backgroundColor: p.is_featured ? "#fef9c3" : "white", color: p.is_featured ? "#854d0e" : "#999", cursor: "pointer" }}>
                  {p.is_featured ? "★ Featured" : "☆ Feature"}
                </button>
                <button onClick={() => router.push("/admin/products/" + p.id)} style={{ flex: 2, padding: "0.5rem", fontSize: "0.7rem", fontWeight: 700, border: "none", backgroundColor: "black", color: "white", cursor: "pointer", textTransform: "uppercase" }}>Edit</button>
                <button onClick={() => setDeleteTarget({ id: p.id, name: p.name })} disabled={deleting === p.id} style={{ padding: "0.5rem 0.75rem", fontSize: "0.7rem", fontWeight: 700, border: "1px solid #ffcccc", backgroundColor: "#fff0f0", color: "#cc0000", cursor: "pointer" }}>
                  {deleting === p.id ? "..." : "Del"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DESKTOP: Original table layout unchanged */
        <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 110px 130px 130px 70px 80px 150px", gap: "0.75rem", padding: "0.6rem 1rem", backgroundColor: "black", color: "white", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <span></span><span>Product</span><span>Price</span><span>Category</span><span>Stock</span><span>Featured</span><span>Actions</span>
          </div>
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>No products.</div>}
          {filtered.map((product: any) => (
            <div key={product.id} style={{ display: "grid", gridTemplateColumns: "56px 1fr 110px 130px 130px 70px 80px 150px", gap: "0.75rem", padding: "0.875rem 1rem", borderTop: "1px solid #f0f0f0", alignItems: "center" }}>
              <div style={{ width: "50px", height: "50px", backgroundColor: "#f5f5f5", overflow: "hidden" }}>
                {product.images?.[0] ? <img src={product.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.88rem" }}>{product.name}</p>
                <p style={{ fontSize: "0.72rem", color: "#999" }}>{(product.sizes || []).join(", ")}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 700 }}>BDT {Number(product.price).toLocaleString()}</p>
                {product.original_price && <p style={{ fontSize: "0.72rem", color: "#999", textDecoration: "line-through" }}>BDT {Number(product.original_price).toLocaleString()}</p>}
              </div>
              <select value={product.category || ""} onChange={e => changeCategory(product.id, e.target.value)} style={{ border: "1px solid #e0e0e0", padding: "0.3rem 0.4rem", fontSize: "0.75rem", outline: "none", backgroundColor: "white", width: "100%" }}>
                <option value="">— No category</option>
                {categories.map(c => <option key={c} value={c}>{formatCat(c)}</option>)}
              </select>
              {/* Subcategory inline dropdown */}
              {(() => {
                const group = categoryGroups.find(g => g.name === product.category)
                const subs = group?.subcategories || []
                return subs.length > 0 ? (
                  <select value={product.subcategory || ""} onChange={e => changeSubcategory(product.id, e.target.value)} style={{ border: "1px solid #e0e0e0", padding: "0.3rem 0.4rem", fontSize: "0.72rem", outline: "none", backgroundColor: "white", width: "100%", color: product.subcategory ? "black" : "#aaa" }}>
                    <option value="">— Sub</option>
                    {subs.map((s: string) => <option key={s} value={s}>{formatCat(s)}</option>)}
                  </select>
                ) : (
                  <div style={{ fontSize: "0.68rem", color: "#ccc", padding: "0.3rem 0.4rem" }}>—</div>
                )
              })()}
              <button onClick={() => toggleStock(product.id, product.in_stock)} style={{ padding: "0.3rem 0.4rem", fontSize: "0.65rem", fontWeight: 700, border: "1px solid #e0e0e0", backgroundColor: product.in_stock ? "#dcfce7" : "#fee2e2", color: product.in_stock ? "#16a34a" : "#dc2626", cursor: "pointer", width: "100%" }}>
                {product.in_stock ? "In Stock" : "Out"}
              </button>
              <button onClick={() => toggleFeatured(product.id, product.is_featured)} style={{ padding: "0.3rem 0.4rem", fontSize: "0.65rem", fontWeight: 700, border: "1px solid " + (product.is_featured ? "#fcd34d" : "#e0e0e0"), backgroundColor: product.is_featured ? "#fef9c3" : "white", color: product.is_featured ? "#854d0e" : "#bbb", cursor: "pointer", width: "100%" }}>
                {product.is_featured ? "★" : "☆"}
              </button>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button onClick={() => router.push("/admin/products/" + product.id)} style={{ flex: 1, padding: "0.4rem 0.5rem", fontSize: "0.7rem", fontWeight: 700, border: "none", backgroundColor: "black", color: "white", cursor: "pointer" }}>Edit</button>
                <a href={"/products/" + product.slug} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "0.4rem 0.5rem", fontSize: "0.7rem", fontWeight: 700, border: "1px solid #e0e0e0", textDecoration: "none", color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}>View</a>
                <button onClick={() => setDeleteTarget({ id: product.id, name: product.name })} disabled={deleting === product.id} style={{ padding: "0.4rem 0.5rem", fontSize: "0.7rem", fontWeight: 700, border: "1px solid #ffcccc", backgroundColor: "#fff0f0", color: "#cc0000", cursor: "pointer" }}>
                  {deleting === product.id ? "..." : "Del"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
