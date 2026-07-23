import { useState, useEffect } from 'react'

/* Single flipping digit tile */
function FlipDigit({ value, urgent }) {
  const display = String(value).padStart(2, '0')
  const [prev, setPrev] = useState(display)
  const [curr, setCurr] = useState(display)
  const [flipping, setFlipping] = useState(false)

  useEffect(() => {
    if (display === curr) return
    setPrev(curr)
    setFlipping(true)
    const t1 = setTimeout(() => setCurr(display), 160)
    const t2 = setTimeout(() => setFlipping(false), 320)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [display]) // eslint-disable-line

  const bg = urgent ? '#7f1d1d' : '#1e293b'
  const accent = urgent ? '#ef4444' : '#60a5fa'

  const tileStyle = {
    position: 'relative',
    width: 46,
    height: 60,
    borderRadius: 8,
    background: bg,
    overflow: 'hidden',
    perspective: 200,
    boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  }

  const digitStyle = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: 30,
    fontWeight: 800,
    color: 'white',
    lineHeight: 1,
    userSelect: 'none',
  }

  const halfBase = {
    position: 'absolute',
    left: 0, right: 0,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  }

  // Divider line
  const divider = {
    position: 'absolute',
    left: 0, right: 0, top: '50%',
    height: 2,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 10,
  }

  return (
    <div style={tileStyle}>
      {/* Static back face */}
      <div style={digitStyle}>{curr}</div>

      {/* Divider */}
      <div style={divider} />

      {/* Flip: top half shows prev, rotates away */}
      {flipping && (
        <div style={{
          ...halfBase,
          top: 0, height: '50%',
          background: bg,
          transformOrigin: 'bottom center',
          animation: 'flipTop 0.16s ease-in forwards',
          zIndex: 5,
        }}>
          <div style={{
            ...digitStyle,
            // clip to top half: shift digit down so top half is visible
            top: 0, height: '200%',
          }}>{prev}</div>
        </div>
      )}

      {/* Flip: bottom half shows curr, rotates into view */}
      {flipping && (
        <div style={{
          ...halfBase,
          bottom: 0, height: '50%',
          background: urgent ? '#991b1b' : '#263347',
          transformOrigin: 'top center',
          animation: 'flipBottom 0.16s ease-out 0.16s both',
          zIndex: 5,
        }}>
          <div style={{
            ...digitStyle,
            // clip to bottom half: shift digit up so bottom half is visible
            top: '-100%', height: '200%',
          }}>{curr}</div>
        </div>
      )}

      {/* Gloss sheen on top half */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />
    </div>
  )
}

/* Single unit: two digit tiles + label */
function FlipUnit({ value, label, urgent }) {
  const d1 = Math.floor(value / 10)
  const d2 = value % 10
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        <FlipDigit value={d1} urgent={urgent} />
        <FlipDigit value={d2} urgent={urgent} />
      </div>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: urgent ? '#ef4444' : 'var(--text2)',
      }}>{label}</div>
    </div>
  )
}

/* Separator colon */
function Colon({ urgent }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingBottom: 22,
      alignSelf: 'center',
    }}>
      {[0, 1].map(i => (
        <div key={i} style={{
          width: 5, height: 5,
          borderRadius: '50%',
          background: urgent ? '#ef4444' : 'var(--text2)',
          opacity: 0.8,
        }} />
      ))}
    </div>
  )
}

/**
 * FlipClock — shows a live countdown to a date/time pair.
 * Props: dateStr (YYYY-MM-DD), timeStr (HH:MM), compact (bool)
 */
export default function FlipClock({ dateStr, timeStr, compact = false, color: colorProp, overLabel = 'Exam Day / Over', hideLabels = false }) {
  const [diff, setDiff] = useState(0)

  useEffect(() => {
    const [h, m] = (timeStr || '00:00').split(':').map(Number)
    const target = new Date(dateStr)
    target.setHours(h, m, 0, 0)
    function calc() { setDiff(target - new Date()) }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [dateStr, timeStr])

  if (diff <= 0) {
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: 20,
        background: '#dc2626',
        color: 'white',
        fontSize: 12,
        fontWeight: 700,
      }}>
        {overLabel}
      </span>
    )
  }

  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins  = Math.floor((diff % 3600000) / 60000)
  const secs  = Math.floor((diff % 60000) / 1000)
  const urgent = days < 3

  if (compact) {
    // Compact inline version (no flip animation, just numbers)
    const color = colorProp || 'var(--accent)'
    // hideLabels: drop the D/H/M/S captions and join with colons, so the row
    // still reads as a countdown (00:11:27:12) without the letters.
    if (hideLabels) {
      const parts = [days, hours, mins, secs].map(v => String(v).padStart(2, '0'))
      return (
        <div style={{ fontSize: 18, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}>
          {parts.join(':')}
        </div>
      )
    }
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[['D', days], ['H', hours], ['M', mins], ['S', secs]].map(([l, v]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
              {String(v).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>
      <FlipUnit value={days}  label="Days"  urgent={urgent} />
      <Colon urgent={urgent} />
      <FlipUnit value={hours} label="Hours" urgent={urgent} />
      <Colon urgent={urgent} />
      <FlipUnit value={mins}  label="Mins"  urgent={urgent} />
      <Colon urgent={urgent} />
      <FlipUnit value={secs}  label="Secs"  urgent={urgent} />
    </div>
  )
}
