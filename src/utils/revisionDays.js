// How many days a completed paper waits before it's flagged "Due for
// Revision" (Profile → Settings → Revision reminder). Purely a display/
// filter threshold used by usePaperProgress — it never touches saved quiz
// results, just when the "Due for Revision" badge/filter lights up.
// Defaults to 14, matching the app's previous fixed behavior.

const STORAGE_KEY = 'cs-revision-days'

export const DEFAULT_REVISION_DAYS = 14

export const REVISION_DAYS_OPTIONS = [
  { id: 3,  label: '3 days' },
  { id: 7,  label: '1 week' },
  { id: 14, label: '2 weeks' },
  { id: 30, label: '1 month' },
]

export function getRevisionDaysPref() {
  if (typeof localStorage === 'undefined') return DEFAULT_REVISION_DAYS
  const saved = Number(localStorage.getItem(STORAGE_KEY))
  return REVISION_DAYS_OPTIONS.some(o => o.id === saved) ? saved : DEFAULT_REVISION_DAYS
}

export function setRevisionDaysPref(days) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, String(days))
}
