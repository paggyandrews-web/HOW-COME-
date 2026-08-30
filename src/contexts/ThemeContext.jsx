import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

// Shared with the Navbar's cycle button and the Profile Settings picker, so
// both surfaces always offer the exact same set of themes.
export const themes = [
  { id: 'black', label: '⬛', title: 'Black' },
  { id: 'pink', label: '🌸', title: 'Pink' },
  { id: 'wine', label: '🍷', title: 'Wine' },
  { id: 'crimson', label: '🔴', title: 'Crimson' },
  { id: 'mauve', label: '💜', title: 'Mauve' },
  { id: 'moss', label: '🌿', title: 'Moss' },
  { id: 'nocturne', label: '🌙', title: 'Nocturne' },
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
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
