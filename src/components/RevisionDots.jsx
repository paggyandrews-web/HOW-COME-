import { DUE_COLOR } from '../utils/paperStatus'

/**
 * Tiny dot tracker for where a completed paper sits in its revision plan
 * (Profile → Settings → Revision schedule) — deliberately just dots, no
 * "1st/2nd/3rd revision" text, since this sits on an already-busy paper card
 * next to the title, status badge, and due banner. Hover/long-press for the
 * plain-English version via the title tooltip.
 *
 * totalStages reflects how many revisions are actually configured (1, 2, or
 * 3 — someone who only wants 1 or 2 revisions sets the rest to "Off" in
 * Settings), so this only ever draws as many dots as could possibly apply —
 * never a 3rd dot that can never be filled.
 *
 *   ● ● ●   all stages done — that's the whole signal once you get here,
 *           whether or not another maintenance round is due (the due
 *           banner elsewhere on the card already says so)
 *   ● ● ○   2 of 3 done, next not due yet (dashed, empty)
 *   ● ▲ ○   2 of 3 done, next is due right now (solid amber)
 */
export default function RevisionDots({ revisionsDone = 0, due = false, totalStages = 3 }) {
  if (totalStages <= 0) return null

  const filled = Math.min(revisionsDone, totalStages)
  const dots = Array.from({ length: totalStages }, (_, i) => {
    if (i < filled) return 'done'
    if (i === filled && due) return 'due'
    return 'upcoming'
  })

  const stageLabel = filled >= totalStages
    ? `All ${totalStages} revision${totalStages > 1 ? 's' : ''} done`
    : due
      ? `Revision ${filled + 1} of ${totalStages} — due now`
      : `Revision ${filled + 1} of ${totalStages} — not due yet`

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} title={stageLabel}>
      {dots.map((state, i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: state === 'done' ? 'var(--accent-green)' : state === 'due' ? DUE_COLOR : 'transparent',
          border: state === 'upcoming' ? '1.5px dashed var(--border)' : 'none',
        }} />
      ))}
    </div>
  )
}
