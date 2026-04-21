// Cloudinary upload utility
// Uploads a file directly from the browser to Cloudinary (no server needed)

const CLOUD_NAME = "dorki2ipl"
const UPLOAD_PRESET = "flextreme_unsigned" // We'll create this as unsigned preset

export async function uploadToCloudinary(
  file: File,
  folder: string = "flextreme"
): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", UPLOAD_PRESET)
  formData.append("folder", folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData }
  )

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || "Cloudinary upload failed")
  }

  const data = await res.json()
  return data.secure_url as string
}
