import { Link } from 'react-router-dom'

/**
 * Full-page sign-up wall for pages that require an account to view at all
 * (as opposed to Quiz/Full 100, which show their list but gate the actual
 * start button). Keep copy neutral — no pricing claims, no dates.
 */
export default function SignupGate({ title, subtitle }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="p-5 rounded-xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="text-2xl mb-1">👋</div>
        <div className="font-semibold text-sm mb-2">{title}</div>
        {subtitle && (
          <div className="text-xs mb-3" style={{ color: 'var(--text2)' }}>{subtitle}</div>
        )}
        <Link to="/register"
          className="inline-block w-full py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)', textDecoration: 'none' }}>
          Sign Up →
        </Link>
        <div className="text-xs mt-2">
          <Link to="/login" style={{ color: 'var(--accent)' }}>Already have an account? Log in</Link>
        </div>
      </div>
    </div>
  )
}
