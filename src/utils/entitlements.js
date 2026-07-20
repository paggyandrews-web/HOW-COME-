// ── Plans & entitlements ───────────────────────────────────────────────
//
// Plans
//   'free'     — no paid access (still gets everything while the promo runs)
//   'pack100'  — ₹399 lifetime. The 100 papers frozen in pack100.json ONLY.
//                No mock tests, and no papers added after the snapshot.
//   'full'     — everything, including future papers and mock tests.
//
// The pack100 entitlement is deliberately a FROZEN ID LIST, not "the first
// 100 papers". Deriving it from order would silently change what someone
// bought the moment a paper is added, removed, or re-sorted.
//
// NOTE: this is a client-side gate. questions.json ships in the bundle, so a
// determined user can read locked content via devtools. Acceptable at this
// price point; move questions server-side if that ever stops being true.

import pack100 from '../data/pack100.json'
import { isPromoActive } from './freeTier'

export const PLAN_FREE = 'free'
export const PLAN_PACK100 = 'pack100'
export const PLAN_FULL = 'full'

export const PACK100_PRICE_INR = pack100.priceInr
export const PACK100_PAPER_COUNT = pack100.paperCount

const PACK100_IDS = new Set(pack100.paperIds)

/** Resolve a user's plan, honouring legacy `isPaid: true` accounts as full. */
export function getPlan(profile) {
  if (!profile) return PLAN_FREE
  if (profile.plan) return profile.plan
  if (profile.isPaid) return PLAN_FULL
  return PLAN_FREE
}

export function isInPack100(paperId) {
  return PACK100_IDS.has(paperId)
}

/** Has the user bought anything at all? (Used for the promo-expiry lock.) */
export function hasPaidPlan(profile) {
  const plan = getPlan(profile)
  return plan === PLAN_FULL || plan === PLAN_PACK100
}

/** Can this user open questions from a given paper? */
export function canAccessPaper(profile, paperId) {
  if (isPromoActive()) return true
  const plan = getPlan(profile)
  if (plan === PLAN_FULL) return true
  if (plan === PLAN_PACK100) return isInPack100(paperId)
  return false
}

/** Mock/model tests are excluded from Pack 100. */
export function canAccessMock(profile) {
  if (isPromoActive()) return true
  return getPlan(profile) === PLAN_FULL
}

/** Why a paper is locked — drives the upgrade copy shown to the user. */
export function paperLockReason(profile, paperId) {
  if (canAccessPaper(profile, paperId)) return null
  return getPlan(profile) === PLAN_PACK100 ? 'not-in-pack' : 'no-plan'
}
