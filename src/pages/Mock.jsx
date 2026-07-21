import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import modelPapers from '../data/modelPapers.json'
import modelQuestions from '../data/modelQuestions.json'
import { useAuth } from '../contexts/AuthContext'
import { canAccessMock } from '../utils/entitlements'

const NEGATIVE_MARK = 1 / 3

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

/* ── Paper list ─────────────────────────────────────────────────────── */
function PaperList({ onStart }) {
  const { user, profile } = useAuth()
  const needsSignup = !user
  // Mock exams require an account, on top of the plan entitlement.
  const mockAllowed = !needsSignup && canAccessMock(profile)
  const counts = useMemo(() => {
    const map = {}
    modelQuestions.forEach(q => { map[q.paperId] = (map[q.paperId] || 0) + 1 })
    // Respect each paper's cap so the list count matches the exam length.
    modelPapers.forEach(p => {
      if (p.questionCount) map[p.id] = Math.min(map[p.id] || 0, p.questionCount)
    })
    return map
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-1">Mock Exams</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
        Model papers in the real PSC exam pattern — 50 questions, 30 minutes, 1/3 negative marking.
      </p>
      {needsSignup && (
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

      {modelPapers.map(p => (
        <div key={p.id} className="rounded-xl p-4 mb-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="font-semibold">{p.title}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text2)' }}>
                {counts[p.id] || 0} questions · {p.durationMinutes} minutes · −{p.negativeMarking} per wrong answer
              </div>
              {p.description && (
                <div className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text2)' }}>{p.description}</div>
              )}
            </div>
            <button
              onClick={() => mockAllowed && onStart(p)}
              disabled={!mockAllowed}
              title={mockAllowed ? undefined : needsSignup ? 'Sign up to take mock exams' : 'Mock exams are not included in Pack 100'}
              className="rounded-lg px-4 py-2 text-sm font-semibold"
              style={{
                background: mockAllowed ? 'var(--accent)' : 'var(--bg2)',
                color: mockAllowed ? 'var(--accent-text)' : 'var(--text2)',
                border: mockAllowed ? 'none' : '1px solid var(--border)',
                cursor: mockAllowed ? 'pointer' : 'not-allowed',
              }}>
              {mockAllowed ? 'Start Exam' : needsSignup ? '🔒 Sign up' : '🔒 Locked'}
            </button>
          </div>
        </div>
      ))}
      {!mockAllowed && !needsSignup && (
        <div className="rounded-xl p-4 mb-4 text-sm leading-relaxed"
          style={{ background: 'rgba(26,157,142,0.08)', border: '1px solid rgba(26,157,142,0.3)' }}>
          <div className="font-semibold mb-1">Mock exams need full access</div>
          <div className="text-xs" style={{ color: 'var(--text2)' }}>
            Your Pack 100 covers the 100 previous question papers. Mock exams are a separate add-on.
            {' '}<Link to="/papers" style={{ color: 'var(--accent)' }}>Browse your papers →</Link>
          </div>
        </div>
      )}
      <div className="text-xs mt-6 leading-relaxed" style={{ color: 'var(--text2)' }}>
        These are model papers generated in the PSC pattern — not previous question papers.
        For real previous papers, visit the <Link to="/papers" style={{ color: 'var(--accent)' }}>Papers</Link> section.
      </div>
    </div>
  )
}

/* ── Exam screen ────────────────────────────────────────────────────── */
function ExamScreen({ paper, questions, onSubmit }) {
  const total = questions.length
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})           // qIndex -> 'A'|'B'|'C'|'D'
  const [marked, setMarked] = useState({})             // qIndex -> true
  const [secsLeft, setSecsLeft] = useState(paper.durationMinutes * 60)
  const [showPalette, setShowPalette] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const submittedRef = useRef(false)

  const doSubmit = useCallback(() => {
    if (submittedRef.current) return
    submittedRef.current = true
    onSubmit(answers, paper.durationMinutes * 60 - secsLeft)
  }, [answers, secsLeft, onSubmit, paper.durationMinutes])

  useEffect(() => {
    const t = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) { clearInterval(t); doSubmit(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [doSubmit])

  const q = questions[current]
  const answered = Object.keys(answers).length
  const timeColor = secsLeft > 900 ? 'var(--accent)' : secsLeft > 300 ? '#f59e0b' : '#ef4444'

  function select(letter) {
    setAnswers(a => {
      const next = { ...a }
      if (next[current] === letter) delete next[current]  // tap again to clear
      else next[current] = letter
      return next
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28">
      {/* Header: timer + progress */}
      <div className="flex items-center justify-between mb-3 sticky top-14 z-10 rounded-lg px-3 py-2"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span className="text-sm font-semibold">{paper.paperCode}</span>
        <span className="text-xs" style={{ color: 'var(--text2)' }}>{answered}/{total} answered</span>
        <span className="font-mono font-bold text-sm" style={{ color: timeColor }}>{fmtClock(secsLeft)}</span>
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
            return (
              <button key={letter} onClick={() => select(letter)}
                className="text-left rounded-lg px-3 py-2.5 text-sm cursor-pointer flex gap-2"
                style={{
                  background: chosen ? 'rgba(26,157,142,0.15)' : 'var(--bg2)',
                  border: '1px solid ' + (chosen ? 'var(--accent)' : 'var(--border)'),
                  color: 'var(--text)',
                }}>
                <span className="font-bold shrink-0" style={{ color: chosen ? 'var(--accent)' : 'var(--text2)' }}>
                  ({letter})
                </span>
                <span>{q['option' + letter]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Prev / Next */}
      <div className="flex gap-2 mt-4">
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
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
          <button onClick={() => setCurrent(c => Math.min(total - 1, c + 1))}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--accent)', border: 'none', color: 'var(--accent-text)' }}>
            Next →
          </button>
        ) : (
          <button onClick={() => setConfirmSubmit(true)}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--accent-green)', border: 'none', color: '#fff' }}>
            Submit
          </button>
        )}
      </div>

      <button onClick={() => setConfirmSubmit(true)}
        className="w-full mt-3 rounded-lg py-2 text-xs font-semibold cursor-pointer"
        style={{ background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text2)' }}>
        Finish exam early
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
            <div className="font-semibold mb-2">Submit exam?</div>
            <div className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
              Answered: {answered} · Unanswered: {total - answered}
              <br />Unanswered questions carry no penalty.
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmSubmit(false)}
                className="flex-1 rounded-lg py-2 text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                Continue exam
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
function ResultScreen({ paper, questions, answers, timeTaken, onRetake, onExit }) {
  const [filter, setFilter] = useState('all')  // all | wrong | skipped

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

  const visible = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => {
      if (filter === 'wrong') return answers[i] != null && answers[i] !== q.correctAnswer
      if (filter === 'skipped') return answers[i] == null
      return true
    })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
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
            Retake
          </button>
          <button onClick={onExit} className="rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            All Mock Exams
          </button>
        </div>
      </div>

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
  const [stage, setStage] = useState('list')   // list | exam | result
  const [paper, setPaper] = useState(null)
  const [answers, setAnswers] = useState({})
  const [timeTaken, setTimeTaken] = useState(0)
  const [examKey, setExamKey] = useState(0)    // remount ExamScreen on retake

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

  function start(p) {
    setPaper(p)
    setAnswers({})
    setExamKey(k => k + 1)
    setStage('exam')
    window.scrollTo(0, 0)
  }

  function handleSubmit(ans, secs) {
    setAnswers(ans)
    setTimeTaken(secs)
    setStage('result')
    window.scrollTo(0, 0)
  }

  if (stage === 'exam' && paper) {
    return <ExamScreen key={examKey} paper={paper} questions={questions} onSubmit={handleSubmit} />
  }
  if (stage === 'result' && paper) {
    return (
      <ResultScreen
        paper={paper}
        questions={questions}
        answers={answers}
        timeTaken={timeTaken}
        onRetake={() => start(paper)}
        onExit={() => { setStage('list'); setPaper(null) }}
      />
    )
  }
  return <PaperList onStart={start} />
}
