// The app's spaced-repetition-style revision schedule (Profile → Settings →
// Revision schedule). Instead of one flat "due after N days" number, this is
// 3 stages, each a user-configurable gap in days from the previous one —
// drives both the "Due for Revision" badge/filter on the Papers / Mock /
// Full 100 lists (via usePaperProgress) and the live preview table in
// Settings. The whole feature can also be switched off entirely for anyone
// who doesn't want revision reminders at all.
//
// Defaults match the original mockup: revise tomorrow (+1 day), again on
// day 4 (+3 days), again on day 9 (+5 days) — then that last gap keeps
// repeating as an ongoing maintenance cadence for any revision beyond the 3rd.

const STORAGE_KEY = 'cs-revision-gaps'
const ENABLED_STORAGE_KEY = 'cs-revision-enabled'

export const DEFAULT_REVISION_GAPS = [1, 3, 5]

/**
 * Whether "Due for Revision" tracking is on at all (Settings → Revision
 * schedule). Defaults to on, matching the app's previous always-on behavior.
 */
export function isRevisionScheduleEnabled() {
  if (typeof localStorage === 'undefined') return true
  const saved = localStorage.getItem(ENABLED_STORAGE_KEY)
  return saved === null ? true : saved === 'true'
}

export function setRevisionScheduleEnabled(enabled) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(ENABLED_STORAGE_KEY, String(enabled))
}

export const REVISION_GAP_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 10, 14].map(d => ({
  id: d,
  label: d === 1 ? '1 day' : `${d} days`,
}))

function isValidGaps(v) {
  return Array.isArray(v) && v.length === 3 && v.every(n => Number.isInteger(n) && n > 0)
}

export function getRevisionGapsPref() {
  if (typeof localStorage === 'undefined') return DEFAULT_REVISION_GAPS
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    return isValidGaps(saved) ? saved : DEFAULT_REVISION_GAPS
  } catch {
    return DEFAULT_REVISION_GAPS
  }
}

export function setRevisionGapsPref(gaps) {
  if (typeof localStorage === 'undefined') return
  if (!isValidGaps(gaps)) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gaps))
}

// The gap to use for the Nth revision since a paper was first completed
// (revisionsDone = how many revisions already logged; 0 → the 1st-stage gap).
// Past the last configured stage, keeps reusing the final gap rather than
// stopping reminders altogether.
export function nextRevisionGap(gaps, revisionsDone) {
  const idx = Math.min(revisionsDone, gaps.length - 1)
  return gaps[idx]
}

// Cumulative day offsets from a fresh completion — [1, 4, 9] for the default
// gaps [1, 3, 5]. Used to render the "When to do it" preview column.
export function cumulativeRevisionDays(gaps) {
  let sum = 0
  return gaps.map(g => (sum += g))
}
