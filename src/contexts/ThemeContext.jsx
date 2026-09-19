import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

// Shared with the Navbar's cycle button and the Profile Settings picker, so
// both surfaces always offer the exact same set of themes.
export const themes = [
  { id: 'black', label: '⬛', title: 'Black' },
  { id: 'white', label: '⬜', title: 'White' },
  { id: 'pink', label: '🌸', title: 'Pink' },
  { id: 'wine', label: '🍷', title: 'Wine' },
  { id: 'mauve', label: '💜', title: 'Mauve' },
  { id: 'moss', label: '🌿', title: 'Moss' },
  { id: 'cyan', label: '🩵', title: 'Cyan' },
]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('cs-theme')
    if (!saved || saved === 'light' || saved === 'paper' || saved === 'dark' || saved === 'howcome') return 'black'
    return saved
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cs-theme', theme)
    // Match the mobile browser/status bar to the theme background
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'white' ? '#ffffff' : '#000000')
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
