import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) setProfile(snap.data())
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signup(email, password, name, district) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    const profileData = { name, district, email, createdAt: new Date().toISOString(), pinnedExams: [] }
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

  async function updatePinnedExams(pinnedExams) {
    if (!user) return
    // Fire-and-forget — do NOT call setProfile here.
    // Calling setProfile after each Firestore write causes a race condition on mobile:
    // if two rapid pins complete out of order, the earlier write's setProfile fires last
    // and resets the UI back to fewer pins. Local state in Home.jsx manages pinned state
    // during the session; Firebase is just the backup store.
    setDoc(doc(db, 'users', user.uid), { pinnedExams }, { merge: true })
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signup, login, logout, updatePinnedExams }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
