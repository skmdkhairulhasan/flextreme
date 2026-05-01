import { NextRequest, NextResponse } from "next/server"

// TEMP hardcoded admin credentials (replace with your database later)
const ADMIN_EMAIL = "admin@flextreme.com"
const ADMIN_PASSWORD = "admin123"

// Simple token generation (for development - use proper JWT in production)
function generateToken(email: string): string {
  const payload = {
    email,
    role: "admin",
    timestamp: Date.now()
  }
  // Base64 encode the payload (NOT SECURE - just for development)
  return btoa(JSON.stringify(payload))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Generate simple token
      const token = generateToken(email)

      return NextResponse.json({ token })
    } else {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    )
  }
}
