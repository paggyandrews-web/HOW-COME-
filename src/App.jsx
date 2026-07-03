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
            <ScrollButton />
            <Analytics />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
