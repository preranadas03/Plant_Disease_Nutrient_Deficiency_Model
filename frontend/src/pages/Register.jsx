import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Register({ onRegisterSuccess }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Core fields
  const [role, setRole] = useState('farmer')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')

  // Farmer specific fields
  const [farmName, setFarmName] = useState('')
  const [farmSize, setFarmSize] = useState('')
  const [soilType, setSoilType] = useState('Loamy')
  const [primaryCrop, setPrimaryCrop] = useState('Cotton')
  const [irrigationType, setIrrigationType] = useState('Drip')

  // Agronomist specific fields
  const [specialization, setSpecialization] = useState('Crop Pathology')
  const [experienceYears, setExperienceYears] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      role,
      username,
      password,
      full_name: fullName,
      phone,
      location
    }

    if (role === 'farmer') {
      payload.farm_name = farmName || 'Green Fields'
      payload.farm_size = farmSize ? parseFloat(farmSize) : 10.0
      payload.soil_type = soilType
      payload.primary_crop = primaryCrop
      payload.irrigation_type = irrigationType
    } else {
      payload.specialization = specialization
      payload.experience_years = experienceYears ? parseInt(experienceYears, 10) : 5
      payload.license_number = licenseNumber || 'AG-00000'
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      setLoading(false)

      if (res.ok) {
        onRegisterSuccess(data.user)
        navigate('/')
      } else {
        setError(data.error || 'Registration failed.')
      }
    } catch (err) {
      setLoading(false)
      setError('Network error. Failed to reach server.')
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card register-card">
        <div className="auth-header">
          <i className="fa-solid fa-seedling auth-icon"></i>
          <h2>Create Account</h2>
          <p>Join LeafSentry to start crop disease management</p>
        </div>

        {error && (
          <div className="auth-error-alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label>
              <i className="fa-solid fa-briefcase"></i> Select User Role
            </label>
            <div className="role-selector-wrapper">
              <div
                className={`role-btn-label ${role === 'farmer' ? 'active' : ''}`}
                onClick={() => setRole('farmer')}
              >
                <i className="fa-solid fa-tractor"></i>
                <span>Farmer</span>
              </div>
              <div
                className={`role-btn-label ${role === 'agronomist' ? 'active' : ''}`}
                onClick={() => setRole('agronomist')}
              >
                <i className="fa-solid fa-user-doctor"></i>
                <span>Agronomist</span>
              </div>
            </div>
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Pick a username"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="text"
                id="phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">General Location</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g., Texas, USA"
              required
            />
          </div>

          {/* Farmer Specific Fields */}
          {role === 'farmer' && (
            <div className="role-fields-container">
              <div className="role-section-title">
                <i className="fa-solid fa-tractor"></i> Farmer Profile Details
              </div>
              <div className="form-row-grid">
                <div className="form-group">
                  <label htmlFor="farmName">Farm Name</label>
                  <input
                    type="text"
                    id="farmName"
                    value={farmName}
                    onChange={e => setFarmName(e.target.value)}
                    placeholder="e.g. Sunny Orchards"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="farmSize">Farm Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    id="farmSize"
                    value={farmSize}
                    onChange={e => setFarmSize(e.target.value)}
                    placeholder="10.0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="soilType">Soil Classification</label>
                <select id="soilType" value={soilType} onChange={e => setSoilType(e.target.value)}>
                  <option value="Sandy">Sandy</option>
                  <option value="Clayey">Clayey</option>
                  <option value="Loamy">Loamy</option>
                  <option value="Silt">Silt</option>
                </select>
              </div>

              <div className="form-row-grid">
                <div className="form-group">
                  <label htmlFor="primaryCrop">Primary Cultivated Crop</label>
                  <select id="primaryCrop" value={primaryCrop} onChange={e => setPrimaryCrop(e.target.value)}>
                    <option value="Cotton">Cotton</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Rice">Rice</option>
                    <option value="Corn">Corn</option>
                    <option value="Soybean">Soybean</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="irrigationType">Irrigation Scheme</label>
                  <select id="irrigationType" value={irrigationType} onChange={e => setIrrigationType(e.target.value)}>
                    <option value="Drip">Drip</option>
                    <option value="Sprinkler">Sprinkler</option>
                    <option value="Flood">Flood</option>
                    <option value="Rainfed">Rainfed</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Agronomist Specific Fields */}
          {role === 'agronomist' && (
            <div className="role-fields-container">
              <div className="role-section-title">
                <i className="fa-solid fa-user-doctor"></i> Agronomist Licensing & Background
              </div>
              <div className="form-group">
                <label htmlFor="specialization">Field of Expertise</label>
                <select
                  id="specialization"
                  value={specialization}
                  onChange={e => setSpecialization(e.target.value)}
                >
                  <option value="Crop Pathology">Crop Pathology</option>
                  <option value="Soil Science">Soil Science</option>
                  <option value="Entomological Agronomy">Entomological Agronomy</option>
                  <option value="General Crop Physiology">General Crop Physiology</option>
                </select>
              </div>

              <div className="form-row-grid">
                <div className="form-group">
                  <label htmlFor="experienceYears">Years of Experience</label>
                  <input
                    type="number"
                    id="experienceYears"
                    value={experienceYears}
                    onChange={e => setExperienceYears(e.target.value)}
                    placeholder="e.g. 5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="licenseNumber">Agronomist License ID</label>
                  <input
                    type="text"
                    id="licenseNumber"
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    placeholder="e.g. AG-12345"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-large" style={{ marginTop: '10px' }} disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Register Now'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  )
}
