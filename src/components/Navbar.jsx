import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

const themes = [
  { id: 'dark', label: '🌙', title: 'Dark' },
  { id: 'howcome', label: 'HC', title: 'HOW COME' },
]

export default function Navbar() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/papers', label: 'Papers' },
    { to: '/topics', label: 'Topics' },
    { to: '/quiz', label: 'Quiz' },
    { to: '/exams', label: '📅 Exams' },
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
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="HOW COME?" className="h-10 w-10 rounded-full object-contain" />
          <span className="font-extrabold text-xl tracking-tight" style={{ color: 'var(--accent)' }}>
            HOW COME<span style={{ color: 'var(--accent)' }}>?</span>
          </span>
        </Link>

        {/* Nav links — hidden on mobile (BottomNav handles mobile nav) */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-4">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="px-2 sm:px-3 py-1 rounded text-sm font-medium transition-colors"
              style={{
                color: isActive(link.to) ? 'var(--accent)' : 'var(--text2)',
                background: isActive(link.to) ? 'var(--bg2)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {themes.map(t => (
              <button
                key={t.id}
                title={t.title}
                onClick={() => setTheme(t.id)}
                className="px-2 py-1 text-sm transition-colors"
                style={{
                  background: theme === t.id ? 'var(--accent)' : 'var(--surface)',
                  color: theme === t.id ? 'var(--accent-text)' : 'var(--text2)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Auth */}
          {user ? (
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1 rounded"
              style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="text-sm px-3 py-1 rounded font-medium"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
