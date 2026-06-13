import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Toast from './components/Toast'
import Sidebar from './components/Sidebar'
import ChatbotWidget from './components/ChatbotWidget'
import Login from './pages/Login'
import Register from './pages/Register'
import FarmerDashboard from './pages/FarmerDashboard'
import HistoryAnalytics from './pages/HistoryAnalytics'
import ProfileSettings from './pages/ProfileSettings'
import AgronomistDashboard from './pages/AgronomistDashboard'
import FarmerInspect from './pages/FarmerInspect'
import ConsultationHub from './pages/ConsultationHub'

function App() {
  const [user, setUser] = useState(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/session-check')
      if (res.ok) {
        const data = await res.json()
        if (data.logged_in) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      }
    } catch (err) {
      console.error('Session check failed:', err)
    } finally {
      setAuthChecking(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      setUser(null)
      showToast('Logged out successfully', 'success')
    } catch (err) {
      showToast('Logout request failed', 'error')
    }
  }

  if (authChecking) {
    return (
      <div className="auth-loading-screen" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)'
      }}>
        <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary-color)', marginBottom: '16px' }}></i>
        <h4>Loading LeafSentry AI Platform...</h4>
      </div>
    )
  }

  return (
    <Router>
      <div className="app-container">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              user ? <Navigate to="/" replace /> : <Login onLoginSuccess={setUser} showToast={showToast} />
            }
          />
          <Route
            path="/register"
            element={
              user ? <Navigate to="/" replace /> : <Register onRegisterSuccess={setUser} showToast={showToast} />
            }
          />

          {/* Protected Area Layout */}
          <Route
            path="/*"
            element={
              user ? (
                <div className="portal-layout">
                  <Sidebar user={user} onLogout={handleLogout} />
                  
                  <main className="main-content">
                    <div className="main-content-header">
                      <h1 className="page-title">
                        {/* Page titles dynamically based on paths */}
                        <Routes>
                          <Route path="/" element={user.role === 'farmer' ? "Farmer Dashboard" : "Agronomist Portal"} />
                          <Route path="/history" element="Analytics & Historical Logs" />
                          <Route path="/consultation" element="Agronomist Consultations" />
                          <Route path="/agronomist/farmer/:farmerId" element="Farmer Case Review" />
                          <Route path="/profile" element="My Profile Settings" />
                        </Routes>
                      </h1>
                      <div className="header-user-status">
                        <span>Active Connection</span>
                        <div className="connection-indicator"></div>
                      </div>
                    </div>

                    <div className="main-content-inner">
                      <Routes>
                        <Route
                          path="/"
                          element={
                            user.role === 'farmer' ? (
                              <FarmerDashboard showToast={showToast} />
                            ) : (
                              <AgronomistDashboard showToast={showToast} />
                            )
                          }
                        />
                        <Route
                          path="/history"
                          element={<HistoryAnalytics user={user} showToast={showToast} />}
                        />
                        <Route
                          path="/consultation"
                          element={
                            user.role === 'farmer' ? (
                              <ConsultationHub showToast={showToast} />
                            ) : (
                              <Navigate to="/" replace />
                            )
                          }
                        />
                        <Route
                          path="/agronomist/farmer/:farmerId"
                          element={
                            user.role === 'agronomist' ? (
                              <FarmerInspect showToast={showToast} />
                            ) : (
                              <Navigate to="/" replace />
                            )
                          }
                        />
                        <Route
                          path="/profile"
                          element={
                            <ProfileSettings
                              user={user}
                              onProfileUpdate={setUser}
                              showToast={showToast}
                            />
                          }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </div>
                  </main>

                  {/* Leafy AI Floating Widget (Farmers only) */}
                  <ChatbotWidget user={user} />
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
