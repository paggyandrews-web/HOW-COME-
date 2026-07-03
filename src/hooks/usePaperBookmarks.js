import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'cs-paper-bookmarks'

function readLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function writeLocal(ids) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)) } catch {}
}

let paperBookmarks = readLocal()
const listeners = new Set()

function setPaperBookmarks(ids) {
  paperBookmarks = ids
  writeLocal(ids)
  listeners.forEach(l => l())
}

function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb) }
function getSnapshot() { return paperBookmarks }

export function usePaperBookmarks() {
  const list = useSyncExternalStore(subscribe, getSnapshot)

  function toggle(paperId) {
    const updated = paperBookmarks.includes(paperId)
      ? paperBookmarks.filter(id => id !== paperId)
      : [...paperBookmarks, paperId]
    setPaperBookmarks(updated)
  }

  function isBookmarked(paperId) {
    return paperBookmarks.includes(paperId)
  }

  return { paperBookmarks: list, toggle, isBookmarked }
}
