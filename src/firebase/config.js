// ── Firebase Configuration ──
// Replace these values with your own from Firebase Console:
// Go to: https://console.firebase.google.com
// → Your Project → Project Settings → "Your apps" → Web app → Config

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDUVOg7Gjr7wHGD6dhYmaovUgLwcMTbvGY",
  authDomain: "how-come-80e31.firebaseapp.com",
  projectId: "how-come-80e31",
  storageBucket: "how-come-80e31.firebasestorage.app",
  messagingSenderId: "651167370939",
  appId: "1:651167370939:web:7ec4ffd4e9949119a5639e",
  measurementId: "G-03TYG2BCG9"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
