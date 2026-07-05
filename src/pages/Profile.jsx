import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useResults } from '../hooks/useResults'

/* ── Delete Account modal ─────────────────────────────────────────── */
function DeleteAccountModal({ onClose }) {
  const { deleteAccount, reauthenticate } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('confirm') // confirm | password | deleting
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleConfirmDelete() {
    setError('')
    setStep('deleting')
    try {
      await deleteAccount()
      navigate('/')
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setStep('password')
      } else {
        setError('Something went wrong. Please try again.')
        setStep('confirm')
      }
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setError('')
    setStep('deleting')
    try {
      await reauthenticate(password)
      await deleteAccount()
      navigate('/')
    } catch (err) {
      setError('Incorrect password. Please try again.')
      setStep('password')
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full"
        style={{
          background: '#000000', maxWidth: 420, borderRadius: 18,
          border: '1px solid #dc2626', overflow: 'hidden',
        }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(220,38,38,0.25)' }}>
          <h2 className="font-bold text-base" style={{ color: '#dc2626' }}>Delete Account</h2>
        </div>

        <div className="px-5 py-4">
          {step === 'confirm' && (
            <>
              <p className="text-sm mb-4" style={{ color: '#ffffff' }}>
                This permanently deletes your account, profile, saved questions, quiz history, and streak.
                This cannot be undone.
              </p>
              {error && <p className="text-xs mb-3" style={{ color: '#dc2626' }}>{error}</p>}
              <div className="flex gap-2">
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: '#111111', color: '#ffffff', border: '1px solid #333333' }}>
                  Cancel
                </button>
                <button onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold"
                  style={{ background: '#dc2626', color: '#ffffff' }}>
                  Delete Forever
                </button>
              </div>
            </>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <p className="text-sm mb-3" style={{ color: '#ffffff' }}>
                For your security, please re-enter your password to confirm deletion.
              </p>
              <input type="password" required autoFocus value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg px-3 py-2.5 text-sm mb-3"
                style={{ background: '#111111', border: '1px solid #333333', color: '#ffffff', outline: 'none' }} />
              {error && <p className="text-xs mb-3" style={{ color: '#dc2626' }}>{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: '#111111', color: '#ffffff', border: '1px solid #333333' }}>
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold"
                  style={{ background: '#dc2626', color: '#ffffff' }}>
                  Confirm Delete
                </button>
              </div>
            </form>
          )}

          {step === 'deleting' && (
            <p className="text-sm text-center py-4" style={{ color: '#ffffff' }}>Deleting your account…</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, profile, logout } = useAuth()
  const { getAllResults, getTopicStats } = useResults()
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [topicStats, setTopicStats] = useState([])
  const [totalQuizzes, setTotalQuizzes] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const results = await getAllResults()
      setTotalQuizzes(results.length)
      const answered = results.reduce((s, r) => s + (r.total || 0), 0)
      const correct = results.reduce((s, r) => s + (r.score || 0), 0)
      setTotalAnswered(answered)
      setTotalCorrect(correct)
      setTopicStats(getTopicStats(results))
      setLoading(false)
    }
    load()
  }, [user])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const overallPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0
  const weakTopics = topicStats.filter(t => t.pct < 60 && t.total >= 2)
  const strongTopics = topicStats.filter(t => t.pct >= 80 && t.total >= 2)

  return (
    <div className="max-w-lg mx-auto px-4 py-8">

      {/* User card */}
      <div className="card rounded-2xl p-5 mb-5">
        {user ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg">{profile?.name || user.displayName || 'Student'}</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>{profile?.district || user.email}</div>
            </div>
            <button onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>
              Sign out
            </button>
          </div>
        ) : (
          <div>
            <div className="font-bold mb-1">Guest</div>
            <p className="text-sm mb-3" style={{ color: 'var(--text2)' }}>
              Sign up to save your progress across devices permanently.
            </p>
            <Link to="/register"
              className="inline-block px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              Sign Up Free →
            </Link>
          </div>
        )}
      </div>

      {/* Overall stats */}
      {totalAnswered > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Quizzes', value: totalQuizzes },
            { label: 'Answered', value: totalAnswered },
            { label: 'Accuracy', value: `${overallPct}%` },
          ].map(({ label, value }) => (
            <div key={label} className="card rounded-xl p-3 text-center">
              <div className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Topic accuracy */}
      {loading ? (
        <div className="card rounded-2xl p-5">
          <div className="skeleton h-4 w-32 mb-4 rounded" />
          {[1,2,3,4].map(i => (
            <div key={i} className="mb-3">
              <div className="skeleton h-3 w-full mb-1 rounded" />
              <div className="skeleton h-1.5 w-full rounded" />
            </div>
          ))}
        </div>
      ) : topicStats.length === 0 ? (
        <div className="card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">📊</div>
          <p className="font-semibold mb-1">No data yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
            Complete a quiz to see your topic accuracy here.
          </p>
          <Link to="/quiz"
            className="inline-block px-5 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            Start a Quiz →
          </Link>
        </div>
      ) : (
        <div className="card rounded-2xl p-5 mb-5">
          <h2 className="font-bold mb-4">Topic Accuracy</h2>

          {weakTopics.length > 0 && (
            <div className="mb-3 p-3 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
              🔴 Needs work: {weakTopics.slice(0, 3).map(t => t.topic).join(', ')}
            </div>
          )}

          {strongTopics.length > 0 && (
            <div className="mb-4 p-3 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', color: '#16a34a' }}>
              🟢 Strong: {strongTopics.slice(0, 3).map(t => t.topic).join(', ')}
            </div>
          )}

          <div className="space-y-3">
            {topicStats.map(({ topic, correct, total, pct }) => (
              <div key={topic}>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="truncate pr-2" style={{ color: 'var(--text)' }}>{topic}</span>
                  <span className="shrink-0 font-semibold"
                    style={{ color: pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {correct}/{total} · {pct}%
                  </span>
                </div>
                <div className="w-full rounded-full h-2" style={{ background: 'var(--bg2)' }}>
                  <div className="h-2 rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#ef4444',
                      transition: 'width 0.5s ease'
                    }} />
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs mt-4" style={{ color: 'var(--text2)' }}>
            Based on {totalAnswered} questions across {totalQuizzes} quizzes.
            {!user && ' Sign up to keep this data permanently.'}
          </p>
        </div>
      )}

      {/* Practice weak topics shortcut */}
      {weakTopics.length > 0 && (
        <Link to={`/quiz?topic=${encodeURIComponent(weakTopics[0].topic)}&mode=practice`}
          className="block card rounded-2xl p-4 text-center mb-3"
          style={{ border: '1px solid var(--accent)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            Practice your weakest topic →
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{weakTopics[0].topic}</p>
        </Link>
      )}

      {/* Saved questions shortcut */}
      <Link to="/bookmarks"
        className="flex items-center justify-between card rounded-2xl p-4 mb-3">
        <span className="text-sm font-semibold">🔖 Saved Questions</span>
        <span style={{ color: 'var(--text2)' }}>→</span>
      </Link>

      {/* Legal links */}
      <div className="text-xs text-center mb-3 flex items-center justify-center gap-3" style={{ color: 'var(--text2)' }}>
        <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text2)' }}>Privacy Policy</a>
        <span>·</span>
        <a href="/terms-and-conditions.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text2)' }}>Terms & Conditions</a>
      </div>

      {/* Delete account */}
      {user && (
        <button onClick={() => setShowDeleteModal(true)}
          className="w-full text-center py-2.5 text-xs font-medium"
          style={{ color: '#dc2626', background: 'none', border: 'none' }}>
          Delete Account
        </button>
      )}

      {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
    </div>
  )
}
