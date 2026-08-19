// Which language(s) to show per paper on the Full 100 list (Profile →
// Settings → Full 100 language). Purely a display filter — it never touches
// archived data, just which language row(s) render for each paper group.
// Defaults to "both", matching the app's previous always-both behavior.

const STORAGE_KEY = 'cs-full100-lang'

export const FULL100_LANG_OPTIONS = [
  { id: 'both', label: 'Both', title: 'Show both languages' },
  { id: 'english', label: 'English only', title: 'Only show the English rendering' },
  { id: 'malayalam', label: 'മലയാളം only', title: 'Only show the Malayalam original' },
]

export function getFull100LangPref() {
  if (typeof localStorage === 'undefined') return 'both'
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'english' || saved === 'malayalam' ? saved : 'both'
}

export function setFull100LangPref(pref) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, pref)
}
