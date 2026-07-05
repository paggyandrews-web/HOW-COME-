import { useState, useRef, useEffect } from 'react'

/**
 * Custom-styled dropdown to replace native <select>.
 * Native selects render via the OS/WebView picker (white background on Android),
 * which can't be restyled with CSS — this component gives full control so the
 * popup list matches the app's black-background / teal-text theme everywhere.
 *
 * options: [{ value, label }]
 */
export default function Dropdown({ value, onChange, options, placeholder, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className={className} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-lg px-3 py-2 text-xs text-left flex items-center justify-between gap-1"
        style={{
          background: '#111111',
          border: `1px solid ${value ? 'var(--accent)' : 'rgba(26,157,142,0.4)'}`,
          color: 'var(--accent)',
        }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <span style={{ fontSize: 9, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
      </button>

      {open && (
        <div
          className="rounded-lg overflow-y-auto"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#111111',
            border: '1px solid var(--accent)',
            maxHeight: 300,
            zIndex: 50,
            boxShadow: '0 12px 28px rgba(0,0,0,0.55)',
          }}
        >
          {options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              className="px-3 py-2.5 text-xs"
              style={{
                color: 'var(--accent)',
                background: o.value === value ? 'rgba(26,157,142,0.18)' : 'transparent',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(26,157,142,0.12)',
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
