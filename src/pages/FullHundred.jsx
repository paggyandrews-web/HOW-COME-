import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import fullPapers from '../data/fullPapers.json'
import fullQuestions from '../data/fullQuestions.json'
import Confetti from '../components/Confetti'
import Dropdown from '../components/Dropdown'
import { useAuth } from '../contexts/AuthContext'
import { useResults } from '../hooks/useResults'
import { useStreak } from '../hooks/useStreak'
import { usePaperProgress } from '../hooks/usePaperProgress'
import { STATUS_META, DUE_COLOR, DUE_BG, daysAgo, STATUS_FILTER_OPTIONS, matchesStatusFilter, statusBadgeText, parsePaperDate } from '../utils/paperStatus'
import { getDraft, saveDraft, clearDraft, getAllDrafts, draftAttemptedCount } from '../utils/fullHundredDraft'

const NEGATIVE_MARK = 1 / 3

// PSC-deleted questions are never answerable in the exam UI, so they must be
// excluded from both the saved result and the progress "total" — otherwise a
// paper with any deleted question could never reach 100% attempted/completed.
const SCOREABLE_FULL_QUESTIONS = fullQuestions.filter(q => q.status !== 'deleted')

/* Printed PSC papers set fractions as a stacked numerator/denominator (see
   Maths / Mental Ability questions like "7/9" or the mixed number "16 2/3%").
   Archived plain-text transcriptions instead wrote them inline as "7/9" or
   "16(2/3)%", which reads far worse than the original. Detect three shapes —
   a whole number glued to a parenthesized fraction ("16(2/3)"), a whole
   number + space + fraction ("10 10/11"), and a bare fraction ("7/9") — and
   render each as a real stacked fraction instead of raw slash text. */
const FRACTION_RE = /(\d+)\((\d+)\/(\d+)\)|(\d+)\s(\d+)\/(\d+)\b|(\d+)\/(\d+)/g

function Frac({ n, d }) {
  return (
    <span className="inline-flex flex-col items-center mx-0.5" style={{ verticalAlign: '-0.35em', lineHeight: 1 }}>
      <span style={{ fontSize: '0.72em', padding: '0 2px' }}>{n}</span>
      <span style={{ borderTop: '1.2px solid currentColor', width: '100%' }} />
      <span style={{ fontSize: '0.72em', padding: '0 2px' }}>{d}</span>
    </span>
  )
}

/* Printed papers also raise a fractional power as a small stacked
   numerator/denominator sitting above the base, e.g. "(32)^(1/5)" for the
   fifth root of 32. Same stacked-fraction shape as Frac, just smaller and
   lifted onto the baseline like a real exponent. */
function ExpFrac({ n, d }) {
  return (
    <span className="inline-flex flex-col items-center mx-0.5" style={{ verticalAlign: 'super', fontSize: '0.62em', lineHeight: 1 }}>
      <span style={{ padding: '0 1px' }}>{n}</span>
      <span style={{ borderTop: '1.1px solid currentColor', width: '100%' }} />
      <span style={{ padding: '0 1px' }}>{d}</span>
    </span>
  )
}

/* Matches a base number — optionally parenthesized, e.g. "(32)" or "8" —
   followed by a fractional exponent written as "^(n/d)". Pulled out before
   ordinary fraction detection so the "(1/5)" inside the exponent doesn't
   also get caught by FRACTION_RE. */
const EXPONENT_RE = /(\(?\d+\)?)\^\((\d+)\/(\d+)\)/g

function renderFractions(str, keyPrefix) {
  const re = new RegExp(FRACTION_RE)
  const nodes = []
  let last = 0, m, k = 0
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) nodes.push(str.slice(last, m.index))
    if (m[1] !== undefined) {
      nodes.push(<span key={keyPrefix + '-f' + (k++)}>{m[1]}<Frac n={m[2]} d={m[3]} /></span>)
    } else if (m[4] !== undefined) {
      nodes.push(<span key={keyPrefix + '-f' + (k++)}>{m[4]} <Frac n={m[5]} d={m[6]} /></span>)
    } else {
      nodes.push(<Frac key={keyPrefix + '-f' + (k++)} n={m[7]} d={m[8]} />)
    }
    last = re.lastIndex
  }
  if (last < str.length) nodes.push(str.slice(last))
  return nodes
}

function renderMathText(str, keyPrefix) {
  const re = new RegExp(EXPONENT_RE)
  const nodes = []
  let last = 0, m, k = 0
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) nodes.push(...renderFractions(str.slice(last, m.index), keyPrefix + '-b' + k))
    nodes.push(
      <span key={keyPrefix + '-e' + (k++)}>
        {m[1]}<ExpFrac n={m[2]} d={m[3]} />
      </span>
    )
    last = re.lastIndex
  }
  if (last < str.length) nodes.push(...renderFractions(str.slice(last), keyPrefix + '-tail'))
  return nodes
}

/* Same \n / __underline__ convention used elsewhere in the app, so a paper
   transcribed with multi-line (i/ii/iii sub-items) questions renders
   correctly — plus fraction detection (above) inside both plain and
   underlined text. */
function renderWithUnderlines(line) {
  const parts = String(line || '').split(/(__[^_]+__)/)
  return parts.map((part, i) => {
    if (part.startsWith('__') && part.endsWith('__')) {
      return (
        <span key={i} style={{ textDecoration: 'underline', textUnderlineOffset: 3, color: 'var(--accent)' }}>
          {renderMathText(part.slice(2, -2), 'u' + i)}
        </span>
      )
    }
    return <span key={i}>{renderMathText(part, 'p' + i)}</span>
  })
}

/* Some archived PSC papers (mostly Maths / Mental Ability grids and GK
   "match the following" questions) were transcribed with a raw markdown-style
   table embedded in questionText — rows of "cell | cell | cell", sometimes
   with a "| :--- | :--- |" header-separator line. Left alone, that just prints
   as literal pipe characters. Detect those lines and render a real table. */
function isTableSeparatorRow(cells) {
  return cells.length > 0 && cells.every(c => /^:?-{2,}:?$/.test(c.trim()))
}

function splitTableRow(line) {
  let cells = line.split('|').map(c => c.trim())
  if (cells.length && cells[0] === '') cells = cells.slice(1)
  if (cells.length && cells[cells.length - 1] === '') cells = cells.slice(0, -1)
  return cells
}

function TableBlock({ lines }) {
  const rows = lines.map(splitTableRow)
  // A markdown table has its separator row ("| :--- | :--- |") immediately
  // after the header. Plain number grids (no header) never have one.
  const hasHeader = rows.length > 1 && isTableSeparatorRow(rows[1])
  const headerRow = hasHeader ? rows[0] : null
  const bodyRows = hasHeader ? rows.slice(2) : rows

  return (
    <table className="my-2" style={{ borderCollapse: 'collapse', fontSize: 14 }}>
      {headerRow && (
        <thead>
          <tr>
            {headerRow.map((cell, i) => (
              <th key={i} className="text-left font-bold"
                style={{ border: '1px solid var(--border)', padding: '4px 10px', background: 'var(--bg2)' }}>
                {renderWithUnderlines(cell)}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {bodyRows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci} style={{ border: '1px solid var(--border)', padding: '4px 10px' }}>
                {renderWithUnderlines(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function QuestionText({ num, text }) {
  const rawLines = String(text || '').split('\n')

  // Group consecutive lines into "table" runs (any line containing '|') vs
  // plain text runs, so a table embedded mid-question renders as a table
  // while the surrounding instruction lines still render as normal text.
  const blocks = []
  rawLines.forEach(line => {
    const type = line.includes('|') ? 'table' : 'text'
    const last = blocks[blocks.length - 1]
    if (last && last.type === type) last.lines.push(line)
    else blocks.push({ type, lines: [line] })
  })

  return (
    <div className="flex gap-2" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 15 }}>
      {num != null && <span className="font-bold shrink-0 self-start">{num}.</span>}
      <div className="font-medium leading-relaxed">
        {blocks.map((block, bi) => {
          if (block.type === 'table') {
            const tableLines = block.lines.filter(l => l.trim() !== '')
            return tableLines.length ? <TableBlock key={bi} lines={tableLines} /> : null
          }
          return block.lines.map((line, li) => (
            <span key={bi + '-' + li}>
              {(bi > 0 || li > 0) && <br />}
              {renderWithUnderlines(line)}
            </span>
          ))
        })}
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
   other medium (M, Tamil, Kannada, ...) lands in the Malayalam slot of its
   paper group below, which is just "everything not English" since Full 100
   is overwhelmingly M-medium. */
function isEnglishPaper(p) {
  const m = String(p.medium || '').toLowerCase()
  return m === 'e' || m.includes('english')
}

/* Groups are the real, physical PSC papers — e.g. "176-2025" — regardless of
   how many medium renderings (native "M", native "E", an "M-EN" English
   study rendering, or an "E-ML" Malayalam study rendering) got archived for
   it. Strip the trailing medium suffix off the archive id to recover the
   group key every rendering of the same paper shares. */
function paperGroupKey(id) {
  return String(id).replace(/-(M-EN|E-ML|M|E)$/, '')
}

/* ── Paper list ─────────────────────────────────────────────────────── */
function PaperList({ onStart, onResume }) {
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const { user } = useAuth()
  const needsSignup = !user

  const { progress, loading, summary } = usePaperProgress(fullPapers, SCOREABLE_FULL_QUESTIONS)

  // Local-only autosave drafts (never synced to Firestore — see
  // utils/fullHundredDraft.js). Read once per mount; PaperList remounts
  // fresh every time you return here from the exam/result screens.
  const drafts = useMemo(() => getAllDrafts(), [])

  // Blend committed (submitted) results with any local in-progress draft.
  // A submitted result always wins — once a paper is completed, a stray
  // draft (there shouldn't be one; submit clears it) never overrides it.
  const displayProgress = useMemo(() => {
    const map = {}
    fullPapers.forEach(p => {
      const committed = progress[p.id]
      if (!committed || committed.status === 'completed') { map[p.id] = committed; return }
      const attempted = draftAttemptedCount(drafts[p.id])
      map[p.id] = attempted > 0
        ? { ...committed, status: 'in-progress', attempted }
        : committed
    })
    return map
  }, [progress, drafts])

  const counts = useMemo(() => {
    const map = {}
    fullQuestions.forEach(q => { map[q.paperId] = (map[q.paperId] || 0) + 1 })
    return map
  }, [])

  // One card per real paper, not per archived medium. Each group carries at
  // most one Malayalam-flavoured entry (native "M", or an "E-ML" study
  // rendering) and one English-flavoured entry (native "E", or an "M-EN"
  // study rendering) — whichever mediums actually got archived for that
  // paper. A paper archived in only one medium simply has a null slot on the
  // other side, and the card below renders nothing there instead of a
  // placeholder.
  const groups = useMemo(() => {
    const map = {}
    const order = []
    fullPapers.forEach(p => {
      const key = paperGroupKey(p.id)
      if (!map[key]) { map[key] = { key, malayalam: null, english: null }; order.push(key) }
      if (isEnglishPaper(p)) map[key].english = p
      else map[key].malayalam = p
    })
    // Latest exam date first. A group with no parseable date (shouldn't
    // happen, but archived data is hand-entered) sinks to the bottom rather
    // than sorting randomly among dated papers.
    return order.map(key => map[key]).sort((a, b) => {
      const da = parsePaperDate((a.malayalam || a.english)?.date)
      const db = parsePaperDate((b.malayalam || b.english)?.date)
      if (da == null && db == null) return 0
      if (da == null) return 1
      if (db == null) return -1
      return db - da
    })
  }, [])

  // Search matches either language's paper code or post name — a paper's
  // English study rendering sometimes carries a slightly different paperCode
  // string ("... (English study version)") than its Malayalam original, so
  // both sides of the group are checked.
  const trimmedQuery = query.trim().toLowerCase()
  function groupMatchesQuery(g) {
    if (!trimmedQuery) return true
    const fields = [g.malayalam?.paperCode, g.english?.paperCode, g.malayalam?.post, g.english?.post]
    return fields.some(f => f && f.toLowerCase().includes(trimmedQuery))
  }

  const shownGroups = groups
    .filter(g =>
      matchesStatusFilter(displayProgress[g.malayalam?.id], status) ||
      matchesStatusFilter(displayProgress[g.english?.id], status)
    )
    .filter(groupMatchesQuery)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-bold text-2xl mb-1">Full 100</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
        Real, complete PSC question papers — all 100 questions, every subject, exactly as printed
        in the original medium. No translation, no explanations — just the paper and the official
        Final Answer Key. Sign up to start.
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

      <div className="relative mb-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by exam code or exam name..."
          className="w-full rounded-xl px-4 py-2.5 pr-8 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm cursor-pointer"
            style={{ color: 'var(--text2)', background: 'transparent', border: 'none' }}
            aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      <Dropdown
        value={status}
        onChange={setStatus}
        placeholder="All Statuses"
        className="w-44 mb-4"
        options={STATUS_FILTER_OPTIONS}
      />

      {needsSignup && (
        <div className="rounded-xl p-5 mb-4 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-2xl mb-1">👋</div>
          <div className="font-semibold text-sm mb-2">Sign up to take Full 100 papers</div>
          <div className="text-xs mb-3" style={{ color: 'var(--text2)' }}>
            These are scored, timed attempts and your progress is saved to your profile —
            that needs an account.
          </div>
          <Link to="/register"
            className="inline-block w-full py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)', textDecoration: 'none' }}>
            Sign Up →
          </Link>
          <div className="text-xs mt-2">
            <Link to="/login" style={{ color: 'var(--accent)' }}>Already have an account? Log in</Link>
          </div>
        </div>
      )}

      {shownGroups.length === 0 && (
        <div className="rounded-xl p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-2xl mb-1">📄</div>
          <div className="font-semibold text-sm">
            {trimmedQuery ? `No papers match "${query.trim()}"` : 'No papers archived yet'}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text2)' }}>
            {trimmedQuery ? 'Try a different exam code or name.' : 'Check back soon.'}
          </div>
        </div>
      )}

      {shownGroups.map(g => {
        const primary = g.malayalam || g.english
        const langs = [
          g.malayalam && { paper: g.malayalam, label: 'മലയാളം' },
          g.english && { paper: g.english, label: 'English' },
        ].filter(Boolean)
        const anyDue = langs.some(({ paper }) => displayProgress[paper.id]?.dueForRevision)

        return (
          <div key={g.key} className="card rounded-xl p-4 mb-3 flex flex-col gap-3"
            style={{ border: '1px solid ' + (anyDue ? DUE_COLOR : 'var(--border)') }}>
            <div>
              <div className="font-semibold text-sm leading-snug">{primary.post}</div>
              <div className="text-xs mt-1.5 flex flex-wrap gap-x-2 gap-y-1" style={{ color: 'var(--text2)' }}>
                <span>📅 {primary.date}</span>
                <span>·</span>
                <span>🏷️ {primary.categoryCode}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {langs.map(({ paper: p, label }) => {
                const prog = displayProgress[p.id]
                const meta = prog ? STATUS_META[prog.status] : null
                const due = prog?.dueForRevision
                const isResumable = prog?.status === 'in-progress'
                const btnLabel = prog?.status === 'completed' ? '🔁 Retake' : isResumable ? '▶️ Resume' : '✏️ Start'
                return (
                  <div key={p.id} className="rounded-lg p-3 flex flex-col gap-2"
                    style={{ background: 'var(--bg2)', border: '1px solid ' + (due ? DUE_COLOR : 'var(--border)') }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold">{label}</div>
                        <div className="text-[11px] mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5" style={{ color: 'var(--text2)' }}>
                          <span>🧾 {p.paperCode}</span>
                          <span>·</span>
                          <span>📝 {counts[p.id] || 0} questions</span>
                        </div>
                      </div>
                      {meta && !loading && (
                        <span
                          className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {statusBadgeText(prog, meta)}
                        </span>
                      )}
                    </div>
                    {due && (
                      <div
                        className="text-[11px] font-semibold px-2 py-1.5 rounded-lg"
                        style={{ color: DUE_COLOR, background: DUE_BG }}
                      >
                        ⏰ Due for revision — last practiced {daysAgo(prog.lastAttemptDate)}d ago
                      </div>
                    )}
                    {needsSignup ? (
                      <Link to="/register"
                        title="Sign up to take Full 100 papers"
                        className="block w-full text-center py-2 rounded-lg text-xs font-bold"
                        style={{ background: 'var(--card)', color: 'var(--text2)', border: '2px solid var(--border)', textDecoration: 'none' }}>
                        🔒 Sign up to start
                      </Link>
                    ) : (
                      <button onClick={() => (isResumable ? onResume(p) : onStart(p))}
                        className="w-full text-center py-2 rounded-lg text-xs font-bold cursor-pointer"
                        style={{ background: 'var(--accent)', color: 'var(--accent-text)', border: '2px solid var(--accent)', touchAction: 'manipulation' }}>
                        {btnLabel}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

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
function ExamScreen({ paper, questions, onSubmit, initial }) {
  const total = questions.length
  const [current, setCurrent] = useState(initial?.current ?? 0)
  const [answers, setAnswers] = useState(initial?.answers ?? {})
  const [marked, setMarked] = useState(initial?.marked ?? {})
  const [elapsed, setElapsed] = useState(initial?.elapsed ?? 0)
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

  // Autosave to localStorage only (no Firestore writes) whenever an answer,
  // mark, or the current position changes — not on every 1s timer tick, so
  // this stays a handful of writes per exam rather than hundreds. Lets a
  // half-finished paper be "Resume"-d later, on this device, instead of
  // silently vanishing if you never hit Finish.
  useEffect(() => {
    saveDraft(paper.id, { answers, marked, current, elapsed })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, marked, current, paper.id])

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
                <span>{renderWithUnderlines(q['option' + letter])}</span>
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
                    <span>{renderWithUnderlines(q['option' + letter])}</span>
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
  const [examInitial, setExamInitial] = useState(null)
  const { saveResult } = useResults()
  const { updateStreak } = useStreak()

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

  // Fresh attempt (first "Start", or "Retake" after a completed paper) —
  // always blank, and drops any stale draft so the list can't show a leftover
  // "Resume" for an attempt that's being restarted on purpose.
  function beginExam(p) {
    clearDraft(p.id)
    setPaper(p)
    setAnswers({})
    setExamInitial(null)
    setExamKey(k => k + 1)
    setStage('exam')
    window.scrollTo(0, 0)
  }

  // Continue a half-finished paper from its local autosave — skips the
  // instructions screen since you've already seen it this attempt.
  function resumeExam(p) {
    const draft = getDraft(p.id)
    setPaper(p)
    setAnswers(draft?.answers || {})
    setExamInitial(draft)
    setExamKey(k => k + 1)
    setStage('exam')
    window.scrollTo(0, 0)
  }

  function handleSubmit(ans, secs) {
    setAnswers(ans)
    setTimeTaken(secs)
    setStage('result')
    window.scrollTo(0, 0)

    // Persist the attempt so this paper shows up as "practiced" on the list
    // (and starts its due-for-revision clock) — mirrors the English Papers flow.
    // Deleted questions are excluded so they don't get wrongly scored as wrong.
    const scoreable = questions
      .map((q, i) => ({ q, a: ans[i] }))
      .filter(({ q }) => q.status !== 'deleted')
    if (scoreable.length) {
      saveResult(scoreable.map(s => s.q), scoreable.map(s => s.a), 'full100')
      // Non-blocking — Full 100 attempts are real daily practice and must
      // count toward the streak too (previously only the Quiz page called
      // this, which silently broke the streak for anyone whose daily
      // practice was Mock/Full 100 instead of Quiz mode).
      updateStreak()
    }
    // The submitted result is now the permanent record — the local
    // in-progress draft has served its purpose.
    clearDraft(paper.id)
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
    return <ExamScreen key={examKey} paper={paper} questions={questions} onSubmit={handleSubmit} initial={examInitial} />
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
  return <PaperList onStart={chooseFromList} onResume={resumeExam} />
}
