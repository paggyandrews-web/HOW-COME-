import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

const STORAGE_KEY = 'cs-streak'

// The local copy MUST be scoped to the signed-in user. A single shared key
// meant that on a shared phone/browser, a new account inherited whatever
// streak the previous user (or a guest session) had left in localStorage —
// e.g. an account created on 8 Oct showing a 22-day streak. Guests keep the
// bare key; signed-in users get their own.
function storageKey(uid) {
  return uid ? `${STORAGE_KEY}:${uid}` : STORAGE_KEY
}

// Streak rule: PAUSE, never reset. The streak counts the days the user was
// actually active. Staying away — for a day, a week, a month — just pauses
// it; the next active day continues from where it stopped (it used to reset
// to 1 after 72h of inactivity). So currentStreak only ever goes up, by one
// per active local calendar day.

// Local (device timezone) date string — NOT UTC.
// toISOString() would flip the day at 5:30 AM IST and break streaks.
function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayStr() {
  return localDateStr()
}

function readLocal(uid) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(uid)) || 'null') || {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      lastActivityAt: null,
    }
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, lastActivityAt: null }
  }
}

function writeLocal(data, uid) {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(data))
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

function computeNewStreak(existing) {
  const now = new Date()
  const today = todayStr()
  const { lastActivityDate, currentStreak, longestStreak } = existing

  if (lastActivityDate === today) {
    // Already counted today — no change
    return existing
  }

  // First activity on a new day — continue from wherever the streak was
  // paused, no matter how long the gap since the last activity.
  const newStreak = (currentStreak || 0) + 1

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(longestStreak || 0, newStreak),
    lastActivityDate: today,
    lastActivityAt: now.toISOString(),
  }
}

// Rebuild a streak record from the user's real quiz history. Every completed
// quiz is saved to results/{uid}/quizzes with a `date` (a full ISO
// timestamp), so the sequence of real activity timestamps is ground truth.
// This repairs streaks that the storage/domain-change bug reset to 1 — using
// real data, never a guessed number — and applies the pause rule
// retroactively: gaps never break a streak, so the streak is simply the
// number of distinct local days with activity.
// Throws if the results read fails, so the caller can retry rather than mark
// the repair "done" on a transient error.
async function reconstructFromResults(uid, existing, { allowDowngrade = false } = {}) {
  const snap = await getDocs(collection(db, 'results', uid, 'quizzes'))
  const dates = []
  snap.forEach(d => {
    const v = d.data().date
    if (v) dates.push(new Date(v))
  })
  if (dates.length === 0) {
    return allowDowngrade
      ? { currentStreak: 0, longestStreak: 0, lastActivityDate: null, lastActivityAt: null }
      : existing
  }

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

  // Under the pause rule every active day counts and no gap resets, so both
  // the current and the longest streak equal the number of active days.
  const current = entries.length
  const longest = entries.length
  const [lastActiveDay, lastActiveTs] = entries[entries.length - 1]

  if (allowDowngrade) {
    return {
      currentStreak: current,
      longestStreak: longest,
      lastActivityDate: lastActiveDay,
      lastActivityAt: lastActiveTs.toISOString(),
    }
  }

  // Never downgrade: keep the best of stored vs reconstructed.
  return {
    currentStreak: Math.max(existing?.currentStreak || 0, current),
    longestStreak: Math.max(existing?.longestStreak || 0, longest, current),
    lastActivityDate:
      (existing?.lastActivityDate || '') >= lastActiveDay ? existing.lastActivityDate : lastActiveDay,
    lastActivityAt:
      existing?.lastActivityAt && new Date(existing.lastActivityAt) >= lastActiveTs
        ? existing.lastActivityAt
        : lastActiveTs.toISOString(),
  }
}

// Number of local calendar days the account has existed, counting the
// signup day as day 1. No genuine streak can be longer than this.
function accountAgeDays(createdAt) {
  if (!createdAt) return null
  const c = new Date(createdAt)
  if (isNaN(c)) return null
  const start = new Date(c.getFullYear(), c.getMonth(), c.getDate())
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((today - start) / 86_400_000) + 1
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
    const uid = user?.uid
    let existing = readLocal(uid)
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
    writeLocal(updated, uid)

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
        let s = data.streak || readLocal(user.uid)

        // One-time repair: rebuild the streak from real quiz history to undo
        // resets caused by the storage/domain-change bug, and to apply the
        // current streak rule retroactively. Guarded by a flag on the user
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
        //
        // V5: bumped for the pause-instead-of-reset change — streaks that the
        // old 72h rule had already reset are restored to the user's real
        // number of active days, so everyone continues from where they
        // stopped.
        // reconstructFromResults never downgrades, so this is safe to re-run.
        if (!data.streakRebuiltV5) {
          try {
            s = await reconstructFromResults(user.uid, s)
            await setDoc(
              doc(db, 'users', user.uid),
              { streak: s, streakRebuiltV1: true, streakRebuiltV2: true, streakRebuiltV3: true, streakRebuiltV5: true },
              { merge: true }
            )
          } catch {}
        }

        // V4: undo streaks inherited from the old shared localStorage key.
        // A streak longer than the account's age can't be real, so rebuild it
        // from this user's own quiz history WITHOUT the never-downgrade floor
        // (the floor is what kept the inherited number alive). Users whose
        // streak fits within their account age are left untouched.
        const age = accountAgeDays(data.createdAt || user.metadata?.creationTime)
        if (!data.streakRebuiltV4 && age && ((s?.currentStreak || 0) > age || (s?.longestStreak || 0) > age)) {
          try {
            s = await reconstructFromResults(user.uid, s, { allowDowngrade: true })
            s = {
              ...s,
              currentStreak: Math.min(s.currentStreak || 0, age),
              longestStreak: Math.min(s.longestStreak || 0, age),
            }
            await setDoc(doc(db, 'users', user.uid), { streak: s, streakRebuiltV4: true }, { merge: true })
          } catch {}
        }

        writeLocal(s, user.uid)
        return s
      } catch {}
    }
    // Guest or fallback
    return readLocal(user?.uid)
  }

  return { updateStreak, getStreak }
}
