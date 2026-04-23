import { NextRequest, NextResponse } from "next/server"

type ContactBody = {
  name: string
  email: string
  subject?: string
  message: string
  recipientEmail?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactBody

    const { name, email, subject, message, recipientEmail } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Message received successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}