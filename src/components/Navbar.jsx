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
            <div className="font-extrabold text-xl tracking-tight leading-tight">
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

          {/* Theme switcher */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #222222' }}>
            {themes.map(t => (
              <button key={t.id} title={t.title} onClick={() => setTheme(t.id)}
                className="px-2 py-1 text-sm transition-colors"
                style={{
                  background: theme === t.id ? '#1a9d8e' : '#111111',
                  color: theme === t.id ? '#ffffff' : '#888888',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Auth */}
          {user ? (
            <button onClick={handleLogout} className="text-sm px-3 py-1 rounded"
              style={{ color: '#888888', border: '1px solid #222222' }}>
              Sign out
            </button>
          ) : (
            <Link to="/login" className="text-sm px-3 py-1 rounded font-medium"
              style={{ background: '#1a9d8e', color: '#ffffff' }}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
