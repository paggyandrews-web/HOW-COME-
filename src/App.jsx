import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import { tap } from './utils/haptics'

/**
 * Finds the nearest "interactive" ancestor of a touched element — a button,
 * link, form control, or anything explicitly styled with a pointer cursor
 * (our convention for custom clickable divs, e.g. Dropdown options). Walks a
 * short distance up the tree since the actual touch often lands on an icon
 * or text node inside the real target.
 */
function isInteractive(el) {
  let node = el
  for (let depth = 0; node && depth < 6; depth++) {
    const tag = node.tagName
    if (tag === 'BUTTON' || tag === 'A' || tag === 'SELECT' || tag === 'INPUT') return true
    if (node.getAttribute && node.getAttribute('role') === 'button') return true
    if (node.nodeType === 1 && window.getComputedStyle(node).cursor === 'pointer') return true
    node = node.parentElement
  }
  return false
}

/** Fires a light haptic tick whenever the person touches something interactive. */
function HapticFeedback() {
  useEffect(() => {
    function onPointerDown(e) {
      // Only for touch/pen — mouse users on desktop don't expect vibration.
      if (e.pointerType === 'mouse') return
      if (isInteractive(e.target)) tap()
    }
    document.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])
  return null
}

// Home loads eagerly — it's the landing page for almost every visit.
// Everything else is code-split so the initial bundle (and the 3MB+
// questions.json some of these pages import) only loads when actually visited.
import Home from './pages/Home'
const Papers = lazy(() => import('./pages/Papers'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Topics = lazy(() => import('./pages/Topics'))
const Exams = lazy(() => import('./pages/Exams'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Profile = lazy(() => import('./pages/Profile'))
const Search = lazy(() => import('./pages/Search'))
const Bookmarks = lazy(() => import('./pages/Bookmarks'))

/* Lightweight fallback shown while a lazy page chunk downloads */
function PageLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '3px solid rgba(26,157,142,0.25)', borderTopColor: 'var(--accent)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
    </div>
  )
}

/* Teal scroll button — centered, fades out when idle */
function ScrollButton() {
  const [visible, setVisible] = useState(false)
  const [atBottom, setAtBottom] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      if (maxScroll < 50) return          // page too short — never show
      setAtBottom(scrolled >= maxScroll - 40)
      setVisible(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setVisible(false), 1500)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(timer.current) }
  }, [])

  function handleClick() {
    if (atBottom) window.scrollTo({ top: 0, behavior: 'smooth' })
    else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  }

  return (
    <button
      onClick={handleClick}
      aria-label={atBottom ? 'Scroll to top' : 'Scroll to bottom'}
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(72px + env(safe-area-inset-bottom) + 10px)',
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: 'var(--accent)',
        border: 'none',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(26,157,142,0.45)',
        cursor: 'pointer',
        zIndex: 40,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.4s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: atBottom ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  )
}

/* Scroll to top on every route change */
function ScrollToTop() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  return null
}

/* Triggers page-enter animation on every route change */
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-enter">
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/papers" element={<Papers />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
            <HapticFeedback />
            <ScrollToTop />
            <Navbar />
            <div
              style={{
                paddingTop: 'calc(72px + env(safe-area-inset-top))',
                paddingBottom: 'calc(64px + env(safe-area-inset-bottom))',
              }}
              className="sm:pb-0"
            >
              <AnimatedRoutes />
            </div>
            <BottomNav />
            <ScrollButton />
            <Analytics />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
