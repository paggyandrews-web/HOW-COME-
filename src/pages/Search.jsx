import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import questions from '../data/questions.json'
import papers from '../data/papers.json'
import modelQuestions from '../data/modelQuestions.json'
import modelPapers from '../data/modelPapers.json'
import SignupGate from '../components/SignupGate'
import { useAuth } from '../contexts/AuthContext'

const paperMap = {}
papers.forEach(p => { paperMap[p.id] = p })

// Mock-test questions are searchable too, but only from mocks that are already
// out (same rule as the Mock page: no drafts, nothing before its publishedAt),
// and only the questions the mock actually shows (capped by questionCount).
function isPublished(paper) {
  if (paper?.status === 'draft') return false
  if (!paper?.publishedAt) return true
  return Date.now() >= new Date(paper.publishedAt).getTime()
}

function liveMockBank() {
  const live = new Map(modelPapers.filter(isPublished).map(p => [p.id, p]))
  const byPaper = {}
  modelQuestions.forEach(q => {
    if (live.has(q.paperId)) (byPaper[q.paperId] = byPaper[q.paperId] || []).push(q)
  })
  const out = []
  Object.entries(byPaper).forEach(([pid, qs]) => {
    const paper = live.get(pid)
    qs.sort((a, b) => (+a.questionNumber || 0) - (+b.questionNumber || 0))
    out.push(...(paper.questionCount ? qs.slice(0, paper.questionCount) : qs))
  })
  return { questions: out, papers: live }
}

const RESULT_LIMIT = 60

function matches(question, q) {
  return (
    question.questionText?.toLowerCase().includes(q) ||
    question.optionA?.toLowerCase().includes(q) ||
    question.optionB?.toLowerCase().includes(q) ||
    question.optionC?.toLowerCase().includes(q) ||
    question.optionD?.toLowerCase().includes(q) ||
    question.topic?.toLowerCase().includes(q)
  )
}

// Alternate PSC and mock hits so neither source crowds the other out.
function interleave(a, b, limit) {
  const out = []
  for (let i = 0; out.length < limit && (i < a.length || i < b.length); i++) {
    if (i < a.length) out.push(a[i])
    if (i < b.length && out.length < limit) out.push(b[i])
  }
  return out
}

function highlight(text, query) {
  if (!text || !query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, 120) + (text.length > 120 ? '…' : '')
  const start = Math.max(0, idx - 40)
  const end = Math.min(text.length, idx + query.length + 80)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

export default function Search() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [inputValue, setInputValue] = useState(params.get('q') || '')

  // Keep URL in sync
  useEffect(() => {
    const q = params.get('q') || ''
    setQuery(q)
    setInputValue(q)
  }, [params])

  function doSearch() {
    const trimmed = inputValue.trim()
    if (trimmed.length >= 2) {
      setParams({ q: trimmed })
      setQuery(trimmed)
    }
  }

  const mockBank = useMemo(() => liveMockBank(), [])
  const [source, setSource] = useState('all') // 'all' | 'psc' | 'mock'
  useEffect(() => { setSource('all') }, [query])

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return { psc: [], mock: [] }
    return {
      psc: questions.filter(question => matches(question, q)),
      mock: mockBank.questions.filter(question => matches(question, q)),
    }
  }, [query, mockBank])

  const results = useMemo(() => {
    if (source === 'psc') return hits.psc.slice(0, RESULT_LIMIT)
    if (source === 'mock') return hits.mock.slice(0, RESULT_LIMIT)
    return interleave(hits.psc, hits.mock, RESULT_LIMIT)
  }, [hits, source])

  const totalHits = source === 'psc' ? hits.psc.length : source === 'mock' ? hits.mock.length : hits.psc.length + hits.mock.length
  const bankSize = questions.length + mockBank.questions.length

  // Group results by topic for the "Found in topics" summary
  const topicHits = useMemo(() => {
    const map = {}
    results.forEach(q => {
      if (q.topic) map[q.topic] = (map[q.topic] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [results])

  const isSearching = query.trim().length >= 2
  const hasResults = results.length > 0

  if (!user) {
    return (
      <SignupGate
        title="Sign up to search questions"
        subtitle="Searching the full PSC question bank by keyword or topic needs an account."
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-5">Search Questions</h1>

      {/* Search input */}
      <div className="relative mb-6">
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder={`Search ${bankSize} questions by keyword or topic...`}
          autoFocus
          className="w-full rounded-xl px-4 py-3.5 pr-20 text-sm"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            outline: 'none',
          }}
        />
        <button
          onClick={doSearch}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            touchAction: 'manipulation',
            opacity: inputValue.trim().length >= 2 ? 1 : 0.4,
          }}
        >
          Search
        </button>
      </div>

      {/* Results count + topic hits */}
      {isSearching && (
        <div className="mb-5">
          <p className="text-sm mb-2" style={{ color: 'var(--text2)' }}>
            {totalHits > 0
              ? `${totalHits} question${totalHits !== 1 ? 's' : ''} found for "${query}"`
              : `No questions found for "${query}"`}
          </p>
          {hits.psc.length + hits.mock.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3" role="tablist" aria-label="Where to search">
              {[['all', 'All', hits.psc.length + hits.mock.length], ['psc', 'PSC papers', hits.psc.length], ['mock', 'Mock tests', hits.mock.length]].map(([key, label, n]) => {
                const active = source === key
                return (
                  <button key={key} role="tab" aria-selected={active} onClick={() => setSource(key)}
                    className="h-8 px-3 rounded-full text-xs font-semibold"
                    style={{
                      background: active ? 'var(--accent)' : 'transparent',
                      color: active ? 'var(--accent-text)' : 'var(--text2)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      touchAction: 'manipulation',
                    }}>
                    {label} <span style={{ opacity: 0.75 }}>{n}</span>
                  </button>
                )
              })}
            </div>
          )}
          {topicHits.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topicHits.map(([topic, count]) => (
                <button
                  key={topic}
                  onClick={() => { setInputValue(topic); setParams({ q: topic }); setQuery(topic) }}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(26,157,142,0.12)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(26,157,142,0.3)',
                    touchAction: 'manipulation',
                  }}
                >
                  {topic} ({count})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isSearching && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-semibold text-lg mb-2">Search PSC Questions</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>
            Type any English word, grammar topic, or option text.<br />
            Searches {questions.length} questions from {papers.length} PSC papers and {mockBank.questions.length} from {mockBank.papers.size} mock tests.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['Tenses', 'Articles', 'Prepositions', 'Conditionals', 'Phrasal Verbs'].map(t => (
              <button
                key={t}
                onClick={() => { setInputValue(t); setParams({ q: t }); setQuery(t) }}
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text2)',
                  touchAction: 'manipulation',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {isSearching && totalHits === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text2)' }}>
          <div className="text-3xl mb-3">😔</div>
          <p className="font-medium">No questions match "{query}"</p>
          <p className="text-sm mt-1">Try a simpler keyword or grammar topic name.</p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {results.map((q, idx) => {
          const paper = paperMap[q.paperId]
          const mock = paper ? null : mockBank.papers.get(q.paperId)
          const snippet = highlight(q.questionText, query)
          return (
            <div key={q.id} className="card rounded-xl p-4">
              {/* Header */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {q.topic && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: 'rgba(26,157,142,0.12)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(26,157,142,0.25)',
                    }}
                  >
                    {q.topic}
                  </span>
                )}
                {paper && (
                  <span className="text-xs" style={{ color: 'var(--text2)' }}>
                    {paper.paperCode} · Q{q.questionNumber}
                  </span>
                )}
                {mock && (
                  <span className="text-xs" style={{ color: 'var(--text2)' }}>
                    <span className="font-semibold" style={{ color: 'var(--accent-pink)' }}>Mock</span>{' '}
                    {mock.title} · Q{q.questionNumber}
                  </span>
                )}
              </div>

              {/* Question snippet */}
              <p className="text-sm font-medium leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
                {snippet}
              </p>

              {/* Options preview (compact) */}
              {q.optionA && (
                <div className="grid grid-cols-2 gap-1 text-xs mb-3" style={{ color: 'var(--text2)' }}>
                  {[['A', q.optionA], ['B', q.optionB], ['C', q.optionC], ['D', q.optionD]]
                    .filter(([, v]) => v)
                    .map(([letter, text]) => (
                      <div key={letter}
                        style={{
                          color: letter === q.correctAnswer ? 'var(--accent)' : 'var(--text2)',
                          fontWeight: letter === q.correctAnswer ? 600 : 400,
                        }}>
                        ({letter}) {text?.slice(0, 30)}{text?.length > 30 ? '…' : ''}
                      </div>
                    ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Link
                  to={`/quiz?questionId=${q.id}`}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)', touchAction: 'manipulation' }}
                >
                  View with Explanation →
                </Link>
                {mock ? (
                <Link
                  to={`/mock?paper=${q.paperId}`}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{
                    background: 'var(--bg2)',
                    color: 'var(--text2)',
                    border: '1px solid var(--border)',
                    touchAction: 'manipulation',
                  }}
                >
                  Open this mock test →
                </Link>
                ) : (
                <Link
                  to={`/quiz?paper=${q.paperId}&mode=browse`}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{
                    background: 'var(--bg2)',
                    color: 'var(--text2)',
                    border: '1px solid var(--border)',
                    touchAction: 'manipulation',
                  }}
                >
                  All questions in {q.paperId} →
                </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {totalHits > results.length && (
        <p className="text-xs text-center mt-4" style={{ color: 'var(--text2)' }}>
          Showing {results.length} of {totalHits}. Try a more specific keyword.
        </p>
      )}
    </div>
  )
}
