import { compare } from "bcryptjs"
import { jwtVerify, SignJWT } from "jose"

type ProductRecord = {
  id: string
  slug: string
  name: string
  price: number
  description: string
  image_url: string
  images_json: string
  video_url?: string | null
  sizes_json: string
  colors_json: string
  category?: string | null
  subcategory?: string | null
  is_featured: number
  in_stock: number
  stock_matrix_json?: string | null
  stock_quantity?: number | null
  low_stock_alert?: number | null
  created_at: string
  updated_at: string
}

type OrderRecord = {
  id: string
  customer_name: string
  phone: string
  address: string
  items: string
  status: string
  product_id?: string | null
  product_name?: string | null
  size?: string | null
  color?: string | null
  quantity: number
  total_price: number
  notes?: string | null
  tracking_url?: string | null
  created_at: string
  updated_at: string
}

type ReviewRecord = {
  id: string
  product_id: string
  product_name?: string | null
  customer_name: string
  customer_location?: string | null
  rating: number
  review_text: string
  photo_url?: string | null
  status: string
  featured: number
  created_at: string
}

export interface Env {
  DB: D1Database
  ASSETS: R2Bucket
  JWT_SECRET: string
  R2_PUBLIC_BASE_URL: string
  CORS_ORIGIN?: string
}

const textEncoder = new TextEncoder()
const countedStockStatuses = ["confirmed", "processing", "shipped", "delivered"]

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set("content-type", "application/json")
  return new Response(JSON.stringify(data), { ...init, headers })
}

function applyCors(request: Request, response: Response, origin: string) {
  const headers = new Headers(response.headers)
  const requestOrigin = request.headers.get("origin")
  headers.set("access-control-allow-origin", requestOrigin && (origin === "*" || requestOrigin === origin) ? requestOrigin : origin)
  headers.set("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS")
  headers.set("access-control-allow-headers", "authorization,content-type")
  headers.set("access-control-max-age", "86400")
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-")
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function normalizeProduct(record: ProductRecord) {
  const images = parseJson<string[]>(record.images_json, [])
  const colors = parseJson<string[]>(record.colors_json, [])
  const sizes = parseJson<string[]>(record.sizes_json, [])
  const stockMatrix = parseJson<Record<string, number>>(record.stock_matrix_json || "{}", {})
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    price: Number(record.price),
    description: record.description,
    image_url: record.image_url,
    images: images.length > 0 ? images : (record.image_url ? [record.image_url] : []),
    video_url: record.video_url || "",
    sizes,
    colors,
    category: record.category || "",
    subcategory: record.subcategory || "",
    is_featured: Boolean(record.is_featured),
    in_stock: Boolean(record.in_stock),
    stock_matrix: stockMatrix,
    stock_quantity: record.stock_quantity ?? null,
    low_stock_alert: record.low_stock_alert ?? 5,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

function normalizeOrder(record: OrderRecord) {
  return {
    id: record.id,
    customer_name: record.customer_name,
    name: record.customer_name,
    phone: record.phone,
    address: record.address,
    items: parseJson(record.items, [] as unknown[]),
    status: record.status,
    product_id: record.product_id || "",
    product_name: record.product_name || "",
    size: record.size || "",
    color: record.color || "",
    quantity: Number(record.quantity || 1),
    total_price: Number(record.total_price || 0),
    notes: record.notes || "",
    tracking_url: record.tracking_url || "",
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

function normalizeReview(record: ReviewRecord) {
  return {
    ...record,
    featured: Boolean(record.featured),
    rating: Number(record.rating),
  }
}

async function signAdminToken(admin: { id: string; email: string }, env: Env) {
  return new SignJWT({ role: "admin", email: admin.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(textEncoder.encode(env.JWT_SECRET))
}

async function verifyAdminToken(request: Request, env: Env) {
  const header = request.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null
  const token = header.slice(7)
  try {
    const { payload } = await jwtVerify(token, textEncoder.encode(env.JWT_SECRET))
    if (payload.role !== "admin") return null
    return payload
  } catch {
    return null
  }
}

async function requireAdmin(request: Request, env: Env) {
  const payload = await verifyAdminToken(request, env)
  if (!payload) {
    return { error: applyCors(request, json({ error: "Unauthorized" }, { status: 401 }), env.CORS_ORIGIN || "*") }
  }
  return { payload }
}

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

async function getSoldQuantities(env: Env, productId: string) {
  const placeholders = countedStockStatuses.map(() => "?").join(",")
  const stmt = env.DB.prepare(
    `SELECT size, color, quantity FROM orders WHERE product_id = ? AND status IN (${placeholders})`
  )
  const result = await stmt.bind(productId, ...countedStockStatuses).all<OrderRecord>()
  return result.results || []
}

async function getProductBySlug(env: Env, slug: string) {
  const row = await env.DB.prepare("SELECT * FROM products WHERE slug = ? LIMIT 1").bind(slug).first<ProductRecord>()
  if (!row) return null
  const product = normalizeProduct(row)
  const sold = await getSoldQuantities(env, product.id)
  if (product.stock_matrix && Object.keys(product.stock_matrix).length > 0) {
    const nextMatrix = { ...product.stock_matrix }
    for (const order of sold) {
      if (!order.size || !order.color) continue
      const key = `${order.size.trim()}_${order.color.trim()}`
      const matchedKey = Object.keys(nextMatrix).find((entry) => entry.toLowerCase() === key.toLowerCase()) || key
      if (matchedKey in nextMatrix) {
        nextMatrix[matchedKey] = Math.max(0, Number(nextMatrix[matchedKey] || 0) - Number(order.quantity || 1))
      }
    }
    product.stock_matrix = nextMatrix
  }
  return product
}

async function listProducts(request: Request, env: Env) {
  const url = new URL(request.url)
  const featured = url.searchParams.get("featured")
  const limit = Number(url.searchParams.get("limit") || "0")
  let query = "SELECT * FROM products"
  const binds: Array<string | number> = []
  if (featured === "true") {
    query += " WHERE is_featured = 1"
  }
  query += " ORDER BY created_at DESC"
  if (limit > 0) {
    query += " LIMIT ?"
    binds.push(limit)
  }
  const rows = await env.DB.prepare(query).bind(...binds).all<ProductRecord>()
  return applyCors(request, json({ products: (rows.results || []).map(normalizeProduct) }), env.CORS_ORIGIN || "*")
}

async function createProduct(request: Request, env: Env) {
  const auth = await requireAdmin(request, env)
  if (auth.error) return auth.error

  const body = await readJson<Record<string, unknown>>(request)
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const slug = typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(String(body.name || id))
  const images = Array.isArray(body.images) ? body.images.filter((entry): entry is string => typeof entry === "string" && entry.length > 0) : []
  const imageUrl = typeof body.image_url === "string" && body.image_url ? body.image_url : images[0] || ""
  await env.DB.prepare(
    `INSERT INTO products (
      id, slug, name, price, description, image_url, images_json, video_url, sizes_json, colors_json,
      category, subcategory, is_featured, in_stock, stock_matrix_json, stock_quantity, low_stock_alert, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    slug,
    String(body.name || ""),
    Number(body.price || 0),
    String(body.description || ""),
    imageUrl,
    JSON.stringify(images),
    String(body.video_url || ""),
    JSON.stringify(Array.isArray(body.sizes) ? body.sizes : []),
    JSON.stringify(Array.isArray(body.colors) ? body.colors : []),
    String(body.category || ""),
    String(body.subcategory || ""),
    body.is_featured ? 1 : 0,
    body.in_stock === false ? 0 : 1,
    JSON.stringify(body.stock_matrix || {}),
    body.stock_quantity === undefined || body.stock_quantity === null || body.stock_quantity === "" ? null : Number(body.stock_quantity),
    Number(body.low_stock_alert || 5),
    now,
    now
  ).run()

  const created = await env.DB.prepare("SELECT * FROM products WHERE id = ? LIMIT 1").bind(id).first<ProductRecord>()
  return applyCors(request, json({ product: created ? normalizeProduct(created) : null }, { status: 201 }), env.CORS_ORIGIN || "*")
}

async function updateProduct(request: Request, env: Env, id: string) {
  const auth = await requireAdmin(request, env)
  if (auth.error) return auth.error

  const body = await readJson<Record<string, unknown>>(request)
  const existing = await env.DB.prepare("SELECT * FROM products WHERE id = ? LIMIT 1").bind(id).first<ProductRecord>()
  if (!existing) {
    return applyCors(request, json({ error: "Product not found" }, { status: 404 }), env.CORS_ORIGIN || "*")
  }

  const now = new Date().toISOString()
  const current = normalizeProduct(existing)
  const nextImages = Array.isArray(body.images) ? body.images.filter((entry): entry is string => typeof entry === "string" && entry.length > 0) : current.images
  const imageUrl = typeof body.image_url === "string" && body.image_url ? body.image_url : nextImages[0] || current.image_url

  await env.DB.prepare(
    `UPDATE products
      SET slug = ?, name = ?, price = ?, description = ?, image_url = ?, images_json = ?, video_url = ?,
          sizes_json = ?, colors_json = ?, category = ?, subcategory = ?, is_featured = ?, in_stock = ?,
          stock_matrix_json = ?, stock_quantity = ?, low_stock_alert = ?, updated_at = ?
      WHERE id = ?`
  ).bind(
    typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : current.slug,
    String(body.name ?? current.name),
    Number(body.price ?? current.price),
    String(body.description ?? current.description),
    imageUrl,
    JSON.stringify(nextImages),
    String(body.video_url ?? current.video_url ?? ""),
    JSON.stringify(Array.isArray(body.sizes) ? body.sizes : current.sizes),
    JSON.stringify(Array.isArray(body.colors) ? body.colors : current.colors),
    String(body.category ?? current.category),
    String(body.subcategory ?? current.subcategory),
    body.is_featured === undefined ? (current.is_featured ? 1 : 0) : (body.is_featured ? 1 : 0),
    body.in_stock === undefined ? (current.in_stock ? 1 : 0) : (body.in_stock ? 1 : 0),
    JSON.stringify(body.stock_matrix ?? current.stock_matrix ?? {}),
    body.stock_quantity === undefined ? current.stock_quantity : (body.stock_quantity === null || body.stock_quantity === "" ? null : Number(body.stock_quantity)),
    Number(body.low_stock_alert ?? current.low_stock_alert ?? 5),
    now,
    id
  ).run()

  const updated = await env.DB.prepare("SELECT * FROM products WHERE id = ? LIMIT 1").bind(id).first<ProductRecord>()
  return applyCors(request, json({ product: updated ? normalizeProduct(updated) : null }), env.CORS_ORIGIN || "*")
}

async function deleteProduct(request: Request, env: Env, id: string) {
  const auth = await requireAdmin(request, env)
  if (auth.error) return auth.error
  await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run()
  return applyCors(request, json({ ok: true }), env.CORS_ORIGIN || "*")
}

async function createOrder(request: Request, env: Env) {
  const body = await readJson<Record<string, unknown>>(request)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const items = Array.isArray(body.items)
    ? body.items
    : [{
        product_id: body.product_id || "",
        product_name: body.product_name || "",
        size: body.size || "",
        color: body.color || "",
        quantity: Number(body.quantity || 1),
        price: Number(body.total_price || 0),
      }]
  const firstItem = (items[0] as Record<string, unknown>) || {}

  await env.DB.prepare(
    `INSERT INTO orders (
      id, customer_name, phone, address, items, status, product_id, product_name, size, color,
      quantity, total_price, notes, tracking_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    String(body.customer_name || body.name || ""),
    String(body.phone || ""),
    String(body.address || ""),
    JSON.stringify(items),
    String(body.status || "pending"),
    String(body.product_id || firstItem.product_id || ""),
    String(body.product_name || firstItem.product_name || ""),
    String(body.size || firstItem.size || ""),
    String(body.color || firstItem.color || ""),
    Number(body.quantity || firstItem.quantity || 1),
    Number(body.total_price || firstItem.price || 0),
    String(body.notes || ""),
    "",
    now,
    now
  ).run()

  const created = await env.DB.prepare("SELECT * FROM orders WHERE id = ? LIMIT 1").bind(id).first<OrderRecord>()
  return applyCors(request, json({ order: created ? normalizeOrder(created) : null }, { status: 201 }), env.CORS_ORIGIN || "*")
}

async function listOrders(request: Request, env: Env) {
  const auth = await requireAdmin(request, env)
  if (auth.error) return auth.error
  const rows = await env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC").all<OrderRecord>()
  return applyCors(request, json({ orders: (rows.results || []).map(normalizeOrder) }), env.CORS_ORIGIN || "*")
}

async function updateOrder(request: Request, env: Env, id: string) {
  const auth = await requireAdmin(request, env)
  if (auth.error) return auth.error
  const body = await readJson<Record<string, unknown>>(request)
  const existing = await env.DB.prepare("SELECT * FROM orders WHERE id = ? LIMIT 1").bind(id).first<OrderRecord>()
  if (!existing) {
    return applyCors(request, json({ error: "Order not found" }, { status: 404 }), env.CORS_ORIGIN || "*")
  }
  const current = normalizeOrder(existing)
  const now = new Date().toISOString()
  await env.DB.prepare(
    `UPDATE orders
      SET customer_name = ?, phone = ?, address = ?, status = ?, notes = ?, tracking_url = ?, total_price = ?, updated_at = ?
      WHERE id = ?`
  ).bind(
    String(body.customer_name ?? body.name ?? current.customer_name),
    String(body.phone ?? current.phone),
    String(body.address ?? current.address),
    String(body.status ?? current.status),
    String(body.notes ?? current.notes),
    String(body.tracking_url ?? current.tracking_url),
    Number(body.total_price ?? current.total_price),
    now,
    id
  ).run()
  const updated = await env.DB.prepare("SELECT * FROM orders WHERE id = ? LIMIT 1").bind(id).first<OrderRecord>()
  return applyCors(request, json({ order: updated ? normalizeOrder(updated) : null }), env.CORS_ORIGIN || "*")
}

async function deleteOrder(request: Request, env: Env, id: string) {
  const auth = await requireAdmin(request, env)
  if (auth.error) return auth.error
  await env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(id).run()
  return applyCors(request, json({ ok: true }), env.CORS_ORIGIN || "*")
}

async function login(request: Request, env: Env) {
  const body = await readJson<{ email?: string; password?: string }>(request)
  const email = (body.email || "").trim().toLowerCase()
  const password = body.password || ""
  const admin = await env.DB.prepare("SELECT id, email, password_hash FROM admins WHERE email = ? LIMIT 1").bind(email).first<{ id: string; email: string; password_hash: string }>()
  if (!admin) {
    return applyCors(request, json({ error: "Invalid email or password" }, { status: 401 }), env.CORS_ORIGIN || "*")
  }

  const valid = await compare(password, admin.password_hash)
  if (!valid) {
    return applyCors(request, json({ error: "Invalid email or password" }, { status: 401 }), env.CORS_ORIGIN || "*")
  }

  const token = await signAdminToken(admin, env)
  return applyCors(request, json({ token, admin: { id: admin.id, email: admin.email } }), env.CORS_ORIGIN || "*")
}

async function uploadImage(request: Request, env: Env) {
  const auth = await requireAdmin(request, env)
  if (auth.error) return auth.error

  const formData = await request.formData()
  const file = formData.get("file")
  const folder = String(formData.get("folder") || "uploads")
  if (!(file instanceof File)) {
    return applyCors(request, json({ error: "File is required" }, { status: 400 }), env.CORS_ORIGIN || "*")
  }

  const key = `${folder}/${Date.now()}-${sanitizeFilename(file.name)}`
  await env.ASSETS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  })

  return applyCors(request, json({
    key,
    url: `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`,
  }), env.CORS_ORIGIN || "*")
}

async function getSettings(request: Request, env: Env) {
  const url = new URL(request.url)
  const keys = url.searchParams.get("keys")
  let rows
  if (keys) {
    const list = keys.split(",").map((entry) => entry.trim()).filter(Boolean)
    const placeholders = list.map(() => "?").join(",")
    rows = await env.DB.prepare(`SELECT key, value FROM settings WHERE key IN (${placeholders})`).bind(...list).all<{ key: string; value: string }>()
  } else {
    rows = await env.DB.prepare("SELECT key, value FROM settings").all<{ key: string; value: string }>()
  }
  const map: Record<string, string> = {}
  for (const row of rows.results || []) map[row.key] = row.value
  return applyCors(request, json({ settings: map }), env.CORS_ORIGIN || "*")
}

async function getReviews(request: Request, env: Env) {
  const url = new URL(request.url)
  const status = url.searchParams.get("status")
  const productId = url.searchParams.get("product_id")
  const limit = Number(url.searchParams.get("limit") || "0")
  const clauses: string[] = []
  const binds: Array<string | number> = []
  if (status) {
    clauses.push("status = ?")
    binds.push(status)
  }
  if (productId) {
    clauses.push("product_id = ?")
    binds.push(productId)
  }
  let query = "SELECT * FROM reviews"
  if (clauses.length > 0) query += ` WHERE ${clauses.join(" AND ")}`
  query += " ORDER BY featured DESC, created_at DESC"
  if (limit > 0) {
    query += " LIMIT ?"
    binds.push(limit)
  }
  const rows = await env.DB.prepare(query).bind(...binds).all<ReviewRecord>()
  return applyCors(request, json({ reviews: (rows.results || []).map(normalizeReview) }), env.CORS_ORIGIN || "*")
}

async function createReview(request: Request, env: Env) {
  const body = await readJson<Record<string, unknown>>(request)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO reviews (
      id, product_id, product_name, customer_name, customer_location, rating, review_text, photo_url, status, featured, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    String(body.product_id || ""),
    String(body.product_name || ""),
    String(body.customer_name || ""),
    String(body.customer_location || ""),
    Number(body.rating || 5),
    String(body.review_text || ""),
    String(body.photo_url || ""),
    "pending",
    0,
    now
  ).run()
  return applyCors(request, json({ ok: true, id }, { status: 201 }), env.CORS_ORIGIN || "*")
}

async function getStats(request: Request, env: Env) {
  const [productCount, orderCount, reviewRows] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as count FROM products").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) as count FROM orders").first<{ count: number }>(),
    env.DB.prepare("SELECT rating FROM reviews WHERE status = 'approved'").all<{ rating: number }>(),
  ])
  const ratings = reviewRows.results || []
  const avgRating = ratings.length > 0 ? ratings.reduce((sum, row) => sum + Number(row.rating || 0), 0) / ratings.length : 5
  return applyCors(request, json({
    productCount: Number(productCount?.count || 0),
    orderCount: Number(orderCount?.count || 0),
    reviewCount: ratings.length,
    avgRating,
  }), env.CORS_ORIGIN || "*")
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.CORS_ORIGIN || "*"
    if (request.method === "OPTIONS") {
      return applyCors(request, new Response(null, { status: 204 }), origin)
    }

    const url = new URL(request.url)
    const { pathname } = url

    try {
      if (request.method === "POST" && pathname === "/api/login") return await login(request, env)
      if (request.method === "GET" && pathname === "/api/products") return await listProducts(request, env)
      if (request.method === "POST" && pathname === "/api/products") return await createProduct(request, env)
      if (request.method === "GET" && pathname.startsWith("/api/products/")) {
        const slug = decodeURIComponent(pathname.replace("/api/products/", ""))
        const product = await getProductBySlug(env, slug)
        return applyCors(request, product ? json({ product }) : json({ error: "Product not found" }, { status: 404 }), origin)
      }
      if (request.method === "PATCH" && pathname.startsWith("/api/products/")) {
        const id = decodeURIComponent(pathname.replace("/api/products/", ""))
        return await updateProduct(request, env, id)
      }
      if (request.method === "DELETE" && pathname.startsWith("/api/products/")) {
        const id = decodeURIComponent(pathname.replace("/api/products/", ""))
        return await deleteProduct(request, env, id)
      }
      if (request.method === "POST" && pathname === "/api/orders") return await createOrder(request, env)
      if (request.method === "GET" && pathname === "/api/orders") return await listOrders(request, env)
      if (request.method === "PATCH" && pathname.startsWith("/api/orders/")) {
        const id = decodeURIComponent(pathname.replace("/api/orders/", ""))
        return await updateOrder(request, env, id)
      }
      if (request.method === "DELETE" && pathname.startsWith("/api/orders/")) {
        const id = decodeURIComponent(pathname.replace("/api/orders/", ""))
        return await deleteOrder(request, env, id)
      }
      if (request.method === "POST" && pathname === "/api/upload") return await uploadImage(request, env)
      if (request.method === "GET" && pathname === "/api/settings") return await getSettings(request, env)
      if (request.method === "GET" && pathname === "/api/reviews") return await getReviews(request, env)
      if (request.method === "POST" && pathname === "/api/reviews") return await createReview(request, env)
      if (request.method === "GET" && pathname === "/api/stats") return await getStats(request, env)

      return applyCors(request, json({ error: "Not found" }, { status: 404 }), origin)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error"
      return applyCors(request, json({ error: message }, { status: 500 }), origin)
    }
  },
}
