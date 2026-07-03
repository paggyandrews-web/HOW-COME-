import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useStreak } from '../hooks/useStreak'

const themes = [
  { id: 'black', label: '⬛', title: 'Black' },
  { id: 'pink', label: '🌸', title: 'Pink' },
]

export default function Navbar() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { getStreak } = useStreak()
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    getStreak().then(s => setStreak(s.currentStreak || 0))
  }, [user])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/papers', label: 'Papers' },
    { to: '/topics', label: 'Topics' },
    { to: '/quiz', label: 'Quiz' },
    { to: '/exams', label: '📅 Exams' },
    ...(user ? [{ to: '/profile', label: '👤 Profile' }] : []),
  ]

  function isActive(path) {
    return location.pathname === path
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <nav
      style={{ background: '#000000', borderBottom: '1px solid #222222' }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="HOW COME?" className="h-10 w-10 rounded-full object-contain" />
          <div>
            <div className="leading-tight" style={{ fontFamily: "'Sifonn', sans-serif", fontSize: '1.25rem', letterSpacing: '0.03em' }}>
              <span style={{ color: '#1a9d8e' }}>HOW </span>
              <span style={{ color: '#ffffff' }}>COME</span>
              <span style={{ color: '#1a9d8e' }}>?</span>
            </div>
            <div className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Every failure is a lesson.
            </div>
          </div>
        </Link>

        {/* Nav links — hidden on mobile (BottomNav handles mobile nav) */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-4">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="px-2 sm:px-3 py-1 rounded text-sm font-medium transition-colors"
              style={{
                color: isActive(link.to) ? '#1a9d8e' : '#888888',
                background: isActive(link.to) ? '#111111' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Streak badge */}
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm font-bold"
              style={{ background: '#1a1000', border: '1px solid rgba(255,107,53,0.3)', color: 'white' }}>
              🔥 {streak}
            </div>
          )}

          {/* Theme switcher — single cycle button */}
          {(() => {
            const current = themes.find(t => t.id === theme) || themes[0]
            const nextTheme = themes[(themes.findIndex(t => t.id === theme) + 1) % themes.length]
            return (
              <button
                title={`Switch to ${nextTheme.title}`}
                onClick={() => setTheme(nextTheme.id)}
                className="px-2.5 py-1.5 rounded-lg text-sm transition-colors"
                style={{ background: '#111111', border: '1px solid #222222', color: '#ffffff' }}>
                {current.label}
              </button>
            )
          })()}

          {/* Search icon */}
          <Link to="/search"
            title="Search"
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ background: '#111111', border: '1px solid #222222', color: '#ffffff', width: 38, height: 38 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </Link>

          {/* Profile icon */}
          <Link to={user ? '/profile' : '/login'}
            title={user ? 'Profile' : 'Login'}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ background: '#111111', border: '1px solid #222222', color: '#ffffff', width: 38, height: 38 }}>
            {user ? (
              <div className="flex items-center justify-center rounded-full font-bold text-sm"
                style={{ width: 24, height: 24, background: 'var(--accent)', color: '#fff' }}>
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}
