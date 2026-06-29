import { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import papers from '../data/papers.json'
import questions from '../data/questions.json'

const YEARS = [...new Set(papers.map(p => p.year))].sort().reverse()

export default function Papers() {
  const [search] = useSearchParams()
  const [year, setYear] = useState(search.get('year') || '')
  const [query, setQuery] = useState('')

  const qCountByPaper = useMemo(() => {
    const map = {}
    questions.forEach(q => {
      map[q.paperId] = (map[q.paperId] || 0) + 1
    })
    return map
  }, [])

  const parseDate = (dateStr) => {
    if (!dateStr) return 0
    const d = new Date(dateStr)
    return isNaN(d) ? 0 : d.getTime()
  }

  const filtered = useMemo(() =>
    papers
      .filter(p =>
        (!year || p.year === year) &&
        (!query || (p.post || p.filename || '').toLowerCase().includes(query.toLowerCase()))
      )
      .sort((a, b) => parseDate(b.date) - parseDate(a.date)),
    [year, query])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-1">Previous Question Papers</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
        {papers.length} papers · {questions.length} English grammar questions extracted
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by post name..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm flex-1 min-w-36"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="">All Years</option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Papers grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(paper => {
          const qCount = qCountByPaper[paper.id] || 0
          return (
            <div key={paper.id} className="card rounded-xl p-4 flex flex-col gap-3">
              <div>
                <div className="font-semibold text-sm leading-snug">
                  {paper.post || paper.filename?.replace('.pdf', '') || paper.id}
                </div>
                <div className="text-xs mt-1.5 flex flex-wrap gap-x-2 gap-y-1" style={{ color: 'var(--text2)' }}>
                  {paper.date && <span>📅 {paper.date}</span>}
                  <span>·</span>
                  <span>{qCount} questions</span>
                </div>
                {paper.paperCode && (
                  <div className="text-xs mt-1" style={{ color: 'var(--text2)', opacity: 0.6 }}>
                    Code: {paper.paperCode}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/quiz?paper=${paper.id}&mode=practice`}
                  className="flex-1 text-center py-2 rounded-xl text-xs font-bold"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-text)',
                    border: '2px solid var(--accent)',
                    touchAction: 'manipulation',
                  }}
                >
                  ✏️ Practice
                </Link>
                <Link
                  to={`/quiz?paper=${paper.id}&mode=timed`}
                  className="flex-1 text-center py-2 rounded-xl text-xs font-bold"
                  style={{
                    background: 'transparent',
                    color: 'var(--accent)',
                    border: '2px solid var(--accent)',
                    touchAction: 'manipulation',
                  }}
                >
                  ⏱️ Timed
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text2)' }}>
          No papers match your filters.
        </div>
      )}
    </div>
  )
}
