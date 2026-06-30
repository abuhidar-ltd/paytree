import {
  put,
  BlobAccessError,
  BlobStoreNotFoundError,
  BlobStoreSuspendedError,
  BlobServiceNotAvailable,
  BlobServiceRateLimited,
  BlobFileTooLargeError,
} from "@vercel/blob"

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_BACKGROUND_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

// iPhone cameras default to HEIC/HEIF. Most browsers can't render those, so
// we accept the upload (so iOS users aren't blocked) and rely on the user's
// device to convert via the canvas-based preprocessor on the client when
// possible. Vercel Blob stores the bytes as-is.
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]

// Only allow base64 fallback in dev. In production, storing multi-MB base64
// data URLs in user.image bloats the database and slows every profile fetch.
const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN
const isProduction = process.env.NODE_ENV === "production"
const allowBase64Fallback = !isProduction && !hasVercelBlob

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
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      error: `Unsupported file type (${file.type || "unknown"}). Use JPG, PNG, WebP, GIF, or HEIC.`,
      code: "INVALID_TYPE",
    }
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024)
    const actualMB = (file.size / 1024 / 1024).toFixed(1)
    return {
      error: `File is ${actualMB}MB — max is ${maxSizeMB}MB. Try a smaller image.`,
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

async function fileToDataURL(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = buffer.toString("base64")
  const mimeType = file.type
  return `data:${mimeType};base64,${base64}`
}

// Sanitize the original filename's extension. Strip path separators, take only
// alphanumerics, lowercase, cap to 5 chars. Falls back to "bin" if anything
// suspicious is found — Vercel Blob is fine with any extension.
function safeExtension(name: string): string {
  const dot = name.lastIndexOf(".")
  if (dot < 0) return "bin"
  const raw = name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "")
  return raw.slice(0, 5) || "bin"
}

async function uploadToStorage(
  file: File,
  filenamePrefix: string,
  userId: string
): Promise<UploadResult | UploadError> {
  if (hasVercelBlob) {
    // addRandomSuffix:true keeps re-uploads from colliding when Date.now()
    // resolution isn't fine enough (back-to-back retries land in the same ms).
    const filename = `${filenamePrefix}-${userId}-${Date.now()}.${safeExtension(file.name)}`
    try {
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: true,
      })
      return { url: blob.url, size: file.size, contentType: file.type }
    } catch (err) {
      // Translate Blob SDK errors into specific codes so the API route can
      // log the actual cause. The June 2026 outage was a `BlobAccessError`
      // ("Cannot use public access on a private store") that surfaced as a
      // generic "Upload failed" in the UI — the explicit code below makes
      // that case impossible to misdiagnose next time.
      const mapped = mapBlobError(err)
      console.error("[upload] put() threw:", mapped.code, mapped.error, err)
      return mapped
    }
  }

  if (allowBase64Fallback) {
    console.log("[upload] Vercel Blob not configured — using base64 fallback (dev only)")
    const dataUrl = await fileToDataURL(file)
    return { url: dataUrl, size: file.size, contentType: file.type }
  }

  // Production with no Blob token — fail loudly rather than silently bloating the DB.
  return {
    error: "Image storage isn't configured. Contact support.",
    code: "STORAGE_NOT_CONFIGURED",
  }
}

function mapBlobError(err: unknown): UploadError {
  // instanceof alone is unreliable after Next.js bundling: the Blob SDK's
  // error classes get minified and the runtime instance is no longer ===
  // the import we typed against (we hit this in prod 2026-06-30 — `Cannot
  // use public access on a private store` surfaced as UPLOAD_FAILED instead
  // of STORAGE_ACCESS_DENIED). Falling back to err.name + message.
  const message = err instanceof Error ? err.message : String(err)
  const name = (err as { name?: string } | null)?.name || ""

  const matches = (cls: new (...args: never[]) => Error, classNameTail: string, msgPattern: RegExp) =>
    err instanceof cls || name === classNameTail || name.endsWith(`.${classNameTail}`) || msgPattern.test(message)

  if (matches(BlobAccessError, "BlobAccessError", /private store|public access on a private|access mismatch/i)) {
    return {
      error: "Image storage rejected the request (access mismatch). The team has been notified.",
      code: "STORAGE_ACCESS_DENIED",
    }
  }
  if (matches(BlobStoreNotFoundError, "BlobStoreNotFoundError", /store not found|no store/i)) {
    return {
      error: "Image storage is missing. Contact support.",
      code: "STORAGE_NOT_FOUND",
    }
  }
  if (matches(BlobStoreSuspendedError, "BlobStoreSuspendedError", /suspended/i)) {
    return {
      error: "Image storage is suspended. Contact support.",
      code: "STORAGE_SUSPENDED",
    }
  }
  if (matches(BlobServiceNotAvailable, "BlobServiceNotAvailable", /service.*not available|temporarily unavailable/i)) {
    return {
      error: "Image storage is temporarily unavailable. Try again in a minute.",
      code: "STORAGE_UNAVAILABLE",
    }
  }
  if (matches(BlobServiceRateLimited, "BlobServiceRateLimited", /rate.?limit/i)) {
    return {
      error: "Too many uploads right now. Try again in a moment.",
      code: "STORAGE_RATE_LIMITED",
    }
  }
  if (matches(BlobFileTooLargeError, "BlobFileTooLargeError", /too large|file size/i)) {
    return {
      error: "Image is larger than what our storage allows.",
      code: "FILE_TOO_LARGE",
    }
  }
  return {
    error: err instanceof Error ? err.message : "Failed to upload image",
    code: "UPLOAD_FAILED",
  }
}

export async function uploadProfileImage(
  file: File,
  userId: string
): Promise<UploadResult | UploadError> {
  try {
    const validationError = await validateImage(file, MAX_PROFILE_IMAGE_SIZE)
    if (validationError) return validationError
    return await uploadToStorage(file, "profile", userId)
  } catch (error) {
    console.error("Profile upload error:", error)
    return {
      error: error instanceof Error ? error.message : "Failed to upload image",
      code: "UPLOAD_FAILED",
    }
  }
}

export async function uploadBackgroundImage(
  file: File,
  userId: string
): Promise<UploadResult | UploadError> {
  try {
    const validationError = await validateImage(file, MAX_BACKGROUND_IMAGE_SIZE)
    if (validationError) return validationError
    return await uploadToStorage(file, "background", userId)
  } catch (error) {
    console.error("Background upload error:", error)
    return {
      error: error instanceof Error ? error.message : "Failed to upload image",
      code: "UPLOAD_FAILED",
    }
  }
}

// Helper to extract colors from image URL (client-side)
export async function extractColorsFromImage(imageUrl: string) {
  try {
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
