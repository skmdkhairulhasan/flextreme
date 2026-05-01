import { NextRequest, NextResponse } from "next/server"
import { uploadToCloudinary } from "@/lib/cloudinary"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const folder = formData.get("folder")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const url = await uploadToCloudinary(
      file,
      typeof folder === "string" && folder ? folder : "flextreme"
    )

    return NextResponse.json({
      success: true,
      url,
      message: "File uploaded successfully",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Upload failed", details: message },
      { status: 500 }
    )
  }
}
