import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const KERALA_DISTRICTS = [
  'Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha','Kottayam',
  'Idukki','Ernakulam','Thrissur','Palakkad','Malappuram',
  'Kozhikode','Wayanad','Kannur','Kasaragod'
]

export default function Register() {
  const { signup } = useAuth()
  const { setTheme } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', district: '', gender: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.district) { setError('Please select your district.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError('')
    setLoading(true)
    try {
      await signup(form.email, form.password, form.name, form.district, form.mobile)
      setTheme(form.gender === 'female' ? 'pink' : 'black')
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="card rounded-2xl p-6">
        <h1 className="font-bold text-xl mb-1">Create Account</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
          Join{' '}
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>HOW </span>
          <span style={{ color: 'var(--come-color)', fontWeight: 700 }}>COME?</span>
          {' '}to track progress and join the district leaderboard
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input type="text" name="name" required value={form.name} onChange={handleChange}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number</label>
            <input type="tel" name="mobile" value={form.mobile} onChange={handleChange}
              placeholder="+91 XXXXXXXXXX"
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" name="password" required value={form.password} onChange={handleChange}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">District</label>
            <select name="district" required value={form.district} onChange={handleChange}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              <option value="">Select your district</option>
              {KERALA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <div className="flex gap-2">
              {['male', 'female'].map(g => (
                <button type="button" key={g}
                  onClick={() => setForm(f => ({ ...f, gender: g }))}
                  className="flex-1 py-2 rounded-lg text-sm font-medium capitalize border-2 transition-all"
                  style={{
                    borderColor: form.gender === g ? 'var(--accent)' : 'var(--border)',
                    background: form.gender === g ? 'var(--bg2)' : 'var(--surface)',
                    color: form.gender === g ? 'var(--text)' : 'var(--text2)',
                  }}>
                  {g === 'male' ? 'Male' : 'Female'}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm mt-2"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-center mt-4" style={{ color: 'var(--text2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }} className="font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
