import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Papers from './pages/Papers'
import Quiz from './pages/Quiz'
import Topics from './pages/Topics'
import Exams from './pages/Exams'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Search from './pages/Search'

/* Triggers page-enter animation on every route change */
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-enter">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/papers" element={<Papers />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
            <Navbar />
            <div style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }} className="sm:pb-0">
              <AnimatedRoutes />
            </div>
            <BottomNav />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
