import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const KERALA_DISTRICTS = [
  'Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha','Kottayam',
  'Idukki','Ernakulam','Thrissur','Palakkad','Malappuram',
  'Kozhikode','Wayanad','Kannur','Kasaragod'
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError('Invalid email or password.')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="card rounded-2xl p-6">
        <h1 className="font-bold text-xl mb-1">Sign In</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
          Welcome back to{' '}
          <span style={{ fontFamily: "'Sifonn', sans-serif" }}>
            <span style={{ color: 'var(--accent)' }}>HOW </span>
            <span style={{ color: 'var(--come-color)' }}>COME</span>
            <span style={{ color: 'var(--accent)' }}>?</span>
          </span>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <div className="text-right mt-1.5">
              <Link to="/forgot-password" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                Forgot password?
              </Link>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm mt-2"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-center mt-4" style={{ color: 'var(--text2)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)' }} className="font-medium">Register</Link>
        </p>
      </div>
    </div>
  )
}
