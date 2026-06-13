import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'

export default function FarmerInspect({ showToast }) {
  const { farmerId } = useParams()
  const [farmer, setFarmer] = useState(null)
  const [history, setHistory] = useState([])
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Track edit states for recommendations
  const [editingRecs, setEditingRecs] = useState({}) // { [analysisId]: boolean }
  const [recsText, setRecsText] = useState({}) // { [analysisId]: string }

  const chatEndRef = useRef(null)

  const fetchFarmerData = async (silent = false) => {
    try {
      const res = await fetch(`/api/agronomist/farmer/${farmerId}`)
      if (!res.ok) {
        throw new Error('Failed to retrieve farmer case details.')
      }
      const data = await res.json()
      setFarmer(data.farmer)
      setHistory(data.history || [])
      setMessages(data.messages || [])
      
      // Initialize recommendation text fields if they aren't dirty
      const initialText = {}
      data.history.forEach(row => {
        initialText[row.id] = row.recommendation_text || ''
      })
      setRecsText(prev => ({ ...initialText, ...prev }))

      if (!silent) setLoading(false)
    } catch (err) {
      console.error(err)
      if (!silent) {
        showToast('Error loading farmer telemetry.', 'error')
        setLoading(false)
      }
    }
  }

  // Initial load
  useEffect(() => {
    fetchFarmerData()
  }, [farmerId])

  // Poll for messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFarmerData(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [farmerId])

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    const msg = chatInput
    setChatInput('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: parseInt(farmerId, 10),
          message: msg
        })
      })

      if (res.ok) {
        // Refresh immediately
        fetchFarmerData(true)
      } else {
        showToast('Failed to deliver message.', 'error')
      }
    } catch (err) {
      showToast('Network error during messaging.', 'error')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const handleSaveRecommendation = async (analysisId) => {
    const text = recsText[analysisId]?.trim()
    if (!text) {
      showToast('Please type a recommendation first.', 'error')
      return
    }

    try {
      const res = await fetch('/api/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
          recommendation_text: text
        })
      })

      const data = await res.json()
      if (res.ok) {
        showToast('Recommendation updated successfully.', 'success')
        // Turn off edit mode
        setEditingRecs(prev => ({ ...prev, [analysisId]: false }))
        fetchFarmerData(true)
      } else {
        showToast(data.error || 'Failed to save recommendation.', 'error')
      }
    } catch (err) {
      showToast('Server communication failure.', 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Loading farmer records...
      </div>
    )
  }

  if (!farmer) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <h4>Farmer Case Not Found</h4>
        <Link to="/" className="btn btn-outline" style={{ marginTop: '16px' }}>
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="row g-4">
      {/* Left Column: Farmer Details & Chat */}
      <div className="col-lg-4">
        {/* Farmer Info Card */}
        <div className="farmer-details-card card shadow-sm p-4">
          <div className="case-farmer-header">
            <img
              src={farmer.avatar_url || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=150'}
              alt={farmer.full_name}
            />
            <div>
              <h3>{farmer.full_name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                <i className="fa-solid fa-location-dot"></i> {farmer.location}
              </p>
            </div>
          </div>

          <div className="case-farmer-meta border-top" style={{ paddingTop: '16px', marginTop: '16px' }}>
            <div className="meta-item">
              <span className="lbl">Farm Name:</span>
              <span className="val">{farmer.farm_name}</span>
            </div>
            <div className="meta-item">
              <span className="lbl">Farm Size:</span>
              <span className="val">{farmer.farm_size} Acres</span>
            </div>
            <div className="meta-item">
              <span className="lbl">Soil Type:</span>
              <span className="val badge-soil">{farmer.soil_type}</span>
            </div>
            <div className="meta-item">
              <span className="lbl">Irrigation Type:</span>
              <span className="val">{farmer.irrigation_type}</span>
            </div>
            <div className="meta-item">
              <span className="lbl">Contact Phone:</span>
              <span className="val">{farmer.phone || 'Not Provided'}</span>
            </div>
          </div>

          <Link to="/" className="btn btn-outline-success w-100 btn-lg" style={{ marginTop: '15px' }}>
            <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
          </Link>
        </div>

        {/* Chat Workspace Card */}
        <div className="case-chat-card card" style={{ marginTop: '32px' }}>
          <div className="card-header border-bottom">
            <h3>
              <i className="fa-solid fa-comments"></i> Direct Chat Console
            </h3>
            <p>Discuss crop telemetry and recommendations with {farmer.full_name.split()[0]}.</p>
          </div>

          <div className="chat-message-window">
            {messages.length > 0 ? (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-bubble-row ${msg.sender_role === 'agronomist' ? 'sender-self' : 'sender-other'}`}
                >
                  <div className="chat-bubble">
                    <p>{msg.message}</p>
                    <span className="chat-time">{msg.timestamp.substring(11, 16)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="chat-empty-state">
                <i className="fa-solid fa-comments"></i>
                <h4>No messages yet</h4>
                <p>Initiate consultation by sending a message below.</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-row input-group p-3 border-top bg-transparent">
            <input
              type="text"
              className="form-control"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type message to farmer..."
              autoComplete="off"
            />
            <button type="button" className="btn btn-success" onClick={handleSendMessage}>
              <i className="fa-solid fa-paper-plane"></i> Send
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Diagnostics History & Recommendations Form */}
      <div className="col-lg-8">
        <div className="farmer-diagnoses-list card shadow-sm p-4">
          <div className="card-header border-bottom">
            <h3>
              <i className="fa-solid fa-microscope"></i> Diagnostic Telemetry Records
            </h3>
            <p>Review leaves uploaded by {farmer.full_name.split()[0]} and log custom agronomist recommendations.</p>
          </div>

          <div className="case-diagnoses-feed" style={{ marginTop: '20px' }}>
            {history.length > 0 ? (
              history.map((row) => {
                const isEditing = editingRecs[row.id]
                const hasRec = row.recommendation_text && !isEditing

                return (
                  <div key={row.id} className="case-diag-item card" style={{ marginBottom: '24px' }}>
                    <div className="case-diag-header">
                      <div className="case-diag-pic">
                        <img src={`/static/uploads/${row.filename}`} alt="Leaf Sample" />
                      </div>
                      <div className="case-diag-details">
                        <div className="case-diag-top">
                          <span
                            className={`status-badge ${row.prediction.toLowerCase().replace(/ /g, '-')}`}
                          >
                            {row.prediction}
                          </span>
                          <span className="case-diag-conf">Confidence: {row.confidence}%</span>
                        </div>
                        <div className="case-diag-date">
                          <i className="fa-solid fa-calendar-days"></i> Uploaded: {row.timestamp}
                        </div>
                        <div className="case-diag-mapping">
                          <p>
                            <strong>Soil Nutrient Signature</strong>: {row.nutrient}
                          </p>
                          <p>
                            <strong>Suggested Fertilizer</strong>: {row.fertilizer}
                          </p>
                        </div>
                      </div>
                      <div className="case-diag-report-link">
                        <a
                          href={`/download-report/${row.id}`}
                          download
                          className="btn btn-outline-success btn-sm px-3"
                          title="Download Report"
                        >
                          <i className="fa-solid fa-file-pdf"></i> Report
                        </a>
                      </div>
                    </div>

                    {/* Recommendation Editor */}
                    <div className="case-rec-form border-top" style={{ marginTop: '16px', paddingTop: '16px' }}>
                      <h4 className="rec-form-title">
                        <i className="fa-solid fa-prescription-bottle-medical"></i> Official Expert Advice
                      </h4>

                      {hasRec ? (
                        <div className="rec-saved-alert">
                          <p className="rec-saved-text">"{row.recommendation_text}"</p>
                          {row.rec_timestamp && (
                            <small className="rec-saved-time">
                              <i className="fa-solid fa-clock"></i> Issued on:{' '}
                              {row.rec_timestamp.substring(0, 16)}
                            </small>
                          )}
                          <button
                            className="btn btn-outline-success btn-sm mt-2"
                            onClick={() => setEditingRecs(prev => ({ ...prev, [row.id]: true }))}
                          >
                            <i className="fa-solid fa-pen"></i> Edit Recommendation
                          </button>
                        </div>
                      ) : (
                        <div className="rec-edit-area">
                          <textarea
                            className="form-control mb-3"
                            rows="4"
                            value={recsText[row.id] || ''}
                            onChange={e => setRecsText(prev => ({ ...prev, [row.id]: e.target.value }))}
                            placeholder="Provide specific, actionable treatment steps, fertilizer rates, or preventative guidelines..."
                            required
                          ></textarea>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleSaveRecommendation(row.id)}
                            >
                              <i className="fa-solid fa-check"></i> Save Recommendation
                            </button>
                            {row.recommendation_text && (
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => {
                                  // Revert text
                                  setRecsText(prev => ({ ...prev, [row.id]: row.recommendation_text }))
                                  setEditingRecs(prev => ({ ...prev, [row.id]: false }))
                                }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: '2rem', marginBottom: '12px' }}></i>
                <h4>No Leaf Uploads Available</h4>
                <p>This farmer has not submitted any leaves for diagnostic testing yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
