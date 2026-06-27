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

// Verify the leading bytes actually match a supported raster image format.
// Content-Type and filename are client-controlled and spoofable, so the bytes
// are the source of truth.
function sniffImageMime(bytes: Uint8Array): string | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg"
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png"
  }
  // GIF: "GIF87a" or "GIF89a"
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61
  ) {
    return "image/gif"
  }
  // WEBP: "RIFF"...."WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp"
  }
  return null
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

  // Validate the actual file bytes (magic number), not just the client-provided
  // Content-Type, which can be spoofed.
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (!sniffImageMime(header)) {
    return {
      error: "Invalid image file",
      code: "INVALID_IMAGE",
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
    // @ts-expect-error - Dynamic import typing issue
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
