import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import papers from '../data/papers.json'
import exams from '../data/exams.json'
import FlipClock from '../components/FlipClock'
import { useStreak } from '../hooks/useStreak'
import { formatExamMode } from '../utils/examMode'
import { isPromoActive, promoEndLabel, promoDeadlineParts } from '../utils/freeTier'

const MAX_PINS = 5

function formatTime12h(timeStr) {
  if (!timeStr) return timeStr
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

/* ── Book + Question Mark illustration ─────────────────────────────── */
function BookIllustration() {
  return (
    <svg viewBox="0 0 160 155" width="145" height="140" xmlns="http://www.w3.org/2000/svg">
      {/* ground glow */}
      <ellipse cx="80" cy="138" rx="48" ry="8" fill="rgba(0,188,170,0.12)" />

      {/* left page */}
      <path d="M18 60 Q18 50 28 50 L76 50 L76 108 L18 108 Z"
            fill="rgba(0,188,170,0.07)" stroke="rgba(0,188,170,0.45)" strokeWidth="1.5"/>
      <line x1="28" y1="63" x2="66" y2="63" stroke="rgba(0,188,170,0.28)" strokeWidth="1"/>
      <line x1="28" y1="70" x2="66" y2="70" stroke="rgba(0,188,170,0.28)" strokeWidth="1"/>
      <line x1="28" y1="77" x2="66" y2="77" stroke="rgba(0,188,170,0.28)" strokeWidth="1"/>
      <line x1="28" y1="84" x2="66" y2="84" stroke="rgba(0,188,170,0.28)" strokeWidth="1"/>
      <line x1="28" y1="91" x2="52" y2="91" stroke="rgba(0,188,170,0.28)" strokeWidth="1"/>

      {/* right page */}
      <path d="M84 50 L132 50 Q142 50 142 60 L142 108 L84 108 Z"
            fill="rgba(0,188,170,0.07)" stroke="rgba(0,188,170,0.45)" strokeWidth="1.5"/>
      <line x1="94" y1="63" x2="132" y2="63" stroke="rgba(0,188,170,0.28)" strokeWidth="1"/>
      <line x1="94" y1="70" x2="132" y2="70" stroke="rgba(0,188,170,0.28)" strokeWidth="1"/>
      <line x1="94" y1="77" x2="132" y2="77" stroke="rgba(0,188,170,0.28)" strokeWidth="1"/>
      <line x1="94" y1="84" x2="132" y2="84" stroke="rgba(0,188,170,0.28)" strokeWidth="1"/>
      <line x1="94" y1="91" x2="118" y2="91" stroke="rgba(0,188,170,0.28)" strokeWidth="1"/>

      {/* spine */}
      <path d="M76 50 L84 50 L84 108 L76 108 Z" fill="rgba(0,188,170,0.35)"/>

      {/* bottom shelf */}
      <rect x="14" y="107" width="132" height="7" rx="3.5" fill="rgba(0,188,170,0.2)"/>

      {/* question-mark halo */}
      <circle cx="80" cy="26" r="24" fill="rgba(0,188,170,0.08)"/>
      <circle cx="80" cy="26" r="16" fill="rgba(0,188,170,0.06)"/>

      {/* question mark */}
      <text x="80" y="36" textAnchor="middle"
            fontSize="30" fontWeight="900" fontFamily="Georgia,serif"
            fill="rgba(0,220,200,0.95)">?</text>

      {/* sparkle dots */}
      <circle cx="14" cy="44" r="2"   fill="rgba(0,188,170,0.55)"/>
      <circle cx="148" cy="58" r="1.5" fill="rgba(0,188,170,0.45)"/>
      <circle cx="152" cy="85" r="1"   fill="rgba(0,188,170,0.35)"/>
      <circle cx="8"   cy="78" r="1.5" fill="rgba(0,188,170,0.4)"/>
      <circle cx="144" cy="38" r="1"   fill="rgba(0,188,170,0.35)"/>
    </svg>
  )
}

/* ── Free-period announcement ───────────────────────────────────────
   Same visual language as the Study Streak card, one size down.
   Auto-hides the moment the promo ends — no cleanup needed later.
   Counts are read from the data files, so they rise on their own each
   time a paper is added. No price is named here, deliberately.        */
function PromoBanner({ questionCount, paperCount }) {
  if (!isPromoActive()) return null
  const { dateStr, timeStr } = promoDeadlineParts()

  return (
    <div className="rounded-2xl p-3"
      style={{
        background: 'linear-gradient(135deg, #06201d 0%, #041a18 100%)',
        border: '1px solid rgba(26,157,142,0.3)',
      }}>
      <div className="flex items-start gap-3">
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: 'rgba(26,157,142,0.14)',
          border: '1px solid rgba(26,157,142,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>🎁</div>

        {/* Left: headline on top, counts below */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
            Free to use until {promoEndLabel()}
          </div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>
            {questionCount != null ? questionCount.toLocaleString('en-IN') : '—'} questions
            {' · '}{paperCount} question papers
          </div>
        </div>

        {/* Right: live counter, no D/H/M/S captions */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Time left
          </div>
          <div style={{ marginTop: 6 }}>
            <FlipClock dateStr={dateStr} timeStr={timeStr} compact hideLabels
              overLabel="Free period over" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── "New exam dates" announcement ──────────────────────────────────
   Shows while October 2026 still has upcoming exams, then hides itself.
   Reads the exam data directly, so the count stays accurate on its own. */
function ExamDatesBanner() {
  const today = new Date(new Date().toDateString())
  const octUpcoming = exams.filter(e =>
    !e.cancelled && e.date && e.date.startsWith('2026-10') && new Date(e.date) >= today
  )
  if (octUpcoming.length === 0) return null

  return (
    <Link to="/exams"
      className="flex items-center gap-3 rounded-2xl p-3"
      style={{
        background: 'linear-gradient(135deg, #2a1c05 0%, #1c1303 100%)',
        border: '1px solid rgba(245,158,11,0.4)',
        textDecoration: 'none',
      }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: 'rgba(245,158,11,0.16)',
        border: '1px solid rgba(245,158,11,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-bold text-sm" style={{ color: '#f59e0b' }}>
          October exam dates are out! 🗓️
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {octUpcoming.length} PSC exams scheduled in October — tap to view
        </div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </Link>
  )
}

/* ── Circular flame ring for streak ────────────────────────────────── */
function StreakRing({ days }) {
  const SIZE = 70, R = 28
  const C = 2 * Math.PI * R
  const offset = C * (1 - Math.min(days / 30, 1))
  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={SIZE/2} cy={SIZE/2} r={R}
                fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
        <circle cx={SIZE/2} cy={SIZE/2} r={R}
                fill="none" stroke="url(#flameGrad)" strokeWidth="4"
                strokeDasharray={C} strokeDashoffset={offset}
                strokeLinecap="round"/>
        <defs>
          <linearGradient id="flameGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b35"/>
            <stop offset="100%" stopColor="#ffd700"/>
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 26, lineHeight: 1,
      }}>🔥</div>
    </div>
  )
}

/* ── Day-dot indicators ─────────────────────────────────────────────── */
function StreakDots({ days }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 28, height: 28, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: i < Math.min(days, 3) ? 'var(--accent-green)' : 'rgba(255,255,255,0.07)',
          border: i < Math.min(days, 3) ? 'none' : '1.5px dashed rgba(255,255,255,0.18)',
        }}>
          {i < Math.min(days, 3) && (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 6.5L5 9.5L11 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Bookmark icon ──────────────────────────────────────────────────── */
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

/* ── Remove dialog ──────────────────────────────────────────────────── */
function RemoveDialog({ exam, onConfirm, onCancel }) {
  if (!exam) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}
      onClick={onCancel}>
      <div className="card rounded-2xl p-5 w-full max-w-sm mx-4"
        onClick={e => e.stopPropagation()}>
        <div className="text-base font-semibold mb-1">Remove from Home?</div>
        <div className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
          {exam.name.split(' / ')[0]}
        </div>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>Remove</button>
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ── Saved exam card ────────────────────────────────────────────────── */
function ExamCard({ exam, saved, onSave, onRequestRemove, savedCount }) {
  const isPast = new Date(exam.date) < new Date(new Date().toDateString())
  const atMax  = !saved && savedCount >= MAX_PINS
  const examDate = new Date(exam.date)

  function handleBookmark(e) {
    e.stopPropagation()
    if (atMax) return
    if (saved) onRequestRemove(exam.id)
    else onSave(exam.id)
  }

  const isToday = examDate.toDateString() === new Date().toDateString()

  return (
    <div className="card rounded-xl p-4"
      style={{
        opacity: exam.cancelled ? 0.5 : isPast ? 0.55 : 1,
        borderLeft: exam.cancelled ? '4px solid #ef4444'
          : saved ? '4px solid var(--accent)' : '4px solid transparent',
        transition: 'border-color 0.3s ease',
      }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--accent)' }}>
            Sl.{exam.slNo} · {exam.catNo}
          </div>
          {exam.cancelled && (
            <div className="inline-block text-xs font-bold px-2 py-0.5 rounded mb-1"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' }}>
              CANCELLED
            </div>
          )}
          <div className="font-semibold text-sm leading-snug"
            style={{ textDecoration: exam.cancelled ? 'line-through' : 'none' }}>{exam.name}</div>
          {exam.dept && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{exam.dept}</div>
          )}
        </div>
        <button type="button" onClick={handleBookmark}
          title={saved ? 'Remove from Home' : atMax ? 'Max 5 saved' : 'Save to Home'}
          className="shrink-0 transition-transform active:scale-110"
          style={{
            opacity: saved ? 1 : atMax ? 0.2 : 0.7,
            pointerEvents: atMax ? 'none' : 'auto',
            padding: '6px 8px', minWidth: '44px', minHeight: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            background: 'none', border: 'none', cursor: 'pointer',
          }}>
          <BookmarkIcon saved={saved} />
        </button>
      </div>

      {/* Full detail grid */}
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
          <span className="font-medium">{formatExamMode(exam.mode).label}</span>
          {!formatExamMode(exam.mode).confirmed && (
            <span title={formatExamMode(exam.mode).note}
              style={{ color: 'var(--text2)', marginLeft: 4, cursor: 'help' }}>*</span>
          )}
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
            <span style={{ color: 'var(--text2)' }}>Candidates: </span>
            <span className="font-medium">{exam.candidates.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* Countdown */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs" style={{ color: 'var(--text2)' }}>
          {exam.cancelled ? <span style={{ color: '#ef4444' }}>This exam will not be held</span>
            : isPast ? 'Completed' : 'Time remaining'}
        </div>
        {exam.cancelled
          ? <span className="text-xs px-2 py-1 rounded font-semibold"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Cancelled</span>
          : !isPast
          ? <FlipClock dateStr={exam.date} timeStr={exam.time} compact />
          : <span className="text-xs px-2 py-1 rounded font-medium"
              style={{ background: 'var(--bg2)', color: 'var(--text2)' }}>Exam over</span>
        }
      </div>
    </div>
  )
}

/* ══ Main Home page ═════════════════════════════════════════════════ */
export default function Home() {
  const { user, pinnedExams: pinnedIds, pinExam, unpinExam } = useAuth()
  const navigate = useNavigate()
  const [removeTarget, setRemoveTarget] = useState(null)
  const [streak, setStreak]             = useState(0)
  const [questionCount, setQuestionCount] = useState(null)
  const { getStreak } = useStreak()

  useEffect(() => {
    getStreak().then(s => setStreak(s.currentStreak || 0))
  }, [user])

  // questions.json is ~3MB — load it lazily off the critical render path
  // instead of bundling it into Home's (eager) chunk just for a count.
  useEffect(() => {
    import('../data/questions.json').then(mod => setQuestionCount(mod.default.length))
  }, [])

  function handleUnpin(id) { unpinExam(id); setRemoveTarget(null) }

  const now         = new Date()
  const today       = new Date(now.toDateString())
  const upcoming    = exams.filter(e => !e.cancelled && new Date(e.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date))
  const pinnedExams = exams.filter(e => pinnedIds.includes(e.id)).slice(0, 5)
  const removeExamData = removeTarget ? exams.find(e => e.id === removeTarget) : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

      {/* ── Hero card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(140deg, #071a2e 0%, #082030 55%, #060e1a 100%)',
          border: '1px solid rgba(26,157,142,0.22)',
          minHeight: 158,
        }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="font-bold mb-0.5" style={{ fontSize: 22, lineHeight: 1.15 }}>
            <span style={{ color: 'var(--accent)' }}>HOW </span>
            <span style={{ color: '#ffffff' }}>COME</span>
            <span style={{ color: 'var(--accent)' }}>?</span>
          </h1>
          <p className="text-sm font-semibold mb-3" style={{ color: 'rgba(0,200,180,0.8)' }}>
            Foundation to PSC English
          </p>

          {/* Stats row */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 rounded-xl px-3 py-2.5 text-center" style={{ background: 'rgba(26,157,142,0.12)', border: '1px solid rgba(26,157,142,0.25)' }}>
              <div className="font-black text-xl leading-none" style={{ color: 'var(--accent)' }}>{papers.length}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Question Papers</div>
            </div>
            <div className="flex-1 rounded-xl px-3 py-2.5 text-center" style={{ background: 'rgba(26,157,142,0.12)', border: '1px solid rgba(26,157,142,0.25)' }}>
              <div className="font-black text-xl leading-none" style={{ color: 'var(--accent)' }}>{questionCount ?? '—'}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Questions</div>
            </div>
          </div>

          <div className="flex justify-center">
            <Link to="/quiz"
              className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              Start Quiz →
            </Link>
          </div>
        </div>
      </div>

      {/* ── New exam dates announcement ───────────────────────────── */}
      <ExamDatesBanner />

      {/* ── Free-period announcement ──────────────────────────────── */}
      <PromoBanner questionCount={questionCount} paperCount={papers.length} />

      {/* ── Study Streak card ─────────────────────────────────────── */}
      {streak > 0 && (
        <div className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, #160800 0%, #1c0a00 100%)',
            border: '1px solid rgba(255,107,53,0.22)',
          }}>
          <div className="flex items-center gap-4">
            <StreakRing days={streak} />
            <div style={{ flex: 1 }}>
              <div className="font-black" style={{ fontSize: 22, lineHeight: 1, color: 'white' }}>
                {streak} {streak === 1 ? 'DAY' : 'DAYS'}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {streak >= 30 ? 'Unstoppable! Legend 🏆'
                  : streak >= 14 ? 'Two weeks of dedication! ⚡'
                  : streak >= 7  ? 'One full week! Keep it up! 💪'
                  : streak >= 3  ? "Building momentum! Don't stop!"
                  : 'Great start! Keep the streak alive!'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="text-xs font-bold mb-1"
                style={{ color: 'var(--accent)', letterSpacing: '0.06em' }}>STUDY STREAK</div>
              <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Don't break it!
              </div>
              <StreakDots days={streak} />
            </div>
          </div>
        </div>
      )}

      {/* ── Upcoming Exams row ────────────────────────────────────── */}
      <Link to="/exams"
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', textDecoration: 'none' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: 'rgba(26,157,142,0.1)',
          border: '1px solid rgba(26,157,142,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div className="font-semibold text-sm">Upcoming Exams</div>
          <div className="text-xs" style={{ color: 'var(--text2)' }}>Stay prepared, stay ahead.</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="font-bold text-sm px-2.5 py-1 rounded-full"
            style={{ background: 'var(--bg2)', color: 'var(--text)' }}>
            {upcoming.length}
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--text2)" strokeWidth="2" strokeLinecap="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </Link>

      {/* ── Saved Exams ──────────────────────────────────────────── */}
      {pinnedExams.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              <h2 className="font-bold text-base">Saved Exams</h2>
            </div>
            <Link to="/exams" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {pinnedExams.map(e => (
              <ExamCard key={e.id} exam={e}
                saved={true} onSave={pinExam}
                onRequestRemove={setRemoveTarget}
                savedCount={pinnedExams.length}
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

      <RemoveDialog
        exam={removeExamData}
        onConfirm={() => handleUnpin(removeTarget)}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}
