// The app's spaced-repetition-style revision schedule (Profile → Settings →
// Revision schedule). Instead of one flat "due after N days" number, this is
// up to 3 stages, each a user-configurable gap in days from the previous one
// — drives both the "Due for Revision" badge/filter on the Papers / Mock /
// Full 100 lists (via usePaperProgress) and the live preview table in
// Settings. The whole feature can also be switched off entirely for anyone
// who doesn't want revision reminders at all (the master toggle), and each
// stage can individually be set to "Off" for someone who only wants 1 or 2
// revisions instead of the full 3.
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

// 0 = "Off" — lets a stage (and, by cascade, every stage after it — see
// activeRevisionStages below) be switched off, for someone who only wants
// 1 or 2 revisions rather than the full 3.
export const REVISION_GAP_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 10, 14].map(d => ({
  id: d,
  label: d === 0 ? 'Off' : d === 1 ? '1 day' : `${d} days`,
}))

function isValidGaps(v) {
  return Array.isArray(v) && v.length === 3 && v.every(n => Number.isInteger(n) && n >= 0)
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

// How many stages are actually active, given a stage set to "Off" (0) stops
// the chain there — a later stage's day count only makes sense on top of
// every earlier one actually happening. [1,3,5] → 3. [1,0,5] → 1 (only the
// 1st revision happens; the stored "5" for the 3rd stage is kept as-is,
// just ignored, so it comes right back if the 2nd stage is turned back on).
// [0,3,5] → 0 (no revisions at all, same effect as the master toggle).
export function activeRevisionStages(gaps) {
  const zeroIdx = gaps.findIndex(g => g === 0)
  return zeroIdx === -1 ? gaps.length : zeroIdx
}

// The gap to use for the Nth revision since a paper was first completed
// (revisionsDone = how many revisions already logged; 0 → the 1st-stage
// gap). Past the last ACTIVE stage, keeps reusing that stage's gap as an
// ongoing maintenance cadence — unless there are no active stages left at
// all (everything from here on is "Off"), in which case there's nothing
// left to schedule and this returns null.
export function nextRevisionGap(gaps, revisionsDone) {
  const active = activeRevisionStages(gaps)
  if (active === 0 || revisionsDone >= active) {
    // Once every configured stage has been completed, only keep going if
    // the LAST stage is a real gap (not itself "Off") — that's the ongoing
    // maintenance cadence. A fully-active [1,3,5] keeps nudging every 5
    // days forever; a deliberately short [1,3,0] (only 2 revisions wanted)
    // stops for good once both are done.
    if (active === gaps.length && revisionsDone >= active) return gaps[gaps.length - 1]
    return null
  }
  return gaps[revisionsDone]
}

// Cumulative day offsets from a fresh completion for however many stages
// are active — e.g. [1, 4, 9] for the default gaps [1, 3, 5], or just [1]
// for [1, 0, 5] (2nd and 3rd are Off). Used to render the "When to do it"
// preview column; a stage past activeRevisionStages(gaps) has no entry.
export function cumulativeRevisionDays(gaps) {
  const active = activeRevisionStages(gaps)
  let sum = 0
  return gaps.slice(0, active).map(g => (sum += g))
}
