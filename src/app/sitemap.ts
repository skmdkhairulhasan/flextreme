export default async function sitemap() {
  let products: { slug: string; updated_at?: string }[] = []
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://flextremefit.com"
    const res = await fetch(`${base}/api/products`, { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      products = data.products || []
    }
  } catch {}

  const base = "https://flextremefit.com"

  const staticPages = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${base}/products`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${base}/reviews`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/size-guide`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/delivery`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${base}/flex-ai`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
  ]

  const productPages = products.map(p => ({
    url: `${base}/products/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [...staticPages, ...productPages]
}
