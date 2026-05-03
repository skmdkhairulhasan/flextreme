// Cloudflare D1 adapter using OpenNext's official getCloudflareContext()
// https://opennext.js.org/cloudflare/bindings

import { getCloudflareContext } from "@opennextjs/cloudflare"

async function getDB(): Promise<any> {
  const ctx = await getCloudflareContext({ async: true })
  const db = (ctx.env as any).DB
  if (!db) throw new Error("D1 binding 'DB' not found in Cloudflare env")
  return db
}

async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<any[]> {
  const db = await getDB()

  let query = ""
  for (let i = 0; i < strings.length; i++) {
    query += strings[i]
    if (i < values.length) query += "?"
  }

  const params = values.map((v) => {
    if (v === undefined || v === null) return null
    if (typeof v === "boolean") return v ? 1 : 0
    if (Array.isArray(v)) return JSON.stringify(v)
    return v
  })

  query = query.trim()

  const isWrite = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE)\s/i.test(query)
  const stmt = db.prepare(query).bind(...params)

  if (isWrite) {
    const result = await stmt.run()
    return (result.results ?? []) as any[]
  }

  const result = await stmt.all()
  return (result.results ?? []) as any[]
}

export default sql
