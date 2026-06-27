import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import questions from '../data/questions.json'
import papers from '../data/papers.json'
import Confetti from '../components/Confetti'
import { useResults } from '../hooks/useResults'
import { useAuth } from '../contexts/AuthContext'

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
  const parts = text.split(/(__[^_]+__)/)
  return parts.map((part, i) => {
    if (part.startsWith('__') && part.endsWith('__')) {
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

function QuizSetup({ onStart }) {
  const [search] = useSearchParams()
  const initPaper = search.get('paper') || ''
  const initTopic = search.get('topic') || ''
  const initMode = search.get('mode') || 'practice'
  const [mode, setMode] = useState(initMode)
  const [paperId, setPaperId] = useState(initPaper)
  const [topicId, setTopicId] = useState(initTopic)
  const [count, setCount] = useState(10)
  const [secsPerQ, setSecsPerQ] = useState(30)

  const years = [...new Set(papers.map(p => p.year))].sort().reverse()
  const [year, setYear] = useState('')

  const allTopics = useMemo(() => {
    const map = {}
    questions.forEach(q => { if (q.topic) map[q.topic] = (map[q.topic] || 0) + 1 })
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
  }, [])

  const filteredPapers = useMemo(() =>
    papers.filter(p => !year || p.year === year), [year])

  const availableQs = useMemo(() =>
    questions.filter(q =>
      (!paperId || q.paperId === paperId) &&
      (!topicId || q.topic === topicId)
    ), [paperId, topicId])

  function handleStart() {
    let pool = [...availableQs]
    if (!paperId && mode !== 'browse') {
      pool = shuffle(pool)
      pool = pool.slice(0, Math.min(count, pool.length))
    }
    onStart({ questions: pool, mode, secsPerQ })
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
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="p-3 rounded-xl text-left border-2 transition-all"
              style={{
                borderColor: mode === m.id ? 'var(--accent)' : 'var(--border)',
                background: mode === m.id ? 'var(--bg2)' : 'var(--surface)',
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
          <select value={topicId} onChange={e => { setTopicId(e.target.value); setPaperId(''); setYear('') }}
            className="rounded-lg px-2 py-2 text-xs"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <option value="">Topic</option>
            {allTopics.map(([t, c]) => (
              <option key={t} value={t}>{t} ({c})</option>
            ))}
          </select>
          <select value={year} onChange={e => { setYear(e.target.value); setPaperId(''); setTopicId('') }}
            className="rounded-lg px-2 py-2 text-xs"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <option value="">Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={paperId} onChange={e => { setPaperId(e.target.value); setTopicId('') }}
            className="rounded-lg px-2 py-2 text-xs"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <option value="">Paper</option>
            {filteredPapers.map(p => (
              <option key={p.id} value={p.id}>
                {p.post || p.id} ({p.year})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Count slider — only when no specific paper and not browse */}
      {!paperId && !isBrowse && (
        <div className="mb-6">
          <div className="text-sm font-medium mb-2">Number of Questions: {count}</div>
          <input type="range" min={5} max={50} step={5}
            value={count} onChange={e => setCount(+e.target.value)}
            className="w-full quiz-range-slider"
            style={{ '--slider-pct': `${((count - 5) / (50 - 5)) * 100}%` }} />
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text2)' }}>
            <span>5</span><span>50</span>
          </div>
        </div>
      )}

      <div className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
        {availableQs.length} questions available
      </div>

      <button onClick={handleStart} disabled={availableQs.length === 0}
        className="w-full py-3 rounded-xl font-semibold text-sm"
        style={{ background: 'var(--accent)', color: 'var(--accent-text)', opacity: availableQs.length === 0 ? 0.5 : 1 }}>
        {isBrowse ? 'Browse Questions →' : 'Start Quiz →'}
      </button>
    </div>
  )
}

// Result icons for 5 score bands
function QuizResult({ questions, answers, onRetry, onHome }) {
  const [reviewIdx, setReviewIdx] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const { user } = useAuth()

  const score = answers.filter((a, i) =>
    questions[i].correctAnswer && a === questions[i].correctAnswer
  ).length
  const answered = answers.filter(Boolean).length
  const pct = Math.round((score / questions.length) * 100)

  // Fire confetti for scores >= 71%
  useEffect(() => {
    if (pct >= 71) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(t)
    }
  }, [pct])

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
      <Confetti active={showConfetti} />

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
        <div className="flex gap-3 mt-5 justify-center">
          <button onClick={onRetry} className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            Try Again
          </button>
          <button onClick={onHome} className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            New Quiz
          </button>
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
  const { saveResult } = useResults()

  const isTimed = quizData?.mode === 'timed'
  const isBrowse = quizData?.mode === 'browse'
  const q = quizData?.questions[current]
  const secsPerQ = quizData?.secsPerQ || 30

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
      // Save results before showing result screen
      const finalAnswers = [...answers]
      finalAnswers[current] = selected ?? answers[current]
      saveResult(quizData.questions, finalAnswers, quizData.mode)
      setQuizState('result')
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

  if (quizState === 'setup') return <QuizSetup onStart={handleStart} />

  if (quizState === 'result') {
    return (
      <QuizResult
        questions={quizData.questions}
        answers={answers}
        onRetry={() => handleStart(quizData)}
        onHome={() => setQuizState('setup')}
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
        {q.topic && (
          <div className="flex items-center gap-1.5 text-xs font-semibold mb-3"
            style={{ color: 'var(--text2)' }}>
            {q.questionNumber || (current + 1)} • {q.topic}
          </div>
        )}
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
