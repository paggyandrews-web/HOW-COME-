import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

// Account data kept in localStorage — cleared on account deletion.
const LOCAL_KEYS_TO_CLEAR = ['cs-pinned', 'cs-quiz-results', 'cs-bookmarks', 'cs-streak']

const MAX_PINS = 5
const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Pinned exams live here — shared across ALL pages, survives navigation
  const [pinnedExams, setPinnedExams] = useState(() =>
    JSON.parse(localStorage.getItem('cs-pinned') || '[]')
  )
  const didSyncPinned = useRef(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) setProfile(snap.data())
      } else {
        setProfile(null)
        didSyncPinned.current = false
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // ONE-TIME sync from Firebase on login — union with local so nothing is lost
  useEffect(() => {
    if (profile?.pinnedExams && !didSyncPinned.current) {
      didSyncPinned.current = true
      const local = JSON.parse(localStorage.getItem('cs-pinned') || '[]')
      const fb = profile.pinnedExams
      const merged = [...new Set([...local, ...fb])].slice(0, MAX_PINS)
      setPinnedExams(merged)
      localStorage.setItem('cs-pinned', JSON.stringify(merged))
    }
  }, [profile])

  function pinExam(id) {
    setPinnedExams(prev => {
      if (prev.includes(id) || prev.length >= MAX_PINS) return prev
      const next = [...prev, id]
      localStorage.setItem('cs-pinned', JSON.stringify(next))
      if (user) setDoc(doc(db, 'users', user.uid), { pinnedExams: next }, { merge: true })
      return next
    })
  }

  function unpinExam(id) {
    setPinnedExams(prev => {
      const next = prev.filter(p => p !== id)
      localStorage.setItem('cs-pinned', JSON.stringify(next))
      if (user) setDoc(doc(db, 'users', user.uid), { pinnedExams: next }, { merge: true })
      return next
    })
  }

  async function signup(email, password, name, district) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    // isPaid: flip to true in Firestore after payment to grant full access.
    const profileData = { name, district, email, createdAt: new Date().toISOString(), pinnedExams: [], isPaid: false }
    await setDoc(doc(db, 'users', cred.user.uid), profileData)
    setProfile(profileData)
    return cred
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  async function logout() {
    await signOut(auth)
    setProfile(null)
  }

  // Permanently deletes the user's account and all associated data.
  // Firebase requires a "recent" login for this — if the session is old,
  // this throws 'auth/requires-recent-login' and the caller should
  // re-authenticate (see reauthenticate()) before retrying.
  async function deleteAccount() {
    const current = auth.currentUser
    if (!current) return
    const uid = current.uid

    // Delete quiz history subcollection (results/{uid}/quizzes/*)
    try {
      const quizzesSnap = await getDocs(collection(db, 'results', uid, 'quizzes'))
      await Promise.all(quizzesSnap.docs.map(d => deleteDoc(d.ref)))
    } catch (e) {
      console.error('Failed to delete quiz history', e)
    }

    // Delete the main profile doc (users/{uid})
    try {
      await deleteDoc(doc(db, 'users', uid))
    } catch (e) {
      console.error('Failed to delete profile doc', e)
    }

    // Delete the Firebase Auth account itself — this can throw
    // auth/requires-recent-login, which the caller must handle.
    await deleteUser(current)

    // Clear locally-stored account/usage data
    LOCAL_KEYS_TO_CLEAR.forEach(k => localStorage.removeItem(k))
    setProfile(null)
  }

  // Re-authenticates with the user's password — needed when deleteAccount()
  // throws auth/requires-recent-login (session too old for a sensitive op).
  async function reauthenticate(password) {
    const current = auth.currentUser
    if (!current?.email) throw new Error('No signed-in user.')
    const credential = EmailAuthProvider.credential(current.email, password)
    await reauthenticateWithCredential(current, credential)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signup, login, logout, resetPassword, deleteAccount, reauthenticate, pinnedExams, pinExam, unpinExam }}>
      {loading ? (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#000000',
        }}>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            <span style={{ color: '#1a9d8e' }}>HOW </span>
            <span style={{ color: '#ffffff' }}>COME</span>
            <span style={{ color: '#1a9d8e' }}>?</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>Kerala PSC English</div>
        </div>
      ) : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
