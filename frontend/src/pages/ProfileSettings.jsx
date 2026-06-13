import React, { useState, useEffect } from 'react'

export default function ProfileSettings({ user, onProfileUpdate, showToast }) {
  if (!user) return null

  const [fullName, setFullName] = useState(user.full_name || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [location, setLocation] = useState(user.location || '')

  // Farmer specific
  const [farmName, setFarmName] = useState(user.farm_name || '')
  const [farmSize, setFarmSize] = useState(user.farm_size || '')
  const [soilType, setSoilType] = useState(user.soil_type || 'Loamy')
  const [primaryCrop, setPrimaryCrop] = useState(user.primary_crop || 'Cotton')
  const [irrigationType, setIrrigationType] = useState(user.irrigation_type || 'Drip')

  // Agronomist specific
  const [specialization, setSpecialization] = useState(user.specialization || '')
  const [experienceYears, setExperienceYears] = useState(user.experience_years || '')
  const [licenseNumber, setLicenseNumber] = useState(user.license_number || '')

  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    const payload = {
      full_name: fullName,
      phone,
      location
    }

    if (user.role === 'farmer') {
      payload.farm_name = farmName
      payload.farm_size = parseFloat(farmSize)
      payload.soil_type = soilType
      payload.primary_crop = primaryCrop
      payload.irrigation_type = irrigationType
    } else {
      payload.specialization = specialization
      payload.experience_years = parseInt(experienceYears, 10)
      payload.license_number = licenseNumber
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      setLoading(false)

      if (res.ok) {
        onProfileUpdate(data.user)
        setSuccess(true)
        showToast('Profile settings updated successfully!', 'success')
      } else {
        showToast(data.error || 'Failed to update profile settings.', 'error')
      }
    } catch (err) {
      setLoading(false)
      showToast('Network error while updating profile.', 'error')
    }
  }

  return (
    <div className="profile-container">
      <div className="row g-4">
        {/* Profile Card Panel */}
        <div className="col-lg-4">
          <div className="profile-card card shadow-sm p-4">
          <div className="profile-header-card">
            <div className="profile-avatar-large">
              <img src={user.avatar_url || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=150'} alt="Profile Avatar" />
            </div>
            <div className="profile-meta-text">
              <h2>{user.full_name}</h2>
              <span className={`role-badge ${user.role}`}>{user.role.toUpperCase()}</span>
              {user.created_at && (
                <p className="join-date" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Member since: {user.created_at.substring(0, 10)}
                </p>
              )}
            </div>
          </div>

          <div className="profile-quick-stats">
            <div className="quick-stat-item">
              <span className="stat-lbl">Location</span>
              <span className="stat-val">
                <i className="fa-solid fa-map-location-dot" style={{ marginRight: '8px' }}></i>
                {user.location}
              </span>
            </div>
            <div className="quick-stat-item">
              <span className="stat-lbl">Contact Phone</span>
              <span className="stat-val">
                <i className="fa-solid fa-phone" style={{ marginRight: '8px' }}></i>
                {user.phone || 'Not Provided'}
              </span>
            </div>
          </div>
        </div>
        </div>

        {/* Edit Profile Form */}
        <div className="col-lg-8">
          <div className="profile-form-card card shadow-sm p-4">
            <div className="card-header border-bottom bg-transparent p-0 pb-3 mb-3">
            <h3>
              <i className="fa-solid fa-user-gear"></i> Edit Profile Information
            </h3>
            <p>Update your account details and agronomic settings.</p>
          </div>

          {success && (
            <div className="profile-success-alert">
              <i className="fa-solid fa-circle-check"></i>
              <span>Profile settings updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="auth-form">
            <div className="form-group mb-3">
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                className="form-control"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6 form-group">
                <label htmlFor="phone">Phone Number</label>
                <input type="text" id="phone" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>

              <div className="col-md-6 form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  className="form-control"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Farmer settings */}
            {user.role === 'farmer' && (
              <div className="profile-sub-section mt-4 pt-3 border-top">
                <h3 className="role-section-title mb-3">
                  <i className="fa-solid fa-seedling"></i> Farm Telemetry Settings
                </h3>

                <div className="form-group mb-3">
                  <label htmlFor="farm_name">Farm Name</label>
                  <input
                    type="text"
                    id="farm_name"
                    className="form-control"
                    value={farmName}
                    onChange={e => setFarmName(e.target.value)}
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6 form-group">
                    <label htmlFor="farm_size">Farm Size (Acres)</label>
                    <input
                      type="number"
                      id="farm_size"
                      step="0.1"
                      className="form-control"
                      value={farmSize}
                      onChange={e => setFarmSize(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6 form-group">
                    <label htmlFor="soil_type">Soil Matrix Type</label>
                    <select
                      id="soil_type"
                      className="form-select"
                      value={soilType}
                      onChange={e => setSoilType(e.target.value)}
                    >
                      <option value="Loamy">Loamy (Recommended)</option>
                      <option value="Sandy">Sandy Soil</option>
                      <option value="Clay">Clay Soil</option>
                      <option value="Black Cotton">Black Cotton Soil</option>
                      <option value="Silty">Silty Soil</option>
                    </select>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6 form-group">
                    <label htmlFor="primary_crop">Primary Crop</label>
                    <input
                      type="text"
                      id="primary_crop"
                      className="form-control"
                      value={primaryCrop}
                      onChange={e => setPrimaryCrop(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6 form-group">
                    <label htmlFor="irrigation_type">Irrigation Method</label>
                    <select
                      id="irrigation_type"
                      className="form-select"
                      value={irrigationType}
                      onChange={e => setIrrigationType(e.target.value)}
                    >
                      <option value="Drip">Drip Irrigation</option>
                      <option value="Sprinkler">Center Pivot / Sprinkler</option>
                      <option value="Furrow">Furrow Irrigation</option>
                      <option value="Rain-fed">Rain-fed</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Agronomist settings */}
            {user.role === 'agronomist' && (
              <div className="profile-sub-section mt-4 pt-3 border-top">
                <h3 className="role-section-title mb-3">
                  <i className="fa-solid fa-graduation-cap"></i> Agronomist Credentials
                </h3>

                <div className="form-group mb-3">
                  <label htmlFor="specialization">Primary Specialization Area</label>
                  <input
                    type="text"
                    id="specialization"
                    className="form-control"
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6 form-group">
                    <label htmlFor="experience_years">Years of Experience</label>
                    <input
                      type="number"
                      id="experience_years"
                      className="form-control"
                      value={experienceYears}
                      onChange={e => setExperienceYears(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6 form-group">
                    <label htmlFor="license_number">License / Registration ID</label>
                    <input
                      type="text"
                      id="license_number"
                      className="form-control"
                      value={licenseNumber}
                      onChange={e => setLicenseNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-success w-100 btn-lg" style={{ marginTop: '15px' }} disabled={loading}>
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i> Save Profile Settings
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  )
}
