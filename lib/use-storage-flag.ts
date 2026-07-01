"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * localStorage-backed boolean flag, read via useSyncExternalStore so the
 * value is correct on the very first client render — no setState-in-effect,
 * no post-hydration flash. `serverFallback` is what SSR renders (pick the
 * value that hides optional UI until the client knows better).
 */

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emit() {
  listeners.forEach((l) => l())
}

export function useStorageFlag(key: string, serverFallback: boolean) {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(key) === "1"
      } catch {
        return false
      }
    },
    () => serverFallback,
  )

  const setFlag = useCallback(
    (next: boolean) => {
      try {
        if (next) window.localStorage.setItem(key, "1")
        else window.localStorage.removeItem(key)
      } catch {}
      emit()
    },
    [key],
  )

  return [value, setFlag] as const
}
