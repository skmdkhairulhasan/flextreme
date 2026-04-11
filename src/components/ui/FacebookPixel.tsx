"use client"
import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: any
  }
}

// Track page views on route change
export function FacebookPixelPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView")
    }
  }, [pathname, searchParams])

  return null
}

// Helper functions to fire pixel events from anywhere
export const fbEvent = {
  viewContent: (params: { content_name: string; content_ids: string[]; value: number; currency?: string }) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: params.content_name,
        content_ids: params.content_ids,
        content_type: "product",
        value: params.value,
        currency: params.currency || "BDT",
      })
    }
  },

  addToCart: (params: { content_name: string; content_ids: string[]; value: number; currency?: string }) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "AddToCart", {
        content_name: params.content_name,
        content_ids: params.content_ids,
        content_type: "product",
        value: params.value,
        currency: params.currency || "BDT",
      })
    }
  },

  initiateCheckout: (params: { value: number; num_items: number; currency?: string }) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        value: params.value,
        num_items: params.num_items,
        currency: params.currency || "BDT",
      })
    }
  },

  purchase: (params: { value: number; currency?: string; order_id?: string; content_ids?: string[] }) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "Purchase", {
        value: params.value,
        currency: params.currency || "BDT",
        order_id: params.order_id,
        content_ids: params.content_ids || [],
        content_type: "product",
      })
    }
  },

  search: (query: string) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "Search", { search_string: query })
    }
  },

  lead: () => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "Lead")
    }
  },

  contact: () => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "Contact")
    }
  },
}
