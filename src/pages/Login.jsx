import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { LogIn, ArrowLeft, Layers, Sun, Moon } from 'lucide-react'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState('hero') // 'hero', 'login', 'signup'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDark, setIsDark] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check initial preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const savedTheme = localStorage.getItem('theme')
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.setAttribute('data-theme', 'dark')
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

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Check your email for the confirmation link!')
      }
      navigate('/')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetView = () => {
    setView('hero')
    setError(null)
    setEmail('')
    setPassword('')
  }

  return (
    <div className="landing-container">
      <button onClick={toggleTheme} className="theme-toggle-btn">
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="landing-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="landing-content">
        {view === 'hero' ? (
          <div className="hero-section">
            <div className="hero-logo">
              <Layers size={48} className="hero-icon" />
              <h1>WorkNest</h1>
            </div>
            <p className="hero-subtitle">
              The modern way to manage your projects, coordinate tasks, and collaborate seamlessly with your team.
            </p>
            <div className="hero-actions">
              <button 
                className="btn btn-primary hero-btn"
                onClick={() => setView('login')}
              >
                Log In
              </button>
              <button 
                className="btn hero-btn-outline"
                onClick={() => setView('signup')}
              >
                Create an Account
              </button>
            </div>
          </div>
        ) : (
          <div className="login-card card glass-card">
            <button className="back-btn" onClick={resetView}>
              <ArrowLeft size={20} />
            </button>
            <div className="login-header">
              <LogIn size={32} className="login-icon" />
              <h2>{view === 'login' ? 'Welcome Back' : 'Join WorkNest'}</h2>
              <p>{view === 'login' ? 'Sign in to your account.' : 'Create your account to get started.'}</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleAuth} className="login-form">
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  className="input" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  className="input" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? 'Processing...' : (view === 'login' ? 'Sign In' : 'Sign Up')}
              </button>
            </form>

            <div className="login-footer">
              <p>
                {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button className="text-btn" onClick={() => setView(view === 'login' ? 'signup' : 'login')}>
                  {view === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
