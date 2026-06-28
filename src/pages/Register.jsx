import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

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
  'Kasaragod': "🗣️ Land of 7 languages! The northernmost gem of Kerala — if you can handle 7 languages, English is easy!",
}

function getPasswordStrength(pwd) {
  if (!pwd) return null
  if (pwd.length < 6) return { label: 'Too short — needs 6+ characters ❌', color: '#ef4444', pct: 15 }
  if (pwd.length < 8)  return { label: 'Okay, but stronger is better 👍', color: '#f59e0b', pct: 45 }
  if (pwd.length < 12) return { label: 'Strong password! 💪', color: '#22c55e', pct: 75 }
  return { label: 'Fortress-level security! 🏰', color: '#1a9d8e', pct: 100 }
}

function Vibe({ message, key: k }) {
  if (!message) return null
  return (
    <div key={k} className="vibe-in flex items-start gap-1.5 mt-2 px-3 py-2 rounded-lg"
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

      {/* Hero header */}
      <div className="rounded-2xl p-6 mb-4 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)', color: 'white' }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: -20, bottom: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px' }}>
            Join HOW COME?
          </div>
          <div style={{ fontSize: 13, opacity: 0.88, marginTop: 5 }}>
            Your PSC English journey starts here
          </div>
        </div>
      </div>

      <div className="card rounded-2xl p-5">

        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text2)' }}>
            <span>Profile completion</span>
            <span style={{ color: progressPct === 100 ? '#22c55e' : 'var(--accent)', fontWeight: 700 }}>
              {progressPct === 100 ? 'Ready! 🎉' : `${filledCount}/6 fields`}
            </span>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: 'var(--bg2)' }}>
            <div className="h-2 rounded-full transition-all duration-500"
              style={{
                width: progressPct + '%',
                background: progressPct === 100 ? '#22c55e' : 'var(--accent)',
              }} />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input type="text" name="name" required value={form.name}
              onChange={handleChange} onBlur={handleNameBlur}
              placeholder="Your full name"
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
            {nameVibe && <Vibe key={nameVibe} message={nameVibe} />}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="email" required value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
            {form.email.includes('@') && form.email.includes('.') && (
              <Vibe key="email" message="Got it! Your email is safe with us 🔒" />
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number</label>
            <input type="tel" name="mobile" value={form.mobile}
              onChange={handleChange}
              placeholder="+91 XXXXXXXXXX"
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
            {mobileVibe && (
              <Vibe key="mobile" message="Safe with us 🔐 We'll never spam or share your number!" />
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" name="password" required value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
            {pwStrength && (
              <div className="mt-2">
                <div className="w-full rounded-full h-1.5 mb-1.5" style={{ background: 'var(--bg2)' }}>
                  <div className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: pwStrength.pct + '%', background: pwStrength.color }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: pwStrength.color }}>
                  {pwStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-medium mb-1">District</label>
            <select name="district" required value={form.district} onChange={handleChange}
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: form.district ? 'var(--text)' : 'var(--text2)', outline: 'none' }}>
              <option value="">Select your district</option>
              {KERALA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {districtVibe && <Vibe key={form.district} message={districtVibe} />}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'male',   label: '👨 Male',   vibe: '💙 Dark theme activated — sleek & sharp!', theme: '🌑 Black' },
                { val: 'female', label: '👩 Female', vibe: '💜 Pink theme activated — elegant & powerful!', theme: '🌸 Pink' },
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
              <Vibe key="male" message="💙 Dark theme activated for you — sleek, sharp & ready to rank!" />
            )}
            {form.gender === 'female' && (
              <Vibe key="female" message="🌸 Pink theme activated for you — elegant, powerful & unstoppable!" />
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm mt-1 transition-all"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              opacity: loading ? 0.7 : 1,
              fontSize: 15,
            }}>
            {loading ? '✨ Creating your account...' : progressPct === 100 ? '🚀 Join HOW COME? Now!' : 'Create Account →'}
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
