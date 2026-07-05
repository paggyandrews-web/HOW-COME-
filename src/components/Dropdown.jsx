import { useState } from 'react'

/**
 * Custom-styled dropdown to replace native <select>.
 * Native selects render via the OS/WebView picker (white background on Android),
 * which can't be restyled with CSS. This opens a full-size bottom-sheet picker
 * instead — same big, easy-to-tap feel as the native picker, but black
 * background with white option text (teal for the selected row/trigger),
 * matching the app theme everywhere.
 *
 * options: [{ value, label }]
 */
export default function Dropdown({ value, onChange, options, placeholder, className = '' }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <div className={className} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg px-3 py-2 text-xs text-left flex items-center justify-between gap-1"
        style={{
          background: '#111111',
          border: `1px solid ${value ? 'var(--accent)' : 'rgba(26,157,142,0.4)'}`,
          color: 'var(--accent)',
        }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <span style={{ fontSize: 9, flexShrink: 0 }}>▼</span>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full"
            style={{
              background: '#000000',
              maxWidth: 560,
              maxHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              border: '1px solid var(--accent)',
              borderBottom: 'none',
              overflow: 'hidden',
            }}
          >
            <div
              className="px-5 py-4 font-bold text-base"
              style={{ color: 'var(--accent)', borderBottom: '1px solid rgba(26,157,142,0.25)', flexShrink: 0 }}
            >
              {placeholder}
            </div>
            <div style={{ overflowY: 'auto' }}>
              {options.map(o => (
                <div
                  key={o.value}
                  onClick={() => { onChange(o.value); setOpen(false) }}
                  className="px-5 py-4 text-base"
                  style={{
                    color: o.value === value ? 'var(--accent)' : '#ffffff',
                    background: o.value === value ? 'rgba(26,157,142,0.12)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    fontWeight: o.value === value ? 700 : 400,
                  }}
                >
                  {o.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
