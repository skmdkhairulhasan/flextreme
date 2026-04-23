import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name: string
      email: string
      subject?: string
      message: string
      recipientEmail?: string
    }

    const { name, email, subject, message, recipientEmail } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // If you already had email logic (Resend etc), keep it here
    // Otherwise just return success for now

    return NextResponse.json({
      success: true,
      message: "Message received successfully"
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}