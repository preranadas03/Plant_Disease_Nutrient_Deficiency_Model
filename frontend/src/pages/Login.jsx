import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e, uName = null, pwd = null) => {
    if (e) e.preventDefault()
    
    const u = uName || username
    const p = pwd || password

    if (!u.trim() || !p.trim()) {
      setError('Please enter both username and password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      })

      const data = await res.json()
      setLoading(false)

      if (res.ok) {
        onLoginSuccess(data.user)
        navigate('/')
      } else {
        setError(data.error || 'Login failed. Please check credentials.')
      }
    } catch (err) {
      setLoading(false)
      setError('Network error. Failed to reach server.')
    }
  }

  const handleDemoLogin = (role) => {
    if (role === 'farmer') {
      setUsername('farmer1')
      setPassword('password')
      handleLogin(null, 'farmer1', 'password')
    } else {
      setUsername('agronomist1')
      setPassword('password')
      handleLogin(null, 'agronomist1', 'password')
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <i className="fa-solid fa-leaf auth-icon"></i>
          <h2>Welcome back!</h2>
          <p>Sign in to your LeafSentry diagnostics account</p>
        </div>

        {error && (
          <div className="auth-error-alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">
              <i className="fa-solid fa-circle-user"></i> Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <i className="fa-solid fa-lock"></i> Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-large" style={{ marginTop: '10px' }} disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Log In'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR QUICK DEMO LOGIN</span>
        </div>

        <div className="demo-login-grid">
          <div className="demo-login-card" onClick={() => handleDemoLogin('farmer')}>
            <div className="demo-avatar-wrapper">
              <img
                src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=150"
                alt="Farmer Avatar"
              />
            </div>
            <div className="demo-text">
              <h4>Farmer Portal</h4>
              <span>Username: farmer1 (pass: password)</span>
            </div>
          </div>

          <div className="demo-login-card" onClick={() => handleDemoLogin('agronomist')}>
            <div className="demo-avatar-wrapper">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150"
                alt="Agronomist Avatar"
              />
            </div>
            <div className="demo-text">
              <h4>Agronomist Portal</h4>
              <span>Username: agronomist1 (pass: password)</span>
            </div>
          </div>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one here</Link>
        </div>
      </div>
    </div>
  )
}
