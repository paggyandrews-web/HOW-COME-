import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Papers from './pages/Papers'
import Quiz from './pages/Quiz'
import Topics from './pages/Topics'
import Exams from './pages/Exams'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Search from './pages/Search'
import Bookmarks from './pages/Bookmarks'

/* Minimalist teal scroll indicator — centered on right edge, fades on idle */
function ScrollIndicator() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    function onScroll() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      setProgress(maxScroll > 0 ? window.scrollY / maxScroll : 0)
      setVisible(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setVisible(false), 1200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(timer.current) }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      right: 3,
      top: '50%',
      transform: 'translateY(-50%)',
      height: '55vh',
      width: 2,
      borderRadius: 2,
      background: 'rgba(255,255,255,0.07)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
      zIndex: 200,
      pointerEvents: 'none',
    }}>
      {/* Thumb */}
      <div style={{
        position: 'absolute',
        left: -1,
        top: `${progress * 100}%`,
        transform: 'translateY(-50%)',
        width: 4,
        height: 28,
        borderRadius: 3,
        background: 'var(--accent)',
        boxShadow: '0 0 6px rgba(26,157,142,0.5)',
        transition: 'top 0.08s linear',
      }} />
    </div>
  )
}

/* Floating scroll button — appears after scrolling 250px */
function ScrollButton() {
  const [visible, setVisible] = useState(false)
  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      setVisible(scrolled > 250)
      setAtBottom(maxScroll > 0 && scrolled >= maxScroll - 40)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  function handleClick() {
    if (atBottom) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={atBottom ? 'Scroll to top' : 'Scroll to bottom'}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 'calc(72px + env(safe-area-inset-bottom))',
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--text2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        zIndex: 40,
        transition: 'opacity 0.2s, transform 0.2s',
        touchAction: 'manipulation',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: atBottom ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>
        <polyline points="18 15 12 9 6 15" />
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/papers" element={<Papers />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<Search />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
            <ScrollToTop />
            <Navbar />
            <div style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }} className="sm:pb-0">
              <AnimatedRoutes />
            </div>
            <BottomNav />
            <ScrollIndicator />
            <ScrollButton />
            <Analytics />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
