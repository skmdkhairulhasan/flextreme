import type { Metadata, Viewport } from "next"
import Script from "next/script"
import "./globals.css"
import DumbbellCursorWrapper from "@/components/ui/DumbbellCursorWrapper"
import PageTransition from "@/components/ui/PageTransition"
import CustomerOnlyWrapper from "@/components/ui/CustomerOnlyWrapper"
import { createClient } from "@/lib/supabase/server"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
}

export const metadata: Metadata = {
  title: {
    default: "Flextreme — Work Hard. Flex Extreme.",
    template: "%s | Flextreme",
  },
  description: "Premium gym wear for serious athletes in Bangladesh. Compression fit, sweat-wicking, 4-way stretch. Cash on Delivery nationwide. Work Hard. Flex Extreme.",
  keywords: ["gym wear", "workout clothes", "compression", "athletic wear", "Bangladesh", "Flextreme", "gym clothes BD", "sports wear"],
  openGraph: {
    title: "Flextreme — Work Hard. Flex Extreme.",
    description: "Premium gym wear for serious athletes in Bangladesh. Cash on Delivery nationwide.",
    type: "website",
    locale: "en_BD",
    siteName: "Flextreme",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flextreme — Work Hard. Flex Extreme.",
    description: "Premium gym wear for serious athletes in Bangladesh.",
  },
  other: {
    "format-detection": "telephone=no",
  },
}

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || ""

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.from("settings").select("value").eq("key", "color_theme").single()
  const theme = data?.value ? JSON.parse(data.value) : {
    primary: "#000000", accent: "#ffffff", bg: "#ffffff",
    text: "#000000", btnBg: "#000000", btnText: "#ffffff"
  }

  const cssVars = [
    "--theme-primary:" + theme.primary,
    "--theme-accent:" + theme.accent,
    "--theme-bg:" + theme.bg,
    "--theme-text:" + theme.text,
    "--theme-btn-bg:" + theme.btnBg,
    "--theme-btn-text:" + theme.btnText,
  ].join(";")

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <style>{`:root{${cssVars}}`}</style>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />

        {/* Facebook Pixel — base code */}
        {FB_PIXEL_ID && (
          <Script
            id="fb-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
        {FB_PIXEL_ID && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
      </head>
      <body suppressHydrationWarning={true} style={{ backgroundColor: theme.bg, color: theme.text }}>
        <DumbbellCursorWrapper />
        <CustomerOnlyWrapper>
          <PageTransition>
            {children}
          </PageTransition>
        </CustomerOnlyWrapper>
      </body>
    </html>
  )
}
