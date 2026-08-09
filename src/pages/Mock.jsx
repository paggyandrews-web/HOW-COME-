import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import modelPapers from '../data/modelPapers.json'
import modelQuestions from '../data/modelQuestions.json'
import { useAuth } from '../contexts/AuthContext'
import { isPromoActive, isInMockCampaignWindow, mockCampaignFreeUntil, mockCampaignEndLabel } from '../utils/freeTier'
import Confetti from '../components/Confetti'
import Dropdown from '../components/Dropdown'
import { useResults } from '../hooks/useResults'
import { usePaperProgress } from '../hooks/usePaperProgress'
import { STATUS_META, DUE_COLOR, DUE_BG, daysAgo, STATUS_FILTER_OPTIONS, matchesStatusFilter, statusBadgeText } from '../utils/paperStatus'

const NEGATIVE_MARK = 1 / 3
const DAY_MS = 24 * 60 * 60 * 1000

// The data file keeps extra questions per paper beyond what's actually quizzed
// (see the `questions` memo below), so progress tracking needs the same
// questionCount-capped set — otherwise "completed" would need attempts on
// rows that are never shown, and could never be reached.
const CAPPED_MODEL_QUESTIONS = (() => {
  const out = []
  modelPapers.forEach(p => {
    const qs = modelQuestions
      .filter(q => q.paperId === p.id)
      .sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0))
    out.push(...(p.questionCount ? qs.slice(0, p.questionCount) : qs))
  })
  return out
})()

// Telegram channel promoted at the end of every test. This is the moment the
// person has just seen the explanations and is most willing to follow — the
// ask costs one tap and, unlike a sign-up, needs no account or password.
// ⚠️ Replace with the real channel URL before deploying.
const TELEGRAM_URL = 'https://t.me/howcomepsc'

/**
 * Access rule per paper:
 * - Regular model papers: needs an account AND (active promo or paid) — unchanged.
 * - Daily mock papers (type: 'daily', with publishedAt): free for EVERYONE (no
 *   account needed at all) for a window after publishedAt. Normally that window
 *   is 24h. But if publishedAt falls inside the Aug 2026 launch campaign (see
 *   freeTier.js), the free-for-everyone window instead runs until the campaign
 *   ends (9 Aug 2026). After the window closes, just needs a logged-in account
 *   — no paid tier required.
 */
function getDailyFreeUntil(paper) {
  if (paper?.type !== 'daily' || !paper?.publishedAt) return null
  return isInMockCampaignWindow(paper.publishedAt)
    ? mockCampaignFreeUntil()
    : new Date(paper.publishedAt).getTime() + DAY_MS
}

function isMockAllowed(paper, user, profile) {
  const freeUntil = getDailyFreeUntil(paper)
  if (freeUntil != null) {
    if (Date.now() < freeUntil) return true
    return !!user
  }
  return !!user && (isPromoActive() || !!profile?.isPaid)
}

/**
 * A daily paper scheduled for a future date must stay hidden until its
 * publishedAt actually arrives. Without this the whole August series would
 * appear at once, because the campaign window (not publishedAt) is what
 * decides the free deadline — so tomorrow's paper would already be unlocked.
 */
function isPublished(paper) {
  if (paper?.status === 'draft') return false
  if (!paper?.publishedAt) return true
  return Date.now() >= new Date(paper.publishedAt).getTime()
}

function dailyFreeWindow(paper) {
  const freeUntil = getDailyFreeUntil(paper)
  if (freeUntil == null) return null
  const msLeft = freeUntil - Date.now()
  const hoursLeft = Math.max(0, Math.ceil(msLeft / (60 * 60 * 1000)))
  // Campaign windows can run for days — switch to a day count once it's not
  // meaningfully "hours left" anymore, so the badge stays readable.
  const label = hoursLeft > 47 ? Math.ceil(hoursLeft / 24) + 'd left' : hoursLeft + 'h left'
  return { inWindow: msLeft > 0, hoursLeft, label }
}

/* ── Question text renderer: supports \n line breaks and __underline__ ── */
function renderWithUnderlines(line) {
  const parts = line.split(/(__[^_]+__)/)
  return parts.map((part, i) => {
    if (part.startsWith('__') && part.endsWith('__')) {
      return (
        <span key={i} style={{ textDecoration: 'underline', textUnderlineOffset: 3, color: 'var(--accent)' }}>
          {part.slice(2, -2)}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function QuestionText({ num, text }) {
  const lines = String(text || '').split('\n')
  return (
    <div className="flex gap-2" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 15 }}>
      {num != null && <span className="font-bold shrink-0 self-start">{num}.</span>}
      <div className="font-medium leading-relaxed">
        {lines.map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {renderWithUnderlines(line)}
          </span>
        ))}
      </div>
    </div>
  )
}

function ExplanationBlock({ explanation }) {
  if (!explanation || typeof explanation !== 'object') return null
  const order = ['correct', 'rule', 'wrong', 'tip']
  return (
    <div className="mt-3 flex flex-col gap-2">
      {order.map(key => explanation[key] && (
        <div key={key} className="rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          {explanation[key]}
        </div>
      ))}
    </div>
  )
}

function fmtClock(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return (h > 0 ? String(h) + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

/* ── Intro / instructions ────────────────────────────────────────────
   Shown when someone arrives from a shared link or the Home banner. They
   tapped a promo, not a "start exam" button, so dropping them into a live
   test with no explanation of what it is feels like an ambush. This screen
   states the rules and lets them choose the mode. */
function IntroScreen({ paper, count, freeWin, onPractice, onExam, onExit }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="card rounded-xl p-5">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="font-bold text-xl">{paper.title}</h1>
          {freeWin?.inWindow && (
            <span className="text-xs font-semibold rounded-full px-2 py-0.5"
              style={{ background: 'rgba(26,157,142,0.15)', color: 'var(--accent)' }}>
              🔴 Free · {freeWin.label}
            </span>
          )}
        </div>
        <div className="text-xs mb-4" style={{ color: 'var(--text2)' }}>
          Kerala PSC English · model paper
        </div>

        <div className="rounded-lg p-3 mb-4 text-sm leading-relaxed"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <div className="font-semibold text-xs mb-2" style={{ color: 'var(--accent)' }}>
            WHAT YOU GET
          </div>
          <div className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
            <div>• {count} questions in the real PSC pattern</div>
            <div>• A full Malayalam explanation for every answer</div>
            <div>• Topic-wise score breakdown at the end</div>
            <div>• No sign-up, no payment</div>
          </div>
        </div>

        <div className="font-semibold text-sm mb-2">Choose how to take it</div>

        <button onClick={onPractice}
          className="w-full rounded-xl p-3 mb-2 text-left cursor-pointer"
          style={{ background: 'var(--accent)', border: '2px solid var(--accent)', color: 'var(--accent-text)' }}>
          <div className="font-bold text-sm">✏️ Practice — recommended</div>
          <div className="text-xs mt-0.5" style={{ opacity: 0.85 }}>
            No timer. The answer and its Malayalam explanation appear as soon as you tap an option.
            Scored with the same −{paper.negativeMarking} penalty as the real exam.
          </div>
        </button>

        <button onClick={onExam}
          className="w-full rounded-xl p-3 text-left cursor-pointer"
          style={{ background: 'transparent', border: '2px solid var(--accent)', color: 'var(--accent)' }}>
          <div className="font-bold text-sm">⏱️ Timed exam</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
            {paper.durationMinutes} minutes · −{paper.negativeMarking} for each wrong answer ·
            explanations only after you submit.
          </div>
        </button>

        <button onClick={onExit}
          className="w-full mt-3 rounded-lg py-2 text-xs font-semibold cursor-pointer"
          style={{ background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text2)' }}>
          See all mock tests
        </button>
      </div>
    </div>
  )
}

/* ── Paper list ─────────────────────────────────────────────────────── */
function PaperList({ onStart, onPractice }) {
  const { user, profile } = useAuth()
  const [copied, setCopied] = useState(null)         // paperId whose link was just copied
  const [confirmPaper, setConfirmPaper] = useState(null)  // paper awaiting "Start exam?" confirmation
  const [status, setStatus] = useState('')
  const needsSignup = !user
  // Whether ANY paid-tier model paper is locked right now — drives the generic banner below.
  const anyPaidLocked = needsSignup || (!isPromoActive() && !profile?.isPaid)
  const counts = useMemo(() => {
    const map = {}
    modelQuestions.forEach(q => { map[q.paperId] = (map[q.paperId] || 0) + 1 })
    // Respect each paper's cap so the list count matches the exam length.
    modelPapers.forEach(p => {
      if (p.questionCount) map[p.id] = Math.min(map[p.id] || 0, p.questionCount)
    })
    return map
  }, [])

  // Drafts (status: 'draft') are nightly-generated daily mocks awaiting manual
  // review/approval — never shown in the app, even locally, until published.
  // Papers dated in the future are withheld until their publishedAt arrives.
  const visiblePapers = useMemo(() => modelPapers.filter(isPublished), [])

  const { progress, loading, summary } = usePaperProgress(visiblePapers, CAPPED_MODEL_QUESTIONS)
  const shownPapers = useMemo(
    () => visiblePapers.filter(p => matchesStatusFilter(progress[p.id], status)),
    [visiblePapers, progress, status]
  )

  // Is anything on this page open to a logged-out visitor right now? During the
  // August campaign the answer is yes, so the blanket "sign up first" card would
  // be a lie — and the exact wall this page is meant to remove.
  const anyFreeNow = useMemo(
    () => visiblePapers.some(p => { const f = getDailyFreeUntil(p); return f != null && Date.now() < f }),
    [visiblePapers]
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-1">Mock Tests</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
        Model papers in the real Kerala PSC pattern. <strong>Practice</strong> is untimed and shows the
        Malayalam explanation the moment you answer — <strong>Timed exam</strong> runs the real clock
        with 1/3 negative marking.
        {!loading && (
          <>
            {' '}{summary.completed} completed
            {summary.dueForRevision > 0 && (
              <span style={{ color: DUE_COLOR }}> · {summary.dueForRevision} due for revision</span>
            )}
            .
          </>
        )}
      </p>

      <Dropdown
        value={status}
        onChange={setStatus}
        placeholder="All Statuses"
        className="w-44 mb-4"
        options={STATUS_FILTER_OPTIONS}
      />

      {needsSignup && !anyFreeNow && (
        <div className="rounded-xl p-5 mb-4 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-2xl mb-1">👋</div>
          <div className="font-semibold text-sm mb-2">Sign up to take mock exams</div>
          <div className="text-xs mb-3" style={{ color: 'var(--text2)' }}>
            Mock exams are timed and your score is saved to your profile — that needs an account.
          </div>
          <Link to="/register"
            className="inline-block w-full py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)', textDecoration: 'none' }}>
            Sign Up Free →
          </Link>
          <div className="text-xs mt-2">
            <Link to="/login" style={{ color: 'var(--accent)' }}>Already have an account? Log in</Link>
          </div>
        </div>
      )}

      {shownPapers.map(p => {
        const allowed = isMockAllowed(p, user, profile)
        const isDaily = p.type === 'daily'
        const freeWin = dailyFreeWindow(p)
        const lockedReason = allowed ? null : isDaily ? 'Sign up to keep taking this test' : needsSignup ? 'Sign up to take mock exams' : 'The free period has ended'
        const shareUrl = isDaily ? `https://howcome.in/mock?paper=${p.id}` : null
        const prog = progress[p.id]
        const meta = prog ? STATUS_META[prog.status] : null
        const due = prog?.dueForRevision
        return (
          /* Same shape as a Papers-tab card: details stacked on top, then one
             full-width Practice / Timed button row. Keeps the two sections of
             the app looking like the same app. */
          <div key={p.id} className="card rounded-xl p-4 mb-3 flex flex-col gap-3"
            style={{ border: '1px solid ' + (due ? DUE_COLOR : isDaily && freeWin?.inWindow ? 'var(--accent)' : 'var(--border)') }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-semibold text-sm leading-snug">{p.title}</div>
                {isDaily && freeWin?.inWindow && (
                  <span className="text-xs font-semibold rounded-full px-2 py-0.5"
                    style={{ background: 'rgba(26,157,142,0.15)', color: 'var(--accent)' }}>
                    🔴 Free · {freeWin.label}
                  </span>
                )}
                {isDaily && freeWin && !freeWin.inWindow && (
                  <span className="text-xs font-semibold rounded-full px-2 py-0.5"
                    style={{ background: 'var(--bg2)', color: 'var(--text2)' }}>
                    Free window ended
                  </span>
                )}
                {meta && !loading && (
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                    style={{ color: meta.color, background: meta.bg }}
                  >
                    {statusBadgeText(prog, meta)}
                  </span>
                )}
              </div>
              <div className="text-xs mt-1.5 flex flex-wrap gap-x-2 gap-y-1" style={{ color: 'var(--text2)' }}>
                <span>📝 {counts[p.id] || 0} questions</span>
                <span>·</span>
                <span>⏱️ {p.durationMinutes} min</span>
                <span>·</span>
                <span>−{p.negativeMarking} per wrong</span>
              </div>
              {due && (
                <div
                  className="text-[11px] font-semibold mt-2 px-2 py-1.5 rounded-lg"
                  style={{ color: DUE_COLOR, background: DUE_BG }}
                >
                  ⏰ Due for revision — last practiced {daysAgo(prog.lastAttemptDate)}d ago
                </div>
              )}
            </div>

            {allowed ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onPractice(p)}
                  className="flex-1 text-center py-2 rounded-xl text-xs font-bold cursor-pointer"
                  style={{
                    background: 'var(--accent)', color: 'var(--accent-text)',
                    border: '2px solid var(--accent)', touchAction: 'manipulation',
                  }}>
                  ✏️ Practice
                </button>
                <button
                  onClick={() => setConfirmPaper(p)}
                  className="flex-1 text-center py-2 rounded-xl text-xs font-bold cursor-pointer"
                  style={{
                    background: 'transparent', color: 'var(--accent)',
                    border: '2px solid var(--accent)', touchAction: 'manipulation',
                  }}>
                  ⏱️ Timed
                </button>
              </div>
            ) : (
              <Link to="/register"
                title={lockedReason}
                className="block text-center py-2 rounded-xl text-xs font-bold"
                style={{
                  background: 'var(--bg2)', color: 'var(--text2)',
                  border: '2px solid var(--border)', textDecoration: 'none',
                }}>
                🔒 {lockedReason}
              </Link>
            )}

            {isDaily && (
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(shareUrl)
                  setCopied(p.id)
                  setTimeout(() => setCopied(null), 1800)
                }}
                className="text-xs rounded-lg py-1.5 cursor-pointer"
                style={{ background: 'transparent', border: '1px dashed var(--border)', color: copied === p.id ? 'var(--accent)' : 'var(--text2)' }}>
                {copied === p.id ? '✓ Link copied' : '🔗 Copy share link'}
              </button>
            )}
          </div>
        )
      })}
      {anyPaidLocked && (
        <div className="rounded-xl p-4 mb-4 text-sm leading-relaxed"
          style={{ background: 'rgba(26,157,142,0.08)', border: '1px solid rgba(26,157,142,0.3)' }}>
          <div className="font-semibold mb-1">
            {needsSignup ? 'No account needed for the free daily tests' : 'The free period has ended'}
          </div>
          <div className="text-xs" style={{ color: 'var(--text2)' }}>
            {needsSignup
              ? 'The daily mock tests above are open to everyone until ' + mockCampaignEndLabel() +
                '. An account only adds saved scores, bookmarks and the full model papers.'
              : 'Full model exams need an active account with full access.'}
            {' '}<Link to={needsSignup ? '/register' : '/papers'} style={{ color: 'var(--accent)' }}>
              {needsSignup ? 'Create a free account →' : 'Browse question papers →'}
            </Link>
          </div>
        </div>
      )}
      <div className="text-xs mt-6 leading-relaxed" style={{ color: 'var(--text2)' }}>
        These are model papers generated in the PSC pattern — not previous question papers.
        For real previous papers, visit the <Link to="/papers" style={{ color: 'var(--accent)' }}>Papers</Link> section.
      </div>

      {/* "Start exam?" gate — a timed run with negative marking should never
          begin on an accidental tap. Practice has no such gate by design. */}
      {confirmPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setConfirmPaper(null)}>
          <div className="rounded-xl p-5 w-full max-w-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-2xl mb-2 text-center">⏱️</div>
            <div className="font-semibold mb-1 text-center">Start exam?</div>
            <div className="text-xs mb-3 text-center" style={{ color: 'var(--text2)' }}>
              {confirmPaper.title}
            </div>
            <div className="rounded-lg p-3 mb-4 text-xs leading-relaxed"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              <div>• {counts[confirmPaper.id] || 0} questions in {confirmPaper.durationMinutes} minutes</div>
              <div>• −{confirmPaper.negativeMarking} mark for every wrong answer</div>
              <div>• Timer starts immediately and cannot be paused</div>
              <div>• Explanations appear only after you submit</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmPaper(null)}
                className="flex-1 rounded-lg py-2 text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                Cancel
              </button>
              <button onClick={() => { const p = confirmPaper; setConfirmPaper(null); onStart(p) }}
                className="flex-1 rounded-lg py-2 text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--accent-green)', border: 'none', color: '#fff' }}>
                Start exam
              </button>
            </div>
            <button onClick={() => { const p = confirmPaper; setConfirmPaper(null); onPractice(p) }}
              className="w-full mt-2 rounded-lg py-2 text-xs font-semibold cursor-pointer"
              style={{ background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text2)' }}>
              Not yet — practise it untimed first
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Exam screen ────────────────────────────────────────────────────── */
/**
 * One screen serves both modes so they cannot drift apart visually.
 *
 * practice = true  → no countdown, and answering a question immediately
 *                    reveals the correct option plus the full Malayalam
 *                    explanation. Navigation, the palette, mark-for-review,
 *                    skipping and the final result screen are all identical
 *                    to the timed exam.
 * practice = false → the real thing: countdown, auto-submit at zero, and
 *                    answers stay hidden until submission.
 */
function ExamScreen({ paper, questions, onSubmit, practice = false }) {
  const total = questions.length
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})           // qIndex -> 'A'|'B'|'C'|'D'
  const [marked, setMarked] = useState({})             // qIndex -> true
  const [secsLeft, setSecsLeft] = useState(paper.durationMinutes * 60)
  const [elapsed, setElapsed] = useState(0)            // practice counts up instead
  const [showPalette, setShowPalette] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const submittedRef = useRef(false)

  const doSubmit = useCallback(() => {
    if (submittedRef.current) return
    submittedRef.current = true
    onSubmit(answers, practice ? elapsed : paper.durationMinutes * 60 - secsLeft)
  }, [answers, secsLeft, elapsed, practice, onSubmit, paper.durationMinutes])

  // Practice still tracks time (the result screen reports it) but nothing
  // expires — no auto-submit, no pressure.
  useEffect(() => {
    if (practice) {
      const t = setInterval(() => setElapsed(e => e + 1), 1000)
      return () => clearInterval(t)
    }
    const t = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) { clearInterval(t); doSubmit(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [doSubmit, practice])

  const q = questions[current]
  const answered = Object.keys(answers).length
  const timeColor = secsLeft > 900 ? 'var(--accent)' : secsLeft > 300 ? '#f59e0b' : '#ef4444'

  // In practice the first answer stands, because the explanation is already
  // showing — letting it change afterwards would just be copying the key.
  const revealed = practice && answers[current] != null

  // Running score during practice, carrying the same 1/3 penalty the real exam
  // applies. Showing a raw correct-count here would teach the wrong instinct —
  // that guessing is free — which is exactly the habit that loses PSC marks.
  const score = useMemo(() => {
    let correct = 0, wrong = 0
    questions.forEach((qq, i) => {
      if (answers[i] == null) return
      if (answers[i] === qq.correctAnswer) correct++
      else wrong++
    })
    return Math.max(0, correct - wrong * NEGATIVE_MARK)
  }, [answers, questions])

  function select(letter) {
    if (revealed) return
    setAnswers(a => {
      const next = { ...a }
      if (!practice && next[current] === letter) delete next[current]  // tap again to clear
      else next[current] = letter
      return next
    })
    // Only practice reveals correctness immediately — timed mode stays
    // silent until submission, so no burst there.
    if (practice && letter === q.correctAnswer) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1600)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28">
      <Confetti active={showConfetti} />
      {/* Header: timer + progress */}
      <div className="flex items-center justify-between mb-3 sticky top-14 z-10 rounded-lg px-3 py-2"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span className="text-sm font-semibold truncate" style={{ maxWidth: '42%' }}>
          {practice ? '✏️ Practice' : paper.paperCode}
        </span>
        <span className="text-xs" style={{ color: 'var(--text2)' }}>{answered}/{total} answered</span>
        {practice
          ? <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>{score.toFixed(2)}/{total}</span>
          : <span className="font-mono font-bold text-sm" style={{ color: timeColor }}>{fmtClock(secsLeft)}</span>}
      </div>

      {/* Question card */}
      <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>
            Question {current + 1} of {total}
          </span>
          <button
            onClick={() => setMarked(m => ({ ...m, [current]: !m[current] }))}
            className="text-xs rounded-full px-3 py-1 cursor-pointer"
            style={{
              background: marked[current] ? 'rgba(236,72,153,0.15)' : 'var(--bg2)',
              color: marked[current] ? 'var(--accent-pink)' : 'var(--text2)',
              border: '1px solid ' + (marked[current] ? 'var(--accent-pink)' : 'var(--border)'),
            }}>
            {marked[current] ? '★ Marked' : '☆ Mark for review'}
          </button>
        </div>

        <QuestionText num={current + 1} text={q.questionText} />

        <div className="flex flex-col gap-2 mt-4">
          {['A', 'B', 'C', 'D'].map(letter => {
            const chosen = answers[current] === letter
            const isRight = q.correctAnswer === letter
            // Timed mode never colours by correctness — only practice reveals.
            let bg = chosen ? 'rgba(26,157,142,0.15)' : 'var(--bg2)'
            let bd = chosen ? 'var(--accent)' : 'var(--border)'
            let lc = chosen ? 'var(--accent)' : 'var(--text2)'
            if (revealed && isRight) { bg = 'rgba(34,197,94,0.12)'; bd = 'var(--accent-green)'; lc = 'var(--accent-green)' }
            else if (revealed && chosen) { bg = 'rgba(239,68,68,0.12)'; bd = '#ef4444'; lc = '#ef4444' }
            return (
              <button key={letter} onClick={() => select(letter)} disabled={revealed}
                className="text-left rounded-lg px-3 py-2.5 text-sm flex gap-2"
                style={{
                  background: bg,
                  border: '1px solid ' + bd,
                  color: 'var(--text)',
                  cursor: revealed ? 'default' : 'pointer',
                }}>
                <span className="font-bold shrink-0" style={{ color: lc }}>({letter})</span>
                <span>{q['option' + letter]}</span>
                {revealed && isRight && <span className="ml-auto shrink-0" style={{ color: 'var(--accent-green)' }}>✓</span>}
                {revealed && chosen && !isRight && <span className="ml-auto shrink-0" style={{ color: '#ef4444' }}>✗</span>}
              </button>
            )
          })}
        </div>

        {practice && !revealed && (
          <div className="text-xs mt-3 text-center" style={{ color: 'var(--text2)' }}>
            Tap an answer to see the explanation
          </div>
        )}
      </div>

      {/* Prev / Next */}
      <div className="flex gap-2 mt-4">
        <button onClick={() => { setCurrent(c => Math.max(0, c - 1)); window.scrollTo(0, 0) }}
          disabled={current === 0}
          className="flex-1 rounded-lg py-2.5 text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: current === 0 ? 'var(--text2)' : 'var(--text)' }}>
          ← Previous
        </button>
        <button onClick={() => setShowPalette(p => !p)}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          ⊞
        </button>
        {current < total - 1 ? (
          <button onClick={() => { setCurrent(c => Math.min(total - 1, c + 1)); window.scrollTo(0, 0) }}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--accent)', border: 'none', color: 'var(--accent-text)' }}>
            {practice && answers[current] == null ? 'Skip →' : 'Next →'}
          </button>
        ) : (
          <button onClick={() => setConfirmSubmit(true)}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--accent-green)', border: 'none', color: '#fff' }}>
            {practice ? 'See result' : 'Submit'}
          </button>
        )}
      </div>

      {/* Explanation sits BELOW the navigation on purpose. Anyone who doesn't
          want to read it can hit Next without scrolling past a long block of
          Malayalam text first. */}
      {revealed && (
        <div className="rounded-xl p-4 mt-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-semibold"
            style={{ color: answers[current] === q.correctAnswer ? 'var(--accent-green)' : '#ef4444' }}>
            {answers[current] === q.correctAnswer
              ? '✓ Correct  +1'
              : '✗ Wrong — correct answer is (' + q.correctAnswer + ')  −' + NEGATIVE_MARK.toFixed(2)}
          </div>
          <ExplanationBlock explanation={q.explanation} />
        </div>
      )}

      <button onClick={() => setConfirmSubmit(true)}
        className="w-full mt-3 rounded-lg py-2 text-xs font-semibold cursor-pointer"
        style={{ background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text2)' }}>
        {practice ? 'Finish practice & see result' : 'Finish exam early'}
      </button>

      {/* Palette */}
      {showPalette && (
        <div className="rounded-xl p-3 mt-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-xs mb-2 flex gap-4 flex-wrap" style={{ color: 'var(--text2)' }}>
            <span><span style={{ color: 'var(--accent)' }}>●</span> answered</span>
            <span><span style={{ color: 'var(--accent-pink)' }}>●</span> marked</span>
            <span><span style={{ color: 'var(--text2)' }}>○</span> not answered</span>
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
            {questions.map((_, i) => {
              const isAns = answers[i] != null
              const isMark = marked[i]
              return (
                <button key={i} onClick={() => { setCurrent(i); setShowPalette(false) }}
                  className="rounded text-xs py-1.5 cursor-pointer font-semibold"
                  style={{
                    background: i === current ? 'var(--accent)' : isAns ? 'rgba(26,157,142,0.2)' : 'var(--bg2)',
                    color: i === current ? 'var(--accent-text)' : isMark ? 'var(--accent-pink)' : isAns ? 'var(--accent)' : 'var(--text2)',
                    border: '1px solid ' + (isMark ? 'var(--accent-pink)' : isAns ? 'var(--accent)' : 'var(--border)'),
                  }}>
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Submit confirmation */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl p-5 w-full max-w-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="font-semibold mb-2">{practice ? 'Finish practice?' : 'Submit exam?'}</div>
            <div className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
              Answered: {answered} · Unanswered: {total - answered}
              <br />Unanswered questions carry no penalty.
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmSubmit(false)}
                className="flex-1 rounded-lg py-2 text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                {practice ? 'Keep practising' : 'Continue exam'}
              </button>
              <button onClick={doSubmit}
                className="flex-1 rounded-lg py-2 text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--accent-green)', border: 'none', color: '#fff' }}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Results screen ─────────────────────────────────────────────────── */
function TelegramCTA({ paper, score, total }) {
  const [shared, setShared] = useState(false)
  const url = `https://howcome.in/mock?paper=${paper.id}`
  const text = `I scored ${score.toFixed(2)}/${total} in the ${paper.title} on HOW COME — free Kerala PSC English mock test with full Malayalam explanations. Try it 👇`

  // navigator.share opens the phone's own share sheet, so WhatsApp, Telegram,
  // Instagram, SMS and everything else the person actually uses show up.
  // Desktop browsers mostly lack it — fall back to copying the message.
  async function share() {
    const payload = { title: 'HOW COME — Free PSC Mock Test', text, url }
    if (navigator.share) {
      try { await navigator.share(payload); return } catch { /* cancelled — ignore */ }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setShared(true)
      setTimeout(() => setShared(false), 1800)
    } catch { /* clipboard blocked — nothing useful to do */ }
  }

  return (
    <div className="rounded-xl p-4 mb-4"
      style={{ background: 'linear-gradient(135deg, #06201d 0%, #041a18 100%)', border: '1px solid rgba(26,157,142,0.4)' }}>
      <div className="flex items-start gap-3">
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0, fontSize: 18,
          background: 'rgba(26,157,142,0.14)', border: '1px solid rgba(26,157,142,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>📢</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>
            When is the next mock test?
          </div>
          <div className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Every new mock test and PDF note goes to the Telegram channel first. No sign-up — one tap.
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center py-2 rounded-xl text-xs font-bold"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)', textDecoration: 'none' }}>
          ➤ Join on Telegram
        </a>
        <button onClick={share}
          className="flex-1 text-center py-2 rounded-xl text-xs font-bold cursor-pointer"
          style={{ background: 'transparent', color: 'var(--accent)', border: '2px solid var(--accent)' }}>
          {shared ? '✓ Copied' : 'Share my score'}
        </button>
      </div>
    </div>
  )
}

function ResultScreen({ paper, questions, answers, timeTaken, onRetake, onExit, practice = false }) {
  const [filter, setFilter] = useState('all')  // all | wrong | skipped
  const [showConfetti, setShowConfetti] = useState(false)

  const stats = useMemo(() => {
    let correct = 0, wrong = 0, skipped = 0
    const topicMap = {}
    questions.forEach((q, i) => {
      const t = q.topic || 'Other'
      topicMap[t] = topicMap[t] || { total: 0, correct: 0, wrong: 0 }
      topicMap[t].total++
      const chosen = answers[i]
      if (chosen == null) { skipped++ }
      else if (chosen === q.correctAnswer) { correct++; topicMap[t].correct++ }
      else { wrong++; topicMap[t].wrong++ }
    })
    const score = Math.max(0, correct - wrong * NEGATIVE_MARK)
    return { correct, wrong, skipped, score, topicMap }
  }, [questions, answers])

  const pct = Math.round((stats.score / questions.length) * 100)
  const topics = Object.entries(stats.topicMap).sort((a, b) => b[1].total - a[1].total)
  // Big gold burst for a near-perfect/perfect finish, a normal burst for a
  // solid pass — same thresholds Quiz.jsx and FullHundred.jsx use, so a good
  // score feels the same everywhere in the app.
  const confettiTier = pct > 90 ? 'big' : 'normal'

  useEffect(() => {
    if (pct >= 71) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visible = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => {
      if (filter === 'wrong') return answers[i] != null && answers[i] !== q.correctAnswer
      if (filter === 'skipped') return answers[i] == null
      return true
    })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
      <Confetti active={showConfetti} tier={confettiTier} />
      {/* Score card */}
      <div className="rounded-xl p-5 text-center mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="text-xs mb-1" style={{ color: 'var(--text2)' }}>{paper.title}</div>
        <div className="font-bold" style={{ fontSize: 40, color: 'var(--accent)' }}>
          {stats.score.toFixed(2)}<span className="text-lg" style={{ color: 'var(--text2)' }}> / {questions.length}</span>
        </div>
        <div className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
          {pct}% · Time taken: {fmtClock(timeTaken)}
        </div>
        <div className="flex justify-center gap-4 mt-3 text-sm">
          <span style={{ color: 'var(--accent-green)' }}>✓ {stats.correct} correct</span>
          <span style={{ color: '#ef4444' }}>✗ {stats.wrong} wrong (−{(stats.wrong * NEGATIVE_MARK).toFixed(2)})</span>
          <span style={{ color: 'var(--text2)' }}>— {stats.skipped} skipped</span>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={onRetake} className="rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--accent)', border: 'none', color: 'var(--accent-text)' }}>
            {practice ? 'Practise again' : 'Retake'}
          </button>
          <button onClick={onExit} className="rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            All Mock Tests
          </button>
        </div>
      </div>

      <TelegramCTA paper={paper} score={stats.score} total={questions.length} />

      {/* Topic-wise breakdown */}
      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="font-semibold text-sm mb-3">Topic-wise performance</div>
        {topics.map(([topic, t]) => {
          const tPct = Math.round((t.correct / t.total) * 100)
          return (
            <div key={topic} className="mb-2.5">
              <div className="flex justify-between text-xs mb-1">
                <span>{topic}</span>
                <span style={{ color: 'var(--text2)' }}>{t.correct}/{t.total}</span>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ background: 'var(--bg2)' }}>
                <div className="h-1.5 rounded-full"
                  style={{ width: tPct + '%', background: tPct >= 60 ? 'var(--accent)' : tPct >= 35 ? '#f59e0b' : '#ef4444' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Review */}
      <div className="flex gap-2 mb-3">
        {[['all', 'All'], ['wrong', 'Wrong'], ['skipped', 'Skipped']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold cursor-pointer"
            style={{
              background: filter === val ? 'var(--accent)' : 'var(--bg2)',
              color: filter === val ? 'var(--accent-text)' : 'var(--text2)',
              border: '1px solid ' + (filter === val ? 'var(--accent)' : 'var(--border)'),
            }}>
            {label}
          </button>
        ))}
      </div>

      {visible.map(({ q, i }) => {
        const chosen = answers[i]
        return (
          <div key={q.id} className="rounded-xl p-4 mb-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xs mb-2" style={{ color: 'var(--text2)' }}>{q.topic} · {q.difficulty}</div>
            <QuestionText num={i + 1} text={q.questionText} />
            <div className="flex flex-col gap-1.5 mt-3">
              {['A', 'B', 'C', 'D'].map(letter => {
                const isCorrect = q.correctAnswer === letter
                const isChosen = chosen === letter
                return (
                  <div key={letter} className="rounded-lg px-3 py-2 text-sm flex gap-2"
                    style={{
                      background: isCorrect ? 'rgba(34,197,94,0.12)' : isChosen ? 'rgba(239,68,68,0.12)' : 'var(--bg2)',
                      border: '1px solid ' + (isCorrect ? 'var(--accent-green)' : isChosen ? '#ef4444' : 'var(--border)'),
                    }}>
                    <span className="font-bold shrink-0"
                      style={{ color: isCorrect ? 'var(--accent-green)' : isChosen ? '#ef4444' : 'var(--text2)' }}>
                      ({letter})
                    </span>
                    <span>{q['option' + letter]}</span>
                    {isCorrect && <span className="ml-auto shrink-0" style={{ color: 'var(--accent-green)' }}>✓</span>}
                    {isChosen && !isCorrect && <span className="ml-auto shrink-0" style={{ color: '#ef4444' }}>✗</span>}
                  </div>
                )
              })}
            </div>
            {chosen == null && (
              <div className="text-xs mt-2" style={{ color: 'var(--text2)' }}>Not answered — no penalty</div>
            )}
            <ExplanationBlock explanation={q.explanation} />
          </div>
        )
      })}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function Mock() {
  const [stage, setStage] = useState('list')   // list | intro | practice | exam | result
  const [paper, setPaper] = useState(null)
  const [answers, setAnswers] = useState({})
  const [timeTaken, setTimeTaken] = useState(0)
  const [examKey, setExamKey] = useState(0)    // remount ExamScreen on retake
  const [wasPractice, setWasPractice] = useState(false)  // which mode produced the result
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const { saveResult } = useResults()

  // Deep link — e.g. /mock?paper=HC-DAILY-2026-08-01 shared in Telegram.
  // Opens that paper if access is currently allowed; otherwise falls through to
  // the normal list, where the card shows the locked state.
  //
  // Lands on the INSTRUCTIONS screen, not inside a running test. The person
  // tapped a promo link, not a start button — they need to know what this is
  // and pick a mode first. &mode=practice or &mode=exam skip straight in.
  useEffect(() => {
    const paperId = searchParams.get('paper')
    if (!paperId) return
    const p = modelPapers.find(mp => mp.id === paperId)
    if (!p || !isPublished(p) || !isMockAllowed(p, user, profile)) return
    const mode = searchParams.get('mode')
    if (mode === 'exam') start(p)
    else if (mode === 'practice') startPractice(p)
    else showIntro(p)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const questions = useMemo(() => {
    if (!paper) return []
    const all = modelQuestions
      .filter(q => q.paperId === paper.id)
      .sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0))
    // Capped by the paper's questionCount so the extra questions stay in the
    // data file for future papers rather than being deleted.
    return paper.questionCount ? all.slice(0, paper.questionCount) : all
  }, [paper])

  // Warn before leaving mid-exam (tab close / refresh)
  useEffect(() => {
    if (stage !== 'exam') return
    const warn = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [stage])

  function showIntro(p) {
    setPaper(p)
    setStage('intro')
    window.scrollTo(0, 0)
  }

  function start(p) {
    setPaper(p)
    setAnswers({})
    setWasPractice(false)
    setExamKey(k => k + 1)
    setStage('exam')
    window.scrollTo(0, 0)
  }

  function startPractice(p) {
    setPaper(p)
    setAnswers({})
    setWasPractice(true)
    setExamKey(k => k + 1)
    setStage('practice')
    window.scrollTo(0, 0)
  }

  function handleSubmit(ans, secs) {
    setAnswers(ans)
    setTimeTaken(secs)
    setStage('result')
    window.scrollTo(0, 0)

    // Persist the attempt so this paper shows up as "practiced" on the list
    // (and starts its due-for-revision clock) — mirrors Papers/Full 100.
    if (questions.length) {
      saveResult(questions, ans, wasPractice ? 'mock-practice' : 'mock-timed')
    }
  }

  if (stage === 'intro' && paper) {
    return (
      <IntroScreen
        paper={paper}
        count={questions.length}
        freeWin={dailyFreeWindow(paper)}
        onPractice={() => startPractice(paper)}
        onExam={() => start(paper)}
        onExit={() => { setStage('list'); setPaper(null) }}
      />
    )
  }
  // Practice and the timed exam are the same screen with the timer and the
  // instant-reveal behaviour flipped, so the two can never drift apart.
  if ((stage === 'exam' || stage === 'practice') && paper) {
    return (
      <ExamScreen
        key={examKey}
        paper={paper}
        questions={questions}
        onSubmit={handleSubmit}
        practice={stage === 'practice'}
      />
    )
  }
  if (stage === 'result' && paper) {
    return (
      <ResultScreen
        paper={paper}
        questions={questions}
        answers={answers}
        timeTaken={timeTaken}
        practice={wasPractice}
        onRetake={() => (wasPractice ? startPractice(paper) : start(paper))}
        onExit={() => { setStage('list'); setPaper(null) }}
      />
    )
  }
  return <PaperList onStart={start} onPractice={startPractice} />
}
