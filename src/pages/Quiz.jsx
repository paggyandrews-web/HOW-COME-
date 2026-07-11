import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import questions from '../data/questions.json'
import papers from '../data/papers.json'
import Confetti from '../components/Confetti'
import Dropdown from '../components/Dropdown'
import { useResults } from '../hooks/useResults'
import { useAuth } from '../contexts/AuthContext'
import { isPromoActive, promoDaysLeft } from '../utils/freeTier'
import { useBookmarks } from '../hooks/useBookmarks'
import { useStreak, isStreakMilestone } from '../hooks/useStreak'

function formatQuestion(text) {
  if (!text) return text
  const breaks = [
    'In the above sentence', 'In the above passage', 'In the above paragraph',
    'Choose the correct', 'Choose the appropriate', 'Choose the best',
    'Choose the most appropriate', 'Choose your answer from',
    'Find the error', 'Find the odd', 'Find out the', 'Identify the',
    'Select the correct', 'Select the appropriate', 'Which of the following',
    'Fill in the blank', 'Pick out the', 'Point out the',
    'Change the sentence', 'Change into', 'Correct the sentence',
  ]
  let result = text
  breaks.forEach(phrase => {
    result = result.replace(new RegExp(`\\.\\s+(${phrase})`, 'gi'), '.\n\n$1')
  })
  result = result.replace(/ : ([A-Z])/g, ' :\n\n$1')
  // Split at ? when followed by the actual sentence to complete (e.g. "Rewrite into...")
  result = result.replace(/\?\s+([A-Z])/g, '?\n\n$1')
  // Split at ?" or ?' when followed by an instruction (e.g. ?" Rewrite into indirect speech.)
  result = result.replace(/\?(["'])\s+([A-Z])/g, '?$1\n\n$2')
  return result
}

function renderWithUnderlines(text) {
  const parts = text.split(/((?<![_])__[^_]+__(?![_])|~~[^~]+~~)/)
  return parts.map((part, i) => {
    if (part.startsWith('__') && part.endsWith('__') && !part.slice(2, -2).includes('_')) {
      const word = part.slice(2, -2)
      return (
        <span key={i} style={{
          textDecoration: 'underline',
          textDecorationThickness: '2px',
          backgroundColor: 'rgba(250, 204, 21, 0.25)',
          fontWeight: 'bold'
        }}>{word}</span>
      )
    }
    if (part.startsWith('~~') && part.endsWith('~~') && !part.slice(2, -2).includes('~')) {
      const word = part.slice(2, -2)
      return (
        <span key={i} style={{ color: '#dc2626', fontSize: '0.75em' }}>{word}</span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// Fix 1: Question number left-aligned
function QuestionText({ num, text }) {
  const formatted = formatQuestion(text)
  const lines = formatted.split('\n')
  return (
    <div className="flex gap-2" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '15px' }}>
      {num && (
        <span className="font-bold shrink-0 self-start">{num}.</span>
      )}
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

function ExplanationText({ text }) {
  if (!text) return null
  return (
    <div className="text-sm leading-relaxed">
      {text.split('\n').map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} className="h-2" />
        const isHeader = /^[✅📌❌💡]/.test(trimmed)
        const isBullet = trimmed.startsWith('•')
        const isNumbered = /^\d+\./.test(trimmed)
        const needsBullet = !isHeader && !isBullet && !isNumbered
        return (
          <div key={i} className="mb-1" style={{ display: 'flex', gap: '6px' }}>
            {needsBullet && <span style={{ flexShrink: 0, color: 'var(--accent)' }}>•</span>}
            <span>{line}</span>
          </div>
        )
      })}
    </div>
  )
}

function ExplanationBlock({ explanation }) {
  if (!explanation) return null
  if (typeof explanation !== 'object') {
    return (
      <div className="p-4" style={{ background: 'var(--bg2)', color: 'var(--text)' }}>
        💡 {explanation}
      </div>
    )
  }
  return (
    <>
      {explanation.correct && (
        <div className="p-4" style={{ background: 'var(--bg2)', color: 'var(--text)' }}>
          <ExplanationText text={explanation.correct} />
        </div>
      )}
      {explanation.rule && (
        <div className="p-4 border-t" style={{ background: 'var(--bg2)', color: 'var(--text)', borderColor: 'var(--border)' }}>
          <ExplanationText text={explanation.rule} />
        </div>
      )}
      {explanation.wrong && (
        <div className="p-4 border-t" style={{ background: 'var(--bg2)', color: 'var(--text)', borderColor: 'var(--border)' }}>
          <ExplanationText text={explanation.wrong} />
        </div>
      )}
      {explanation.tip && (
        <div className="p-4 border-t" style={{ background: 'var(--bg2)', color: 'var(--text)', borderColor: 'var(--border)' }}>
          <ExplanationText text={explanation.tip} />
        </div>
      )}
    </>
  )
}

/* ── Share Result ─────────────────────────────────── */

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function generateShareCanvas({ score, total, pct, icon, topicStats }) {
  const W = 800, H = 800
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#071524'
  ctx.fillRect(0, 0, W, H)

  // Decorative circles
  ;[
    [W - 60, 60, 180, 'rgba(26,157,142,0.08)'],
    [60, H - 60, 130, 'rgba(26,157,142,0.06)'],
    [W / 2, H / 2, 220, 'rgba(26,157,142,0.03)'],
  ].forEach(([cx, cy, r, c]) => {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  })

  // Top teal accent bar
  ctx.fillStyle = '#1a9d8e'
  ctx.fillRect(0, 0, W, 8)

  // HOW COME? branding
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 54px system-ui, -apple-system, Arial, sans-serif'
  ctx.fillText('HOW COME?', W / 2, 78)

  ctx.fillStyle = '#1a9d8e'
  ctx.font = '18px system-ui, -apple-system, Arial, sans-serif'
  ctx.fillText('Kerala PSC English Practice', W / 2, 110)

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(60, 132)
  ctx.lineTo(W - 60, 132)
  ctx.stroke()

  // Big emoji icon
  ctx.font = '80px serif'
  ctx.textAlign = 'center'
  ctx.fillText(icon, W / 2, 235)

  // Score "X / Y"
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 86px system-ui, -apple-system, Arial, sans-serif'
  ctx.fillText(`${score} / ${total}`, W / 2, 340)

  // Percentage
  ctx.fillStyle = '#1a9d8e'
  ctx.font = 'bold 42px system-ui, -apple-system, Arial, sans-serif'
  ctx.fillText(`${pct}% Correct`, W / 2, 398)

  // Motivation
  const msg =
    pct > 90 ? "Outstanding! You're PSC ready!"
    : pct >= 71 ? 'Excellent work! Keep it up!'
    : pct >= 51 ? 'Good effort! Keep practising!'
    : 'Every attempt makes you better!'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '20px system-ui, -apple-system, Arial, sans-serif'
  ctx.fillText(msg, W / 2, 445)

  // Topic performance
  const showTopics = topicStats.slice(0, 4)
  if (showTopics.length > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '13px system-ui, -apple-system, Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('TOPIC PERFORMANCE', 80, 490)

    const barX = 80, barW = W - 160, barH = 36, barGap = 12
    showTopics.forEach((t, i) => {
      const y = 508 + i * (barH + barGap)
      // BG
      ctx.fillStyle = 'rgba(255,255,255,0.07)'
      drawRoundRect(ctx, barX, y, barW, barH, 8)
      ctx.fill()
      // Fill
      const fillW = Math.max(barW * Math.max(t.pct / 100, 0.02), 16)
      ctx.fillStyle = t.pct >= 80 ? '#16a34a' : t.pct >= 50 ? '#f59e0b' : '#ef4444'
      drawRoundRect(ctx, barX, y, fillW, barH, 8)
      ctx.fill()
      // Label
      ctx.fillStyle = '#ffffff'
      ctx.font = '14px system-ui, -apple-system, Arial, sans-serif'
      ctx.textAlign = 'left'
      const label = t.topic.length > 30 ? t.topic.slice(0, 30) + '…' : t.topic
      ctx.fillText(label, barX + 12, y + barH / 2 + 5)
      ctx.textAlign = 'right'
      ctx.fillText(`${t.correct}/${t.total}`, barX + barW - 12, y + barH / 2 + 5)
    })
  }

  // Bottom bar
  ctx.fillStyle = '#0a2e28'
  ctx.fillRect(0, H - 75, W, 75)

  ctx.fillStyle = '#1a9d8e'
  ctx.font = 'bold 22px system-ui, -apple-system, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('how-come.vercel.app', W / 2, H - 38)

  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = '13px system-ui, -apple-system, Arial, sans-serif'
  ctx.fillText('Free Kerala PSC English Practice App', W / 2, H - 14)

  return canvas
}

async function shareResult({ score, total, pct, icon, topicStats }) {
  const canvas = generateShareCanvas({ score, total, pct, icon, topicStats })
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'howcome-score.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `HOW COME? Score: ${score}/${total}`,
            text: `I scored ${pct}% on HOW COME! Kerala PSC English Practice\nPractice free at: how-come.vercel.app`,
          })
        } catch (e) {
          if (e.name !== 'AbortError') {
            // fallback download
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = 'howcome-score.png'; a.click()
            URL.revokeObjectURL(url)
          }
        }
      } else {
        // Desktop fallback — download the image
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'howcome-score.png'; a.click()
        URL.revokeObjectURL(url)
      }
      resolve()
    }, 'image/png')
  })
}

// PSC-deleted/cancelled questions are flagged with "(~~deleted by psc~~)" in questionText.
// They should never surface in topic/mixed/saved/mistakes quizzes — only when a user
// deliberately practices the exact paper they belong to.
function isDeletedByPsc(q) {
  return typeof q.questionText === 'string' && /deleted by psc/i.test(q.questionText)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function TimerBar({ secs, total }) {
  const pct = (secs / total) * 100
  const color = pct > 50 ? 'var(--accent)' : pct > 20 ? '#f59e0b' : '#ef4444'
  return (
    <div className="w-full rounded-full h-2" style={{ background: 'var(--bg2)' }}>
      <div className="h-2 rounded-full transition-all"
        style={{ width: `${pct}%`, background: color, transition: 'width 1s linear' }} />
    </div>
  )
}

const TIMING_OPTIONS = [15, 20, 25, 30]

function QuizSetup({ onStart, locked, needsSignup, daysLeft }) {
  const [search] = useSearchParams()
  const initPaper = search.get('paper') || ''
  const initTopic = search.get('topic') || ''
  const initMode = search.get('mode') || 'practice'
  const [mode, setMode] = useState(initMode)
  const [paperId, setPaperId] = useState(initPaper)
  const [topicId, setTopicId] = useState(initTopic)
  const [count, setCount] = useState(10)
  const [secsPerQ, setSecsPerQ] = useState(30)
  const { bookmarks } = useBookmarks()
  const { getAllResults, getMistakeIds } = useResults()
  const [mistakeIds, setMistakeIds] = useState([])

  // Load past-mistake question IDs (localStorage + Firestore if logged in)
  useEffect(() => {
    let alive = true
    getAllResults().then(results => {
      if (alive) setMistakeIds(getMistakeIds(results))
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const years = [...new Set(papers.map(p => p.year))].sort().reverse()
  const [year, setYear] = useState('')

  const allTopics = useMemo(() => {
    const map = {}
    questions.forEach(q => { if (q.topic) map[q.topic] = (map[q.topic] || 0) + 1 })
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
  }, [])

  const filteredPapers = useMemo(() =>
    papers.filter(p => !year || p.year === year), [year])

  const availableQs = useMemo(() => {
    // Deleted/cancelled PSC questions only allowed when practicing that exact paper
    // (paperId selected, no topic mixing) — never in topic, mixed, saved or mistakes pools.
    const isExactPaperOnly = !!paperId && !topicId
    const stripDeleted = qs => isExactPaperOnly ? qs : qs.filter(q => !isDeletedByPsc(q))

    if (mode === 'saved') {
      return stripDeleted(questions.filter(q => bookmarks.includes(q.id)))
    }
    if (mode === 'mistakes') {
      return stripDeleted(questions.filter(q => mistakeIds.includes(q.id)))
    }
    return stripDeleted(questions.filter(q =>
      (!paperId || q.paperId === paperId) &&
      (!topicId || q.topic === topicId)
    ))
  }, [paperId, topicId, mode, bookmarks, mistakeIds])

  // When a topic is pre-selected, default count to all questions in that topic
  useEffect(() => {
    if (topicId) setCount(availableQs.length || 10)
  }, [topicId, availableQs.length])

  function handleStart() {
    let pool = [...availableQs]
    if (!paperId && mode !== 'browse' && mode !== 'saved' && mode !== 'mistakes') {
      pool = shuffle(pool)
      pool = pool.slice(0, Math.min(count, pool.length))
    }
    const playMode = (mode === 'saved' || mode === 'mistakes') ? 'practice' : mode
    onStart({ questions: pool, mode: playMode, secsPerQ })
  }

  const isBrowse = mode === 'browse'

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="font-bold text-2xl mb-6">Start Quiz</h1>

      {/* Mode */}
      <div className="mb-5">
        <div className="text-sm font-medium mb-2">Quiz Mode</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'practice', label: '📖 Practice', sub: 'No timer · Explanations' },
            { id: 'timed', label: '⏱ Timed', sub: 'Timer per question' },
            { id: 'saved', label: '🔖 Saved', sub: bookmarks.length > 0 ? `${bookmarks.length} bookmarked` : 'No bookmarks yet' },
            { id: 'mistakes', label: '❌ Mistakes', sub: mistakeIds.length > 0 ? `${mistakeIds.length} to retry` : 'No mistakes yet' },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="p-3 rounded-xl text-left border-2 transition-all"
              style={{
                borderColor: mode === m.id ? 'var(--accent)' : 'var(--border)',
                background: mode === m.id ? 'var(--bg2)' : 'var(--surface)',
                opacity: (m.id === 'saved' && bookmarks.length === 0) || (m.id === 'mistakes' && mistakeIds.length === 0) ? 0.5 : 1,
              }}>
              <div className="font-medium text-sm">{m.label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{m.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Timing selector — only for timed mode */}
      {mode === 'timed' && (
        <div className="mb-5">
          <div className="text-sm font-medium mb-2">Seconds per Question</div>
          <div className="grid grid-cols-4 gap-2">
            {TIMING_OPTIONS.map(t => (
              <button key={t} onClick={() => setSecsPerQ(t)}
                className="py-2 rounded-lg text-sm font-semibold border-2 transition-all"
                style={{
                  borderColor: secsPerQ === t ? 'var(--accent)' : 'var(--border)',
                  background: secsPerQ === t ? 'var(--bg2)' : 'var(--surface)',
                  color: secsPerQ === t ? 'var(--text)' : 'var(--text2)',
                }}>
                {t}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compact filter row — Topic / Year / Paper in one line */}
      <div className="mb-5">
        <div className="text-sm font-medium mb-2">Filter (optional)</div>
        <div className="grid grid-cols-3 gap-2">
          <Dropdown
            value={topicId}
            onChange={v => { setTopicId(v); setPaperId(''); setYear('') }}
            placeholder="Topic"
            options={[
              { value: '', label: 'Topic' },
              ...allTopics.map(([t, c]) => ({ value: t, label: `${t} (${c})` })),
            ]}
          />
          <Dropdown
            value={year}
            onChange={v => { setYear(v); setPaperId(''); setTopicId('') }}
            placeholder="Year"
            options={[
              { value: '', label: 'Year' },
              ...years.map(y => ({ value: y, label: y })),
            ]}
          />
          <Dropdown
            value={paperId}
            onChange={v => { setPaperId(v); setTopicId('') }}
            placeholder="Paper"
            options={[
              { value: '', label: 'Paper' },
              ...filteredPapers.map(p => ({
                value: p.id,
                label: `${p.post || p.id} (${p.year})${p.paperCode ? ` · ${p.paperCode}` : ''}`,
              })),
            ]}
          />
        </div>
      </div>

      {/* Count slider — hidden for paper-specific, browse, saved and mistakes modes */}
      {!paperId && !isBrowse && mode !== 'saved' && mode !== 'mistakes' && (
        <div className="mb-6">
          {(() => {
            const sliderMax = topicId ? availableQs.length : Math.max(50, availableQs.length)
            const sliderMin = Math.min(5, sliderMax)
            const safePct = sliderMax <= sliderMin ? 100 : ((count - sliderMin) / (sliderMax - sliderMin)) * 100
            return (
              <>
                <div className="text-sm font-medium mb-2">Number of Questions: {count}</div>
                <input type="range" min={sliderMin} max={sliderMax} step={1}
                  value={Math.min(count, sliderMax)}
                  onChange={e => setCount(+e.target.value)}
                  className="w-full quiz-range-slider"
                  style={{ '--slider-pct': `${safePct}%` }} />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text2)' }}>
                  <span>{sliderMin}</span><span>{sliderMax}</span>
                </div>
              </>
            )
          })()}
        </div>
      )}

      <div className="text-sm mb-4 font-semibold" style={{ color: 'var(--accent)' }}>
        {availableQs.length} questions available
      </div>

      {needsSignup && !isBrowse ? (
        <div className="p-4 rounded-xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-2xl mb-1">👋</div>
          <div className="font-semibold text-sm mb-2">Sign up to start practicing</div>
          <div className="text-xs mb-3" style={{ color: 'var(--text2)' }}>
            Free to use until 31 July — just create an account first.
          </div>
          <Link to="/register"
            className="inline-block w-full py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            Sign Up Free →
          </Link>
          <div className="text-xs mt-2">
            <Link to="/login" style={{ color: 'var(--accent)' }}>Already have an account? Log in</Link>
          </div>
        </div>
      ) : locked && !isBrowse ? (
        <div className="p-4 rounded-xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--accent-pink)' }}>
          <div className="text-2xl mb-1">🔒</div>
          <div className="font-semibold text-sm mb-1" style={{ color: 'var(--accent-pink)' }}>Free promo ended</div>
          <div className="text-xs" style={{ color: 'var(--text2)' }}>
            The free period ended 31 July. Upgrade to keep practicing.
          </div>
        </div>
      ) : (
        <>
          <button onClick={handleStart} disabled={availableQs.length === 0}
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)', opacity: availableQs.length === 0 ? 0.5 : 1 }}>
            {isBrowse ? 'Browse Questions →' : 'Start Quiz →'}
          </button>
          {typeof daysLeft === 'number' && !isBrowse && (
            <div className="text-xs text-center mt-2" style={{ color: 'var(--text2)' }}>
              Free until 31 July {daysLeft > 0 ? `— ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : '— last day'}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Result icons for 5 score bands
function QuizResult({ questions, answers, onRetry, onHome, streakMilestone }) {
  const [reviewIdx, setReviewIdx] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFire, setShowFire] = useState(false)
  const [sharing, setSharing] = useState(false)
  const { user } = useAuth()

  const score = answers.filter((a, i) =>
    questions[i].correctAnswer && a === questions[i].correctAnswer
  ).length
  const answered = answers.filter(Boolean).length
  const pct = Math.round((score / questions.length) * 100)
  // Near-perfect/perfect scores get the bigger, gold-tinted burst instead of
  // the standard one — the same animation every time stops feeling earned.
  const confettiTier = pct > 90 ? 'big' : 'normal'

  // Fire confetti for scores >= 71%
  useEffect(() => {
    if (pct >= 71) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(t)
    }
  }, [pct])

  // Separate ember burst for hitting a streak milestone this session
  useEffect(() => {
    if (streakMilestone) {
      setShowFire(true)
      const t = setTimeout(() => setShowFire(false), 3500)
      return () => clearTimeout(t)
    }
  }, [streakMilestone])

  // Topic breakdown for this quiz
  const topicStats = useMemo(() => {
    const stats = {}
    questions.forEach((q, i) => {
      const topic = q.topic || 'General'
      if (!stats[topic]) stats[topic] = { correct: 0, total: 0 }
      stats[topic].total++
      if (answers[i] === q.correctAnswer) stats[topic].correct++
    })
    return Object.entries(stats)
      .map(([topic, { correct, total }]) => ({ topic, correct, total, pct: Math.round((correct / total) * 100) }))
      .sort((a, b) => a.pct - b.pct)
  }, [questions, answers])

  const weakTopics = topicStats.filter(t => t.pct < 60 && t.total >= 1)
  const strongTopics = topicStats.filter(t => t.pct >= 80 && t.total >= 1)

  // 5-band icon
  const icon = pct > 90 ? '🏆' : pct >= 71 ? '🎉' : pct >= 51 ? '📚' : pct >= 31 ? '💪' : '😓'
  const message = pct > 90 ? 'Outstanding! Excellent work!' : pct >= 71 ? 'Great job! Keep it up.' : pct >= 51 ? 'Good effort — keep practising!' : pct >= 31 ? 'You\'re getting there — keep going!' : 'Don\'t give up — practice more!'

  const q = questions[reviewIdx]
  const userAns = answers[reviewIdx]
  const correct = q?.correctAnswer
  const opts = q ? [
    ['A', q.optionA], ['B', q.optionB], ['C', q.optionC], ['D', q.optionD]
  ].filter(([, v]) => v) : []

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Confetti active={showConfetti} tier={confettiTier} />
      <Confetti active={showFire} variant="fire" tier={confettiTier} />

      {/* Score card */}
      <div className="card rounded-2xl p-6 text-center mb-4">
        <div className="text-5xl mb-3">{icon}</div>
        <h2 className="text-2xl font-bold mb-1">
          {questions[0]?.correctAnswer ? `${score} / ${questions.length}` : `${answered} answered`}
        </h2>
        {questions[0]?.correctAnswer && (
          <div className="text-4xl font-bold mb-3" style={{ color: 'var(--accent)' }}>{pct}%</div>
        )}
        <p style={{ color: 'var(--text2)' }} className="text-sm">{message}</p>
        {streakMilestone && (
          <div
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(255,107,53,0.14)', color: '#ff6b35' }}
          >
            🔥 {streakMilestone}-day streak!
          </div>
        )}
        <div className="flex gap-3 mt-5 justify-center flex-wrap">
          <button onClick={onRetry} className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            Try Again
          </button>
          <button onClick={onHome} className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            New Quiz
          </button>
          {questions[0]?.correctAnswer && (
            <button
              onClick={async () => {
                setSharing(true)
                await shareResult({ score, total: questions.length, pct, icon, topicStats })
                setSharing(false)
              }}
              disabled={sharing}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
              style={{
                background: 'rgba(26,157,142,0.15)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                opacity: sharing ? 0.65 : 1,
                touchAction: 'manipulation',
              }}
            >
              {sharing ? '⏳ Preparing…' : '📤 Share Result'}
            </button>
          )}
        </div>
      </div>

      {/* Topic breakdown */}
      {topicStats.length > 0 && (
        <div className="card rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-sm mb-3">Topic Breakdown</h3>
          <div className="space-y-2">
            {topicStats.map(({ topic, correct, total, pct: tPct }) => (
              <div key={topic}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text)' }} className="truncate pr-2">{topic}</span>
                  <span className="shrink-0 font-semibold" style={{ color: tPct >= 80 ? '#16a34a' : tPct >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {correct}/{total}
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: 'var(--bg2)' }}>
                  <div className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${tPct}%`,
                      background: tPct >= 80 ? '#16a34a' : tPct >= 50 ? '#f59e0b' : '#ef4444'
                    }} />
                </div>
              </div>
            ))}
          </div>

          {weakTopics.length > 0 && (
            <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              🔴 Focus on: {weakTopics.map(t => t.topic).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Guest signup prompt */}
      {!user && (
        <div className="card rounded-2xl p-4 mb-4" style={{ border: '1px solid var(--accent)' }}>
          <p className="text-sm font-semibold mb-1">Track your progress permanently</p>
          <p className="text-xs mb-3" style={{ color: 'var(--text2)' }}>
            Sign up to save your weak topics across all quizzes and see your improvement over time.
          </p>
          <Link to="/register"
            className="block text-center py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            Sign Up Free →
          </Link>
        </div>
      )}

      {/* Fix 6: Single question review with Prev/Next */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">Review</h3>
        <span className="text-xs" style={{ color: 'var(--text2)' }}>
          Q{reviewIdx + 1} of {questions.length}
        </span>
      </div>

      {/* Number jump bar only */}
      <div className="flex gap-1 overflow-x-auto py-1 mb-4">
        {questions.map((_, i) => {
          const ans = answers[i]
          const isCorrect = ans && questions[i].correctAnswer && ans === questions[i].correctAnswer
          const isWrong = ans && questions[i].correctAnswer && ans !== questions[i].correctAnswer
          return (
            <button key={i} onClick={() => setReviewIdx(i)}
              className="shrink-0 w-7 h-7 rounded text-xs font-semibold"
              style={{
                background: i === reviewIdx ? 'var(--accent)' : isCorrect ? '#16a34a' : isWrong ? '#dc2626' : 'var(--bg2)',
                color: (i === reviewIdx || isCorrect || isWrong) ? 'white' : 'var(--text2)',
              }}>
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Single question */}
      {q && (
        <div className="card rounded-xl p-4">
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>
            Q{q.questionNumber || (reviewIdx + 1)}{q.topic ? ` • ${q.topic}` : ''}
          </div>
          <div className="text-sm font-medium mb-3">
            <QuestionText text={q.questionText} />
          </div>
          <div className="space-y-1 mb-3">
            {opts.map(([letter, text]) => {
              let bg = 'var(--bg2)', col = 'var(--text)'
              if (correct && letter === correct) { bg = '#16a34a'; col = 'white' }
              else if (userAns === letter && letter !== correct) { bg = '#dc2626'; col = 'white' }
              return (
                <div key={letter} className="px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: bg, color: col }}>
                  ({letter}) {text}
                </div>
              )
            })}
          </div>
          {q.explanation && (
            <div className="rounded-lg overflow-hidden text-xs"
              style={{ border: '1px solid var(--border)' }}>
              <ExplanationBlock explanation={q.explanation} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Quiz() {
  const [quizState, setQuizState] = useState('setup')
  const [quizData, setQuizData] = useState(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [timedOut, setTimedOut] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [vibratingOption, setVibratingOption] = useState(null)
  const [streakMilestone, setStreakMilestone] = useState(null)
  const { saveResult } = useResults()
  const { toggle: toggleBookmark, isBookmarked } = useBookmarks()
  const { updateStreak } = useStreak()
  const { user, profile } = useAuth()
  const [searchParams] = useSearchParams()

  const needsSignup = !user
  const isLocked = !needsSignup && !profile?.isPaid && !isPromoActive()
  const daysLeft = (!needsSignup && !profile?.isPaid) ? promoDaysLeft() : null

  const isTimed = quizData?.mode === 'timed'
  const isBrowse = quizData?.mode === 'browse'
  const q = quizData?.questions[current]
  const secsPerQ = quizData?.secsPerQ || 30

  // Auto-start when a single questionId is passed (from Search page)
  useEffect(() => {
    const qid = searchParams.get('questionId')
    if (!qid) return
    const found = questions.find(q => q.id === qid)
    if (!found) return
    handleStart({ questions: [found], mode: 'browse', secsPerQ: 30 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-reveal in browse mode
  useEffect(() => {
    if (isBrowse && quizState === 'quiz') setRevealed(true)
  }, [current, isBrowse, quizState])

  // Timer — stops when answer is selected or timed out
  useEffect(() => {
    if (quizState !== 'quiz' || !isTimed || timedOut || selected !== null) return
    if (timeLeft <= 0) { setTimedOut(true); return }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [quizState, isTimed, timeLeft, timedOut, selected])

  function handleStart({ questions, mode, secsPerQ }) {
    if (mode !== 'browse' && (needsSignup || isLocked)) return // must be signed up, and within the free promo or paid
    setQuizData({ questions, mode, secsPerQ })
    setAnswers(new Array(questions.length).fill(null))
    setCurrent(0)
    setSelected(null)
    setRevealed(false)
    setTimeLeft(secsPerQ)
    setTimedOut(false)
    setQuizState('quiz')
  }

  // Fix 3: No reveal on select in timed mode
  function handleSelect(letter) {
    if (revealed || timedOut) return
    setSelected(letter)
    setAnswers(prev => { const next = [...prev]; next[current] = letter; return next })
    // Vibration feedback (haptic + CSS)
    if (navigator.vibrate) navigator.vibrate(30)
    setVibratingOption(letter)
    setTimeout(() => setVibratingOption(null), 350)
    // Confetti only in timed mode when correct
    if (isTimed && q?.correctAnswer && letter === q.correctAnswer) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }

  function handleCheck() {
    setRevealed(true)
    if (q?.correctAnswer && selected === q.correctAnswer) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }

  function handleNext() {
    if (current + 1 >= quizData.questions.length) {
      if (isBrowse) return // Browse mode doesn't go to result
      // Save results + update streak before showing result screen
      const finalAnswers = [...answers]
      finalAnswers[current] = selected ?? answers[current]
      saveResult(quizData.questions, finalAnswers, quizData.mode)
      // Non-blocking — the result screen shouldn't wait on this, and the
      // fire burst just fires a beat later once the streak is confirmed.
      updateStreak().then(updated => {
        if (updated?.isNewDay && isStreakMilestone(updated.currentStreak)) {
          setStreakMilestone(updated.currentStreak)
        }
      })
      setQuizState('result')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setCurrent(i => i + 1)
    setSelected(answers[current + 1] ?? null)
    setRevealed(false)
    setTimeLeft(secsPerQ)
    setTimedOut(false)
  }

  // Fix 6: Previous question navigation
  function handlePrev() {
    if (current === 0) return
    const prev = current - 1
    setCurrent(prev)
    setSelected(answers[prev] ?? null)
    // In practice mode, restore revealed state if already answered
    setRevealed(isBrowse || (!isTimed && answers[prev] !== null))
    setTimedOut(false)
    setTimeLeft(secsPerQ)
  }

  if (quizState === 'setup') return <QuizSetup onStart={handleStart} locked={isLocked} needsSignup={needsSignup} daysLeft={daysLeft} />

  if (quizState === 'result') {
    return (
      <QuizResult
        questions={quizData.questions}
        answers={answers}
        onRetry={() => { setStreakMilestone(null); handleStart(quizData) }}
        onHome={() => { setStreakMilestone(null); setQuizState('setup') }}
        streakMilestone={streakMilestone}
      />
    )
  }

  // Active quiz
  const opts = [
    ['A', q.optionA], ['B', q.optionB], ['C', q.optionC], ['D', q.optionD]
  ].filter(([, v]) => v)

  const progress = ((current + 1) / quizData.questions.length) * 100

  // Can advance to next in timed mode without revealing
  const timedCanAdvance = isTimed && (selected !== null || timedOut)
  const isLastQ = current + 1 >= quizData.questions.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Confetti active={showConfetti} />
      {/* Header */}
      <div className="flex items-center justify-between mb-3 text-sm" style={{ color: 'var(--text2)' }}>
        <span>Question {current + 1} of {quizData.questions.length}</span>
        <span style={{ color: 'var(--accent)' }} className="font-medium">{q.paperId}</span>
      </div>

      {/* Progress */}
      <div className="w-full rounded-full h-1.5 mb-4" style={{ background: 'var(--bg2)' }}>
        <div className="h-1.5 rounded-full"
          style={{ width: `${progress}%`, background: 'var(--accent)', transition: 'width 0.3s' }} />
      </div>

      {/* Timer */}
      {isTimed && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text2)' }}>
            <span>Time</span>
            <span style={{ color: timeLeft <= 10 ? '#ef4444' : 'var(--text2)' }}>{timeLeft}s</span>
          </div>
          <TimerBar secs={timeLeft} total={secsPerQ} />
        </div>
      )}

      {/* Question */}
      <div className="card rounded-2xl p-5 mb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          {q.topic && (
            <div className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>
              {q.questionNumber || (current + 1)} • {q.topic}
            </div>
          )}
          <button
            onClick={() => toggleBookmark(q.id)}
            title={isBookmarked(q.id) ? 'Remove bookmark' : 'Bookmark this question'}
            className="shrink-0 text-lg transition-transform active:scale-125"
            style={{ lineHeight: 1, marginLeft: 'auto' }}>
            {isBookmarked(q.id) ? '🔖' : '🏷️'}
          </button>
        </div>
        <QuestionText num={!q.topic ? (q.questionNumber || current + 1) : null} text={q.questionText} />
      </div>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {opts.map(([letter, text]) => {
          const isSelected = selected === letter
          const isCorrect = q.correctAnswer && letter === q.correctAnswer
          let style = {}
          if (revealed || (isTimed && selected !== null)) {
            // Border-only feedback — both practice (after Check) and timed (after selection)
            if (isCorrect) style = { background: 'var(--surface)', color: 'var(--text)', borderColor: '#16a34a', borderWidth: '3px' }
            else if (isSelected && !isCorrect) style = { background: 'var(--surface)', color: 'var(--text)', borderColor: '#dc2626', borderWidth: '3px' }
            else style = { background: 'var(--bg2)', color: 'var(--text2)', borderColor: 'var(--border)' }
          } else if (timedOut) {
            if (isCorrect) style = { background: 'var(--surface)', color: 'var(--text)', borderColor: '#16a34a', borderWidth: '3px' }
            else style = { background: 'var(--surface)', color: 'var(--text2)', borderColor: 'var(--border)' }
          } else {
            style = isSelected
              ? { background: 'var(--bg2)', color: 'var(--text)', borderColor: 'var(--accent)' }
              : { background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }
          }
          return (
            <button key={letter}
              onClick={() => handleSelect(letter)}
              disabled={revealed || (isTimed && selected !== null) || timedOut || isBrowse}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm border-2 transition-all${vibratingOption === letter ? ' vibrate' : ''}`}
              style={style}>
              <span className="font-semibold mr-2">({letter})</span>{text}
            </button>
          )
        })}
      </div>

      {/* Fix 4: Action buttons — single instance, no duplicate */}
      {/* Browse mode: just Prev + Next */}
      {isBrowse && (
        <div className="flex gap-3 mb-4">
          <button onClick={handlePrev} disabled={current === 0}
            className="py-2.5 px-4 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', opacity: current === 0 ? 0.4 : 1 }}>
            ← Prev
          </button>
          <button onClick={handleNext} disabled={isLastQ}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)', opacity: isLastQ ? 0.4 : 1 }}>
            Next →
          </button>
        </div>
      )}

      {/* Timed mode buttons */}
      {isTimed && (
        <div className="flex gap-3 mb-4">
          {!timedCanAdvance && (
            <button onClick={handleNext}
              className="py-2.5 px-4 rounded-xl text-sm"
              style={{ background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
              Skip
            </button>
          )}
          {timedCanAdvance && (
            <button onClick={handleNext} className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              {isLastQ ? 'See Results' : 'Next →'}
            </button>
          )}
        </div>
      )}

      {/* Practice mode: pre-reveal buttons */}
      {!isTimed && !isBrowse && !revealed && (
        <div className="flex gap-3 mb-4">
          {current > 0 && (
            <button onClick={handlePrev}
              className="py-2.5 px-4 rounded-xl text-sm"
              style={{ background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
              ← Prev
            </button>
          )}
          {selected && (
            <button onClick={handleCheck} className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              Check Answer
            </button>
          )}
          <button onClick={handleNext}
            className="py-2.5 px-4 rounded-xl text-sm"
            style={{ background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
            Skip
          </button>
        </div>
      )}

      {/* Explanation (practice + browse only) */}
      {(isBrowse || (!isTimed && revealed)) && q.explanation && (
        <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <ExplanationBlock explanation={q.explanation} />
        </div>
      )}

      {/* Timed out message */}
      {timedOut && (
        <div className="mb-4 p-3 rounded-xl text-sm text-center" style={{ background: '#fef2f2', color: '#dc2626' }}>
          ⏰ Time's up!
        </div>
      )}

      {/* Practice mode: post-reveal Next button (single instance — Fix 4) */}
      {!isTimed && !isBrowse && revealed && (
        <div className="flex gap-3">
          {current > 0 && (
            <button onClick={handlePrev}
              className="py-2.5 px-4 rounded-xl text-sm"
              style={{ background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
              ← Prev
            </button>
          )}
          <button onClick={handleNext} className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            {isLastQ ? 'See Results' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}
