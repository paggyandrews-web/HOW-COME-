import { useState, useMemo, useRef } from 'react'
import exams from '../data/exams.json'
import FlipClock from '../components/FlipClock'

function formatTime12h(timeStr) {
  if (!timeStr) return timeStr
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

const MAX_PINS = 5

function UnpinDialog({ exam, onConfirm, onCancel }) {
  if (!exam) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}
      onClick={onCancel}
    >
      <div
        className="card rounded-2xl p-5 w-full max-w-sm mx-4 mb-4 sm:mb-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-base font-semibold mb-1">Unpin this exam?</div>
        <div className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
          {exam.name.split(' / ')[0]}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            Unpin
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function ExamRow({ exam, pinned, onPin, onRequestUnpin, pinCount }) {
  const canPin = pinned || pinCount < MAX_PINS
  const examDate = new Date(exam.date)
  const now = new Date()
  const today = new Date(now.toDateString())
  const isPast = examDate < today
  const isToday = examDate.toDateString() === now.toDateString()
  const lastTap = useRef(0)

  // Chrome fires a ghost click after every touch. onTouchEnd can't prevent it
  // (Chrome ignores preventDefault on passive touch listeners). onPointerUp is
  // non-passive and fires before the ghost click, so we set ignoreNextClick here
  // to block the ghost click in onClick.
  const ignoreNextClick = useRef(false)

  function doPin() {
    const now = Date.now()
    if (now - lastTap.current < 400) return
    lastTap.current = now
    if (!canPin) return
    if (pinned) {
      // Delay dialog 150ms so ghost click fires before backdrop appears.
      // Without this, the ghost click hits the backdrop and instantly closes the dialog.
      setTimeout(() => onRequestUnpin(exam.id), 150)
    } else {
      onPin(exam.id)
    }
  }

  // onPointerUp handles touch in Chrome — pointer events are NOT passive,
  // unlike touchend. pointerType check prevents double-fire on desktop mouse.
  function handlePinPointerUp(e) {
    if (e.pointerType !== 'touch') return
    e.stopPropagation()
    ignoreNextClick.current = true
    setTimeout(() => { ignoreNextClick.current = false }, 600)
    doPin()
  }

  // Handles desktop mouse clicks. Also receives ghost click after touch —
  // caught and blocked by ignoreNextClick flag.
  function handlePinClick(e) {
    e.stopPropagation()
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false
      return
    }
    doPin()
  }

  return (
    <div className="card rounded-xl p-4"
      style={{
        opacity: isPast ? 0.55 : 1,
        borderLeft: pinned ? '4px solid var(--accent)' : '4px solid transparent',
        transition: 'border-color 0.3s ease',
      }}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--accent)' }}>
            Sl. {exam.slNo} · {exam.catNo}
          </div>
          <div className="font-semibold text-sm leading-snug mb-0.5">{exam.name}</div>
          <div className="text-xs" style={{ color: 'var(--text2)' }}>{exam.dept}</div>
        </div>
        <button
          onPointerUp={handlePinPointerUp}
          onClick={handlePinClick}
          title={pinned ? 'Unpin from Home' : canPin ? 'Pin to Home' : 'Max 5 pins reached'}
          className="text-xl shrink-0 mt-0.5 transition-transform active:scale-110"
          style={{
            opacity: pinned ? 1 : canPin ? 0.35 : 0.15,
            cursor: canPin ? 'pointer' : 'not-allowed',
            padding: '4px 8px',
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}>
          📌
        </button>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
        <div>
          <span style={{ color: 'var(--text2)' }}>Exam Date: </span>
          <span className="font-medium">
            {examDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {isToday && <span className="ml-1 font-bold" style={{ color: '#ef4444' }}>TODAY!</span>}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text2)' }}>Exam Time: </span>
          <span className="font-medium">{formatTime12h(exam.time)}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text2)' }}>Mode: </span>
          <span className="font-medium">{exam.mode}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text2)' }}>Scope: </span>
          <span className="font-medium">{exam.scope}</span>
        </div>
        {exam.admissionFrom && (
          <div>
            <span style={{ color: 'var(--text2)' }}>Admission Tickets From: </span>
            <span className="font-medium">
              {new Date(exam.admissionFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}
        {exam.candidates && (
          <div>
            <span style={{ color: 'var(--text2)' }}>Total Candidates: </span>
            <span className="font-medium">{exam.candidates.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* Flip clock countdown */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs" style={{ color: 'var(--text2)' }}>
          {isPast ? 'Completed' : 'Time remaining'}
        </div>
        {!isPast
          ? <FlipClock dateStr={exam.date} timeStr={exam.time} compact />
          : <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg2)', color: 'var(--text2)' }}>Done</span>
        }
      </div>
    </div>
  )
}

export default function Exams() {
  const [pinned, setPinned] = useState(() =>
    JSON.parse(localStorage.getItem('cs-pinned') || '[]')
  )
  const [query, setQuery] = useState('')
  const [showPast, setShowPast] = useState(false)
  const [unpinTarget, setUnpinTarget] = useState(null)

  function pinExam(id) {
    setPinned(prev => {
      if (prev.includes(id) || prev.length >= MAX_PINS) return prev
      const next = [...prev, id]
      localStorage.setItem('cs-pinned', JSON.stringify(next))
      return next
    })
  }

  function unpinExam(id) {
    setPinned(prev => {
      const next = prev.filter(p => p !== id)
      localStorage.setItem('cs-pinned', JSON.stringify(next))
      return next
    })
    setUnpinTarget(null)
  }

  function requestUnpin(id) {
    setUnpinTarget(id)
  }

  const now = new Date()

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return exams
      .filter(e => {
        const past = new Date(e.date) < new Date(now.toDateString())
        if (!showPast && past) return false
        if (!q) return true
        return (
          e.name.toLowerCase().includes(q) ||
          e.catNo.toLowerCase().includes(q) ||
          e.dept.toLowerCase().includes(q) ||
          e.scope.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [query, showPast])

  const pinnedExams = exams.filter(e => pinned.includes(e.id))
  const upcoming = exams
    .filter(e => new Date(e.date) >= new Date(now.toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const unpinExamData = unpinTarget ? exams.find(e => e.id === unpinTarget) : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-1">Upcoming Exams</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
        Kerala PSC · July 2026 (101 exams) · August 2026 (61 exams) · Pin up to {MAX_PINS} to Home
      </p>

      {/* Pinned summary */}
      {pinnedExams.length > 0 && (
        <div className="mb-5 p-3 rounded-xl" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>
            📌 Pinned to Home ({pinnedExams.length}/{MAX_PINS})
          </div>
          <div className="flex flex-wrap gap-2">
            {pinnedExams.map(e => (
              <button key={e.id} onClick={() => requestUnpin(e.id)}
                className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--accent)' }}>
                {e.date.slice(5).replace('-', '/')} {e.name.split(' / ')[0].slice(0, 20)}…
                <span style={{ color: 'var(--text2)' }}>✕</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2 mb-5">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, cat no, dept..."
          className="flex-1 rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <button
          onClick={() => setShowPast(p => !p)}
          className="px-3 py-2 rounded-lg text-xs font-medium"
          style={{
            background: showPast ? 'var(--accent)' : 'var(--bg2)',
            color: showPast ? 'var(--accent-text)' : 'var(--text2)',
            border: '1px solid var(--border)'
          }}>
          {showPast ? 'All' : 'Upcoming'}
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-center mb-5">
        <div className="flex-1 card rounded-xl p-3">
          <div className="font-bold text-lg" style={{ color: 'var(--accent)' }}>{upcoming.length}</div>
          <div className="text-xs" style={{ color: 'var(--text2)' }}>Upcoming</div>
        </div>
        <div className="flex-1 card rounded-xl p-3">
          <div className="font-bold text-lg" style={{ color: 'var(--accent)' }}>{pinned.length}</div>
          <div className="text-xs" style={{ color: 'var(--text2)' }}>Pinned</div>
        </div>
        <div className="flex-1 card rounded-xl p-3">
          <div className="font-bold text-lg" style={{ color: 'var(--accent)' }}>{exams.length}</div>
          <div className="text-xs" style={{ color: 'var(--text2)' }}>Total Exams</div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(e => (
          <ExamRow
            key={e.id}
            exam={e}
            pinned={pinned.includes(e.id)}
            onPin={pinExam}
            onRequestUnpin={requestUnpin}
            pinCount={pinned.length}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text2)' }}>
            No exams match your search.
          </div>
        )}
      </div>

      {/* Unpin confirmation dialog */}
      <UnpinDialog
        exam={unpinExamData}
        onConfirm={() => unpinExam(unpinTarget)}
        onCancel={() => setUnpinTarget(null)}
      />
    </div>
  )
}
