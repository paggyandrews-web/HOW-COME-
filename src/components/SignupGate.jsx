import { Link, useLocation } from 'react-router-dom'

/**
 * Full-page sign-up wall for pages that require an account to view at all
 * (as opposed to Quiz/Full 100, which show their list but gate the actual
 * start button). Keep copy neutral — no pricing claims, no dates.
 */
export default function SignupGate({ title, subtitle }) {
  // Remember the page (incl. ?paper=... from a shared link) so that after
  // signing up / logging in the person lands back on it, not on Home.
  const location = useLocation()
  const from = location.pathname + location.search
  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="card p-6 rounded-[28px] text-center relative overflow-hidden"
        style={{ background: 'radial-gradient(120% 80% at 50% 0%, var(--accent-soft) 0%, transparent 60%), var(--card)' }}>
        <div className="flex justify-center gap-1.5 mb-4" aria-hidden="true">
          {['A', 'B', 'C', 'D'].map(l => (
            <span key={l} className="omr" data-state={l === 'B' ? 'picked' : undefined}>{l}</span>
          ))}
        </div>
        <div className="display text-2xl mb-2">{title}</div>
        {subtitle && (
          <div className="text-sm mb-5 leading-snug" style={{ color: 'var(--text2)' }}>{subtitle}</div>
        )}
        <Link to="/register" state={{ from }}
          className="btn-solid inline-flex items-center justify-center w-full h-11 rounded-full font-semibold text-[15px]"
          style={{ textDecoration: 'none' }}>
          Sign up
        </Link>
        <div className="text-sm mt-3">
          <Link to="/login" state={{ from }} style={{ color: 'var(--accent)' }}>Already have an account? Log in</Link>
        </div>
      </div>
    </div>
  )
}
