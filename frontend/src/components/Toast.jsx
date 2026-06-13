import React, { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`toast ${type}`}>
      <div className="toast-content">
        {type === 'success' ? (
          <i className="fa-solid fa-circle-check" style={{ color: 'var(--primary-light)' }}></i>
        ) : (
          <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--accent-red)' }}></i>
        )}
        <span>{message}</span>
      </div>
      <button className="toast-close-btn" onClick={onClose}>
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  )
}
