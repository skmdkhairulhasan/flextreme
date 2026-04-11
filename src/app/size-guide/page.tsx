import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Size Guide | Flextreme" }

async function getSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from("settings").select("*")
  const map: Record<string, string> = {}
  data?.forEach((s: any) => { map[s.key] = s.value })
  return map
}

export default async function SizeGuidePage() {
  const settings = await getSettings()

  // Read from new size_tables JSON (set by admin Size Guide tab)
  let sizeTables: any[] = []
  if (settings.size_tables) {
    try { sizeTables = JSON.parse(settings.size_tables) } catch {}
  }

  // Fallback: build from old individual keys if no tables saved yet
  if (sizeTables.length === 0) {
    const oldSizes = ["xs","s","m","l","xl","xxl"].map(id => ({
      id, label: id.toUpperCase(),
      chest: settings[`size_${id}_chest`] || "",
      waist: settings[`size_${id}_waist`] || "",
      hips: settings[`size_${id}_hips`] || "",
    })).filter(r => r.chest || r.waist || r.hips)

    if (oldSizes.length > 0) {
      sizeTables = [{
        id: "default", name: "Size Guide",
        unit: settings.size_unit || "inches",
        columns: [
          { id: "chest", name: "Chest", description: "Measure around the fullest part of your chest." },
          { id: "waist", name: "Waist", description: "Measure around your natural waistline." },
          { id: "hips", name: "Hips", description: "Measure around the fullest part of your hips." },
        ],
        rows: oldSizes.map(s => ({ id: s.id, label: s.label, values: { chest: s.chest, waist: s.waist, hips: s.hips } }))
      }]
    }
  }

  const tips = [
    { title: "Measure Your Chest", description: "Wrap the tape around the fullest part of your chest, keeping it horizontal and snug but not tight." },
    { title: "Measure Your Waist", description: "Measure around your natural waistline, which is the narrowest part of your torso." },
    { title: "Measure Your Hips", description: "Stand with feet together and measure around the fullest part of your hips and seat." },
    { title: "When In Between Sizes", description: "If you are between sizes, we recommend sizing up for a more comfortable fit during workouts." },
  ]

  return (
    <div style={{ paddingTop: "72px" }}>
      <div style={{ backgroundColor: "black", color: "white", padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>Find Your Fit</p>
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 }}>Size Guide</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "1rem", fontSize: "0.95rem" }}>Measurements help you find the perfect fit</p>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "4rem 1.5rem" }}>

        {sizeTables.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#999", border: "1px dashed #e0e0e0" }}>
            <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No size guide set up yet.</p>
            <p style={{ fontSize: "0.85rem" }}>Add your size tables in Admin → Settings → Size Guide.</p>
          </div>
        ) : sizeTables.map((table: any) => (
          <div key={table.id} style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase" }}>{table.name}</h2>
              <span style={{ fontSize: "0.78rem", color: "#999", border: "1px solid #e0e0e0", padding: "0.25rem 0.75rem", textTransform: "uppercase" }}>{table.unit || "cm"}</span>
            </div>

            {/* Column descriptions */}
            {table.columns?.some((c: any) => c.description) && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${table.columns.length}, 1fr)`, gap: "1rem", marginBottom: "1.5rem" }}>
                {table.columns.map((col: any) => col.description ? (
                  <div key={col.id} style={{ backgroundColor: "#f9f9f9", padding: "0.875rem 1rem", borderLeft: "3px solid black" }}>
                    <p style={{ fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", marginBottom: "0.3rem" }}>{col.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "#666", lineHeight: 1.5 }}>{col.description}</p>
                  </div>
                ) : null)}
              </div>
            )}

            {/* Size table */}
            <p style={{ fontSize: "0.72rem", color: "#999", marginBottom: "0.5rem" }}>← Scroll sideways to see all columns →</p>
            <div style={{ border: "1px solid #e0e0e0", overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${(table.columns?.length + 1) * 120}px` }}>
                <thead>
                  <tr style={{ backgroundColor: "black", color: "white" }}>
                    <th style={{ padding: "0.875rem 1.25rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Size</th>
                    {table.columns?.map((col: any) => (
                      <th key={col.id} style={{ padding: "0.875rem 1.25rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows?.map((row: any, i: number) => (
                    <tr key={row.id} style={{ backgroundColor: i % 2 === 0 ? "white" : "#fafafa", borderTop: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "0.875rem 1.25rem", fontWeight: 900, fontSize: "0.95rem", whiteSpace: "nowrap" }}>{row.label}</td>
                      {table.columns?.map((col: any) => (
                        <td key={col.id} style={{ padding: "0.875rem 1.25rem", fontSize: "0.9rem", color: "#555", whiteSpace: "nowrap" }}>
                          {row.values?.[col.id] ? `${row.values[col.id]} ${table.unit || "cm"}` : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* How to measure */}
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "1.5rem" }}>How to Measure</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ padding: "1.5rem", border: "1px solid #e0e0e0" }}>
                <div style={{ width: "32px", height: "32px", backgroundColor: "black", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.85rem", marginBottom: "1rem" }}>{i + 1}</div>
                <h3 style={{ fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>{tip.title}</h3>
                <p style={{ fontSize: "0.82rem", color: "#666", lineHeight: 1.7 }}>{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
