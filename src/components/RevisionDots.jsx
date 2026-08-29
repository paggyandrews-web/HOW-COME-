import { DUE_COLOR } from '../utils/paperStatus'

/**
 * Tiny 3-dot tracker for where a completed paper sits in its revision plan
 * (Profile → Settings → Revision schedule) — deliberately just dots, no
 * "1st/2nd/3rd revision" text, since this sits on an already-busy paper card
 * next to the title, status badge, and due banner. Hover/long-press for the
 * plain-English version via the title tooltip.
 *
 *   ● ● ●   all 3 stages done, comfortably ahead of schedule
 *   ● ● ○   2 done, 3rd not due yet (dashed, empty)
 *   ● ▲ ○   2 done, 3rd is due right now (solid amber)
 *   ● ● ●  (amber ring) — past the 3-stage plan, due for another round
 */
export default function RevisionDots({ revisionsDone = 0, due = false }) {
  const filled = Math.min(revisionsDone, 3)
  const dots = [0, 1, 2].map(i => {
    if (i < filled) return 'done'
    if (i === filled && due) return 'due'
    return 'upcoming'
  })
  // Already cycled through all 3 stages at least once, and it's due again —
  // flag the last dot with a ring rather than leaving all 3 looking like
  // there's nothing left to do.
  if (filled >= 3 && due) dots[2] = 'due-again'

  const stageLabel = filled >= 3
    ? (due ? 'Due for another revision round' : 'All 3 revisions done')
    : due
      ? `Revision ${filled + 1} of 3 — due now`
      : `Revision ${filled + 1} of 3 — not due yet`

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} title={stageLabel}>
      {dots.map((state, i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: state === 'done' || state === 'due-again'
            ? 'var(--accent-green)'
            : state === 'due' ? DUE_COLOR : 'transparent',
          border: state === 'upcoming' ? '1.5px dashed var(--border)' : 'none',
          boxShadow: state === 'due-again' ? `0 0 0 2px ${DUE_COLOR}` : 'none',
        }} />
      ))}
    </div>
  )
}
