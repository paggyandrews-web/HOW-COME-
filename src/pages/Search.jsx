import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import questions from '../data/questions.json'
import papers from '../data/papers.json'

const paperMap = {}
papers.forEach(p => { paperMap[p.id] = p })

function highlight(text, query) {
  if (!text || !query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, 120) + (text.length > 120 ? '…' : '')
  const start = Math.max(0, idx - 40)
  const end = Math.min(text.length, idx + query.length + 80)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

export default function Search() {
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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return questions.filter(question =>
      question.questionText?.toLowerCase().includes(q) ||
      question.optionA?.toLowerCase().includes(q) ||
      question.optionB?.toLowerCase().includes(q) ||
      question.optionC?.toLowerCase().includes(q) ||
      question.optionD?.toLowerCase().includes(q) ||
      question.topic?.toLowerCase().includes(q)
    ).slice(0, 60)
  }, [query])

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-5">Search Questions</h1>

      {/* Search input */}
      <div className="relative mb-6">
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder={`Search ${questions.length} PSC questions by keyword or topic...`}
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
            {hasResults
              ? `${results.length} question${results.length !== 1 ? 's' : ''} found for "${query}"`
              : `No questions found for "${query}"`}
          </p>
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
            Searches across all {questions.length} questions from {papers.length} papers.
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
      {isSearching && !hasResults && (
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
                  to={`/quiz?paper=${q.paperId}&mode=browse`}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  Practice Paper →
                </Link>
                <Link
                  to={`/quiz?topic=${encodeURIComponent(q.topic || '')}&mode=practice`}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{
                    background: 'var(--bg2)',
                    color: 'var(--text2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  Quiz on {q.topic?.split(' ')[0] || 'Topic'}
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {results.length === 60 && (
        <p className="text-xs text-center mt-4" style={{ color: 'var(--text2)' }}>
          Showing top 60 results. Try a more specific keyword.
        </p>
      )}
    </div>
  )
}
