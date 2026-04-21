import type { Metadata } from "next"
import "./globals.css"
import CustomerOnlyWrapper from "@/components/ui/CustomerOnlyWrapper"
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: "Flextreme — Premium Gym Wear",
  description: "Premium quality gym wear and fitness apparel. Shop now for the best workout clothes.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <CustomerOnlyWrapper>
          {children}
        </CustomerOnlyWrapper>
        <Analytics />
      </body>
    </html>
  )
}
