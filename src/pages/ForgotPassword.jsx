import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with that email.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError('Could not send reset email. Try again.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="card rounded-2xl p-6">
        <h1 className="font-bold text-xl mb-1">Reset Password</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
          Enter your account email and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {sent ? (
          <div className="p-4 rounded-lg text-sm text-center" style={{ background: 'rgba(26,157,142,0.1)', border: '1px solid rgba(26,157,142,0.25)', color: 'var(--accent)' }}>
            ✅ Reset link sent! Check <strong>{email}</strong> for instructions.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm mt-2"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-sm text-center mt-4" style={{ color: 'var(--text2)' }}>
          <Link to="/login" style={{ color: 'var(--accent)' }} className="font-medium">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}
