// Which animation plays on a correct answer (Profile → Settings →
// Celebration). Defaults to Christmas.

const STORAGE_KEY = 'cs-celebration'

export const CELEBRATION_OPTIONS = [
  { id: 'christmas', label: '🎄 Christmas', title: 'One cracker that bursts into baubles, stars, candy canes and gifts,' },
  { id: 'diwali', label: '🎆 Diwali', title: 'Colourful crackers that burst into sparks' },
  { id: 'onam', label: '🌸 Onam', title: 'Crackers that open like a pookalam, with petals drifting down' },
  { id: 'vishu', label: '🌼 Vishu', title: 'Golden crackers with kani-konna flowers falling' },
  { id: 'confetti', label: '🎉 Confetti', title: 'Classic paper confetti' },
]

const IDS = CELEBRATION_OPTIONS.map(o => o.id)

export function getCelebrationPref() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return IDS.includes(saved) ? saved : 'christmas'
  } catch { return 'christmas' }
}

export function setCelebrationPref(pref) {
  try { localStorage.setItem(STORAGE_KEY, pref) } catch {}
}
