import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar({ user, onLogout }) {
  const location = useLocation()
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  if (!user) return null

  return (
    <aside className="sidebar" style={{ overflowY: 'auto' }}>
      <div className="sidebar-brand">
        <i className="fa-solid fa-leaf brand-icon"></i>
        <div className="brand-text">
          <h2>LeafSentry</h2>
          <span>Agri-AI Diagnostic</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {user.role === 'farmer' ? (
          <>
            <Link
              to="/"
              className={`menu-item ${location.pathname === '/' ? 'active' : ''}`}
              id="nav-dashboard"
            >
              <i className="fa-solid fa-gauge-high"></i>
              <span>Dashboard</span>
            </Link>
            <Link
              to="/history"
              className={`menu-item ${location.pathname === '/history' ? 'active' : ''}`}
              id="nav-history"
            >
              <i className="fa-solid fa-chart-line"></i>
              <span>History & Analytics</span>
            </Link>
            <Link
              to="/consultation"
              className={`menu-item ${location.pathname === '/consultation' ? 'active' : ''}`}
              id="nav-consultation"
            >
              <i className="fa-solid fa-user-doctor"></i>
              <span>Consultation Hub</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/"
              className={`menu-item ${location.pathname === '/' || location.pathname.startsWith('/agronomist') ? 'active' : ''}`}
              id="nav-agronomy"
            >
              <i className="fa-solid fa-user-group"></i>
              <span>Agronomist Portal</span>
            </Link>
            <Link
              to="/history"
              className={`menu-item ${location.pathname === '/history' ? 'active' : ''}`}
              id="nav-history"
            >
              <i className="fa-solid fa-chart-line"></i>
              <span>Telemetry History</span>
            </Link>
          </>
        )}
        <Link
          to="/profile"
          className={`menu-item ${location.pathname === '/profile' ? 'active' : ''}`}
          id="nav-profile"
        >
          <i className="fa-solid fa-user-gear"></i>
          <span>My Profile</span>
        </Link>
      </nav>

      {/* Quick Weather Panel (Farmers only) */}
      {user.role === 'farmer' && (
        <div className="weather-panel-sidebar">
          <div className="weather-header">
            <i className="fa-solid fa-cloud-sun weather-icon-main"></i>
            <h4>Crop Weather</h4>
          </div>
          <div className="weather-body">
            <p className="temp">29°C</p>
            <p className="desc" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Scattered Clouds</p>
            <small className="action-tip">Optimal spray humidity (62%)</small>
          </div>
        </div>
      )}

      {/* Theme Toggle & Logout in Sidebar Footer */}
      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle dark and light theme"
          style={{ width: '100%' }}
        >
          <i className="fa-solid fa-moon moon-icon"></i>
          <i className="fa-solid fa-sun sun-icon"></i>
          <span className="theme-text">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        <button
          onClick={onLogout}
          className="menu-item logout-btn"
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.9rem',
            padding: '12px 16px',
            borderRadius: '10px',
            transition: 'all 0.3s ease'
          }}
        >
          <i className="fa-solid fa-right-from-bracket" style={{ color: '#e57373' }}></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
