// Local-only autosave for in-progress Full 100 attempts.
//
// Stored ENTIRELY in localStorage — never written to Firestore — so resuming
// costs zero extra Firebase usage. The tradeoff: a draft only exists on the
// device/browser where the attempt was started, it won't follow you across
// devices. Once an attempt is submitted, saveResult() (Firestore + localStorage)
// takes over as the permanent record and the draft here is cleared.
const KEY = 'cs-full100-drafts'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function writeAll(drafts) {
  try {
    localStorage.setItem(KEY, JSON.stringify(drafts))
  } catch {
    // Storage full/unavailable — resume just won't be offered next time.
  }
}

export function getDraft(paperId) {
  return readAll()[paperId] || null
}

export function saveDraft(paperId, data) {
  const drafts = readAll()
  drafts[paperId] = { ...data, savedAt: new Date().toISOString() }
  writeAll(drafts)
}

export function clearDraft(paperId) {
  const drafts = readAll()
  if (drafts[paperId]) {
    delete drafts[paperId]
    writeAll(drafts)
  }
}

export function getAllDrafts() {
  return readAll()
}

// Number of scoreable questions with a recorded answer in this draft.
// Deleted questions are never selectable in the exam UI, so they never end
// up as keys in draft.answers — no separate filtering needed here.
export function draftAttemptedCount(draft) {
  if (!draft || !draft.answers) return 0
  return Object.keys(draft.answers).length
}
