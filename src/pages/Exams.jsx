import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import exams from '../data/exams.json'
import FlipClock from '../components/FlipClock'
import { useAuth } from '../contexts/AuthContext'
import { formatExamMode } from '../utils/examMode'

function formatTime12h(timeStr) {
  if (!timeStr) return timeStr
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

const MAX_PINS = 5

// Confirmation-tab accent (amber) — Exam-tab keeps the app's normal --accent
const CONFIRM_COLOR = '#f59e0b'
const CONFIRM_HOVER = '#d97706'
const CONFIRM_TEXT_ON = '#1a1200'

function BookmarkIcon({ saved, color = 'var(--accent)' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24"
      fill={saved ? color : 'none'}
      stroke={color} strokeWidth="2"
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

// mode: 'exam' (dated calendar) | 'confirm' (OTR confirmation deadline)
function ExamRow({ exam, mode, saved, onSave, onRequestRemove, savedCount, highlighted }) {
  const isConfirm = mode === 'confirm'
  const accent = isConfirm ? CONFIRM_COLOR : 'var(--accent)'
  const refDateStr = isConfirm ? exam.confirmBy : exam.date
  const refTimeStr = isConfirm ? (exam.confirmTime || '23:59') : exam.time

  const atMax = !saved && savedCount >= MAX_PINS
  const refDate = new Date(refDateStr)
  const now = new Date()
  const today = new Date(now.toDateString())
  const isPast = refDate < today
  const isToday = refDate.toDateString() === now.toDateString()

  // PSC only finalizes the candidate count and exam time AFTER the
  // confirmation window closes. While confirmBy is still upcoming, the
  // candidates figure is the pre-confirmation (provisional) number.
  const candidatesPending = exam.confirmBy && new Date(exam.confirmBy) >= today
  const candidatesLabel = candidatesPending ? 'Provisional Candidates: ' : 'Total Candidates: '

  function handleBookmark(e) {
    e.stopPropagation()
    if (atMax) return
    if (saved) onRequestRemove(exam.id)
    else onSave(exam.id)
  }

  return (
    <div id={exam.id} className="card rounded-xl p-4"
      style={{
        opacity: exam.cancelled ? 0.5 : isPast ? 0.55 : 1,
        borderLeft: exam.cancelled ? '4px solid #ef4444'
          : saved ? `4px solid ${accent}` : highlighted ? `4px solid ${accent}` : '4px solid transparent',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        boxShadow: highlighted ? `0 0 0 2px ${accent}` : undefined,
      }}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold mb-0.5" style={{ color: accent }}>
            Sl. {exam.slNo} · {exam.catNo}
          </div>
          {exam.cancelled && (
            <div className="inline-block text-xs font-bold px-2 py-0.5 rounded mb-1"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' }}>
              CANCELLED
            </div>
          )}
          <div className="font-semibold text-sm leading-snug mb-0.5"
            style={{ textDecoration: exam.cancelled ? 'line-through' : 'none' }}>{exam.name}</div>
          <div className="text-xs" style={{ color: 'var(--text2)' }}>{exam.dept}</div>
          {exam.cancelled && exam.cancelledNote && (
            <div className="text-xs mt-1" style={{ color: '#ef4444' }}>{exam.cancelledNote}</div>
          )}
        </div>
        {!isConfirm && (
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
            <BookmarkIcon saved={saved} color={accent} />
          </button>
        )}
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
        {!isConfirm ? (
          <>
            <div>
              <span style={{ color: 'var(--text2)' }}>Exam Date: </span>
              <span className="font-medium">
                {refDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {isToday && <span className="ml-1 font-bold" style={{ color: '#ef4444' }}>TODAY!</span>}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text2)' }}>Exam Time: </span>
              <span className="font-medium">{exam.time ? formatTime12h(exam.time) : 'TBA (see Admit Card)'}</span>
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
                <span style={{ color: 'var(--text2)' }}>{candidatesLabel}</span>
                <span className="font-medium">{exam.candidates.toLocaleString('en-IN')}</span>
              </div>
            )}
            {exam.confirmBy && candidatesPending && (
              <div className="col-span-2">
                <span style={{ color: CONFIRM_COLOR }}>⚠ Confirm by: </span>
                <span className="font-medium">
                  {new Date(exam.confirmBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <span style={{ color: 'var(--text2)' }}>Confirm by: </span>
              <span className="font-medium">
                {refDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {isToday && <span className="ml-1 font-bold" style={{ color: '#ef4444' }}>TODAY!</span>}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text2)' }}>Scope: </span>
              <span className="font-medium">{exam.scope}</span>
            </div>
            {exam.date && (
              <div>
                <span style={{ color: 'var(--text2)' }}>Exam Date: </span>
                <span className="font-medium">
                  {new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
            {exam.mode && (
              <div>
                <span style={{ color: 'var(--text2)' }}>Mode: </span>
                <span className="font-medium">{formatExamMode(exam.mode).label}</span>
              </div>
            )}
            {exam.mode && !formatExamMode(exam.mode).confirmed && (
              <div className="col-span-2 text-xs" style={{ color: 'var(--text2)', opacity: 0.85 }}>
                ⓘ {formatExamMode(exam.mode).note}
              </div>
            )}
            {exam.candidates && (
              <div>
                <span style={{ color: 'var(--text2)' }}>{candidatesLabel}</span>
                <span className="font-medium">{exam.candidates.toLocaleString('en-IN')}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Countdown */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs">
          {exam.cancelled ? (
            <span style={{ color: '#ef4444' }}>This exam will not be held</span>
          ) : isPast ? (
            <span style={{ color: 'var(--text2)' }}>{isConfirm ? 'Confirmation closed' : 'Completed'}</span>
          ) : isConfirm ? (
            <span className="font-bold px-2.5 py-1.5 rounded-full"
              style={{ background: CONFIRM_COLOR, color: CONFIRM_TEXT_ON, whiteSpace: 'nowrap' }}>
              Time left to confirm
            </span>
          ) : (
            <span style={{ color: 'var(--text2)' }}>Time remaining</span>
          )}
        </div>
        {exam.cancelled
          ? <span className="text-xs px-2 py-1 rounded font-semibold"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Cancelled</span>
          : !isPast
          ? <FlipClock dateStr={refDateStr} timeStr={refTimeStr} compact color={accent}
              overLabel={isConfirm ? 'Confirmation Closed' : 'Exam Day / Over'} />
          : <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg2)', color: 'var(--text2)' }}>
              {isConfirm ? 'Closed' : 'Done'}
            </span>
        }
      </div>
    </div>
  )
}

export default function Exams() {
  const { pinnedExams: saved, pinExam, unpinExam } = useAuth()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('exam') // 'exam' | 'confirm'
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

  // Scroll to and highlight the target exam when arriving via hash; also switch to its tab
  useEffect(() => {
    if (!hashId) return
    const target = exams.find(e => e.id === hashId)
    if (target) setActiveTab(target.date ? 'exam' : 'confirm')
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
  const today = new Date(now.toDateString())

  // Exam Calendar = every exam with a known test date (the master calendar).
  // Confirmation Calendar = every exam that still needs an OTR confirmation
  // action by a deadline. PSC often publishes both at once (test date known,
  // but you still must confirm by a cutoff) — so an exam can appear in BOTH
  // tabs at the same time. Once its confirmBy date passes it just fades to
  // "Confirmation closed" in that tab; nothing needs to be deleted, and if an
  // exam is added with only a confirmBy (no date yet), it lives in the
  // Confirmation tab alone until PSC later publishes the date.
  const examCalendar = useMemo(() => exams.filter(e => e.date), [])
  const confirmCalendar = useMemo(() => exams.filter(e => e.confirmBy), [])

  const isConfirmTab = activeTab === 'confirm'
  const currentList = isConfirmTab ? confirmCalendar : examCalendar
  const dateField = isConfirmTab ? 'confirmBy' : 'date'
  const accent = isConfirmTab ? CONFIRM_COLOR : 'var(--accent)'

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return currentList
      .filter(e => {
        // Saved exams render in their own section above — never here, or a
        // hash-targeted saved exam would appear twice.
        if (!isConfirmTab && saved.includes(e.id)) return false
        // Always include the hash-targeted exam so it can be scrolled to
        if (e.id === hashId) return true
        const past = new Date(e[dateField]) < today
        if (!showPast && past) return false
        if (!q) return true
        return (
          e.name.toLowerCase().includes(q) ||
          e.catNo.toLowerCase().includes(q) ||
          e.dept.toLowerCase().includes(q) ||
          (e.scope || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(a[dateField]) - new Date(b[dateField]))
  }, [query, showPast, hashId, activeTab])

  const savedExams = examCalendar.filter(e => saved.includes(e.id))

  // Saved exams respect the same search box as the main list, but are NOT
  // hidden by the past filter — a saved exam should never silently disappear.
  const savedShown = useMemo(() => {
    const q = query.toLowerCase()
    return savedExams
      .filter(e => !q || (
        e.name.toLowerCase().includes(q) ||
        e.catNo.toLowerCase().includes(q) ||
        e.dept.toLowerCase().includes(q) ||
        (e.scope || '').toLowerCase().includes(q)
      ))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [query, saved])
  // A cancelled exam is not "upcoming" — it must never be counted or counted down to.
  const upcomingExams = examCalendar.filter(e => !e.cancelled && new Date(e.date) >= today)
  const upcomingConfirms = confirmCalendar.filter(e => new Date(e.confirmBy) >= today)

  const removeExamData = removeTarget ? exams.find(e => e.id === removeTarget) : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-1">Upcoming Exams</h1>
      <p className="text-sm mb-3" style={{ color: 'var(--text2)' }}>
        Kerala PSC · {examCalendar.length} scheduled · {confirmCalendar.length} awaiting confirmation
      </p>

      {/* Government-info source + disclaimer, required alongside PSC notification data */}
      <div className="text-xs mb-5 p-3 rounded-xl" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
        Sourced from official KPSC notifications:{' '}
        <a href="https://www.keralapsc.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
          keralapsc.gov.in
        </a>
        . HOW COME? is an independent study app and is not affiliated with, endorsed by, or connected to the Kerala Public Service Commission or the Government of Kerala.
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setActiveTab('exam')}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{
            background: !isConfirmTab ? 'var(--accent)' : 'var(--bg2)',
            color: !isConfirmTab ? 'var(--accent-text)' : 'var(--text2)',
            border: '1px solid var(--border)',
            touchAction: 'manipulation',
          }}>
          📅 Exam Calendar
        </button>
        <button
          onClick={() => setActiveTab('confirm')}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{
            background: isConfirmTab ? CONFIRM_COLOR : 'var(--bg2)',
            color: isConfirmTab ? CONFIRM_TEXT_ON : 'var(--text2)',
            border: '1px solid var(--border)',
            touchAction: 'manipulation',
          }}>
          ✍️ Confirmation Needed{confirmCalendar.length > 0 ? ` (${confirmCalendar.length})` : ''}
        </button>
      </div>

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
            background: showPast ? accent : 'var(--bg2)',
            color: showPast ? (isConfirmTab ? CONFIRM_TEXT_ON : 'var(--accent-text)') : 'var(--text2)',
            border: '1px solid var(--border)',
            touchAction: 'manipulation',
          }}>
          {showPast ? 'All' : 'Upcoming'}
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-center mb-5">
        {!isConfirmTab ? (
          <>
            <div className="flex-1 card rounded-xl p-3">
              <div className="font-bold text-lg" style={{ color: accent }}>{upcomingExams.length}</div>
              <div className="text-xs" style={{ color: 'var(--text2)' }}>Upcoming</div>
            </div>
            <div className="flex-1 card rounded-xl p-3">
              <div className="font-bold text-lg" style={{ color: accent }}>{savedExams.length}</div>
              <div className="text-xs" style={{ color: 'var(--text2)' }}>Saved</div>
            </div>
            <div className="flex-1 card rounded-xl p-3">
              <div className="font-bold text-lg" style={{ color: accent }}>{examCalendar.length}</div>
              <div className="text-xs" style={{ color: 'var(--text2)' }}>Total Exams</div>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 card rounded-xl p-3">
              <div className="font-bold text-lg" style={{ color: accent }}>{upcomingConfirms.length}</div>
              <div className="text-xs" style={{ color: 'var(--text2)' }}>Open</div>
            </div>
            <div className="flex-1 card rounded-xl p-3">
              <div className="font-bold text-lg" style={{ color: accent }}>{confirmCalendar.length - upcomingConfirms.length}</div>
              <div className="text-xs" style={{ color: 'var(--text2)' }}>Closed</div>
            </div>
            <div className="flex-1 card rounded-xl p-3">
              <div className="font-bold text-lg" style={{ color: accent }}>{confirmCalendar.length}</div>
              <div className="text-xs" style={{ color: 'var(--text2)' }}>Total</div>
            </div>
          </>
        )}
      </div>

      {/* Saved exams — excluded from `filtered` above (line ~317) so they don't
          appear twice, so they must be rendered here or they vanish entirely. */}
      {!isConfirmTab && savedShown.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            <h2 className="font-bold text-sm">Saved ({savedShown.length})</h2>
          </div>
          <div className="space-y-3">
            {savedShown.map(e => (
              <ExamRow
                key={e.id}
                exam={e}
                mode={activeTab}
                saved={true}
                onSave={pinExam}
                onRequestRemove={setRemoveTarget}
                savedCount={savedExams.length}
                highlighted={highlightId === e.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.map(e => (
          <ExamRow
            key={e.id}
            exam={e}
            mode={activeTab}
            saved={!isConfirmTab && saved.includes(e.id)}
            onSave={pinExam}
            onRequestRemove={setRemoveTarget}
            savedCount={savedExams.length}
            highlighted={highlightId === e.id}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text2)' }}>
            {isConfirmTab && confirmCalendar.length === 0
              ? 'No exams need confirmation right now.'
              : 'No exams match your search.'}
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
