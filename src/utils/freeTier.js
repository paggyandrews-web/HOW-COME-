// ── Free promo period ──
// Everyone (except paid accounts) gets full access until the cutoff below.
// After that, quizzes require isPaid on the account.
//
// This replaced a per-user 7-day trial. Simpler and safer: one shared
// deadline for everyone, no per-device/per-account clock to track or
// reset — the only real gate left is being logged in at all (enforced
// separately in Quiz.jsx), since quizzes now require an account.

const FREE_UNTIL = new Date('2026-08-16T00:00:00+05:30').getTime() // end of 15 August 2026, IST

export function isPromoActive() {
  return Date.now() < FREE_UNTIL
}

export function promoDaysLeft() {
  const msLeft = FREE_UNTIL - Date.now()
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
}

// Every user-facing mention of the end date must come from here — never
// hardcode it in a page, or it silently goes stale when the date moves.
// FREE_UNTIL is midnight *after* the last free day, so step back 1ms.
export function promoEndLabel() {
  return new Date(FREE_UNTIL - 1).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata',
  })
}

// YYYY-MM-DD / HH:MM of the deadline, for feeding <FlipClock />.
export function promoDeadlineParts() {
  const d = new Date(FREE_UNTIL)
  const iso = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Kolkata',
  }).format(d)
  return { dateStr: iso, timeStr: '00:00' }
}

// ── August 2026 daily-mock launch campaign ──
// Any daily mock paper *published* in this window stays free for EVERYONE
// (no account needed at all) until the campaign ends on 20 August — not just
// the usual 24h. Papers published outside this window keep the normal 24h
// no-signup rule (see Mock.jsx). Bump these two dates to run another campaign.
//
// The end date deliberately sits well past the expected Play Store launch
// (~10 Aug). If review slips, free access must NOT close before the app is
// actually downloadable — that would kill the funnel at the worst moment.
const MOCK_CAMPAIGN_START = new Date('2026-08-01T00:00:00+05:30').getTime()
const MOCK_CAMPAIGN_END = new Date('2026-08-21T00:00:00+05:30').getTime() // end of 20 Aug 2026, IST

export function isInMockCampaignWindow(publishedAt) {
  const t = new Date(publishedAt).getTime()
  return t >= MOCK_CAMPAIGN_START && t < MOCK_CAMPAIGN_END
}

export function mockCampaignFreeUntil() {
  return MOCK_CAMPAIGN_END
}

// Human-readable end of the campaign, for banners. Single source of truth —
// never hardcode "20 August" in a page.
export function mockCampaignEndLabel() {
  return new Date(MOCK_CAMPAIGN_END - 1).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata',
  })
}
