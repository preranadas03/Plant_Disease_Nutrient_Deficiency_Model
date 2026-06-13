import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function AgronomistDashboard({ showToast }) {
  const [data, setData] = useState({ farmers: [], total_farmers: 0, unreviewed_diagnoses: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/agronomist/dashboard')
        if (!res.ok) {
          throw new Error('Failed to load dashboard statistics.')
        }
        const stats = await res.json()
        setData(stats)
        setLoading(false)
      } catch (err) {
        console.error(err)
        showToast('Error loading agronomist dashboard telemetry.', 'error')
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  return (
    <div>
      {/* Agronomist Stats Row */}
      <div className="agronomy-stats-row">
        <div className="agronomy-stat-card card">
          <div className="stat-card-icon primary-color">
            <i className="fa-solid fa-user-group"></i>
          </div>
          <div className="stat-card-info">
            <h3>{data.total_farmers}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Registered Farmers</p>
          </div>
        </div>

        <div className="agronomy-stat-card card">
          <div className="stat-card-icon warning-color">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div className="stat-card-info">
            <h3>{data.unreviewed_diagnoses}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Pending Diagnostics Reviews</p>
          </div>
        </div>

        <div className="agronomy-stat-card card">
          <div className="stat-card-icon success-color">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div className="stat-card-info">
            <h3>Active</h3>
            <p style={{ color: 'var(--text-secondary)' }}>System Telemetry & YOLOv8</p>
          </div>
        </div>
      </div>

      {/* Farmers Section Header */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
          <i className="fa-solid fa-tractor" style={{ marginRight: '10px', color: 'var(--primary-light)' }}></i>
          Farmer Directory & Advisory Log
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Select a farmer profile below to inspect their leaf upload history, issue treatment recommendations, or reply to consult requests.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Loading farmer profiles...
        </div>
      ) : data.farmers.length > 0 ? (
        <div className="farmers-grid">
          {data.farmers.map((farmer) => (
            <div key={farmer.id} className="farmer-summary-card">
              <div className="farmer-card-header">
                <img
                  src={farmer.avatar_url || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=150'}
                  alt={farmer.full_name}
                  className="farmer-avatar"
                />
                <div className="farmer-title-info">
                  <h4>{farmer.full_name}</h4>
                  <span>@{farmer.username} | {farmer.location}</span>
                </div>
              </div>

              <div className="farmer-card-details">
                <div className="detail-row">
                  <span className="lbl">Farm Name:</span>
                  <span className="val">{farmer.farm_name}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Farm Size:</span>
                  <span className="val">{farmer.farm_size} Acres</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Soil Class:</span>
                  <span className="val badge-soil">{farmer.soil_type}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Primary Crop:</span>
                  <span className="val">{farmer.primary_crop}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Irrigation:</span>
                  <span className="val">{farmer.irrigation_type}</span>
                </div>
              </div>

              <div className="farmer-card-actions">
                <Link to={`/agronomist/farmer/${farmer.id}`} className="btn btn-primary btn-small">
                  <i className="fa-solid fa-user-doctor"></i> Review & Consult
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <i className="fa-solid fa-box-open" style={{ fontSize: '3rem', color: 'var(--border-color)', marginBottom: '16px' }}></i>
          <h4>No Registered Farmers Found</h4>
          <p style={{ color: 'var(--text-secondary)' }}>Once farmers register on LeafSentry, their telemetry cards will display here.</p>
        </div>
      )}
    </div>
  )
}
