/**
 * Client-side device fingerprint for duplicate-signup detection.
 *
 * FingerprintJS (OSS) hashes stable browser/device traits into a visitorId
 * that survives cookie clearing and incognito — the strongest signal we have
 * that two "different" accounts came from the same physical device. IP and
 * geo are captured server-side (auth hook + /api/signup-fingerprint); this
 * module only produces the hash and beacons it after a successful signup.
 *
 * Everything here is best-effort telemetry for ADMIN REVIEW (see
 * lib/fraud-detection.ts): it must never throw, block, or slow the signup
 * flow it rides on — same contract as lib/signup-telemetry.ts.
 */

let fpPromise: Promise<string | null> | null = null

/**
 * Compute (and memoize) the device hash. The library is dynamically imported
 * so it never weighs down the signup bundle's critical path — call
 * preloadDeviceFingerprint() on mount and the result is usually ready long
 * before the user finishes typing three wizard steps.
 */
export function getDeviceFingerprint(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null)
  if (!fpPromise) {
    fpPromise = import("@fingerprintjs/fingerprintjs")
      .then(async (FingerprintJS) => {
        const agent = await FingerprintJS.load()
        const { visitorId } = await agent.get()
        return visitorId || null
      })
      .catch(() => null)
  }
  return fpPromise
}

export function preloadDeviceFingerprint(): void {
  void getDeviceFingerprint()
}

/**
 * Send the hash to the server right after signup succeeds. sendBeacon
 * survives the hard navigation to /onboarding (same pattern as
 * lib/signup-telemetry.ts); the session cookie set by the signup response
 * rides along, which is how the server knows which user this device is.
 */
export function beaconSignupFingerprint(deviceHash: string): void {
  if (typeof window === "undefined") return
  try {
    // Plain-string body (arrives as text/plain) exactly like signup-telemetry —
    // the endpoint reads req.text() and JSON.parses, so content-type is moot.
    const body = JSON.stringify({ deviceHash })
    const url = "/api/signup-fingerprint"
    if (typeof navigator.sendBeacon === "function") {
      if (navigator.sendBeacon(url, body)) return
    }
    void fetch(url, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "content-type": "application/json" },
    }).catch(() => {})
  } catch {
    // Fingerprinting must never interfere with the signup itself.
  }
}
