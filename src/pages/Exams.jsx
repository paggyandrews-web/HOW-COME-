import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import exams from '../data/exams.json'
import FlipClock from '../components/FlipClock'
import { useAuth } from '../contexts/AuthContext'

function formatTime12h(timeStr) {
  if (!timeStr) return timeStr
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

const MAX_PINS = 5

function BookmarkIcon({ saved }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24"
      fill={saved ? 'var(--accent)' : 'none'}
      stroke="var(--accent)" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function RemoveDialog({ exam, onConfirm, onCancel }) {
  if (!exam) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}
      onClick={onCancel}
    >
      <div
        className="card rounded-2xl p-5 w-full max-w-sm mx-4 mb-4 sm:mb-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-base font-semibold mb-1">Remove from Home?</div>
        <div className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
          {exam.name.split(' / ')[0]}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            Remove
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

function ExamRow({ exam, saved, onSave, onRequestRemove, savedCount, highlighted }) {
  const atMax = !saved && savedCount >= MAX_PINS
  const examDate = new Date(exam.date)
  const now = new Date()
  const today = new Date(now.toDateString())
  const isPast = examDate < today
  const isToday = examDate.toDateString() === now.toDateString()

  function handleBookmark(e) {
    e.stopPropagation()
    if (atMax) return
    if (saved) onRequestRemove(exam.id)
    else onSave(exam.id)
  }

  return (
    <div id={exam.id} className="card rounded-xl p-4"
      style={{
        opacity: isPast ? 0.55 : 1,
        borderLeft: saved ? '4px solid var(--accent)' : highlighted ? '4px solid var(--accent)' : '4px solid transparent',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        boxShadow: highlighted ? '0 0 0 2px var(--accent)' : undefined,
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
          type="button"
          onClick={handleBookmark}
          title={saved ? 'Remove from Home' : atMax ? 'Max 5 saved' : 'Save to Home'}
          className="shrink-0 mt-0.5 transition-transform active:scale-110"
          style={{
            opacity: saved ? 1 : atMax ? 0.2 : 0.7,
            pointerEvents: atMax ? 'none' : 'auto',
            padding: '6px 8px',
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}>
          <BookmarkIcon saved={saved} />
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
            <span style={{ color: 'var(--text2)' }}>Admit Card from: </span>
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

      {/* Countdown */}
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
  const { pinnedExams: saved, pinExam, unpinExam } = useAuth()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [showPast, setShowPast] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [highlightId, setHighlightId] = useState(null)

  // Read hash target (e.g. /exams#exam-id)
  const hashId = location.hash ? location.hash.slice(1) : null

  // Clean up stale IDs that no longer exist in exams data
  useEffect(() => {
    const validIds = new Set(exams.map(e => e.id))
    saved.forEach(id => {
      if (!validIds.has(id)) unpinExam(id)
    })
  }, [])

  // Scroll to and highlight the target exam when arriving via hash
  useEffect(() => {
    if (!hashId) return
    setHighlightId(hashId)
    // Give the DOM a moment to render then scroll
    setTimeout(() => {
      const el = document.getElementById(hashId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 150)
    // Remove highlight after 2 seconds
    const t = setTimeout(() => setHighlightId(null), 2500)
    return () => clearTimeout(t)
  }, [hashId])

  function handleRemove(id) {
    unpinExam(id)
    setRemoveTarget(null)
  }

  const now = new Date()

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return exams
      .filter(e => {
        // Always include the hash-targeted exam so it can be scrolled to
        if (e.id === hashId) return true
        if (saved.includes(e.id)) return false
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
  }, [query, showPast, hashId])

  const savedExams = exams.filter(e => saved.includes(e.id))
  const upcoming = exams
    .filter(e => new Date(e.date) >= new Date(now.toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const removeExamData = removeTarget ? exams.find(e => e.id === removeTarget) : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-1">Upcoming Exams</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
        Kerala PSC · July 2026 (101 exams) · August 2026 (61 exams) · Bookmark up to {MAX_PINS} to Home
      </p>

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
            border: '1px solid var(--border)',
            touchAction: 'manipulation',
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
          <div className="font-bold text-lg" style={{ color: 'var(--accent)' }}>{savedExams.length}</div>
          <div className="text-xs" style={{ color: 'var(--text2)' }}>Saved</div>
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
            saved={saved.includes(e.id)}
            onSave={pinExam}
            onRequestRemove={setRemoveTarget}
            savedCount={savedExams.length}
            highlighted={highlightId === e.id}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text2)' }}>
            No exams match your search.
          </div>
        )}
      </div>

      {/* Remove confirmation dialog */}
      <RemoveDialog
        exam={removeExamData}
        onConfirm={() => handleRemove(removeTarget)}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}
