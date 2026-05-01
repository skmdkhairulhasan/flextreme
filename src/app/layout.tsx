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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Exo+2:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning={true}>
        <CustomerOnlyWrapper>
          {children}
        </CustomerOnlyWrapper>
        <Analytics />
      </body>
    </html>
  )
}
