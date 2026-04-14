"use client"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import ChatBot from "@/components/ui/ChatBot"
import { CartProvider, CartDrawer } from "@/components/ui/Cart"
import { FacebookPixelPageView } from "@/components/ui/FacebookPixel"
import AnnouncementBanner from "@/components/ui/AnnouncementBanner"

export default function CustomerOnlyWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")
  const isFlexAI = pathname === "/flex-ai"

  if (isAdmin) return <main>{children}</main>
  
  if (isFlexAI) return (
    <CartProvider>
      <Suspense fallback={null}><FacebookPixelPageView /></Suspense>
      {children}
      <CartDrawer />
    </CartProvider>
  )

  return (
    <CartProvider>
      <Suspense fallback={null}>
        <FacebookPixelPageView />
      </Suspense>
      <AnnouncementBanner />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <ChatBot />
      <CartDrawer />
    </CartProvider>
  )
}
