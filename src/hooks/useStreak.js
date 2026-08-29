import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

const STORAGE_KEY = 'cs-streak'

// A streak survives a gap of up to this many hours of inactivity before it
// resets. 72h = "missed a day or two is fine, missed three days breaks it" —
// more forgiving than a strict calendar-day check, and immune to someone
// squeaking in right before midnight one day and right after midnight two
// days later (which is only ~24h apart in real time but 2 calendar days).
const GRACE_HOURS = 72

// Local (device timezone) date string — NOT UTC.
// toISOString() would flip the day at 5:30 AM IST and break streaks.
function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayStr() {
  return localDateStr()
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      lastActivityAt: null,
    }
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, lastActivityAt: null }
  }
}

function writeLocal(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

// Pick the more advanced of two streak records: the one whose last activity
// is more recent, or on a tie the higher streak. Used so a stale/empty local
// copy can never overwrite a good remote one.
function mostAdvanced(a, b) {
  const da = a?.lastActivityDate || ''
  const db2 = b?.lastActivityDate || ''
  if (da !== db2) return da > db2 ? a : b
  return (a?.currentStreak || 0) >= (b?.currentStreak || 0) ? a : b
}

// The timestamp to measure the grace window from. Records written before
// lastActivityAt existed only have lastActivityDate — treat those as if the
// activity happened at the very end of that local day, the most generous
// reading available, so migrated users aren't punished for a field that
// didn't used to exist.
function effectiveLastTimestamp(existing) {
  if (existing?.lastActivityAt) return new Date(existing.lastActivityAt)
  if (existing?.lastActivityDate) {
    const [y, m, d] = existing.lastActivityDate.split('-').map(Number)
    return new Date(y, m - 1, d, 23, 59, 59, 999)
  }
  return null
}

function computeNewStreak(existing) {
  const now = new Date()
  const today = todayStr()
  const { lastActivityDate, currentStreak, longestStreak } = existing

  if (lastActivityDate === today) {
    // Already counted today — no change
    return existing
  }

  const lastTs = effectiveLastTimestamp(existing)
  const hoursSinceLast = lastTs ? (now - lastTs) / 3_600_000 : Infinity

  // Within the grace window — the streak survives even if a day (or two)
  // was skipped, as long as it's been under 72h since the last activity.
  // Past it — too long a gap, start over.
  const newStreak = hoursSinceLast <= GRACE_HOURS ? currentStreak + 1 : 1

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
    lastActivityDate: today,
    lastActivityAt: now.toISOString(),
  }
}

// Rebuild a streak record from the user's real quiz history. Every completed
// quiz is saved to results/{uid}/quizzes with a `date` (a full ISO
// timestamp), so the sequence of real activity timestamps is ground truth.
// This repairs streaks that the storage/domain-change bug reset to 1 — using
// real data, never a guessed number — and applies the same 72h grace rule
// retroactively, so a gap that wouldn't have broken the streak under the
// current rule doesn't wrongly zero it out here either.
// Throws if the results read fails, so the caller can retry rather than mark
// the repair "done" on a transient error.
async function reconstructFromResults(uid, existing) {
  const snap = await getDocs(collection(db, 'results', uid, 'quizzes'))
  const dates = []
  snap.forEach(d => {
    const v = d.data().date
    if (v) dates.push(new Date(v))
  })
  if (dates.length === 0) return existing

  // One entry per local calendar day, timestamped at that day's LATEST
  // activity — that's what would have been saved as lastActivityAt if the
  // real app had recorded it live that day.
  const byDay = new Map()
  for (const d of dates) {
    const key = localDateStr(d)
    const prev = byDay.get(key)
    if (!prev || d > prev) byDay.set(key, d)
  }
  const entries = [...byDay.entries()].sort((a, b) => a[1] - b[1]) // ascending by timestamp

  let longest = 1, run = 1
  for (let i = 1; i < entries.length; i++) {
    const gapHours = (entries[i][1] - entries[i - 1][1]) / 3_600_000
    run = gapHours <= GRACE_HOURS ? run + 1 : 1
    if (run > longest) longest = run
  }
  // Length of the run ending on the most recent active day.
  let current = 1
  for (let i = entries.length - 1; i > 0; i--) {
    const gapHours = (entries[i][1] - entries[i - 1][1]) / 3_600_000
    if (gapHours <= GRACE_HOURS) current++
    else break
  }
  const [lastActiveDay, lastActiveTs] = entries[entries.length - 1]
  const alive = (new Date() - lastActiveTs) / 3_600_000 <= GRACE_HOURS

  // Never downgrade: keep the best of stored vs reconstructed.
  return {
    currentStreak: Math.max(existing?.currentStreak || 0, alive ? current : 0),
    longestStreak: Math.max(existing?.longestStreak || 0, longest, current),
    lastActivityDate:
      (existing?.lastActivityDate || '') >= lastActiveDay ? existing.lastActivityDate : lastActiveDay,
    lastActivityAt:
      existing?.lastActivityAt && new Date(existing.lastActivityAt) >= lastActiveTs
        ? existing.lastActivityAt
        : lastActiveTs.toISOString(),
  }
}

// Streak lengths worth a special celebration. Early wins (3, 7) come fast to
// hook the habit; after 10 it's every round number so it stays achievable.
export function isStreakMilestone(n) {
  return n === 3 || n === 7 || (n >= 10 && n % 10 === 0)
}

export function useStreak() {
  const { user } = useAuth()

  async function updateStreak() {
    // Read the AUTHORITATIVE record before computing. Previously this read
    // localStorage only — so a cleared or brand-new-origin localStorage (e.g.
    // after the site domain changed from *.vercel.app to howcome.in, which is
    // a different origin with its own empty storage) looked like "first ever
    // visit", reset the streak to 1, and then overwrote the real value in
    // Firestore. Now Firestore wins whenever it's more advanced.
    let existing = readLocal()
    if (user) {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists() && snap.data().streak) {
          existing = mostAdvanced(existing, snap.data().streak)
        }
      } catch {}
    }
    const today = todayStr()
    const isNewDay = existing.lastActivityDate !== today
    const updated = computeNewStreak(existing)

    // Always write to localStorage
    writeLocal(updated)

    // Also write to Firestore if logged in
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { streak: updated }, { merge: true })
      } catch {}
    }

    // isNewDay tells callers whether the streak actually advanced today, so
    // they don't re-fire a milestone celebration on every quiz taken while
    // already sitting at a milestone number.
    return { ...updated, isNewDay }
  }

  async function getStreak() {
    // Registered: try Firestore first
    if (user) {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        const data = snap.exists() ? snap.data() : {}
        let s = data.streak || readLocal()

        // One-time repair: rebuild the streak from real quiz history to undo
        // resets caused by the storage/domain-change bug, and to apply the
        // 72h grace-period rule retroactively. Guarded by a flag on the user
        // doc (not inside the streak map, which updateStreak rewrites) so it
        // runs exactly once per user. On read failure we leave the flag
        // unset and retry on the next open rather than marking it done.
        //
        // V2: bumped from streakRebuiltV1 because updateStreak() was only ever
        // called from the Quiz page — Mock and Full 100 attempts were saved to
        // results/{uid}/quizzes (so they're in the ground truth this function
        // reads) but never advanced the live streak counter. Anyone whose daily
        // practice was Mock/Full 100 instead of Quiz saw their streak reset
        // despite real, continuous activity. Mock/FullHundred now also call
        // updateStreak(), but everyone who was already affected needs this
        // second, one-time reconstruction to recover the streak that bug ate.
        //
        // V3: bumped again for the 72h-grace-period change — under the old
        // strict "must be exactly yesterday" rule, gaps of ~2 days wrongly
        // reset streaks that should have survived under the new rule. This
        // re-reconstruction gives existing users the benefit of the grace
        // period retroactively.
        // reconstructFromResults never downgrades, so this is safe to re-run.
        if (!data.streakRebuiltV3) {
          try {
            s = await reconstructFromResults(user.uid, s)
            await setDoc(
              doc(db, 'users', user.uid),
              { streak: s, streakRebuiltV1: true, streakRebuiltV2: true, streakRebuiltV3: true },
              { merge: true }
            )
          } catch {}
        }

        writeLocal(s)
        return s
      } catch {}
    }
    // Guest or fallback
    return readLocal()
  }

  return { updateStreak, getStreak }
}
