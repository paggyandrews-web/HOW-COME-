import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import papers from '../data/papers.json'
import Quiz from '../pages/Quiz'
import OmrBubble from './OmrBubble'
import { useAuth } from '../contexts/AuthContext'
import { useResults } from '../hooks/useResults'

/**
 * A set of questions (one topic, one paper…) split into "Yet to attempt" and
 * "Attempted", so people can practice only what they haven't done yet.
 * Practice runs right here (embedded Quiz) and returns to this page after.
 *
 *   pool       questions in the order they should be listed / practiced
 *   title      page heading (node)      subtitle  line under it (node)
 *   backTo     link target              backLabel link text
 *   exitLabel  result-screen button that returns here
 *   rowMeta    q => string shown under each question (paper, Q number…)
 *   wholeSet   optional label for a "practice everything in order" button
 */

export const PAPER_BY_ID = Object.fromEntries(papers.map(p => [p.id, p]))
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }

// papers.json dates look like "20-Jun-2026"
export function paperTime(paperId) {
  const d = PAPER_BY_ID[paperId]?.date || ''
  const m = d.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/)
  return m ? new Date(+m[3], MONTHS[m[2]] ?? 0, +m[1]).getTime() : 0
}

function previewText(text) {
  return (text || '')
    .replace(/__([^_\n]+?)__/g, '$1')   // __underlined__ markers, not ____ blanks
    .replace(/~~/g, '')
    .replace(/([:.?!])\s*\n\s*/g, '$1 ')
    .replace(/\s*\n\s*/g, ' · ')
    .trim()
}

function ago(iso) {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? 'a month ago' : `${months} months ago`
}

const COUNT_OPTIONS = [10, 20, 50]
const PAGE = 40

export default function PracticeSet({ pool, title, subtitle, backTo, backLabel, exitLabel, rowMeta, wholeSet }) {
  const { user } = useAuth()
  const { getAllResults, getLastOutcomes } = useResults()

  const [outcomes, setOutcomes] = useState(null) // null while loading
  const [tab, setTab] = useState('new')           // 'new' | 'done'
  const [doneFilter, setDoneFilter] = useState('all') // 'all' | 'wrong' | 'right'
  const [count, setCount] = useState(10)
  const [shown, setShown] = useState(PAGE)
  const [session, setSession] = useState(null)    // { questions, mode, secsPerQ } while practicing

  function loadOutcomes() {
    return getAllResults().then(results => setOutcomes(getLastOutcomes(results)))
  }

  useEffect(() => {
    let alive = true
    getAllResults().then(results => { if (alive) setOutcomes(getLastOutcomes(results)) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const groups = useMemo(() => {
    const o = outcomes || {}
    const fresh = [], wrong = [], right = []
    pool.forEach(q => {
      const r = o[q.id]
      if (!r) fresh.push(q)
      else if (r.correct) right.push(q)
      else wrong.push(q)
    })
    const byRecent = (a, b) => (o[b.id]?.date || '').localeCompare(o[a.id]?.date || '')
    wrong.sort(byRecent)
    right.sort(byRecent)
    return { fresh, wrong, right, attempted: [...wrong, ...right].sort(byRecent) }
  }, [pool, outcomes])

  useEffect(() => { setShown(PAGE) }, [tab, doneFilter])

  function start(list) {
    if (!list.length) return
    window.scrollTo(0, 0)
    setSession({ questions: list, mode: 'practice', secsPerQ: 30 })
  }

  function endSession() {
    setSession(null)
    loadOutcomes()
    window.scrollTo(0, 0)
  }

  if (session) {
    return <Quiz preset={session} onExit={endSession} exitLabel={exitLabel} />
  }

  const loading = outcomes === null
  const total = pool.length
  const { fresh, wrong, right, attempted } = groups
  const list = tab === 'new'
    ? fresh
    : doneFilter === 'wrong' ? wrong : doneFilter === 'right' ? right : attempted
  const visible = list.slice(0, shown)
  const pct = n => (total ? (n / total) * 100 : 0)
  const takeN = count === 'all' ? fresh.length : Math.min(count, fresh.length)

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <Link to={backTo} className="inline-flex items-center gap-1 text-sm mb-3" style={{ color: 'var(--text2)', textDecoration: 'none' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        {backLabel}
      </Link>

      {title}
      {subtitle && (
        <p className="text-sm mt-1.5" style={{ color: 'var(--text2)' }}>{subtitle}</p>
      )}

      {/* ── Coverage ─────────────────────────────────────────── */}
      <div className="card rounded-2xl p-4 mt-4">
        <div className="flex h-2.5 rounded-full overflow-hidden gap-[2px]" style={{ background: 'var(--bg2)' }}
          role="img" aria-label={`${right.length} right, ${wrong.length} wrong, ${fresh.length} not attempted`}>
          {!loading && <>
            <div style={{ width: pct(right.length) + '%', background: 'var(--ok)' }} />
            <div style={{ width: pct(wrong.length) + '%', background: 'var(--bad)' }} />
          </>}
        </div>
        <div className="grid grid-cols-3 mt-3 text-center">
          <Stat value={loading ? '–' : fresh.length} label="Yet to attempt" color="var(--text)" />
          <Stat value={loading ? '–' : right.length} label="Got right" color="var(--ok)" />
          <Stat value={loading ? '–' : wrong.length} label="Got wrong" color="var(--bad)" />
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div role="tablist" className="grid grid-cols-2 p-1 mt-4 rounded-full"
        style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        {[['new', 'Yet to attempt', fresh.length], ['done', 'Attempted', attempted.length]].map(([key, label, n]) => {
          const active = tab === key
          return (
            <button key={key} role="tab" aria-selected={active} onClick={() => setTab(key)}
              className="h-10 rounded-full text-sm font-semibold transition-colors"
              style={{
                background: active ? 'var(--card)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text2)',
                boxShadow: active ? 'inset 0 1px 0 var(--hairline-hi), 0 1px 3px rgba(0,0,0,0.25)' : 'none',
              }}>
              {label} <span style={{ opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>{loading ? '' : n}</span>
            </button>
          )
        })}
      </div>

      {tab === 'done' && attempted.length > 0 && (
        <div className="flex gap-2 mt-3">
          {[['all', 'All'], ['wrong', `Wrong · ${wrong.length}`], ['right', `Right · ${right.length}`]].map(([key, label]) => {
            const active = doneFilter === key
            return (
              <button key={key} onClick={() => setDoneFilter(key)}
                className="h-8 px-3 rounded-full text-xs font-semibold"
                style={{
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text2)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────── */}
      {!loading && tab === 'new' && fresh.length > 0 && (
        <div className="mt-4">
          {fresh.length > COUNT_OPTIONS[0] && <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text2)' }}>Questions per round</span>
            {[...COUNT_OPTIONS.filter(n => n < fresh.length), 'all'].map(n => {
              const active = count === n || (n === 'all' && count !== 'all' && count >= fresh.length)
              return (
                <button key={n} onClick={() => setCount(n)} aria-pressed={active}
                  className="h-7 px-2.5 rounded-full text-xs font-semibold"
                  style={{
                    background: active ? 'var(--accent-soft)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text2)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                  {n === 'all' ? `All ${fresh.length}` : n}
                </button>
              )
            })}
          </div>}
          <button onClick={() => start(fresh.slice(0, takeN))}
            className="btn-solid w-full h-12 rounded-full font-semibold text-[15px]">
            Practice {takeN} new {takeN === 1 ? 'question' : 'questions'}
          </button>
        </div>
      )}

      {!loading && tab === 'done' && attempted.length > 0 && (
        <div className="flex gap-2 mt-4">
          {wrong.length > 0 && (
            <button onClick={() => start(wrong)}
              className="btn-solid flex-1 h-12 rounded-full font-semibold text-[15px]">
              Retry {wrong.length} wrong
            </button>
          )}
          <button onClick={() => start(list)}
            className={`${wrong.length > 0 ? 'btn-ghost' : 'btn-solid'} flex-1 h-12 rounded-full font-semibold text-[15px]`}>
            Revise {doneFilter === 'all' ? 'all' : doneFilter === 'wrong' ? 'wrong' : 'right'} ({list.length})
          </button>
        </div>
      )}

      {!loading && wholeSet && fresh.length < pool.length && (
        <button onClick={() => start(pool)}
          className="btn-ghost w-full h-11 rounded-full text-sm font-semibold mt-2.5">
          {wholeSet} ({pool.length})
        </button>
      )}

      {/* ── List ─────────────────────────────────────────────── */}
      <div className="mt-5">
        {loading && [0, 1, 2, 3].map(i => <div key={i} className="skeleton h-16 mb-2" style={{ borderRadius: 16 }} />)}

        {!loading && list.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ border: '1.5px dashed var(--border-strong)' }}>
            {tab === 'new' ? (
              <>
                <p className="text-[15px] font-semibold mb-1">Every question here is attempted</p>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  {wrong.length > 0 ? 'Open Attempted to retry the ones you got wrong.' : 'Open Attempted to revise them.'}
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold mb-1">Nothing here yet</p>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  Questions you practice here will show up in this list.
                </p>
              </>
            )}
          </div>
        )}

        {!loading && visible.length > 0 && (
          <p className="text-xs mb-2" style={{ color: 'var(--text2)' }}>
            Tap a question to start practicing from it.
          </p>
        )}

        <ul className="space-y-2">
          {!loading && visible.map((q, i) => {
            const o = outcomes[q.id]
            return (
              <li key={q.id}>
                <button onClick={() => start(list.slice(i))}
                  className="omr-option card w-full rounded-2xl px-3.5 py-3 text-left"
                  style={{ alignItems: 'flex-start' }}>
                  <OmrBubble small
                    letter={o ? (o.correct ? '✓' : '✗') : ''}
                    state={o ? (o.correct ? 'right' : 'wrong') : undefined} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
                      {previewText(q.questionText)}
                    </span>
                    <span className="block text-xs mt-1" style={{ color: 'var(--text2)' }}>
                      {rowMeta(q)}
                      {o ? `, ${o.correct ? 'right' : 'wrong'} ${ago(o.date)}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {!loading && list.length > shown && (
          <button onClick={() => setShown(s => s + PAGE)}
            className="btn-ghost w-full h-11 rounded-full text-sm font-semibold mt-3">
            Show {Math.min(PAGE, list.length - shown)} more
          </button>
        )}
      </div>
    </div>
  )
}

function Stat({ value, label, color }) {
  return (
    <div>
      <div className="display" style={{ fontSize: 26, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{label}</div>
    </div>
  )
}
