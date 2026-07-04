import { Link } from 'react-router-dom'
import { useBookmarks } from '../hooks/useBookmarks'
import questions from '../data/questions.json'

/* ── Saved questions ─────────────────────────────────────────────── */
function QuestionsTab() {
  const { bookmarks, toggle } = useBookmarks()
  const saved = questions.filter(q => bookmarks.includes(q.id))

  if (saved.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-5xl mb-4">❓</div>
        <p className="font-semibold text-base mb-2">No questions bookmarked yet</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
          Tap the bookmark icon on any question during a quiz to save it here.
        </p>
        <Link to="/quiz" className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
          Start a Quiz →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Quick-quiz all saved questions */}
      {saved.length > 1 && (
        <Link to="/quiz?mode=saved"
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
          ⚡ Quiz all {saved.length} bookmarked questions
        </Link>
      )}

      {saved.map(q => (
        <div key={q.id} className="card rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              {q.topic && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(26,157,142,0.12)', color: 'var(--accent)', border: '1px solid rgba(26,157,142,0.2)' }}>
                  {q.topic}
                </span>
              )}
              <span className="text-xs" style={{ color: 'var(--text2)' }}>
                {q.paperId} · Q{q.questionNumber}
              </span>
            </div>
            {/* Remove bookmark */}
            <button onClick={() => toggle(q.id)}
              title="Remove bookmark"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, touchAction: 'manipulation' }}>
              <svg width="18" height="18" viewBox="0 0 24 24"
                fill="var(--accent)" stroke="var(--accent)" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text)' }}>
            {q.questionText?.replace(/\n/g, ' ').slice(0, 120)}{q.questionText?.length > 120 ? '…' : ''}
          </p>
          {/* Options hint */}
          {q.optionA && (
            <div className="grid grid-cols-2 gap-1 text-xs mb-3" style={{ color: 'var(--text2)' }}>
              {[['A', q.optionA], ['B', q.optionB], ['C', q.optionC], ['D', q.optionD]]
                .filter(([, v]) => v)
                .map(([letter, text]) => (
                  <div key={letter} style={{
                    color: letter === q.correctAnswer ? 'var(--accent)' : 'var(--text2)',
                    fontWeight: letter === q.correctAnswer ? 600 : 400,
                  }}>
                    ({letter}) {text?.slice(0, 28)}{text?.length > 28 ? '…' : ''}
                  </div>
                ))}
            </div>
          )}
          <Link to={`/quiz?questionId=${q.id}`}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold inline-block"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            View with Explanation →
          </Link>
        </div>
      ))}
    </div>
  )
}

/* ══ Bookmarks Page ═════════════════════════════════════════════════ */
export default function Bookmarks() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <h1 className="font-bold text-xl mb-4">Saved Questions</h1>
      <QuestionsTab />
    </div>
  )
}
