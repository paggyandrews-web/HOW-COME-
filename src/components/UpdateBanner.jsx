import { useEffect, useRef, useState } from 'react'

/**
 * Tells people when a newer version of the app has been deployed.
 *
 * The Android app (a WebView) and installed PWAs keep the page alive in the
 * background for days, so after a deploy many people keep running the old
 * JavaScript until they fully close the app. This compares the entry script
 * the page was loaded with against the one in the live index.html — on
 * start-up, whenever the app comes back to the foreground, and every 30
 * minutes — and offers a one-tap refresh when they differ.
 */
const ENTRY = /\/assets\/index-[\w-]+\.js/
const CHECK_EVERY = 30 * 60 * 1000
const MIN_GAP = 60 * 1000

function loadedEntry() {
  for (const s of document.scripts) {
    const m = s.src && s.src.match(ENTRY)
    if (m) return m[0]
  }
  return null // dev server — nothing to compare
}

async function liveEntry() {
  // __update_check is skipped by sw.js so this always hits the network
  const res = await fetch('/?__update_check=' + Date.now(), { cache: 'no-store' })
  if (!res.ok) return null
  const m = (await res.text()).match(ENTRY)
  return m ? m[0] : null
}

export default function UpdateBanner() {
  const [ready, setReady] = useState(false)
  const lastCheck = useRef(0)

  useEffect(() => {
    const current = loadedEntry()
    if (!current) return
    let alive = true

    async function check() {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastCheck.current < MIN_GAP) return
      lastCheck.current = Date.now()
      try {
        const live = await liveEntry()
        if (alive && live && live !== current) setReady(true)
      } catch { /* offline — try again later */ }
    }

    const first = setTimeout(check, 5000)
    const every = setInterval(check, CHECK_EVERY)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      alive = false
      clearTimeout(first)
      clearInterval(every)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [])

  if (!ready) return null

  return (
    <div
      role="status"
      style={{
        position: 'fixed', left: 12, right: 12, zIndex: 300,
        bottom: 'calc(env(safe-area-inset-bottom) + 96px)',
        maxWidth: 420, margin: '0 auto',
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '10px 10px 10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>New update available</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>Refresh to get the latest features.</div>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="btn-solid h-9 px-4 rounded-full text-[13px] font-semibold shrink-0"
        style={{ touchAction: 'manipulation' }}
      >
        Refresh
      </button>
      <button
        onClick={() => setReady(false)}
        aria-label="Dismiss"
        className="h-9 w-9 rounded-full shrink-0 inline-flex items-center justify-center"
        style={{ color: 'var(--text2)', touchAction: 'manipulation' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  )
}
