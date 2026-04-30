import { put } from "@vercel/blob"

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_BACKGROUND_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]

// Check if Vercel Blob is configured
const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN

export interface UploadResult {
  url: string
  size: number
  contentType: string
}

export interface UploadError {
  error: string
  code: string
}

export async function validateImage(
  file: File,
  maxSize: number
): Promise<UploadError | null> {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
      code: "INVALID_TYPE",
    }
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / 1024 / 1024
    return {
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
      code: "FILE_TOO_LARGE",
    }
  }

  return null
}

// Convert file to base64 data URL for local development
async function fileToDataURL(file: File): Promise<string> {
  // Convert File to Buffer for server-side processing
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = buffer.toString('base64')
  const mimeType = file.type
  return `data:${mimeType};base64,${base64}`
}

export async function uploadProfileImage(
  file: File,
  userId: string
): Promise<UploadResult | UploadError> {
  try {
    // Validate
    const validationError = await validateImage(file, MAX_PROFILE_IMAGE_SIZE)
    if (validationError) return validationError

    // Use Vercel Blob if configured, otherwise use base64
    if (hasVercelBlob) {
      const filename = `profile-${userId}-${Date.now()}.${file.name.split(".").pop()}`
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      })

      return {
        url: blob.url,
        size: file.size,
        contentType: file.type,
      }
    } else {
      // Fallback to base64 for local development
      console.log("📦 Using base64 storage (Vercel Blob not configured)")
      const dataUrl = await fileToDataURL(file)
      return {
        url: dataUrl,
        size: file.size,
        contentType: file.type,
      }
    }
  } catch (error) {
    console.error("Upload error:", error)
    return {
      error: "Failed to upload image",
      code: "UPLOAD_FAILED",
    }
  }
}

export async function uploadBackgroundImage(
  file: File,
  userId: string
): Promise<UploadResult | UploadError> {
  try {
    // Validate
    const validationError = await validateImage(file, MAX_BACKGROUND_IMAGE_SIZE)
    if (validationError) return validationError

    // Use Vercel Blob if configured, otherwise use base64
    if (hasVercelBlob) {
      const filename = `background-${userId}-${Date.now()}.${file.name.split(".").pop()}`
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      })

      return {
        url: blob.url,
        size: file.size,
        contentType: file.type,
      }
    } else {
      // Fallback to base64 for local development
      console.log("📦 Using base64 storage (Vercel Blob not configured)")
      const dataUrl = await fileToDataURL(file)
      return {
        url: dataUrl,
        size: file.size,
        contentType: file.type,
      }
    }
  } catch (error) {
    console.error("Upload error:", error)
    return {
      error: "Failed to upload image",
      code: "UPLOAD_FAILED",
    }
  }
}

// Helper to extract colors from image URL (client-side)
export async function extractColorsFromImage(imageUrl: string) {
  try {
    // Import node-vibrant dynamically
    const vibrantModule = await import("node-vibrant")
    // @ts-ignore - Dynamic import typing issue
    const Vibrant = vibrantModule.default || vibrantModule
    const palette = await Vibrant.from(imageUrl).getPalette()

    return {
      primary: palette.Vibrant?.hex || "#3b82f6",
      accent: palette.LightVibrant?.hex || "#00ff88",
      background: palette.DarkVibrant?.hex || "#0f172a",
      text: palette.DarkMuted?.hex || "#ffffff",
    }
  } catch (error) {
    console.error("Color extraction error:", error)
    return null
  }
}
