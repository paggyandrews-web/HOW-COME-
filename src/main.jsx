import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Hide splash screen once React has mounted
requestAnimationFrame(() => {
  const splash = document.getElementById('splash')
  if (splash) {
    splash.classList.add('hide')
    setTimeout(() => splash.remove(), 450)
  }
})

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
