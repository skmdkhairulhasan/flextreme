"use client"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { uploadToCloudinary } from "@/lib/cloudinary"

export default function EditProduct() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isNew = id === "new"

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [categoryGroups, setCategoryGroups] = useState<{id:string;name:string;subcategories:string[]}[]>([
    {id:"tops",name:"tops",subcategories:[]},
    {id:"bottoms",name:"bottoms",subcategories:[]},
    {id:"accessories",name:"accessories",subcategories:[]},
  ])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [saved, setSaved] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: "",
    slug: "",
    price: "",
    original_price: "",
    description: "",
    category: "tops",
    subcategory: "",
    sizes: "XS,S,M,L,XL,XXL",
    colors: "Black,White",
    images: [] as string[],
    video_url: "",
    is_featured: false,
    in_stock: true,
    stock_quantity: "" as string | number,
    low_stock_alert: "5" as string | number,
    stock_matrix: {} as Record<string, number>,
  })

  useEffect(() => {
    if (!isNew) fetchProduct()
    loadCategories()
  }, [id])

  async function loadCategories() {
    const supabase = createClient()
    const { data } = await supabase.from("settings").select("value").eq("key", "product_categories").single()
    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value)
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          setCategoryGroups(parsed.map((name: string) => ({ id: name, name, subcategories: [] })))
        } else {
          setCategoryGroups(parsed)
        }
      } catch {}
    }
  }

  async function fetchProduct() {
    const supabase = createClient()
    const { data } = await supabase.from("products").select("*").eq("id", id).single()
    if (data) {
      setForm({
        name: data.name || "",
        slug: data.slug || "",
        price: String(data.price || ""),
        original_price: String(data.original_price || ""),
        description: data.description || "",
        category: data.category || "tops",
        subcategory: data.subcategory || "",
        sizes: (data.sizes || []).join(","),
        colors: (data.colors || []).join(","),
        images: data.images || [],
        video_url: data.video_url || "",
        is_featured: data.is_featured || false,
        in_stock: data.in_stock !== false,
        stock_quantity: data.stock_quantity !== null && data.stock_quantity !== undefined ? String(data.stock_quantity) : "",
        low_stock_alert: data.low_stock_alert !== null && data.low_stock_alert !== undefined ? String(data.low_stock_alert) : "5",
        stock_matrix: data.stock_matrix || {},
      })
    }
    setLoading(false)
  }

  async function uploadImages(files: FileList) {
    setUploading(true)
    setUploadError("")
    const uploaded: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress("Uploading image " + (i + 1) + " of " + files.length + "...")
      try {
        const url = await uploadToCloudinary(file, "flextreme/products")
        uploaded.push(url)
      } catch (err: any) {
        setUploadError("Upload failed: " + err.message)
        setUploading(false)
        setUploadProgress("")
        return
      }
    }

    setForm(prev => ({ ...prev, images: [...prev.images, ...uploaded] }))
    setUploading(false)
    setUploadProgress("")
  }

  async function uploadVideo(file: File) {
    setUploading(true)
    setUploadError("")
    setUploadProgress("Uploading video...")
    try {
      const url = await uploadToCloudinary(file, "flextreme/products")
      setForm(prev => ({ ...prev, video_url: url }))
    } catch (err: any) {
      setUploadError("Video upload failed: " + err.message)
    }
    setUploading(false)
    setUploadProgress("")
  }

  function removeImage(index: number) {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  function moveImage(from: number, to: number) {
    const imgs = [...form.images]
    const item = imgs.splice(from, 1)[0]
    imgs.splice(to, 0, item)
    setForm(prev => ({ ...prev, images: imgs }))
  }

  async function handleSave() {
    if (!form.name || !form.slug || !form.price) { alert("Name, slug and price are required"); return }
    setSaving(true)
    const supabase = createClient()
    const data = {
      name: form.name,
      slug: form.slug,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory || null,
      sizes: form.sizes.split(",").map(s => s.trim()).filter(Boolean),
      colors: form.colors.split(",").map(c => c.trim()).filter(Boolean),
      images: form.images,
      video_url: form.video_url || null,
      is_featured: form.is_featured,
      in_stock: form.in_stock,
      stock_quantity: Object.keys(form.stock_matrix).length > 0 ? Object.values(form.stock_matrix).reduce((s, v) => s + (v || 0), 0) : (form.stock_quantity !== "" ? Number(form.stock_quantity) : null),
      low_stock_alert: form.low_stock_alert !== "" ? Number(form.low_stock_alert) : 5,
      stock_matrix: form.stock_matrix,
      updated_at: new Date().toISOString(),
    }
    if (isNew) {
      const { error } = await supabase.from("products").insert(data)
      if (error) { alert("Error: " + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from("products").update(data).eq("id", id)
      if (error) { alert("Error: " + error.message); setSaving(false); return }
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      if (isNew) router.push("/admin/products")
    }, 1500)
  }

  const inputStyle = { width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 1rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" }
  const labelStyle = { display: "block" as const, fontSize: "0.72rem", fontWeight: 700 as const, marginBottom: "0.4rem", textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "#555" }

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#999" }}>Loading product...</div>

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
            {isNew ? "Add New Product" : "Edit Product"}
          </h1>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {isNew ? "Fill in the details and upload images" : "Update product details, images and video"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => router.push("/admin/products")} style={{ padding: "0.75rem 1.5rem", border: "1px solid #e0e0e0", backgroundColor: "white", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", textTransform: "uppercase" }}>Cancel</button>
          {!isNew && (
            <a href={"/products/" + form.slug} target="_blank" rel="noreferrer" style={{ padding: "0.75rem 1.5rem", border: "1px solid #e0e0e0", backgroundColor: "white", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", textTransform: "uppercase", textDecoration: "none", color: "black", display: "inline-block" }}>Preview</a>
          )}
          <button onClick={handleSave} disabled={saving} style={{ padding: "0.75rem 2rem", backgroundColor: saved ? "#16a34a" : saving ? "#333" : "black", color: "white", border: "none", fontSize: "0.8rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", textTransform: "uppercase" }}>
            {saved ? "Saved!" : saving ? "Saving..." : isNew ? "Create Product" : "Save Changes"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "2px solid black" }}>
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase" }}>Product Images</h2>
                <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.2rem" }}>First image is the main image.</p>
              </div>
              <button onClick={() => imageInputRef.current?.click()} disabled={uploading} style={{ backgroundColor: "black", color: "white", border: "none", padding: "0.5rem 1rem", fontSize: "0.75rem", fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", textTransform: "uppercase" }}>
                {uploading ? "Uploading..." : "+ Upload"}
              </button>
            </div>

            <input ref={imageInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => e.target.files && uploadImages(e.target.files)} />

            {uploadProgress && (
              <div style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", padding: "1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#0369a1" }}>
                {uploadProgress}
              </div>
            )}

            {uploadError && (
              <div style={{ backgroundColor: "#fff0f0", border: "1px solid #ffcccc", padding: "1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "#cc0000" }}>
                {uploadError}
              </div>
            )}

            {form.images.length === 0 ? (
              <div onClick={() => imageInputRef.current?.click()} style={{ border: "2px dashed #e0e0e0", padding: "3rem", textAlign: "center", cursor: "pointer", color: "#999" }}>
                <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>+</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Click to upload images</p>
                <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>JPG, PNG, WEBP supported</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                {form.images.map((img, index) => (
                  <div key={index} style={{ position: "relative", backgroundColor: "#f5f5f5", aspectRatio: "1/1", overflow: "hidden", border: index === 0 ? "2px solid black" : "1px solid #e0e0e0" }}>
                    <img src={img} alt={"Product " + index} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {index === 0 && (
                      <div style={{ position: "absolute", top: "0.4rem", left: "0.4rem", backgroundColor: "black", color: "white", padding: "0.15rem 0.5rem", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase" }}>Main</div>
                    )}
                    <div style={{ position: "absolute", top: "0.4rem", right: "0.4rem", display: "flex", gap: "0.25rem" }}>
                      {index > 0 && (
                        <button onClick={() => moveImage(index, index - 1)} style={{ width: "24px", height: "24px", backgroundColor: "white", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: "0.7rem" }}>L</button>
                      )}
                      {index < form.images.length - 1 && (
                        <button onClick={() => moveImage(index, index + 1)} style={{ width: "24px", height: "24px", backgroundColor: "white", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: "0.7rem" }}>R</button>
                      )}
                      <button onClick={() => removeImage(index)} style={{ width: "24px", height: "24px", backgroundColor: "#ff4444", border: "none", color: "white", cursor: "pointer", fontSize: "0.7rem" }}>X</button>
                    </div>
                  </div>
                ))}
                <div onClick={() => imageInputRef.current?.click()} style={{ border: "2px dashed #e0e0e0", aspectRatio: "1/1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#999" }}>
                  <p style={{ fontSize: "1.5rem" }}>+</p>
                  <p style={{ fontSize: "0.7rem" }}>Add more</p>
                </div>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
            <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "2px solid black" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase" }}>Product Video</h2>
              <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.2rem" }}>Optional. Short product demo video.</p>
            </div>
            <input ref={videoInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => e.target.files && e.target.files[0] && uploadVideo(e.target.files[0])} />
            {form.video_url ? (
              <div>
                <video src={form.video_url} controls style={{ width: "100%", marginBottom: "0.75rem" }} />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => videoInputRef.current?.click()} style={{ flex: 1, padding: "0.6rem", border: "1px solid #e0e0e0", backgroundColor: "white", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", textTransform: "uppercase" }}>Replace</button>
                  <button onClick={() => setForm(prev => ({ ...prev, video_url: "" }))} style={{ flex: 1, padding: "0.6rem", border: "1px solid #ffcccc", backgroundColor: "#fff0f0", color: "#cc0000", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", textTransform: "uppercase" }}>Remove</button>
                </div>
              </div>
            ) : (
              <div onClick={() => videoInputRef.current?.click()} style={{ border: "2px dashed #e0e0e0", padding: "2.5rem", textAlign: "center", cursor: "pointer", color: "#999" }}>
                <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Play</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Click to upload video</p>
                <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>MP4, MOV, WEBM supported</p>
              </div>
            )}
          </div>

        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
            <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "2px solid black" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase" }}>Basic Info</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input value={form.name} onChange={e => {
                  const name = e.target.value
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                  setForm(prev => ({ ...prev, name, slug }))
                }} placeholder="e.g. Apex Compression Tee" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>URL Slug (auto-generated)</label>
                <input value={form.slug} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))} style={{ ...inputStyle, backgroundColor: "#f9f9f9", color: "#666" }} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value, subcategory: "" }))} style={{ ...inputStyle, backgroundColor: "white" }}>
                  <option value="">— Select category</option>
                  {categoryGroups.map(g => (
                    <option key={g.id} value={g.name}>{g.name.replace(/-/g, " ").replace(/\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              {/* Subcategory — shown when selected category has subcategories */}
              {form.category && (categoryGroups.find(g => g.name === form.category)?.subcategories?.length ?? 0) > 0 && (
                <div>
                  <label style={labelStyle}>Subcategory</label>
                  <select value={form.subcategory} onChange={e => setForm(prev => ({ ...prev, subcategory: e.target.value }))} style={{ ...inputStyle, backgroundColor: "white" }}>
                    <option value="">— None (show in all {form.category})</option>
                    {categoryGroups.find(g => g.name === form.category)!.subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub.replace(/-/g, " ").replace(/\w/g, l => l.toUpperCase())}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: "0.68rem", color: "#999", marginTop: "0.3rem" }}>
                    Subcategory helps customers filter products (e.g. Compression Top, Hoodie, Tank Top)
                  </p>
                </div>
              )}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={5} placeholder="Describe the product..." style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
            <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "2px solid black" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase" }}>Pricing</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Price (BDT) *</label>
                <input type="number" value={form.price} onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))} placeholder="2499" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Original Price (BDT)</label>
                <input type="number" value={form.original_price} onChange={e => setForm(prev => ({ ...prev, original_price: e.target.value }))} placeholder="3499" style={inputStyle} />
                <p style={{ fontSize: "0.7rem", color: "#999", marginTop: "0.3rem" }}>Leave empty if no discount</p>
              </div>
            </div>
            {form.price && form.original_price && Number(form.original_price) > Number(form.price) && (
              <div style={{ marginTop: "1rem", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#15803d", fontWeight: 700 }}>
                Discount: {Math.round(((Number(form.original_price) - Number(form.price)) / Number(form.original_price)) * 100)}% off
              </div>
            )}
          </div>

          <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
            <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "2px solid black" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase" }}>Sizes and Colors</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Sizes (comma separated)</label>
                <input value={form.sizes} onChange={e => setForm(prev => ({ ...prev, sizes: e.target.value }))} placeholder="XS,S,M,L,XL,XXL" style={inputStyle} />
                <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  {form.sizes.split(",").filter(Boolean).map(s => (
                    <span key={s} style={{ border: "1px solid #e0e0e0", padding: "0.15rem 0.6rem", fontSize: "0.7rem", fontWeight: 700 }}>{s.trim()}</span>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Colors (comma separated)</label>
                <input value={form.colors} onChange={e => setForm(prev => ({ ...prev, colors: e.target.value }))} placeholder="Black,White,Grey" style={inputStyle} />
                <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  {form.colors.split(",").filter(Boolean).map(c => (
                    <span key={c} style={{ border: "1px solid #e0e0e0", padding: "0.15rem 0.6rem", fontSize: "0.7rem", fontWeight: 700 }}>{c.trim()}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
            <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "2px solid black" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 900, textTransform: "uppercase" }}>Status</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                <input type="checkbox" checked={form.in_stock} onChange={e => setForm(prev => ({ ...prev, in_stock: e.target.checked }))} style={{ width: "18px", height: "18px" }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>In Stock</p>
                  <p style={{ fontSize: "0.75rem", color: "#999" }}>Uncheck to force mark as out of stock</p>
                </div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(prev => ({ ...prev, is_featured: e.target.checked }))} style={{ width: "18px", height: "18px" }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>Featured Product</p>
                  <p style={{ fontSize: "0.75rem", color: "#999" }}>Shows on homepage featured section</p>
                </div>
              </label>
              <div style={{ padding: "0.875rem 1rem", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", fontSize: "0.78rem", color: "#0369a1" }}>
                💡 Manage detailed stock (per size & color) from the <strong>Stock</strong> page in the admin menu.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
