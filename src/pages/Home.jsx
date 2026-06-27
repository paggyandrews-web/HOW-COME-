import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import questions from '../data/questions.json'
import papers from '../data/papers.json'
import exams from '../data/exams.json'
import FlipClock from '../components/FlipClock'

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

function ExamCard({ exam, pinned, onPin, onRequestUnpin, pinCount }) {
  const isPast = new Date(exam.date) < new Date(new Date().toDateString())
  const canPin = pinned || pinCount < MAX_PINS
  const examDate = new Date(exam.date)
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
      {/* Name + pin button */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--accent)' }}>
            Sl.{exam.slNo} · {exam.catNo}
          </div>
          <div className="font-semibold text-sm leading-snug">{exam.name}</div>
        </div>
        <button
          onPointerUp={handlePinPointerUp}
          onClick={handlePinClick}
          title={pinned ? 'Unpin' : canPin ? 'Pin to home' : 'Max 5 pins reached'}
          className="text-xl shrink-0 transition-transform active:scale-110"
          style={{
            opacity: pinned ? 1 : canPin ? 0.3 : 0.1,
            cursor: canPin ? 'pointer' : 'default',
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

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
        <div>
          <span style={{ color: 'var(--text2)' }}>Exam Date: </span>
          <span className="font-medium">{examDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text2)' }}>Exam Time: </span>
          <span className="font-medium">{exam.time}</span>
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
          <div className="col-span-2">
            <span style={{ color: 'var(--text2)' }}>Admission Tickets From: </span>
            <span className="font-medium">
              {new Date(exam.admissionFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}
        {exam.candidates && (
          <div className="col-span-2">
            <span style={{ color: 'var(--text2)' }}>Total Candidates: </span>
            <span className="font-medium">{exam.candidates.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* Flip Clock countdown */}
      {!isPast ? (
        <FlipClock dateStr={exam.date} timeStr={exam.time} compact />
      ) : (
        <span className="text-xs px-2 py-1 rounded font-medium"
          style={{ background: 'var(--bg2)', color: 'var(--text2)' }}>Exam over</span>
      )}
    </div>
  )
}

export default function Home() {
  const { user, profile, updatePinnedExams } = useAuth()
  const [pinned, setPinned] = useState(() =>
    JSON.parse(localStorage.getItem('cs-pinned') || '[]')
  )
  const [unpinTarget, setUnpinTarget] = useState(null)
  const didLoadFromFirebase = useRef(false)

  // Only apply Firebase pinned state ONCE on initial load.
  // Never overwrite local state after that — prevents race conditions
  // when multiple updatePinnedExams() calls complete out of order on slow networks.
  useEffect(() => {
    if (profile?.pinnedExams && !didLoadFromFirebase.current) {
      didLoadFromFirebase.current = true
      const local = JSON.parse(localStorage.getItem('cs-pinned') || '[]')
      const fb = profile.pinnedExams
      // Use whichever has more pins (handles offline edits)
      const merged = local.length >= fb.length ? local : fb
      setPinned(merged)
      localStorage.setItem('cs-pinned', JSON.stringify(merged))
    }
  }, [profile])

  function pinExam(id) {
    setPinned(prev => {
      if (prev.includes(id) || prev.length >= MAX_PINS) return prev
      const next = [...prev, id]
      localStorage.setItem('cs-pinned', JSON.stringify(next))
      if (user) updatePinnedExams?.(next)
      return next
    })
  }

  function unpinExam(id) {
    setPinned(prev => {
      const next = prev.filter(p => p !== id)
      localStorage.setItem('cs-pinned', JSON.stringify(next))
      if (user) updatePinnedExams?.(next)
      return next
    })
    setUnpinTarget(null)
  }

  const now = new Date()
  const today = new Date(now.toDateString())

  const upcoming = exams
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const pinnedExams = exams.filter(e => pinned.includes(e.id))
  const nearestUnpinned = upcoming.filter(e => !pinned.includes(e.id)).slice(0, 5 - pinnedExams.length)
  const homeExams = [...pinnedExams, ...nearestUnpinned]

  const years = [...new Set(papers.map(p => p.year))].sort().reverse()
  const unpinExamData = unpinTarget ? exams.find(e => e.id === unpinTarget) : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">

      {/* Hero */}
      <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
          color: 'white',
        }}>
        <div style={{
          position: 'absolute', right: -40, top: -40,
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', right: 60, bottom: -60,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">HOW COME</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)' }} className="mb-5">
            Foundation to PSC English — {questions.length} grammar questions from {papers.length} previous papers
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/quiz" className="px-5 py-2 rounded-lg font-semibold text-sm"
              style={{ background: 'white', color: 'var(--accent)' }}>
              Start Quiz →
            </Link>
            <Link to="/papers" className="px-5 py-2 rounded-lg font-medium text-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
              Browse Papers
            </Link>
            <Link to="/exams" className="px-5 py-2 rounded-lg font-medium text-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
              📅 Upcoming Exams
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['📄', papers.length, 'Question Papers'],
          ['📝', questions.length, 'Grammar Questions'],
          ['📅', years.length, 'Years Covered'],
          ['🗓️', upcoming.length, 'Upcoming Exams'],
        ].map(([icon, val, label]) => (
          <div key={label} className="card rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{val}</div>
            <div className="text-xs" style={{ color: 'var(--text2)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Exam countdown section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">📅 Upcoming Exams</h2>
          <Link to="/exams" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            View all →
          </Link>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--text2)' }}>
          Tap 📌 to pin up to {MAX_PINS} exams to this page.
        </p>
        <div className="space-y-3">
          {homeExams.map(e => (
            <ExamCard
              key={e.id}
              exam={e}
              pinned={pinned.includes(e.id)}
              onPin={pinExam}
              onRequestUnpin={setUnpinTarget}
              pinCount={pinned.length}
            />
          ))}
          {homeExams.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--text2)' }}>
              No upcoming exams found.
            </div>
          )}
        </div>
      </div>

      {/* Papers by year */}
      <div>
        <h2 className="font-bold text-lg mb-3">📚 Papers by Year</h2>
        <div className="flex flex-wrap gap-2">
          {years.map(yr => (
            <Link key={yr} to={`/papers?year=${yr}`}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              {yr} ({papers.filter(p => p.year === yr).length} papers)
            </Link>
          ))}
        </div>
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
