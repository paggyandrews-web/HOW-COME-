import { Link } from 'react-router-dom'
import { topicSlug } from '../data/topics'

// The rows that fill the space under the practice button: one per subtopic,
// each with its own right / wrong progress, opening a practice page of its own.
export default function SubtopicList({ slug, subs, pool, outcomes }) {
  const rows = subs
    .map(name => {
      const qs = pool.filter(q => q.subtopic === name)
      let right = 0, wrong = 0
      if (outcomes) qs.forEach(q => {
        const r = outcomes[q.id]
        if (r) r.correct ? right++ : wrong++
      })
      return { name, total: qs.length, right, wrong }
    })
    .filter(r => r.total > 0)

  if (!rows.length) return null

  return (
    <section className="mt-7" aria-labelledby="subtopics-heading">
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <h2 id="subtopics-heading" className="text-[15px] font-semibold">Subtopics</h2>
        <span className="text-xs" style={{ color: 'var(--text2)' }}>Practise one rule at a time</span>
      </div>
      <ul className="card rounded-2xl overflow-hidden">
        {rows.map((r, i) => {
          const done = r.right + r.wrong
          const pct = n => (r.total ? (n / r.total) * 100 : 0)
          return (
            <li key={r.name} style={i ? { borderTop: '1px solid var(--border)' } : undefined}>
              <Link
                to={'/topics/' + slug + '/' + topicSlug(r.name)}
                className="flex items-center gap-3 px-4 py-3"
                style={{ color: 'var(--text)', textDecoration: 'none', touchAction: 'manipulation' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold leading-snug">{r.name}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex flex-1 h-1.5 rounded-full overflow-hidden gap-[2px]" style={{ background: 'var(--bg2)', maxWidth: 160 }}
                      role="img" aria-label={`${r.right} right, ${r.wrong} wrong, ${r.total - done} not attempted`}>
                      <div style={{ width: pct(r.right) + '%', background: 'var(--ok)' }} />
                      <div style={{ width: pct(r.wrong) + '%', background: 'var(--bad)' }} />
                    </div>
                    <span className="text-[11px] shrink-0" style={{ color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>
                      {outcomes ? `${done}/${r.total} done` : `${r.total} questions`}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-bold rounded-full px-2 py-0.5"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                  {r.total}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--text2)' }}><path d="m9 18 6-6-6-6" /></svg>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
