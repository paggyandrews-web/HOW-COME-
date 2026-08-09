import { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import papers from '../data/papers.json'
import questions from '../data/questions.json'
import Dropdown from '../components/Dropdown'
import { usePaperProgress } from '../hooks/usePaperProgress'

// Group by the actual year of the test date (not the paper-code year, which
// can differ — e.g. a 2023-coded paper whose exam was actually held in 2024).
function testYear(p) {
  if (p.date) {
    const m = String(p.date).match(/(\d{4})/)
    if (m) return m[1]
  }
  return p.year != null ? String(p.year) : p.year
}

function daysAgo(isoDate) {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000)
  return days
}

const STATUS_META = {
  'not-started': { label: 'Not started', color: 'var(--text2)', bg: 'rgba(136,136,136,0.14)' },
  'in-progress': { label: 'In progress', color: 'var(--accent)', bg: 'rgba(26,157,142,0.14)' },
  'completed': { label: 'Completed', color: 'var(--accent-green)', bg: 'rgba(34,197,94,0.14)' },
}
const DUE_COLOR = '#f59e0b'
const DUE_BG = 'rgba(245,158,11,0.14)'

const YEARS = [...new Set(papers.map(testYear))].filter(Boolean).sort().reverse()

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'due', label: 'Due for Revision' },
]

export default function Papers() {
  const [search] = useSearchParams()
  const [year, setYear] = useState(search.get('year') || '')
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')

  const { progress, loading, summary } = usePaperProgress(papers, questions)

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
      .filter(p => {
        if (year && testYear(p) !== year) return false
        if (status) {
          const prog = progress[p.id]
          if (!prog) return false
          if (status === 'due') {
            if (!prog.dueForRevision) return false
          } else if (prog.status !== status) {
            return false
          }
        }
        if (!query) return true
        const q = query.toLowerCase()
        return (
          (p.post || '').toLowerCase().includes(q) ||
          (p.filename || '').toLowerCase().includes(q) ||
          (p.paperCode || '').toLowerCase().includes(q) ||
          (p.id || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => parseDate(b.date) - parseDate(a.date)),
    [year, status, query, progress])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-1">Previous Question Papers</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
        {papers.length} papers · {questions.length} English grammar questions extracted
        {!loading && (
          <>
            {' · '}{summary.completed} completed
            {summary.dueForRevision > 0 && (
              <span style={{ color: DUE_COLOR }}> · {summary.dueForRevision} due for revision</span>
            )}
          </>
        )}
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by post name or code..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm flex-1 min-w-36 theme-input"
          style={{ background: '#111111', border: `1px solid ${query ? 'var(--accent)' : 'rgba(26,157,142,0.4)'}`, color: 'var(--accent)', outline: 'none' }}
        />
        <Dropdown
          value={year}
          onChange={setYear}
          placeholder="All Years"
          className="w-36"
          options={[
            { value: '', label: 'All Years' },
            ...YEARS.map(y => ({ value: y, label: y })),
          ]}
        />
        <Dropdown
          value={status}
          onChange={setStatus}
          placeholder="All Statuses"
          className="w-44"
          options={STATUS_OPTIONS}
        />
      </div>

      {/* Papers grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(paper => {
          const qCount = qCountByPaper[paper.id] || 0
          const prog = progress[paper.id]
          const meta = prog ? STATUS_META[prog.status] : null
          const due = prog?.dueForRevision

          return (
            <div
              key={paper.id}
              className="card rounded-xl p-4 flex flex-col gap-3"
              style={due ? { border: `1px solid ${DUE_COLOR}` } : undefined}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-sm leading-snug">
                    {paper.post || paper.filename?.replace('.pdf', '') || paper.id}
                  </div>
                  {meta && !loading && (
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                      style={{ color: meta.color, background: meta.bg }}
                    >
                      {prog.status === 'in-progress'
                        ? `${prog.attempted}/${prog.total} done`
                        : prog.status === 'completed'
                          ? `Score: ${prog.score}%`
                          : meta.label}
                    </span>
                  )}
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
                {due && (
                  <div
                    className="text-[11px] font-semibold mt-2 px-2 py-1.5 rounded-lg"
                    style={{ color: DUE_COLOR, background: DUE_BG }}
                  >
                    ⏰ Due for revision — last practiced {daysAgo(prog.lastAttemptDate)}d ago
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
