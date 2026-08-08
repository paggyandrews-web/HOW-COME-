import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import fullPapers from '../data/fullPapers.json'
import fullQuestions from '../data/fullQuestions.json'
import Confetti from '../components/Confetti'

const NEGATIVE_MARK = 1 / 3

/* Same \n / __underline__ convention used elsewhere in the app, so a paper
   transcribed with multi-line (i/ii/iii sub-items) questions renders correctly. */
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

function fmtClock(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

/* A paper counts as "English" if its medium says so — either a genuine PSC
   English-medium booklet ("E") or a labelled English study rendering. Every
   other medium (M, Tamil, Kannada, ...) lands in the Malayalam tab, which is
   just "everything not English" since Full 100 is overwhelmingly M-medium. */
function isEnglishPaper(p) {
  const m = String(p.medium || '').toLowerCase()
  return m === 'e' || m.includes('english')
}

/* ── Paper list ─────────────────────────────────────────────────────── */
function PaperList({ onStart }) {
  const [tab, setTab] = useState('malayalam') // malayalam | english

  const counts = useMemo(() => {
    const map = {}
    fullQuestions.forEach(q => { map[q.paperId] = (map[q.paperId] || 0) + 1 })
    return map
  }, [])

  const malayalamPapers = useMemo(() => fullPapers.filter(p => !isEnglishPaper(p)), [])
  const englishPapers = useMemo(() => fullPapers.filter(p => isEnglishPaper(p)), [])
  const shownPapers = tab === 'english' ? englishPapers : malayalamPapers

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-1">Full 100</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
        Real, complete PSC question papers — all 100 questions, every subject, exactly as printed
        in the original medium. No translation, no explanations — just the paper and the official
        Final Answer Key, free for everyone.
      </p>

      <div className="flex gap-2 mb-4">
        {[['malayalam', 'മലയാളം', malayalamPapers.length], ['english', 'English', englishPapers.length]].map(([val, label, n]) => (
          <button key={val} onClick={() => setTab(val)}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold cursor-pointer"
            style={{
              background: tab === val ? 'var(--accent)' : 'var(--bg2)',
              color: tab === val ? 'var(--accent-text)' : 'var(--text2)',
              border: '1px solid ' + (tab === val ? 'var(--accent)' : 'var(--border)'),
            }}>
            {label} <span style={{ opacity: 0.8, fontWeight: 600 }}>({n})</span>
          </button>
        ))}
      </div>

      {shownPapers.length === 0 && (
        <div className="rounded-xl p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-2xl mb-1">📄</div>
          <div className="font-semibold text-sm">
            {tab === 'english' ? 'No English papers archived yet' : 'No papers archived yet'}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text2)' }}>Check back soon.</div>
        </div>
      )}

      {shownPapers.map(p => (
        <div key={p.id} className="card rounded-xl p-4 mb-3 flex flex-col gap-3"
          style={{ border: '1px solid var(--border)' }}>
          <div>
            <div className="font-semibold text-sm leading-snug">{p.post}</div>
            <div className="text-xs mt-1.5 flex flex-wrap gap-x-2 gap-y-1" style={{ color: 'var(--text2)' }}>
              <span>🧾 {p.paperCode}</span>
              <span>·</span>
              <span>📅 {p.date}</span>
              <span>·</span>
              <span>📝 {counts[p.id] || 0} questions</span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text2)' }}>
              Category: {p.categoryCode}
            </div>
          </div>
          <button onClick={() => onStart(p)}
            className="w-full text-center py-2.5 rounded-xl text-sm font-bold cursor-pointer"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)', border: '2px solid var(--accent)', touchAction: 'manipulation' }}>
            ✏️ Start
          </button>
        </div>
      ))}

      <div className="text-xs mt-4 leading-relaxed" style={{ color: 'var(--text2)' }}>
        These are archived exactly as PSC published them — deleted questions are marked and excluded
        from scoring. For the English section with full Malayalam explanations, see{' '}
        <a href="/papers" style={{ color: 'var(--accent)' }}>Papers</a>.
      </div>
    </div>
  )
}

/* ── Instructions screen ────────────────────────────────────────────── */
function InstructionsScreen({ paper, questionCount, onBegin, onBack }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-10">
      <button onClick={onBack}
        className="text-xs font-semibold mb-3 cursor-pointer"
        style={{ color: 'var(--text2)' }}>
        ← Back to papers
      </button>

      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="font-semibold text-sm leading-snug">{paper.post}</div>
        <div className="text-xs mt-1.5 flex flex-wrap gap-x-2 gap-y-1" style={{ color: 'var(--text2)' }}>
          <span>🧾 {paper.paperCode}</span>
          <span>·</span>
          <span>📅 {paper.date}</span>
          <span>·</span>
          <span>📝 {questionCount} questions</span>
        </div>
      </div>

      <h2 className="font-bold text-lg mb-3">Before you start</h2>

      <div className="flex flex-col gap-2.5 mb-5">
        <div className="rounded-xl p-3.5 flex gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <div className="text-sm font-semibold">Negative marking</div>
            <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text2)' }}>
              Every wrong answer deducts <b>⅓ (0.33) mark</b>. Unanswered questions carry
              <b> no penalty</b> — skip a question if you're not sure, rather than guessing blindly.
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3.5 flex gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <span className="text-xl shrink-0">⏱️</span>
          <div>
            <div className="text-sm font-semibold">Timing</div>
            <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text2)' }}>
              There's no fixed time limit — a stopwatch runs in the header so you can track your
              pace. Try to finish at a real-exam speed (roughly <b>45–60 seconds</b> per question).
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3.5 flex gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <span className="text-xl shrink-0">📊</span>
          <div>
            <div className="text-sm font-semibold">Live mark</div>
            <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text2)' }}>
              Your running score updates in the header the moment you pick an option, so you always
              know where you stand.
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3.5 flex gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <span className="text-xl shrink-0">🚫</span>
          <div>
            <div className="text-sm font-semibold">Deleted questions</div>
            <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text2)' }}>
              Questions PSC deleted in the Final Answer Key are shown for reference only and don't
              count toward your score, positively or negatively.
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3.5 flex gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <span className="text-xl shrink-0">🧭</span>
          <div>
            <div className="text-sm font-semibold">Navigation</div>
            <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text2)' }}>
              Move freely between questions with Previous/Next or the ⊞ question palette, and mark
              questions for review. Once you pick an option the correct answer is revealed
              immediately — this is a practice run, not a locked exam.
            </div>
          </div>
        </div>
      </div>

      <button onClick={onBegin}
        className="w-full text-center py-3 rounded-xl text-sm font-bold cursor-pointer"
        style={{ background: 'var(--accent)', color: 'var(--accent-text)', border: '2px solid var(--accent)', touchAction: 'manipulation' }}>
        ✅ I understand, start the exam
      </button>
    </div>
  )
}

/* ── Exam screen ────────────────────────────────────────────────────── */
function ExamScreen({ paper, questions, onSubmit }) {
  const total = questions.length
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [marked, setMarked] = useState({})
  const [elapsed, setElapsed] = useState(0)
  const [showPalette, setShowPalette] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const submittedRef = useRef(false)

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const warn = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const doSubmit = useCallback(() => {
    if (submittedRef.current) return
    submittedRef.current = true
    onSubmit(answers, elapsed)
  }, [answers, elapsed, onSubmit])

  const q = questions[current]
  const isDeleted = q.status === 'deleted'
  const answered = Object.keys(answers).length
  const revealed = !isDeleted && answers[current] != null

  // Live running mark — recalculated the instant an answer is picked, so the
  // header score always reflects exactly what's been answered so far.
  const liveMark = useMemo(() => {
    let correct = 0, wrong = 0
    Object.keys(answers).forEach(idx => {
      const qq = questions[idx]
      if (!qq || qq.status === 'deleted') return
      if (answers[idx] === qq.correctAnswer) correct++
      else wrong++
    })
    return { correct, wrong, score: Math.max(0, correct - wrong * NEGATIVE_MARK) }
  }, [answers, questions])

  function select(letter) {
    if (revealed || isDeleted) return
    setAnswers(a => ({ ...a, [current]: letter }))
    if (letter === q.correctAnswer) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1600)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28">
      <Confetti active={showConfetti} />
      <div className="mb-3 sticky top-14 z-10 rounded-lg px-3 py-2 flex flex-col gap-1.5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold truncate" style={{ maxWidth: '42%' }}>{paper.paperCode}</span>
          <span className="text-xs" style={{ color: 'var(--text2)' }}>{answered}/{total} answered</span>
          <span className="font-mono font-bold text-sm" style={{ color: 'var(--accent)' }}>{fmtClock(elapsed)}</span>
        </div>
        <div className="flex items-center justify-between text-xs pt-1.5" style={{ borderTop: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text2)' }}>📊 Live mark</span>
          <span className="flex items-center gap-2">
            <span style={{ color: 'var(--accent-green)' }}>✓ {liveMark.correct}</span>
            <span style={{ color: '#ef4444' }}>✗ {liveMark.wrong}</span>
            <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{liveMark.score.toFixed(2)}</span>
          </span>
        </div>
      </div>

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

        {isDeleted && (
          <div className="text-xs rounded-lg px-3 py-2 mt-3" style={{ background: 'var(--bg2)', border: '1px dashed var(--border)', color: 'var(--text2)' }}>
            🚫 PSC deleted this question in the Final Answer Key — it's shown for reference only and
            doesn't count toward your score.
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          {['A', 'B', 'C', 'D'].map(letter => {
            const chosen = answers[current] === letter
            const isRight = q.correctAnswer === letter
            let bg = chosen ? 'rgba(26,157,142,0.15)' : 'var(--bg2)'
            let bd = chosen ? 'var(--accent)' : 'var(--border)'
            let lc = chosen ? 'var(--accent)' : 'var(--text2)'
            if (revealed && isRight) { bg = 'rgba(34,197,94,0.12)'; bd = 'var(--accent-green)'; lc = 'var(--accent-green)' }
            else if (revealed && chosen) { bg = 'rgba(239,68,68,0.12)'; bd = '#ef4444'; lc = '#ef4444' }
            return (
              <button key={letter} onClick={() => select(letter)} disabled={revealed || isDeleted}
                className="text-left rounded-lg px-3 py-2.5 text-sm flex gap-2"
                style={{ background: bg, border: '1px solid ' + bd, color: 'var(--text)', cursor: (revealed || isDeleted) ? 'default' : 'pointer' }}>
                <span className="font-bold shrink-0" style={{ color: lc }}>({letter})</span>
                <span>{q['option' + letter]}</span>
                {revealed && isRight && <span className="ml-auto shrink-0" style={{ color: 'var(--accent-green)' }}>✓</span>}
                {revealed && chosen && !isRight && <span className="ml-auto shrink-0" style={{ color: '#ef4444' }}>✗</span>}
              </button>
            )
          })}
        </div>
      </div>

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
            Next →
          </button>
        ) : (
          <button onClick={() => setConfirmSubmit(true)}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--accent-green)', border: 'none', color: '#fff' }}>
            See result
          </button>
        )}
      </div>

      <button onClick={() => setConfirmSubmit(true)}
        className="w-full mt-3 rounded-lg py-2 text-xs font-semibold cursor-pointer"
        style={{ background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text2)' }}>
        Finish & see result
      </button>

      {showPalette && (
        <div className="rounded-xl p-3 mt-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-xs mb-2 flex gap-4 flex-wrap" style={{ color: 'var(--text2)' }}>
            <span><span style={{ color: 'var(--accent)' }}>●</span> answered</span>
            <span><span style={{ color: 'var(--accent-pink)' }}>●</span> marked</span>
            <span><span style={{ color: 'var(--text2)' }}>○</span> not answered</span>
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
            {questions.map((qq, i) => {
              const isAns = answers[i] != null
              const isMark = marked[i]
              return (
                <button key={i} onClick={() => { setCurrent(i); setShowPalette(false) }}
                  className="rounded text-xs py-1.5 cursor-pointer font-semibold"
                  style={{
                    background: i === current ? 'var(--accent)' : isAns ? 'rgba(26,157,142,0.2)' : qq.status === 'deleted' ? 'var(--bg2)' : 'var(--bg2)',
                    color: i === current ? 'var(--accent-text)' : isMark ? 'var(--accent-pink)' : isAns ? 'var(--accent)' : qq.status === 'deleted' ? 'var(--text2)' : 'var(--text2)',
                    border: '1px solid ' + (isMark ? 'var(--accent-pink)' : isAns ? 'var(--accent)' : 'var(--border)'),
                    opacity: qq.status === 'deleted' ? 0.5 : 1,
                  }}>
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl p-5 w-full max-w-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="font-semibold mb-2">Finish and see your result?</div>
            <div className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
              Answered: {answered} · Unanswered: {total - answered}
              <br />Unanswered questions carry no penalty.
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmSubmit(false)}
                className="flex-1 rounded-lg py-2 text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                Keep going
              </button>
              <button onClick={doSubmit}
                className="flex-1 rounded-lg py-2 text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--accent-green)', border: 'none', color: '#fff' }}>
                Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Result screen ──────────────────────────────────────────────────── */
function ResultScreen({ paper, questions, answers, timeTaken, onRetake, onExit }) {
  const [filter, setFilter] = useState('all')
  const [showConfetti, setShowConfetti] = useState(false)

  const stats = useMemo(() => {
    let correct = 0, wrong = 0, skipped = 0, deleted = 0
    questions.forEach((q, i) => {
      if (q.status === 'deleted') { deleted++; return }
      const chosen = answers[i]
      if (chosen == null) skipped++
      else if (chosen === q.correctAnswer) correct++
      else wrong++
    })
    const scored = questions.length - deleted
    const score = Math.max(0, correct - wrong * NEGATIVE_MARK)
    return { correct, wrong, skipped, deleted, scored, score }
  }, [questions, answers])

  const pct = stats.scored ? Math.round((stats.score / stats.scored) * 100) : 0
  // Big gold burst for a near-perfect/perfect finish, a normal burst for a
  // solid pass — same threshold the regular Quiz result screen uses.
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
      if (filter === 'wrong') return q.status !== 'deleted' && answers[i] != null && answers[i] !== q.correctAnswer
      if (filter === 'skipped') return q.status !== 'deleted' && answers[i] == null
      return true
    })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
      <Confetti active={showConfetti} tier={confettiTier} />
      <div className="rounded-xl p-5 text-center mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="text-xs mb-1" style={{ color: 'var(--text2)' }}>{paper.post}</div>
        <div className="font-bold" style={{ fontSize: 40, color: 'var(--accent)' }}>
          {stats.score.toFixed(2)}<span className="text-lg" style={{ color: 'var(--text2)' }}> / {stats.scored}</span>
        </div>
        <div className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
          {pct}% · Time taken: {fmtClock(timeTaken)}
        </div>
        <div className="flex justify-center gap-4 mt-3 text-sm flex-wrap">
          <span style={{ color: 'var(--accent-green)' }}>✓ {stats.correct} correct</span>
          <span style={{ color: '#ef4444' }}>✗ {stats.wrong} wrong (−{(stats.wrong * NEGATIVE_MARK).toFixed(2)})</span>
          <span style={{ color: 'var(--text2)' }}>— {stats.skipped} skipped</span>
          {stats.deleted > 0 && <span style={{ color: 'var(--text2)' }}>🚫 {stats.deleted} deleted</span>}
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={onRetake} className="rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--accent)', border: 'none', color: 'var(--accent-text)' }}>
            Retake
          </button>
          <button onClick={onExit} className="rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            All Papers
          </button>
        </div>
      </div>

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
        const isDeleted = q.status === 'deleted'
        return (
          <div key={q.id} className="rounded-xl p-4 mb-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <QuestionText num={i + 1} text={q.questionText} />
            {isDeleted && (
              <div className="text-xs rounded-lg px-3 py-2 mt-2 mb-1" style={{ background: 'var(--bg2)', border: '1px dashed var(--border)', color: 'var(--text2)' }}>
                🚫 Deleted by PSC — excluded from scoring
              </div>
            )}
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
            {!isDeleted && chosen == null && (
              <div className="text-xs mt-2" style={{ color: 'var(--text2)' }}>Not answered — no penalty</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function FullHundred() {
  const [stage, setStage] = useState('list')   // list | instructions | exam | result
  const [paper, setPaper] = useState(null)
  const [answers, setAnswers] = useState({})
  const [timeTaken, setTimeTaken] = useState(0)
  const [examKey, setExamKey] = useState(0)

  const questions = useMemo(() => {
    if (!paper) return []
    return fullQuestions
      .filter(q => q.paperId === paper.id)
      .sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0))
  }, [paper])

  // Clicking "Start" shows the instructions screen first (negative marking,
  // timing, live mark, etc.) rather than dropping straight into the exam.
  function chooseFromList(p) {
    setPaper(p)
    setStage('instructions')
    window.scrollTo(0, 0)
  }

  function beginExam(p) {
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

  if (stage === 'instructions' && paper) {
    return (
      <InstructionsScreen
        paper={paper}
        questionCount={questions.length}
        onBegin={() => beginExam(paper)}
        onBack={() => { setStage('list'); setPaper(null) }}
      />
    )
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
        onRetake={() => beginExam(paper)}
        onExit={() => { setStage('list'); setPaper(null) }}
      />
    )
  }
  return <PaperList onStart={chooseFromList} />
}
