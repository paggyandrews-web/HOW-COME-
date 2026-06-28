import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import questions from '../data/questions.json'
import papers from '../data/papers.json'
import exams from '../data/exams.json'
import FlipClock from '../components/FlipClock'
import { useStreak } from '../hooks/useStreak'

const MAX_PINS = 5

function formatTime12h(timeStr) {
  if (!timeStr) return timeStr
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

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

function ExamCard({ exam, saved, onSave, onRequestRemove, savedCount }) {
  const isPast = new Date(exam.date) < new Date(new Date().toDateString())
  const canSave = saved || savedCount < MAX_PINS
  const examDate = new Date(exam.date)

  function handleBookmark() {
    if (!canSave) return
    if (saved) {
      onRequestRemove(exam.id)
    } else {
      onSave(exam.id)
    }
  }

  return (
    <div className="card rounded-xl p-4"
      style={{
        opacity: isPast ? 0.55 : 1,
        borderLeft: saved ? '4px solid var(--accent)' : '4px solid transparent',
        transition: 'border-color 0.3s ease',
      }}>
      {/* Name + bookmark button */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--accent)' }}>
            Sl.{exam.slNo} · {exam.catNo}
          </div>
          <div className="font-semibold text-sm leading-snug">{exam.name}</div>
        </div>
        <button
          onClick={handleBookmark}
          title={saved ? 'Remove from Home' : canSave ? 'Save to Home' : 'Max 5 saved'}
          className="shrink-0 transition-transform active:scale-110"
          style={{
            opacity: saved ? 1 : canSave ? 0.4 : 0.15,
            cursor: canSave ? 'pointer' : 'not-allowed',
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
          }}>
          <BookmarkIcon saved={saved} />
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
  const navigate = useNavigate()
  const [pinned, setPinned] = useState(() =>
    JSON.parse(localStorage.getItem('cs-pinned') || '[]')
  )
  const [removeTarget, setRemoveTarget] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const didLoadFromFirebase = useRef(false)
  const [streak, setStreak] = useState(0)
  const { getStreak } = useStreak()

  useEffect(() => {
    getStreak().then(s => setStreak(s.currentStreak || 0))
  }, [user])

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
    setRemoveTarget(null)
  }

  const now = new Date()
  const today = new Date(now.toDateString())

  const upcoming = exams
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const pinnedExams = exams.filter(e => pinned.includes(e.id))

  const years = [...new Set(papers.map(p => p.year))].sort().reverse()
  const removeExamData = removeTarget ? exams.find(e => e.id === removeTarget) : null

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
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>HOW </span>
            <span style={{ color: '#ffffff', fontWeight: 800 }}>COME</span>
            <span style={{ color: '#14b8a6', fontWeight: 800 }}>?</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)' }} className="mb-4">
            Foundation to PSC English — {questions.length} grammar questions from {papers.length} previous papers
          </p>

          {/* Streak — big and motivational */}
          {streak > 0 && (
            <div
              className="flex items-center gap-3 mb-4 px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <span style={{ fontSize: 42, lineHeight: 1 }}>🔥</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, color: 'white' }}>
                  {streak} {streak === 1 ? 'Day' : 'Days'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>
                  {streak >= 30
                    ? 'Unstoppable! You are a legend 🏆'
                    : streak >= 14
                    ? 'Two weeks of dedication! ⚡'
                    : streak >= 7
                    ? 'One full week! Keep it up! 💪'
                    : streak >= 3
                    ? "Building momentum! Don't stop!"
                    : 'Great start! Keep the streak alive!'}
                </div>
              </div>
              <div style={{ textAlign: 'right', opacity: 0.8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>STUDY STREAK</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Don't break it!</div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link to="/quiz" className="px-5 py-2 rounded-lg font-semibold text-sm"
              style={{ background: 'white', color: 'var(--accent)' }}>
              Start Quiz →
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

      {/* Search bar */}
      <div className="relative">
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
              navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
            }
          }}
          placeholder="🔍  Search questions by keyword, topic, grammar rule..."
          className="w-full rounded-xl px-4 py-3.5 text-sm"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            outline: 'none',
          }}
        />
        {searchQuery.trim().length >= 2 && (
          <button
            onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)', touchAction: 'manipulation' }}
          >
            Search
          </button>
        )}
      </div>

      {/* Pinned Exams */}
      {pinnedExams.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">🔖 Saved Exams</h2>
            <Link to="/exams" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {pinnedExams.map(e => (
              <ExamCard
                key={e.id}
                exam={e}
                saved={true}
                onSave={pinExam}
                onRequestRemove={setRemoveTarget}
                savedCount={pinned.length}
              />
            ))}
          </div>
        </div>
      )}

      {pinnedExams.length === 0 && (
        <div className="card rounded-xl p-5 text-center">
          <div className="text-2xl mb-2">🔖</div>
          <p className="text-sm font-medium mb-1">No exams saved yet</p>
          <p className="text-xs mb-3" style={{ color: 'var(--text2)' }}>
            Bookmark upcoming exams to track their countdowns here.
          </p>
          <Link to="/exams" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            Browse Upcoming Exams →
          </Link>
        </div>
      )}

      {/* Remove confirmation dialog */}
      <RemoveDialog
        exam={removeExamData}
        onConfirm={() => unpinExam(removeTarget)}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}
