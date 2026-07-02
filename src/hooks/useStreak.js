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

export function useStreak() {
  const { user } = useAuth()

  async function updateStreak() {
    const existing = readLocal()
    const updated = computeNewStreak(existing)

    // Always write to localStorage
    writeLocal(updated)

    // Also write to Firestore if logged in
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { streak: updated }, { merge: true })
      } catch {}
    }
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
