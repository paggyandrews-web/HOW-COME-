// Subtle haptic feedback for touch interactions.
// Feature-detected — silently no-ops on platforms without the Vibration API
// (e.g. iOS Safari, desktop browsers), so it never throws or breaks anything there.

const STORAGE_KEY = 'cs-vibration'

let lastTap = 0

/**
 * Whether the person has left vibration on (Settings, in Profile). Defaults
 * to on, matching the app's previous always-on behavior.
 */
export function isVibrationEnabled() {
  if (typeof localStorage === 'undefined') return true
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === null ? true : saved === 'true'
}

export function setVibrationEnabled(enabled) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, String(enabled))
}

/**
 * Fire a short, gentle vibration. Meant to feel like a light "tick" under
 * the finger, not a buzz — keep durations small (default 10ms).
 * Throttled so rapid-fire events (e.g. a finger dragging across several
 * buttons) don't turn into one continuous motor hum.
 */
export function tap(duration = 10) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  if (!isVibrationEnabled()) return
  const now = Date.now()
  if (now - lastTap < 30) return
  lastTap = now
  try {
    navigator.vibrate(duration)
  } catch {
    // Some browsers throw if vibrate() is called outside a user gesture — ignore.
  }
}
