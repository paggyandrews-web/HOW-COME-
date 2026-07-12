// ── Lightweight celebration sound cues ──
// Synthesized with the Web Audio API (no asset files, works offline in the
// TWA/PWA). Reuses a single AudioContext since some browsers cap how many
// can be created per page.

let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  // Browsers suspend the context until a user gesture resumes it — a tapped
  // answer counts, so this is safe to call from a click handler.
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function tone(audioCtx, freq, startTime, duration, gain = 0.12) {
  const osc = audioCtx.createOscillator()
  const g = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, startTime)
  g.gain.linearRampToValueAtTime(gain, startTime + 0.02)
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(g)
  g.connect(audioCtx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

/**
 * unlockAudio() — creates/resumes the shared AudioContext from inside a real
 * user gesture (e.g. an onClick handler). Browsers only allow the *first*
 * AudioContext creation/resume when it's synchronously triggered by a tap;
 * calling this early (well before a milestone/result screen appears) means
 * later playChime() calls — which usually fire from useEffects after an
 * async Firestore round trip — actually have permission to play.
 */
export function unlockAudio() {
  getCtx()
}

/**
 * playChime('big')    — bright ascending two-note chime for a big win
 *                        (perfect/near-perfect quiz score).
 * playChime('fire')   — warmer, lower descending pair for a streak milestone.
 * playChime('normal') — quick, quiet single tick for a routine correct answer.
 */
export function playChime(kind = 'big') {
  try {
    const audioCtx = getCtx()
    if (!audioCtx) return
    const now = audioCtx.currentTime

    if (kind === 'fire') {
      tone(audioCtx, 523.25, now, 0.22, 0.1)       // C5
      tone(audioCtx, 659.25, now + 0.09, 0.28, 0.1) // E5
    } else if (kind === 'normal') {
      tone(audioCtx, 784.0, now, 0.12, 0.07)        // G5, short and soft
    } else {
      tone(audioCtx, 659.25, now, 0.18, 0.11)       // E5
      tone(audioCtx, 987.77, now + 0.1, 0.32, 0.11) // B5
    }
  } catch {
    // Never let a sound cue break the celebration itself.
  }
}
