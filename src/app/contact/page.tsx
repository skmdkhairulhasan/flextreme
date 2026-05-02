import { apiFetchServer } from "@/lib/api/server"
import ContactForm from "@/components/ui/ContactForm"
import ContactSocialBubbles from "./ContactSocialBubbles"

export const dynamic = "force-dynamic"
export const metadata = { title: "Contact Us | Flextreme" }

function addHttps(url: string) {
  if (!url || !url.trim()) return ""
  const t = url.trim()
  return t.startsWith("http") ? t : "https://" + t
}

export default async function ContactPage() {
  const s: Record<string, string> = {}
  try {
    const res = await apiFetchServer<{ settings: any[] }>("/api/settings")
    res.settings?.forEach((r: any) => { s[r.key] = r.value })
  } catch {}

  const email    = s.store_email || ""
  const phone    = s.store_phone || ""
  const whatsapp = s.whatsapp_number || "8801935962421"
  const address  = s.store_address || ""

  const socials = [
    { name: "Instagram", url: addHttps(s.instagram_url || ""), color: "#E4405F" },
    { name: "Facebook",  url: addHttps(s.facebook_url  || ""), color: "#1877F2" },
    { name: "TikTok",    url: addHttps(s.tiktok_url    || ""), color: "#010101" },
    { name: "YouTube",   url: addHttps(s.youtube_url   || ""), color: "#FF0000" },
    { name: "Twitter",   url: addHttps(s.twitter_url   || ""), color: "#1DA1F2" },
  ].filter(s => s.url !== "")

  const defaultHours = [
    { day: "Saturday – Thursday", hours: "9:00 AM – 9:00 PM" },
    { day: "Friday",              hours: "2:00 PM – 9:00 PM" },
  ]
  let businessHours = defaultHours
  if (s.business_hours) {
    try { businessHours = JSON.parse(s.business_hours) } catch {}
  }

  return (
    <div style={{ paddingTop: "72px", backgroundColor: "var(--theme-bg, white)", flex: 1 }}>

      {/* Header */}
      <div style={{ backgroundColor: "var(--theme-primary, black)", color: "white", padding: "5rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>Get In Touch</p>
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", margin: 0 }}>Contact Us</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "1rem", fontSize: "0.95rem" }}>We'd love to hear from you. Send us a message or reach out directly.</p>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "4rem 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", alignItems: "start" }}>

          {/* Left: Contact Info */}
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "2px solid black" }}>Reach Us Directly</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* WhatsApp */}
              <a href={"https://wa.me/" + whatsapp} target="_blank" rel="noreferrer"
                style={{ display: "flex", gap: "1rem", alignItems: "center", textDecoration: "none", color: "inherit", padding: "1rem 1.25rem", border: "1px solid #e0e0e0" }}>
                <div style={{ width: "44px", height: "44px", backgroundColor: "#25D366", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.1rem" }}>WhatsApp</p>
                  <p style={{ fontSize: "0.82rem", color: "#555" }}>+{whatsapp}</p>
                  <p style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600 }}>Available 9am – 9pm daily</p>
                </div>
              </a>

              {/* Email */}
              {email && (
                <a href={"mailto:" + email}
                  style={{ display: "flex", gap: "1rem", alignItems: "center", textDecoration: "none", color: "inherit", padding: "1rem 1.25rem", border: "1px solid #e0e0e0" }}>
                  <div style={{ width: "44px", height: "44px", backgroundColor: "var(--theme-primary, black)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.1rem" }}>Email</p>
                    <p style={{ fontSize: "0.82rem", color: "#555" }}>{email}</p>
                    <p style={{ fontSize: "0.72rem", color: "#999" }}>We reply within 24 hours</p>
                  </div>
                </a>
              )}

              {/* Phone */}
              {phone && (
                <a href={"tel:" + phone}
                  style={{ display: "flex", gap: "1rem", alignItems: "center", textDecoration: "none", color: "inherit", padding: "1rem 1.25rem", border: "1px solid #e0e0e0" }}>
                  <div style={{ width: "44px", height: "44px", backgroundColor: "var(--theme-primary, black)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.06 2.18 2 2 0 012.03 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.1rem" }}>Phone</p>
                    <p style={{ fontSize: "0.82rem", color: "#555" }}>{phone}</p>
                  </div>
                </a>
              )}

              {/* Address */}
              {address && (
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", padding: "1rem 1.25rem", border: "1px solid #e0e0e0" }}>
                  <div style={{ width: "44px", height: "44px", backgroundColor: "var(--theme-primary, black)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.1rem" }}>Address</p>
                    <p style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.6 }}>{address}</p>
                  </div>
                </div>
              )}

              {/* Business Hours */}
              <div style={{ padding: "1.25rem", backgroundColor: "#f9f9f9", border: "1px solid #e0e0e0" }}>
                <p style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Business Hours</p>
                {businessHours.map((h: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", padding: "0.3rem 0", borderBottom: i < businessHours.length - 1 ? "1px solid #e0e0e0" : "none" }}>
                    <span style={{ color: "#555" }}>{h.day}</span>
                    <span style={{ fontWeight: 600 }}>{h.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <ContactForm recipientEmail={email} whatsapp={whatsapp} />
        </div>
      </div>

      {/* Social Bubbles — only on this page */}
      {socials.length > 0 && <ContactSocialBubbles socials={socials} />}
    </div>
  )
}
