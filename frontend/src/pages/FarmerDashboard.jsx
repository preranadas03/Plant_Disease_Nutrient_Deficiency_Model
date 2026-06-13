import React, { useState, useRef } from 'react'

export default function FarmerDashboard({ showToast }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid leaf image file.', 'error')
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResults(null)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleRemovePreview = (e) => {
    e.stopPropagation()
    setSelectedFile(null)
    setPreviewUrl('')
    setResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRunDiagnosis = async () => {
    if (!selectedFile) return
    setLoading(true)
    setResults(null)

    const formData = new FormData()
    formData.append('image', selectedFile)

    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        throw new Error('Analysis request failed.')
      }

      const data = await res.json()
      setLoading(false)

      if (data.error) {
        showToast(data.error, 'error')
      } else {
        setResults(data)
        showToast('Diagnosis Complete!', 'success')
      }
    } catch (err) {
      setLoading(false)
      showToast('Error connecting to inference backend. Please try again.', 'error')
      console.error(err)
    }
  }

  const referenceCatalog = [
    {
      title: 'Healthy Leaf',
      deficiency: 'No Deficiency',
      desc: 'Uniformly green color, natural veins, clear margins, showing no symptoms of physiological stress.',
      img: '/static/images/healthy.png',
      badgeClass: 'healthy-badge'
    },
    {
      title: 'Bacterial Blight',
      deficiency: 'Potassium (K) Stress',
      desc: 'Angular water-soaked lesions that turn dark brown. Often resembles severe potassium deficiency.',
      img: '/static/images/blight.png',
      badgeClass: 'warning-badge'
    },
    {
      title: 'Leaf Redding',
      deficiency: 'Phosphorus (P) Stress',
      desc: 'Leaf margins turn purplish-red while main veins stay green. Typically flags phosphorus deficiency.',
      img: '/static/images/redding.png',
      badgeClass: 'warning-badge'
    },
    {
      title: 'Leaf Variegation',
      deficiency: 'Magnesium (Mg) Stress',
      desc: 'Interveinal chlorosis, yellowing spots or white stripes, signaling magnesium uptake deficiency.',
      img: '/static/images/variegation.png',
      badgeClass: 'warning-badge'
    }
  ]

  return (
    <div className="row g-4">
      {/* Left Column: Diagnostic Interface */}
      <div className="col-lg-8">
        <div className="diagnostic-card card shadow-sm p-4">
          <div className="card-header">
            <h3>
              <i className="fa-solid fa-microscope"></i> Live Leaf Diagnosis
            </h3>
            <p>
              Upload a cotton leaf image to run real-time YOLOv8 disease classification and nutrient mapping.
            </p>
          </div>

          {/* Dropzone area */}
          <div
            className={`upload-zone ${dragActive ? 'dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files[0])}
              accept="image/*"
              style={{ display: 'none' }}
            />

            {!previewUrl ? (
              <div className="upload-zone-content">
                <i className="fa-solid fa-cloud-arrow-up upload-icon"></i>
                <p className="upload-text">
                  Drag & drop your leaf image here, or <span>browse files</span>
                </p>
                <span className="file-limits">Supports JPG, JPEG, PNG (max. 16MB)</span>
              </div>
            ) : (
              <div className="preview-container">
                <img src={previewUrl} alt="Leaf Preview" />
                <button type="button" className="remove-preview-btn" onClick={handleRemovePreview}>
                  <i className="fa-solid fa-trash-can"></i> Remove
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="diagnostic-actions" style={{ display: loading ? 'none' : 'flex' }}>
            <button
              type="button"
              className="btn btn-success btn-lg w-100 py-3 mt-3 shadow-sm"
              disabled={!selectedFile}
              onClick={handleRunDiagnosis}
            >
              <i className="fa-solid fa-play"></i> Run AI Diagnosis
            </button>
          </div>

          {/* Analyzer Loading State */}
          {loading && (
            <div className="analyzer-loading">
              <div className="spinner-container">
                <div className="spinner"></div>
                <div className="pulse-ring"></div>
              </div>
              <h4>Running YOLOv8 Deep Learning Inference...</h4>
              <p>Analyzing cell structures, chlorosis, lesions, and necrosis patterns.</p>
            </div>
          )}
        </div>

        {/* Diagnostic Outputs */}
        {results && (
          <div className="results-wrapper" style={{ marginTop: '32px' }}>
            <div className="results-card">
              <div className="card-header border-bottom">
                <div className="header-align">
                  <h3>
                    <i className="fa-solid fa-square-poll-vertical"></i> Analysis Results
                  </h3>
                  <a
                    href={`/download-report/${results.id}`}
                    download
                    className="btn btn-outline-success btn-sm px-3"
                  >
                    <i className="fa-solid fa-file-pdf"></i> Download PDF Report
                  </a>
                </div>
              </div>

              <div className="results-body">
                {/* Top summary row */}
                <div className="result-summary-row">
                  <div className="summary-metric">
                    <span className="metric-label">Detected Condition</span>
                    <h2
                      className={`status-badge ${results.prediction.toLowerCase().replace(/ /g, '-')}`}
                    >
                      {results.prediction}
                    </h2>
                  </div>
                  <div className="summary-metric">
                    <span className="metric-label">Inference Confidence</span>
                    <div className="confidence-gauge-wrapper">
                      <span className="metric-value">{results.confidence}%</span>
                      <div className="confidence-bar-outer">
                        <div
                          className="confidence-bar-inner"
                          style={{ width: `${results.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed diagnostic panels */}
                <div className="diagnostic-details-grid">
                  <div className="detail-card warning-card">
                    <div className="detail-card-icon">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div className="detail-card-content">
                      <h4>Nutrient Deficiency Mapping</h4>
                      <p>{results.nutrient}</p>
                    </div>
                  </div>

                  <div className="detail-card info-card">
                    <div className="detail-card-icon">
                      <i className="fa-solid fa-prescription-bottle-medical"></i>
                    </div>
                    <div className="detail-card-content">
                      <h4>Recommended Treatment / Fertilizer</h4>
                      <p>{results.fertilizer}</p>
                    </div>
                  </div>

                  <div className="detail-card success-card">
                    <div className="detail-card-icon">
                      <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <div className="detail-card-content">
                      <h4>Long-Term Prevention Strategy</h4>
                      <p>{results.prevention}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Static Info Column: Cotton Care Quick Guide */}
      <div className="col-lg-4">
        <div className="info-sidebar-card card shadow-sm p-4">
          <div className="card-header border-0 bg-transparent p-0 mb-4">
            <h3>
              <i className="fa-solid fa-circle-info"></i> Model Reference Guide
            </h3>
            <p>Supported cotton leaf diseases & corresponding deficiency signatures.</p>
          </div>
          <div className="card-body p-0">
            <div className="reference-catalog">
              {referenceCatalog.map((item, idx) => (
                <div key={idx} className="reference-card">
                  <img src={item.img} alt={item.title} className="ref-card-img" />
                  <div className="ref-card-details">
                    <div className="ref-card-header">
                      <h4>{item.title}</h4>
                      <span className={`ref-badge ${item.badgeClass}`}>{item.deficiency}</span>
                    </div>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
