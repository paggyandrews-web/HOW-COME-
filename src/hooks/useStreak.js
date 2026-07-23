import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
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
        if (snap.exists() && snap.data().streak) {
          const s = snap.data().streak
          // Sync to localStorage too
          writeLocal(s)
          return s
        }
      } catch {}
    }
    // Guest or fallback
    return readLocal()
  }

  return { updateStreak, getStreak }
}
