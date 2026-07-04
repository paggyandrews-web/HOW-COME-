// ── Free promo period ──
// Everyone (except paid accounts) gets full access until the cutoff below.
// After that, quizzes require isPaid on the account.
//
// This replaced a per-user 7-day trial. Simpler and safer: one shared
// deadline for everyone, no per-device/per-account clock to track or
// reset — the only real gate left is being logged in at all (enforced
// separately in Quiz.jsx), since quizzes now require an account.

const FREE_UNTIL = new Date('2026-08-01T00:00:00+05:30').getTime() // end of 31 July 2026, IST

export function isPromoActive() {
  return Date.now() < FREE_UNTIL
}

export function promoDaysLeft() {
  const msLeft = FREE_UNTIL - Date.now()
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
}
