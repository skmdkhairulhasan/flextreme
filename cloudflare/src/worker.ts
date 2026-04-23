// TEMP TYPE FIX
type D1Database = any
type R2Bucket = any

import { compare } from "bcryptjs"
import { SignJWT } from "jose"

export interface Env {
  DB: D1Database
  ASSETS: R2Bucket
  JWT_SECRET: string
  R2_PUBLIC_BASE_URL: string
  CORS_ORIGIN: string
}

const textEncoder = new TextEncoder()

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set("content-type", "application/json")
  return new Response(JSON.stringify(data), { ...init, headers })
}

function applyCors(request: Request, response: Response, origin: string) {
  const headers = new Headers(response.headers)
  const requestOrigin = request.headers.get("origin")

  headers.set(
    "access-control-allow-origin",
    requestOrigin && (origin === "*" || requestOrigin === origin)
      ? requestOrigin
      : origin
  )

  headers.set("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS")
  headers.set("access-control-allow-headers", "authorization,content-type")

  return new Response(response.body, {
    status: response.status,
    headers,
  })
}

function getAvgRating(rows: any[]) {
  return rows.length > 0
    ? rows.reduce((sum: number, row: any) => sum + Number(row.rating || 0), 0) / rows.length
    : 5
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
      // LOGIN
      if (request.method === "POST" && pathname === "/api/login") {
        const body = await request.json() as any

        const email = (body.email || "").trim().toLowerCase()
        const password = body.password || ""

        const admin = await env.DB.prepare(
          "SELECT id, email, password_hash FROM admins WHERE email = ? LIMIT 1"
        )
          .bind(email)
          .first()

        if (!admin) {
          return applyCors(
            request,
            json({ error: "Invalid email or password" }, { status: 401 }),
            origin
          )
        }

        const valid = await compare(password, admin.password_hash)

        if (!valid) {
          return applyCors(
            request,
            json({ error: "Invalid email or password" }, { status: 401 }),
            origin
          )
        }

        const token = await new SignJWT({ role: "admin", email: admin.email })
          .setProtectedHeader({ alg: "HS256" })
          .setSubject(admin.id)
          .setIssuedAt()
          .setExpirationTime("7d")
          .sign(textEncoder.encode(env.JWT_SECRET))

        return applyCors(
          request,
          json({ token, admin: { id: admin.id, email: admin.email } }),
          origin
        )
      }

      // PRODUCTS LIST
      if (request.method === "GET" && pathname === "/api/products") {
        const result = await env.DB.prepare(
          "SELECT * FROM products ORDER BY created_at DESC"
        ).all()

        return applyCors(
          request,
          json({ products: result?.results || [] }),
          origin
        )
      }

      // SINGLE PRODUCT
      if (request.method === "GET" && pathname.startsWith("/api/products/")) {
        const slug = pathname.replace("/api/products/", "")

        const product = await env.DB.prepare(
          "SELECT * FROM products WHERE slug = ? LIMIT 1"
        )
          .bind(slug)
          .first()

        return applyCors(
          request,
          product
            ? json({ product })
            : json({ error: "Not found" }, { status: 404 }),
          origin
        )
      }

      // STATS
      if (request.method === "GET" && pathname === "/api/stats") {
        const result = await env.DB.prepare(
          "SELECT rating FROM reviews WHERE status = 'approved'"
        ).all()

        const avgRating = getAvgRating(result?.results || [])

        return applyCors(request, json({ avgRating }), origin)
      }

      return applyCors(
        request,
        json({ error: "Not found" }, { status: 404 }),
        origin
      )
    } catch (error) {
      return applyCors(
        request,
        json({ error: "Internal error" }, { status: 500 }),
        origin
      )
    }
  },
}