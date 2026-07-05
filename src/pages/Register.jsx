import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Dropdown from '../components/Dropdown'

const KERALA_DISTRICTS = [
  'Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha','Kottayam',
  'Idukki','Ernakulam','Thrissur','Palakkad','Malappuram',
  'Kozhikode','Wayanad','Kannur','Kasaragod'
]

const NAME_VIBES = [
  "Nice name! That sounds like a topper 🏆",
  "Sweet name! PSC officers have great names 🌟",
  "Love it! A name that belongs on a rank list ✨",
  "Beautiful name — beautiful future! 🌸",
  "Strong name for a strong officer! 💪",
  "That's a great name — own it! 🎯",
  "Such a cool name — we'll remember it! 😎",
]

const DISTRICT_VIBES = {
  'Thiruvananthapuram': "🏛️ The capital city! Right at the heart of Kerala government — you're already close to the action!",
  'Kollam': "🥜 Cashew capital of the world! Strong like the nut, cracking every PSC paper!",
  'Pathanamthitta': "⛪ God's own pilgrim zone! Sabarimala district — faith and hard work go together!",
  'Alappuzha': "🚤 Venice of the East! Beautiful backwaters, brilliant minds — you'll float to the top!",
  'Kottayam': "📚 Land of Letters, Latex & Lakes! Kerala's most literate district — PSC is in your DNA!",
  'Idukki': "⛰️ Up in the misty mountains! The spice garden of India — season your preparation well!",
  'Ernakulam': "🏙️ Kochi hustle! Where Kerala's metro dreams are made — think big, rank high!",
  'Thrissur': "🐘 Pooram city! Cultural capital with explosive spirit — make your preparation a celebration!",
  'Palakkad': "🌾 Gateway of Kerala! The rice bowl with big ambitions — nurture your dreams like the paddy fields!",
  'Malappuram': "💪 Kerala's fastest-growing district — unstoppable energy, unstoppable preparation!",
  'Kozhikode': "🌶️ City of Spices & scholars! Calicut University land — add some spice to your English!",
  'Wayanad': "🌿 Misty hills and tiger trails! Nature's paradise — let your preparation be wild and free!",
  'Kannur': "🎭 Land of Looms & Lores! Theyyam's sacred home — weave your success story here!",
  'Kasaragod': "🗣️ Land of 7 languages! The northernmost gem — if you handle 7 languages, English is easy!",
}

function getPasswordStrength(pwd) {
  if (!pwd) return null
  if (pwd.length < 6) return { label: 'Too short — needs 6+ characters ❌', color: '#ef4444', pct: 15 }
  if (pwd.length < 8)  return { label: 'Okay, but stronger is better 👍', color: '#f59e0b', pct: 45 }
  if (pwd.length < 12) return { label: 'Strong password! 💪', color: '#22c55e', pct: 75 }
  return { label: 'Fortress-level security! 🏰', color: '#1a9d8e', pct: 100 }
}

// Scroll the focused field above the keyboard
function scrollUp(e) {
  setTimeout(() => {
    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 320)
}

function Vibe({ message, id }) {
  if (!message) return null
  return (
    <div key={id} className="vibe-in flex items-start gap-1.5 mt-2 px-3 py-2 rounded-lg"
      style={{ background: 'rgba(26,157,142,0.1)', border: '1px solid rgba(26,157,142,0.25)' }}>
      <span className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--accent)' }}>
        {message}
      </span>
    </div>
  )
}

export default function Register() {
  const { signup } = useAuth()
  const { setTheme } = useTheme()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', district: '', gender: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [nameVibe, setNameVibe] = useState('')
  const [namePicked, setNamePicked] = useState(false)
  const [mobileVibe, setMobileVibe] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (name === 'mobile' && value.replace(/\D/g, '').length >= 10) setMobileVibe(true)
  }

  function handleNameBlur() {
    if (form.name.trim().length >= 2 && !namePicked) {
      setNameVibe(NAME_VIBES[Math.floor(Math.random() * NAME_VIBES.length)])
      setNamePicked(true)
    }
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

  const filledCount = [form.name.trim(), form.email.trim(), form.mobile.trim(), form.password, form.district, form.gender].filter(Boolean).length
  const progressPct = Math.round((filledCount / 6) * 100)
  const pwStrength = getPasswordStrength(form.password)
  const districtVibe = form.district ? DISTRICT_VIBES[form.district] : ''

  return (
    <div className="max-w-sm mx-auto px-4 py-8">

      {/* Header */}
      <h1 className="font-bold text-2xl mb-4">Sign Up</h1>

      <div className="card rounded-2xl p-5">

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text2)' }}>
            <span>Profile completion</span>
            <span style={{ color: progressPct === 100 ? '#22c55e' : 'var(--accent)', fontWeight: 700 }}>
              {progressPct === 100 ? 'Ready! 🎉' : filledCount + '/6 fields'}
            </span>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: 'var(--bg2)' }}>
            <div className="h-2 rounded-full transition-all duration-500"
              style={{ width: progressPct + '%', background: progressPct === 100 ? '#22c55e' : 'var(--accent)' }} />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input type="text" name="name" required value={form.name}
              onChange={handleChange} onBlur={handleNameBlur} onFocus={scrollUp}
              placeholder="Your full name"
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
            {nameVibe && <Vibe id={nameVibe} message={nameVibe} />}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="email" required value={form.email}
              onChange={handleChange} onFocus={scrollUp}
              placeholder="your@email.com"
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
            {form.email.includes('@') && form.email.includes('.') && (
              <Vibe id="email" message="Got it! Your email is safe with us 🔒" />
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number</label>
            <input type="tel" name="mobile" value={form.mobile}
              onChange={handleChange} onFocus={scrollUp}
              placeholder="+91 XXXXXXXXXX"
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
            {mobileVibe && <Vibe id="mobile" message="Safe with us 🔐 We'll never spam or share your number!" />}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" name="password" required value={form.password}
              onChange={handleChange} onFocus={scrollUp}
              placeholder="Min. 6 characters"
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
            {pwStrength && (
              <div className="mt-2">
                <div className="w-full rounded-full h-1.5 mb-1.5" style={{ background: 'var(--bg2)' }}>
                  <div className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: pwStrength.pct + '%', background: pwStrength.color }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
              </div>
            )}
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-medium mb-1">District</label>
            <Dropdown
              value={form.district}
              onChange={v => setForm(f => ({ ...f, district: v }))}
              placeholder="Select your district"
              options={KERALA_DISTRICTS.map(d => ({ value: d, label: d }))}
            />
            {districtVibe && <Vibe id={form.district} message={districtVibe} />}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'male',   label: '👨 Male' },
                { val: 'female', label: '👩 Female' },
              ].map(g => (
                <button type="button" key={g.val}
                  onClick={() => setForm(f => ({ ...f, gender: g.val }))}
                  className="py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={{
                    borderColor: form.gender === g.val ? 'var(--accent)' : 'var(--border)',
                    background: form.gender === g.val ? 'rgba(26,157,142,0.12)' : 'var(--surface)',
                    color: form.gender === g.val ? 'var(--text)' : 'var(--text2)',
                    touchAction: 'manipulation',
                  }}>
                  {g.label}
                </button>
              ))}
            </div>
            {form.gender === 'male' && (
              <Vibe id="male" message="💼 Welcome bro! Time to make your family proud with that government job!" />
            )}
            {form.gender === 'female' && (
              <Vibe id="female" message="👑 Future officer alert! Kerala PSC needs more women toppers — you're next!" />
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold transition-all"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              fontSize: 15,
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? '✨ Creating your account...' : progressPct === 100 ? '🚀 Join HOW COME? Now!' : 'Create Account →'}
          </button>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text2)' }}>
            By creating an account, you agree to our{' '}
            <a href="/terms-and-conditions.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Terms</a>
            {' and '}
            <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Privacy Policy</a>.
          </p>
        </form>

        <p className="text-sm text-center mt-4" style={{ color: 'var(--text2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }} className="font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
