import React, { useEffect, useState, useRef } from 'react'

export default function ConsultationHub({ showToast }) {
  const [agronomists, setAgronomists] = useState([])
  const [activeAgronomist, setActiveAgronomist] = useState(null)
  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(true)

  const chatEndRef = useRef(null)

  const fetchConsultationData = async (agronomistId = null, silent = false) => {
    try {
      let url = '/api/consultation'
      if (agronomistId) {
        url += `?agronomist_id=${agronomistId}`
      }
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error('Failed to load consultation data.')
      }
      const data = await res.json()
      
      setAgronomists(data.agronomists || [])
      setActiveAgronomist(data.agronomist)
      setMessages(data.messages || [])
      setHistory(data.history || [])
      
      if (!silent) setLoading(false)
    } catch (err) {
      console.error(err)
      if (!silent) {
        showToast('Error loading consultation details.', 'error')
        setLoading(false)
      }
    }
  }

  // Initial load
  useEffect(() => {
    fetchConsultationData()
  }, [])

  // Poll for messages and updates
  useEffect(() => {
    if (!activeAgronomist) return
    const interval = setInterval(() => {
      fetchConsultationData(activeAgronomist.id, true)
    }, 5000)
    return () => clearInterval(interval)
  }, [activeAgronomist])

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectAgronomist = (agId) => {
    setLoading(true)
    fetchConsultationData(agId)
  }

  const simulateExpertReply = (farmerMessageText, agId) => {
    const textLower = farmerMessageText.toLowerCase()
    let reply = "Hello! I received your message. I am currently evaluating your fields and latest diagnostics logs, and will reply in detail shortly."
    
    if (textLower.includes('blight') || textLower.includes('spots') || textLower.includes('brown')) {
      reply = "I see. If you uploaded a photo showing dark brown or black spots on the leaves, it could be Bacterial Blight. Please check the expert recommendations section, where I have drafted potassic fertilizer dosage recommendations."
    } else if (textLower.includes('yellow') || textLower.includes('nutrient') || textLower.includes('fertilizer')) {
      reply = "For yellowing issues, it depends on whether the yellowing is interveinal (Magnesium stress) or along the margins (Potassium). I recommend foliar sprays once we confirm via leaf analysis."
    } else if (textLower.includes('red') || textLower.includes('redding')) {
      reply = "Red leaves on cotton usually stem from waterlogging or cold soil restricting phosphorus uptake. Make sure your drainage lines are clear."
    }

    setTimeout(async () => {
      try {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agronomist_id: agId,
            message: reply,
            sender_role: 'agronomist'
          })
        })
        fetchConsultationData(agId, true)
        showToast(`New message received from Dr. ${activeAgronomist?.full_name?.split()?.pop() || 'Jenkins'}`, 'success')
      } catch (err) {
        console.error(err)
      }
    }, 3500)
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeAgronomist) return
    const msg = chatInput
    const agId = activeAgronomist.id
    setChatInput('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agronomist_id: agId,
          message: msg
        })
      })

      if (res.ok) {
        // Refresh immediately
        fetchConsultationData(agId, true)
        // Simulate auto reply
        simulateExpertReply(msg, agId)
      } else {
        showToast('Failed to send message.', 'error')
      }
    } catch (err) {
      showToast('Network error while sending message.', 'error')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  // Filter recommendations matching the selected agronomist
  const filteredRecs = activeAgronomist
    ? history.filter(
        row =>
          row.recommendation_text &&
          row.agronomist_name === activeAgronomist.full_name
      )
    : []

  return (
    <div className="consultation-layout">
      {/* Left Sidebar: Agronomist Directory */}
      <div className="agronomist-directory card">
        <div className="card-header border-bottom">
          <h3>
            <i className="fa-solid fa-address-book"></i> Active Agronomists
          </h3>
          <p>Select a certified consultant to open a case review or chat.</p>
        </div>

        <div className="directory-list">
          {agronomists.length > 0 ? (
            agronomists.map((ag) => (
              <div
                key={ag.id}
                onClick={() => handleSelectAgronomist(ag.id)}
                className={`directory-card ${activeAgronomist?.id === ag.id ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <div className="directory-avatar">
                  <img src={ag.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150'} alt={ag.full_name} />
                </div>
                <div className="directory-info">
                  <h4>{ag.full_name}</h4>
                  <span className="spec-badge">{ag.specialization}</span>
                  <span className="exp-badge">{ag.experience_years} Yrs Exp</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-directory">
              <p>No certified agronomists online in your region.</p>
            </div>
          )}
        </div>
      </div>

      {/* Center/Right Workspace */}
      <div className="consultation-workspace">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Loading consultation workspace...
          </div>
        ) : activeAgronomist ? (
          <>
            {/* Chat Window Card */}
            <div className="chat-workspace-card card">
              <div className="card-header border-bottom chat-header-main">
                <div className="chat-active-user">
                  <img
                    src={activeAgronomist.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150'}
                    alt={activeAgronomist.full_name}
                    className="chat-avatar-thumb"
                  />
                  <div>
                    <h3>{activeAgronomist.full_name}</h3>
                    <span className="specialization-text">
                      <i className="fa-solid fa-graduation-cap"></i> {activeAgronomist.specialization} (License:{' '}
                      {activeAgronomist.license_number})
                    </span>
                  </div>
                </div>
              </div>

              <div className="chat-message-window">
                {messages.length > 0 ? (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`chat-bubble-row ${msg.sender_role === 'farmer' ? 'sender-self' : 'sender-other'}`}
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
                    <h4>Start a Conversation</h4>
                    <p>
                      Send a message to Dr. {activeAgronomist.full_name.split().pop()} regarding crop symptoms or soil
                      management.
                    </p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="chat-input-row">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message here..."
                  autoComplete="off"
                />
                <button type="button" className="btn btn-primary" onClick={handleSendMessage}>
                  <i className="fa-solid fa-paper-plane"></i> Send
                </button>
              </div>
            </div>

            {/* Expert Recommendations Card */}
            <div className="recommendations-card card" style={{ marginTop: '32px' }}>
              <div className="card-header border-bottom">
                <h3>
                  <i className="fa-solid fa-prescription-bottle-medical"></i> Verified Recommendations
                </h3>
                <p>Official treatment reports issued by Dr. {activeAgronomist.full_name.split().pop()} for your crop diagnoses.</p>
              </div>
              <div className="recommendations-feed">
                {filteredRecs.length > 0 ? (
                  filteredRecs.map((row) => (
                    <div key={row.id} className="recommendation-item-card">
                      <div className="rec-item-header">
                        <div className="rec-diagnosis-lbl">
                          <span
                            className={`status-badge ${row.prediction.toLowerCase().replace(/ /g, '-')}`}
                          >
                            {row.prediction}
                          </span>
                          {row.rec_timestamp && (
                            <span className="rec-date">{row.rec_timestamp.substring(0, 16)}</span>
                          )}
                        </div>
                        <a
                          href={`/download-report/${row.id}`}
                          download
                          className="btn btn-outline btn-small"
                        >
                          <i className="fa-solid fa-file-pdf"></i> PDF
                        </a>
                      </div>
                      <div className="rec-item-body">
                        <p className="rec-text">"{row.recommendation_text}"</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-recommendations">
                    <i className="fa-solid fa-prescription-bottle"></i>
                    <p>No expert recommendations have been logged by this agronomist yet.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="workspace-unselected card">
            <i className="fa-solid fa-user-doctor select-expert-icon"></i>
            <h3>No Expert Selected</h3>
            <p>Please select an agronomist from the active directory panel to view consultation threads and crop reports.</p>
          </div>
        )}
      </div>
    </div>
  )
}
