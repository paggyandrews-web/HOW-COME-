/**
 * An answer letter drawn like a bubble on a PSC OMR sheet.
 *
 * state: undefined (empty ring) | 'picked' | 'right' | 'wrong' | 'muted'
 * Styling lives in index.css (.omr) so every theme picks it up.
 */
export default function OmrBubble({ letter, state, small = false }) {
  return (
    <span
      className={small ? 'omr omr-sm' : 'omr'}
      data-state={state || undefined}
      aria-hidden="true"
    >
      {letter}
    </span>
  )
}

/** Maps the usual quiz flags onto a bubble state. */
export function bubbleState({ chosen, isRight, revealed }) {
  if (revealed) {
    if (isRight) return 'right'
    if (chosen) return 'wrong'
    return 'muted'
  }
  return chosen ? 'picked' : undefined
}
