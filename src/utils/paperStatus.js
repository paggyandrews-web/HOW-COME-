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
