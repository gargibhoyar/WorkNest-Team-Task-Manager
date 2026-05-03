import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { LogOut, LayoutDashboard, Sun, Moon } from 'lucide-react'
import './Layout.css'

export default function Layout({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check initial preference from localStorage or system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const savedTheme = localStorage.getItem('theme')
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [])

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev
      if (next) {
        document.documentElement.setAttribute('data-theme', 'dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.removeAttribute('data-theme')
        localStorage.setItem('theme', 'light')
      }
      return next
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="layout-container">
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <LayoutDashboard className="icon" />
          <h2>WorkNest</h2>
        </Link>
        <div className="nav-actions">
          <button onClick={toggleTheme} className="btn" style={{ padding: '0.5rem' }}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <span className="user-email">{user?.email}</span>
          <button onClick={handleLogout} className="btn btn-outline">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
