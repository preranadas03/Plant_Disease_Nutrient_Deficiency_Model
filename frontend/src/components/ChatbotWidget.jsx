import React, { useState, useRef, useEffect } from 'react'

export default function ChatbotWidget({ user }) {
  if (!user || user.role !== 'farmer') return null

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hi ${user.full_name}! I'm Leafy, your agricultural assistant. Ask me anything about cotton leaf health, deficiencies, or treatment!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, isTyping])

  const handleSend = async (textToSend) => {
    const text = textToSend || input
    if (!text.trim()) return

    if (!textToSend) {
      setInput('')
    }

    const newMsg = {
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, newMsg])
    setIsTyping(true)

    try {
      const res = await fetch('/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      const data = await res.json()
      setIsTyping(false)
      
      const botMsg = {
        sender: 'bot',
        text: data.response || "I'm sorry, I encountered an error. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      setIsTyping(false)
      const errMsg = {
        sender: 'bot',
        text: "Could not connect to Leafy AI. Please check server connection.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errMsg])
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  const suggestionChips = [
    { label: '🌾 My Farm Profile', msg: 'What is my farm profile status?' },
    { label: '🔍 Last Diagnosis', msg: 'Tell me about my last diagnosis' },
    { label: '🦠 Treatment Tips', msg: 'How to treat Bacterial Blight?' },
    { label: '🌤️ Weather Info', msg: 'Get current weather advisory' }
  ]

  const formatMarkdown = (text) => {
    if (!text) return ''
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/### (.*?)\n/g, '<h5>$1</h5>')
      .replace(/- \*\*(.*?)\*\*:/g, '• <strong>$1</strong>:')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className="chatbot-widget">
      <button
        className="chatbot-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Ask Leafy AI Assistant"
      >
        <i className="fa-solid fa-comment-dots"></i>
        <span className="chat-badge">AI</span>
      </button>
 
      <div className={`chatbot-container ${isOpen ? 'active' : ''}`}>
        <div className="chat-header">
          <div className="chat-bot-info">
            <i className="fa-solid fa-robot"></i>
            <div>
              <h4>Leafy AI</h4>
              <span>Online</span>
            </div>
          </div>
          <button className="chat-close" onClick={() => setIsOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
 
        <div className="chat-messages">
          {messages.map((m, idx) => (
            <div key={idx} className={`message ${m.sender === 'bot' ? 'bot-message' : 'user-message'}`}>
              <span dangerouslySetInnerHTML={{ __html: formatMarkdown(m.text) }} />
              <span className="chat-time" style={{ fontSize: '0.6rem', display: 'block', textAlign: 'right', marginTop: '4px', opacity: 0.7 }}>
                {m.time}
              </span>
            </div>
          ))}
          {isTyping && (
            <div className="message bot-message typing-indicator">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chatbot suggestion chips */}
        <div className="chat-suggestions">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              className="suggestion-chip"
              onClick={() => handleSend(chip.msg)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <button onClick={() => handleSend()}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  )
}
