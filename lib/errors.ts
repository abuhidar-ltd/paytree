/**
 * Extracts a string message from a thrown value. Safe against non-Error throws
 * (e.g. `throw "boom"` or `throw { message: "..." }`).
 */
export function errMsg(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error) {
    const m = (error as { message: unknown }).message
    if (typeof m === "string") return m
  }
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}
