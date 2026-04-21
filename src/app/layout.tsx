import type { Metadata } from "next"
import "./globals.css"
import CustomerOnlyWrapper from "@/components/ui/CustomerOnlyWrapper"

export const metadata: Metadata = {
  title: "Baking Duck — Quackingly Good Achaar",
  description: "Premium homemade Chicken & Garlic Achaar. Small batch, no preservatives, authentic recipe. Delivering across Bangladesh.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <CustomerOnlyWrapper>
          {children}
        </CustomerOnlyWrapper>
      </body>
    </html>
  )
}
