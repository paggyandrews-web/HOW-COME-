// Shared "practiced vs unpracticed" badge/filter helpers, used by both the
// Papers (English, per-question explanations) and Full 100 pages so the two
// feel identical even though they track different question sets.

export const STATUS_META = {
  'not-started': { label: 'Not started', color: 'var(--text2)', bg: 'rgba(136,136,136,0.14)' },
  'in-progress': { label: 'In progress', color: 'var(--accent)', bg: 'rgba(26,157,142,0.14)' },
  'completed': { label: 'Completed', color: 'var(--accent-green)', bg: 'rgba(34,197,94,0.14)' },
}

export const DUE_COLOR = '#f59e0b'
export const DUE_BG = 'rgba(245,158,11,0.14)'

export function daysAgo(isoDate) {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000)
}

const MONTH_INDEX = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }

// Archived papers store their test date as "DD-Mon-YYYY" (e.g. "31-Dec-2025")
// — not a format the Date constructor parses reliably across browsers.
// Parsed by hand so "latest exam first" sorting is consistent everywhere.
// Returns a millisecond timestamp, or null if the string doesn't match.
export function parsePaperDate(str) {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(String(str || '').trim())
  if (!m) return null
  const month = MONTH_INDEX[m[2]]
  if (month === undefined) return null
  return new Date(Number(m[3]), month, Number(m[1])).getTime()
}

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'due', label: 'Due for Revision' },
]

// Text shown inside the badge pill for a given progress record.
export function statusBadgeText(prog, meta) {
  if (prog.status === 'in-progress') return `${prog.attempted}/${prog.total} done`
  if (prog.status === 'completed') return `Score: ${prog.score}%`
  return meta.label
}

export function matchesStatusFilter(prog, status) {
  if (!status) return true
  if (!prog) return false
  if (status === 'due') return prog.dueForRevision
  return prog.status === status
}
