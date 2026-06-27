import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
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

export function useBookmarks() {
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = useState([])
  const [loaded, setLoaded] = useState(false)

  // Load bookmarks on mount
  useEffect(() => {
    async function load() {
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid))
          if (snap.exists() && snap.data().bookmarks) {
            const ids = snap.data().bookmarks
            setBookmarks(ids)
            writeLocal(ids)
            setLoaded(true)
            return
          }
        } catch {}
      }
      // Guest or fallback
      setBookmarks(readLocal())
      setLoaded(true)
    }
    load()
  }, [user])

  async function toggle(questionId) {
    const current = bookmarks
    const isBookmarked = current.includes(questionId)
    const updated = isBookmarked
      ? current.filter(id => id !== questionId)
      : [...current, questionId]

    setBookmarks(updated)
    writeLocal(updated)

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { bookmarks: updated })
      } catch {}
    }
  }

  function isBookmarked(questionId) {
    return bookmarks.includes(questionId)
  }

  return { bookmarks, toggle, isBookmarked, loaded }
}
