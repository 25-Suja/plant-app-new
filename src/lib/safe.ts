// Small helpers that keep the app working on older / locked-down iPhones.

const memory = new Map<string, string>()

/** localStorage can throw on iOS (blocked cookies, in-app browsers, Lockdown Mode). Never let that crash the app. */
export const safeStorage = {
  get(key: string): string | null {
    try {
      const v = window.localStorage.getItem(key)
      return v ?? memory.get(key) ?? null
    } catch {
      return memory.get(key) ?? null
    }
  },
  set(key: string, value: string) {
    memory.set(key, value)
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* storage unavailable: the in-memory copy keeps this visit working */
    }
  },
}

/** AbortSignal.timeout() is missing before iOS 16. */
export function timeoutSignal(ms: number): AbortSignal | undefined {
  if (typeof AbortController === 'undefined') return undefined
  const AS = AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }
  if (typeof AS.timeout === 'function') return AS.timeout(ms)
  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
}

/** crypto.randomUUID() is missing before iOS 15.4. */
export function uuid(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}
