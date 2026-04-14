import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Delivery Info | Flextreme" }

type DeliveryZone = { id: string; name: string; charge: string; days: string }
type DeliveryGroup = { id: string; name: string; zones: DeliveryZone[] }
type FaqItem = { id: string; question: string; answer: string }

export default async function DeliveryPage() {
  const supabase = await createClient()
  const { data } = await supabase.from("settings").select("*")
  const map: Record<string, string> = {}
  data?.forEach((s: any) => { map[s.key] = s.value })

  const isFreeDelivery = map.free_delivery === "true"

  let groups: DeliveryGroup[] = []
  if (map.delivery_groups) {
    groups = JSON.parse(map.delivery_groups)
  } else {
    groups = [
      { id: "dhaka", name: "Dhaka Division", zones: [
        { id: "1", name: "Dhaka City", charge: map.delivery_dhaka_city || "60", days: "1-2" },
        { id: "2", name: "Dhaka District", charge: map.delivery_dhaka_district || "100", days: "2-3" },
        { id: "3", name: "Narayanganj", charge: map.delivery_narayanganj || "100", days: "2-3" },
        { id: "4", name: "Gazipur", charge: map.delivery_gazipur || "100", days: "2-3" },
        { id: "5", name: "Mymensingh", charge: map.delivery_mymensingh || "100", days: "2-3" },
      ]},
      { id: "ctg", name: "Chittagong Division", zones: [
        { id: "6", name: "Chittagong", charge: map.delivery_chittagong || "120", days: "3-4" },
        { id: "7", name: "Comilla", charge: map.delivery_comilla || "120", days: "2-3" },
      ]},
      { id: "others", name: "Other Divisions", zones: [
        { id: "8", name: "Sylhet", charge: map.delivery_sylhet || "120", days: "3-4" },
        { id: "9", name: "Rajshahi", charge: map.delivery_rajshahi || "120", days: "3-4" },
        { id: "10", name: "Khulna", charge: map.delivery_khulna || "120", days: "3-4" },
        { id: "11", name: "Other Districts", charge: map.delivery_other || "130", days: "3-5" },
      ]},
    ]
  }

  const faqs: FaqItem[] = map.faqs ? JSON.parse(map.faqs) : [
    { id: "1", question: "How do I place an order?", answer: "Visit our Products page, choose your item, select size and color, fill in your details and click Order Now. We confirm via WhatsApp." },
    { id: "2", question: "What payment methods do you accept?", answer: "Cash on Delivery (COD) only. Pay when your order arrives — no advance payment needed." },
    { id: "3", question: "How long does delivery take?", answer: "Dhaka City: 1-2 days. Other cities: 3-5 days depending on location." },
    { id: "4", question: "Can I return or exchange my order?", answer: "Yes! Contact us on WhatsApp within 48 hours of receiving your order and we will arrange an exchange or refund." },
  ]

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--theme-bg, white)", paddingTop: "72px" }}>

      {/* Header */}
      <div style={{ backgroundColor: "var(--theme-primary, black)", color: "var(--theme-btn-text, white)", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>Bangladesh Wide</p>
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", margin: 0 }}>Delivery Info</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "1rem", fontSize: "0.95rem" }}>
          {isFreeDelivery ? "Free Delivery · Cash on Delivery · Nationwide" : "Cash on Delivery · Nationwide Coverage"}
        </p>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "4rem 1.5rem" }}>

        {/* Banner */}
        {isFreeDelivery ? (
          <div style={{ backgroundColor: "#f0fdf4", border: "2px solid #86efac", padding: "2.5rem 2rem", marginBottom: "2.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚚</div>
            <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 900, color: "#15803d", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "-0.02em" }}>Free Delivery Nationwide</h2>
            <p style={{ fontSize: "1rem", color: "#166534", lineHeight: 1.7, maxWidth: "500px", margin: "0 auto 0.75rem" }}>We offer <strong>FREE delivery</strong> across all of Bangladesh — no minimum order, no hidden charges, no surprises.</p>
            <p style={{ fontSize: "0.9rem", color: "#16a34a", fontWeight: 700 }}>✓ Cash on Delivery &nbsp;·&nbsp; ✓ Pay when it arrives &nbsp;·&nbsp; ✓ Zero advance payment</p>
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1.25rem 1.5rem", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "40px", height: "40px", backgroundColor: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "white", fontSize: "1.1rem" }}>✓</span>
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: "0.9rem", color: "#15803d", marginBottom: "0.2rem" }}>Cash on Delivery Available Nationwide</p>
                <p style={{ fontSize: "0.82rem", color: "#166534" }}>Pay when your order arrives at your door. No advance payment, no risk.</p>
              </div>
            </div>

            {/* Delivery zones table */}
            {groups.map(group => (
              <div key={group.id} style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#666", marginBottom: "0.75rem" }}>{group.name}</h2>
                <div style={{ border: "1px solid #e0e0e0", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "50%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "30%" }} />
                    </colgroup>
                    <thead>
                      <tr style={{ backgroundColor: "var(--theme-primary, black)", color: "var(--theme-btn-text, white)" }}>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>City / Area</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Charge</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Est. Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.zones.map((zone, i) => (
                        <tr key={zone.id} style={{ backgroundColor: i % 2 === 0 ? "white" : "#f9f9f9", borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "0.875rem 1rem", fontWeight: 600, fontSize: "0.9rem" }}>{zone.name}</td>
                          <td style={{ padding: "0.875rem 1rem", fontWeight: 700, fontSize: "0.9rem", color: "#111" }}>{zone.charge ? "BDT " + zone.charge : "—"}</td>
                          <td style={{ padding: "0.875rem 1rem", color: "#666", fontSize: "0.85rem" }}>{zone.days ? zone.days + " business days" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <div style={{ marginTop: "3rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Frequently Asked Questions</h2>
              <div style={{ width: "40px", height: "2px", backgroundColor: "var(--theme-primary, black)", marginTop: "0.5rem" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {faqs.map((faq, i) => (
                <div key={faq.id} style={{ borderBottom: "1px solid #f0f0f0", padding: "1.25rem 0" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{ color: "rgba(0,0,0,0.25)", fontWeight: 900, fontSize: "0.8rem", flexShrink: 0, marginTop: "0.1rem" }}>Q{i + 1}</span>
                    {faq.question}
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#555", lineHeight: 1.7, paddingLeft: "1.75rem" }}>{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact strip */}
        <div style={{ marginTop: "3rem", backgroundColor: "var(--theme-primary, black)", color: "var(--theme-btn-text, white)", padding: "2rem", textAlign: "center" }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>Still have questions?</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", marginBottom: "1rem" }}>Our team is available 9am–9pm daily</p>
          <a href={"https://wa.me/" + (map.whatsapp_number || "8801935962421")} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", backgroundColor: "#25D366", color: "var(--theme-btn-text, white)", padding: "0.75rem 2rem", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            WhatsApp Us
          </a>
        </div>

      </div>
    </div>
  )
}
