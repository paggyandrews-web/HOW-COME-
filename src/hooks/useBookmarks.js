import { useEffect, useSyncExternalStore } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const STORAGE_KEY = 'cs-bookmarks'

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function writeLocal(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {}
}

// ── Module-level shared store ──
// All useBookmarks() instances share this, so toggling a bookmark
// anywhere updates every component immediately.
let bookmarks = readLocal()
const listeners = new Set()

function setBookmarks(ids) {
  bookmarks = ids
  writeLocal(ids)
  listeners.forEach(l => l())
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return bookmarks
}

// Tracks which uid we last loaded from Firestore, so multiple hook
// instances don't trigger duplicate reads.
let loadedForUid

export function useBookmarks() {
  const { user } = useAuth()
  const list = useSyncExternalStore(subscribe, getSnapshot)

  useEffect(() => {
    const uid = user?.uid || null
    if (loadedForUid === uid) return
    loadedForUid = uid
    if (!uid) {
      setBookmarks(readLocal())
      return
    }
    getDoc(doc(db, 'users', uid))
      .then(snap => {
        if (snap.exists() && snap.data().bookmarks) {
          setBookmarks(snap.data().bookmarks)
        }
      })
      .catch(() => {})
  }, [user])

  async function toggle(questionId) {
    const updated = bookmarks.includes(questionId)
      ? bookmarks.filter(id => id !== questionId)
      : [...bookmarks, questionId]

    setBookmarks(updated)

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { bookmarks: updated }, { merge: true })
      } catch {}
    }
  }

  function isBookmarked(questionId) {
    return bookmarks.includes(questionId)
  }

  return { bookmarks: list, toggle, isBookmarked, loaded: true }
}
