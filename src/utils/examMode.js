// ── Exam mode display ──────────────────────────────────────────────────
//
// PSC notifications use three forms, and we mirror them faithfully:
//   'OMR'           — confirmed OMR sheet exam
//   'Online'        — confirmed online exam
//   'Online / OMR'  — PSC has NOT decided yet. Their notifications literally
//                     read "objective type OMR sheet or online examination".
//
// We must never collapse the third case into one mode. Guessing would put
// wrong information about a government exam in front of a candidate. Instead
// we show it as unconfirmed and point them at the official notification.

export function formatExamMode(mode) {
  const m = (mode || '').trim().toLowerCase()

  if (m === 'omr') {
    return { label: 'OMR', confirmed: true, note: null }
  }
  if (m === 'online') {
    return { label: 'Online', confirmed: true, note: null }
  }
  if (m === 'online / omr' || m === 'omr / online' || m === 'online/omr') {
    return {
      label: 'OMR or Online',
      confirmed: false,
      note: 'PSC has not confirmed the mode yet — check your hall ticket.',
    }
  }
  // Unknown/blank — show whatever PSC gave us rather than inventing a mode.
  return { label: mode || 'Not specified', confirmed: !!mode, note: null }
}
