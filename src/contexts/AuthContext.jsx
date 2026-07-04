import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

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
    const profileData = { name, district, email, createdAt: new Date().toISOString(), pinnedExams: [], isPaid: false }
    await setDoc(doc(db, 'users', cred.user.uid), profileData)
    setProfile(profileData)
    return cred
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signup, login, logout, pinnedExams, pinExam, unpinExam }}>
      {loading ? (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          background: '#071524',
        }}>
          <div style={{ color: '#ffffff', fontWeight: 800, fontSize: 28 }}>HOW COME?</div>
          <div style={{ color: '#1a9d8e', fontSize: 13 }}>Kerala PSC English Practice</div>
        </div>
      ) : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
