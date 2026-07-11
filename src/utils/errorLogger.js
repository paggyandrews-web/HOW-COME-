// ── Lightweight error logging ──
// Writes uncaught errors, unhandled promise rejections, and React render
// crashes to a Firestore "errorLogs" collection so DREWS can see real-world
// issues without needing a third-party service. View logs in Firebase
// Console → Firestore Database → errorLogs.

import { db, auth } from '../firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

let isLogging = false // guard against recursive loops if the write itself fails

export async function logError(error, meta = {}) {
  if (isLogging) return
  isLogging = true
  try {
    await addDoc(collection(db, 'errorLogs'), {
      message: (error && error.message) || String(error),
      stack: (error && error.stack) || null,
      context: meta.context || null,
      componentStack: meta.componentStack || null,
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      userId: auth.currentUser ? auth.currentUser.uid : null,
      timestamp: serverTimestamp(),
    })
  } catch (e) {
    // Never let error logging itself cause more errors — just console it.
    console.error('errorLogger failed to write log:', e)
  } finally {
    isLogging = false
  }
}

export function initGlobalErrorLogging() {
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, { context: 'window.onerror' })
  })
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, { context: 'unhandledrejection' })
  })
}
