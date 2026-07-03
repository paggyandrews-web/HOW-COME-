import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useBookmarks } from '../hooks/useBookmarks'
import { usePaperBookmarks } from '../hooks/usePaperBookmarks'
import papers from '../data/papers.json'
import questions from '../data/questions.json'
import exams from '../data/exams.json'

/* ── Utility ─────────────────────────────────────────────────────── */
const qCountByPaper = {}
questions.forEach(q => { qCountByPaper[q.paperId] = (qCountByPaper[q.paperId] || 0) + 1 })

/* ── Papers tab ─────────────────────────────────────────────────── */
function PapersTab() {
  const { paperBookmarks, toggle } = usePaperBookmarks()
  const saved = papers.filter(p => paperBookmarks.includes(p.id))

  if (saved.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-5xl mb-4">📄</div>
        <p className="font-semibold text-base mb-2">No papers bookmarked yet</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
          Tap the bookmark icon on any paper in the Papers tab to save it here.
        </p>
        <Link to="/papers" className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
          Browse Papers →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {saved.map(paper => (
        <div key={paper.id} className="card rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-snug">
                {paper.post || paper.id}
              </div>
              <div className="text-xs mt-1 flex flex-wrap gap-x-2 gap-y-0.5" style={{ color: 'var(--text2)' }}>
                {paper.date && <span>📅 {paper.date}</span>}
                {paper.date && <span>·</span>}
                <span>{qCountByPaper[paper.id] || 0} questions</span>
                {paper.paperCode && <><span>·</span><span>{paper.paperCode}</span></>}
              </div>
            </div>
            {/* Remove bookmark */}
            <button onClick={() => toggle(paper.id)}
              title="Remove bookmark"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, touchAction: 'manipulation' }}>
              <svg width="20" height="20" viewBox="0 0 24 24"
                fill="var(--accent)" stroke="var(--accent)" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
          <div className="flex gap-2">
            <Link to={`/quiz?paper=${paper.id}&mode=practice`}
              className="flex-1 text-center py-2 rounded-xl text-xs font-bold"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              ✏️ Practice
            </Link>
            <Link to={`/quiz?paper=${paper.id}&mode=browse`}
              className="flex-1 text-center py-2 rounded-xl text-xs font-bold"
              style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              📖 Browse
            </Link>
            <Link to={`/quiz?paper=${paper.id}&mode=timed`}
              className="flex-1 text-center py-2 rounded-xl text-xs font-bold"
              style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              ⏱️ Timed
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Questions tab ──────────────────────────────────────────────── */
function QuestionsTab() {
  const { bookmarks, toggle } = useBookmarks()
  const saved = questions.filter(q => bookmarks.includes(q.id))

  if (saved.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-5xl mb-4">❓</div>
        <p className="font-semibold text-base mb-2">No questions bookmarked yet</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
          Tap the bookmark icon on any question during a quiz to save it here.
        </p>
        <Link to="/quiz" className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
          Start a Quiz →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Quick-quiz all saved questions */}
      {saved.length > 1 && (
        <Link to="/quiz?mode=saved"
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
          ⚡ Quiz all {saved.length} bookmarked questions
        </Link>
      )}

      {saved.map(q => (
        <div key={q.id} className="card rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              {q.topic && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(26,157,142,0.12)', color: 'var(--accent)', border: '1px solid rgba(26,157,142,0.2)' }}>
                  {q.topic}
                </span>
              )}
              <span className="text-xs" style={{ color: 'var(--text2)' }}>
                {q.paperId} · Q{q.questionNumber}
              </span>
            </div>
            {/* Remove bookmark */}
            <button onClick={() => toggle(q.id)}
              title="Remove bookmark"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, touchAction: 'manipulation' }}>
              <svg width="18" height="18" viewBox="0 0 24 24"
                fill="var(--accent)" stroke="var(--accent)" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
            {q.questionText?.replace(/\n/g, ' ').slice(0, 120)}{q.questionText?.length > 120 ? '…' : ''}
          </p>
          {/* Options hint */}
          {q.optionA && (
            <div className="grid grid-cols-2 gap-1 text-xs mb-3" style={{ color: 'var(--text2)' }}>
              {[['A', q.optionA], ['B', q.optionB], ['C', q.optionC], ['D', q.optionD]]
                .filter(([, v]) => v)
                .map(([letter, text]) => (
                  <div key={letter} style={{
                    color: letter === q.correctAnswer ? 'var(--accent)' : 'var(--text2)',
                    fontWeight: letter === q.correctAnswer ? 600 : 400,
                  }}>
                    ({letter}) {text?.slice(0, 28)}{text?.length > 28 ? '…' : ''}
                  </div>
                ))}
            </div>
          )}
          <Link to={`/quiz?questionId=${q.id}`}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold inline-block"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            View with Explanation →
          </Link>
        </div>
      ))}
    </div>
  )
}

/* ── Exams tab ──────────────────────────────────────────────────── */
function ExamsTab() {
  const { pinnedExams: pinnedIds, unpinExam } = useAuth()
  const [removing, setRemoving] = useState(null)

  const now = new Date()
  const today = new Date(now.toDateString())
  const saved = exams.filter(e => pinnedIds.includes(e.id))

  function daysUntil(dateStr) {
    if (!dateStr) return null
    const d = new Date(dateStr)
    if (isNaN(d)) return null
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (saved.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-5xl mb-4">📅</div>
        <p className="font-semibold text-base mb-2">No exams bookmarked yet</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
          Pin upcoming exams from the Exams tab to track their countdowns here.
        </p>
        <Link to="/exams" className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
          Browse Exams →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {saved.map(exam => {
        const days = daysUntil(exam.date)
        const isPast = days !== null && days < 0
        const isToday = days === 0

        return (
          <div key={exam.id} className="card rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-snug mb-1">{exam.name}</div>
                {exam.board && (
                  <div className="text-xs mb-1" style={{ color: 'var(--text2)' }}>{exam.board}</div>
                )}
                <div className="flex flex-wrap gap-2 items-center">
                  {exam.date && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(26,157,142,0.1)', color: 'var(--accent)', border: '1px solid rgba(26,157,142,0.2)' }}>
                      📅 {exam.date}
                    </span>
                  )}
                  {days !== null && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: isPast ? 'rgba(255,80,80,0.1)' : isToday ? 'rgba(255,165,0,0.15)' : 'rgba(26,157,142,0.1)',
                        color: isPast ? '#ff5050' : isToday ? '#ffa500' : 'var(--accent)',
                        border: `1px solid ${isPast ? 'rgba(255,80,80,0.3)' : isToday ? 'rgba(255,165,0,0.4)' : 'rgba(26,157,142,0.2)'}`,
                      }}>
                      {isPast ? `${Math.abs(days)}d ago` : isToday ? 'Today!' : `${days}d left`}
                    </span>
                  )}
                </div>
              </div>
              {/* Unpin */}
              <button onClick={() => setRemoving(exam.id)}
                title="Remove bookmark"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, touchAction: 'manipulation' }}>
                <svg width="20" height="20" viewBox="0 0 24 24"
                  fill="var(--accent)" stroke="var(--accent)" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>
          </div>
        )
      })}

      {/* Confirm remove dialog */}
      {removing && (() => {
        const exam = exams.find(e => e.id === removing)
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="rounded-2xl p-5 w-full max-w-sm mx-4 mb-4 sm:mb-0"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="font-semibold mb-1">Remove bookmark?</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
                {exam?.name} will be removed from your bookmarks.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setRemoving(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  Cancel
                </button>
                <button onClick={() => { unpinExam(removing); setRemoving(null) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#c0392b', color: '#fff' }}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/* ══ Bookmarks Page ═════════════════════════════════════════════════ */
const TABS = [
  { id: 'papers',    label: 'Papers' },
  { id: 'questions', label: 'Questions' },
  { id: 'exams',     label: 'Exams' },
]

export default function Bookmarks() {
  const [tab, setTab] = useState('papers')

  const { paperBookmarks } = usePaperBookmarks()
  const { bookmarks } = useBookmarks()
  const { pinnedExams } = useAuth()

  const counts = {
    papers:    paperBookmarks.length,
    questions: bookmarks.length,
    exams:     pinnedExams.length,
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Page header */}
      <h1 className="font-bold text-xl mb-4">Bookmarks</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? 'var(--accent-text)' : 'var(--text2)',
              touchAction: 'manipulation',
            }}>
            {t.label}
            {counts[t.id] > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold leading-none"
                style={{
                  background: tab === t.id ? 'rgba(255,255,255,0.25)' : 'rgba(26,157,142,0.2)',
                  color: tab === t.id ? '#fff' : 'var(--accent)',
                  minWidth: 18,
                  textAlign: 'center',
                }}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'papers'    && <PapersTab />}
      {tab === 'questions' && <QuestionsTab />}
      {tab === 'exams'     && <ExamsTab />}
    </div>
  )
}
