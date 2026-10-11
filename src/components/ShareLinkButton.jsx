import { useState, useRef, useEffect } from 'react'

// Public site — every shared link points here, even when copied from the
// Android app or a local dev server, so the person receiving it can open it.
export const SITE_URL = 'https://howcome.in'

export function paperShareUrl(path) {
  return `${SITE_URL}${path}`
}

/* Clipboard API needs a secure context; older Android WebViews and some
   in-app browsers don't have it, so fall back to the textarea trick. */
async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/**
 * Small round "copy link" icon for a paper card. Tapping copies the paper's
 * public deep link; the chain icon flips to a green tick with a "Link copied"
 * bubble for a moment so the person knows it worked.
 */
export default function ShareLinkButton({ url, label = 'Copy link to this paper', size = 30 }) {
  const [state, setState] = useState('idle') // idle | copied | failed
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  async function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    const ok = await copyText(url)
    setState(ok ? 'copied' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1800)
  }

  const copied = state === 'copied'
  const failed = state === 'failed'

  return (
    <span className="share-link-wrap" style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        title={label}
        className={`share-link-btn${copied ? ' is-copied' : ''}`}
        style={{ width: size, height: size }}
      >
        {copied ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
      </button>
      {(copied || failed) && (
        <span role="status" className="share-link-bubble" style={failed ? { background: '#dc2626' } : undefined}>
          {copied ? 'Link copied' : 'Copy failed'}
        </span>
      )}
    </span>
  )
}
