import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message, recipientEmail } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const toEmail = recipientEmail || process.env.CONTACT_EMAIL || "flextremefit@gmail.com"
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      // Fallback: just return success so frontend can use mailto as backup
      return NextResponse.json({ fallback: true })
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Flextreme Contact <onboarding@resend.dev>",
        to: toEmail,
        reply_to: email,
        subject: subject || "Contact Form: Message from " + name,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: black; color: white; padding: 20px 24px; margin-bottom: 24px;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;">FLEXTREME</h1>
              <p style="margin: 4px 0 0; color: rgba(255,255,255,0.5); font-size: 13px;">New message from your website</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #999; width: 100px;">From</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: 700;">${name}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #999;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${email}" style="color: black;">${email}</a></td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #999;">Subject</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">${subject || "—"}</td></tr>
            </table>
            <div style="background: #f9f9f9; border: 1px solid #e0e0e0; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #999; letter-spacing: 0.08em;">Message</p>
              <p style="margin: 0; line-height: 1.7; color: #333; white-space: pre-wrap;">${message}</p>
            </div>
            <a href="mailto:${email}?subject=Re: ${subject || "Your message to Flextreme"}" style="display: inline-block; background: black; color: white; padding: 12px 24px; font-weight: 700; font-size: 13px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em;">Reply to ${name}</a>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("Resend error:", err)
      return NextResponse.json({ fallback: true })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Contact API error:", err)
    return NextResponse.json({ fallback: true })
  }
}
