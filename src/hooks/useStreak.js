import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

const STORAGE_KEY = 'cs-streak'

// Local (device timezone) date string — NOT UTC.
// toISOString() would flip the day at 5:30 AM IST and break streaks.
function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayStr() {
  return localDateStr()
}

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return localDateStr(d)
}

// The local date string one day after the given 'YYYY-MM-DD'.
function nextDay(dstr) {
  const [y, m, d] = dstr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + 1)
  return localDateStr(dt)
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    }
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null }
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

function computeNewStreak(existing) {
  const today = todayStr()
  const { lastActivityDate, currentStreak, longestStreak } = existing

  if (lastActivityDate === today) {
    // Already counted today — no change
    return existing
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = localDateStr(yesterday)

  let newStreak
  if (lastActivityDate === yesterdayStr) {
    // Consecutive day — increment
    newStreak = currentStreak + 1
  } else {
    // Missed a day or first time — reset to 1
    newStreak = 1
  }

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
    lastActivityDate: today,
  }
}

// Rebuild a streak record from the user's real quiz history. Every completed
// quiz is saved to results/{uid}/quizzes with a `date`, so the set of distinct
// LOCAL activity days is ground truth. This repairs streaks that the storage/
// domain-change bug reset to 1 — using real data, never a guessed number.
// Throws if the results read fails, so the caller can retry rather than mark
// the repair "done" on a transient error.
async function reconstructFromResults(uid, existing) {
  const snap = await getDocs(collection(db, 'results', uid, 'quizzes'))
  const dates = []
  snap.forEach(d => {
    const v = d.data().date
    if (v) dates.push(localDateStr(new Date(v)))
  })
  if (dates.length === 0) return existing

  const uniq = [...new Set(dates)].sort() // ascending YYYY-MM-DD
  let longest = 1, run = 1
  for (let i = 1; i < uniq.length; i++) {
    run = uniq[i] === nextDay(uniq[i - 1]) ? run + 1 : 1
    if (run > longest) longest = run
  }
  // Length of the consecutive run ending on the most recent active day.
  let current = 1
  for (let i = uniq.length - 1; i > 0; i--) {
    if (uniq[i] === nextDay(uniq[i - 1])) current++
    else break
  }
  const lastActive = uniq[uniq.length - 1]
  const alive = lastActive === todayStr() || lastActive === yesterdayStr()

  // Never downgrade: keep the best of stored vs reconstructed.
  return {
    currentStreak: Math.max(existing?.currentStreak || 0, alive ? current : 0),
    longestStreak: Math.max(existing?.longestStreak || 0, longest, current),
    lastActivityDate:
      (existing?.lastActivityDate || '') >= lastActive ? existing.lastActivityDate : lastActive,
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
        // resets caused by the storage/domain-change bug. Guarded by a flag on
        // the user doc (not inside the streak map, which updateStreak rewrites)
        // so it runs exactly once per user. On read failure we leave the flag
        // unset and retry on the next open rather than marking it done.
        if (!data.streakRebuiltV1) {
          try {
            s = await reconstructFromResults(user.uid, s)
            await setDoc(
              doc(db, 'users', user.uid),
              { streak: s, streakRebuiltV1: true },
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
