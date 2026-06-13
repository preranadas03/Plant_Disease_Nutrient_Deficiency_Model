import React, { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function HistoryAnalytics({ user, showToast }) {
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ disease_counts: {}, recent_confidence: [] })
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch('/api/stats')
      const statsData = await statsRes.json()
      
      // Fetch history
      const historyRes = await fetch('/api/history')
      const historyData = await historyRes.json()

      setStats(statsData)
      setHistory(historyData.history || [])
      setLoading(false)
    } catch (err) {
      console.error(err)
      showToast('Failed to retrieve history logs.', 'error')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleClearHistory = async () => {
    if (
      window.confirm(
        'Are you absolutely sure you want to permanently clear the entire log database? This action cannot be undone.'
      )
    ) {
      try {
        const res = await fetch('/api/clear-history', { method: 'POST' })
        const data = await res.json()
        if (res.ok) {
          showToast(data.message || 'Database cleared.', 'success')
          fetchData()
        } else {
          showToast('Failed to clear logs.', 'error')
        }
      } catch (err) {
        showToast('Error connecting to database.', 'error')
      }
    }
  }

  // Filter history based on search
  const filteredHistory = history.filter(row => {
    const term = searchTerm.toLowerCase()
    const matchCondition = row.prediction?.toLowerCase().includes(term)
    const matchNutrient = row.nutrient?.toLowerCase().includes(term)
    const matchDate = row.timestamp?.toLowerCase().includes(term)
    const matchFarmer = row.farmer_name?.toLowerCase().includes(term)
    return matchCondition || matchNutrient || matchDate || matchFarmer
  })

  // Chart Setup: Disease Distribution
  const hasDiseaseData = Object.keys(stats.disease_counts).length > 0
  const diseaseLabels = Object.keys(stats.disease_counts)
  const diseaseValues = Object.values(stats.disease_counts)
  const chartColors = [
    '#2e7d32', // green
    '#e57373', // red
    '#ffb74d', // orange
    '#ba68c8', // purple
    '#4fc3f7', // light blue
    '#c62828', // dark red
    '#d4e157'  // yellow-green
  ]

  const diseaseChartData = {
    labels: diseaseLabels,
    datasets: [
      {
        data: diseaseValues,
        backgroundColor: chartColors.slice(0, diseaseLabels.length),
        borderWidth: 2,
        borderColor: document.body.classList.contains('light-theme') ? '#ffffff' : '#111811'
      }
    ]
  }

  const diseaseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { family: 'Outfit', size: 11 },
          color: document.body.classList.contains('light-theme') ? '#5e6b5e' : '#a0b2a0'
        }
      }
    }
  }

  // Chart Setup: Confidence Trends
  const hasConfidenceData = stats.recent_confidence && stats.recent_confidence.length > 0
  
  const confidenceLabels = (stats.recent_confidence || []).map(row => {
    const dt = new Date(row.timestamp)
    return dt.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  })
  
  const confidenceValues = (stats.recent_confidence || []).map(row => row.confidence)

  const confidenceChartData = {
    labels: confidenceLabels,
    datasets: [
      {
        label: 'Diagnosis Confidence (%)',
        data: confidenceValues,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#2e7d32',
        pointHoverRadius: 7
      }
    ]
  }

  const confidenceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: {
          color: document.body.classList.contains('light-theme')
            ? 'rgba(0,0,0,0.06)'
            : 'rgba(255,255,255,0.06)'
        },
        ticks: {
          color: document.body.classList.contains('light-theme') ? '#5e6b5e' : '#a0b2a0',
          font: { family: 'Outfit', size: 10 }
        }
      },
      y: {
        grid: {
          color: document.body.classList.contains('light-theme')
            ? 'rgba(0,0,0,0.06)'
            : 'rgba(255,255,255,0.06)'
        },
        ticks: {
          color: document.body.classList.contains('light-theme') ? '#5e6b5e' : '#a0b2a0',
          font: { family: 'Outfit', size: 10 }
        },
        min: 0,
        max: 100
      }
    }
  }

  return (
    <div className="analytics-container">
      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card card">
          <div className="card-header">
            <h3>
              <i className="fa-solid fa-chart-pie"></i> Disease Distribution
            </h3>
            <p>Distribution profile of identified cotton plant conditions.</p>
          </div>
          <div className="card-body chart-wrapper">
            {hasDiseaseData ? (
              <Doughnut data={diseaseChartData} options={diseaseChartOptions} />
            ) : (
              <div className="no-data-msg">
                <i className="fa-solid fa-folder-open"></i>
                <p style={{ marginTop: '8px' }}>No analytical data logged yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-card card">
          <div className="card-header">
            <h3>
              <i className="fa-solid fa-chart-line"></i> Confidence Trends
            </h3>
            <p>Success rates and model confidence for last 10 detections.</p>
          </div>
          <div className="card-body chart-wrapper">
            {hasConfidenceData ? (
              <Line data={confidenceChartData} options={confidenceChartOptions} />
            ) : (
              <div className="no-data-msg">
                <i className="fa-solid fa-folder-open"></i>
                <p style={{ marginTop: '8px' }}>No analytical data logged yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Table Section */}
      <div className="history-card card">
        <div className="card-header border-bottom">
          <div className="header-align">
            <div>
              <h3>
                <i className="fa-solid fa-database"></i> Diagnosis Log Database
              </h3>
              <p>Search, filter, and export detailed history logs of past leaf evaluations.</p>
            </div>
            <div className="header-actions">
              <button onClick={handleClearHistory} className="btn btn-danger btn-small">
                <i className="fa-solid fa-trash"></i> Clear Database
              </button>
            </div>
          </div>
        </div>

        <div className="table-controls">
          <div className="search-bar-wrapper">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by disease, deficiency, or date..."
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Sample Image</th>
                {user.role === 'agronomist' && <th>Farmer</th>}
                <th>Date & Time</th>
                <th>Detected Condition</th>
                <th>Confidence</th>
                <th>Nutrient Mapping</th>
                <th>Recommended Treatment</th>
                <th>Report</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={user.role === 'agronomist' ? 9 : 8} style={{ textAlign: 'center', padding: '30px' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Loading records...
                  </td>
                </tr>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((row) => (
                  <tr key={row.id} className="history-row">
                    <td>#{row.id}</td>
                    <td>
                      <div className="table-img-wrapper">
                        <img
                          src={`/static/uploads/${row.filename}`}
                          alt="Leaf Sample"
                          className="table-thumb"
                        />
                      </div>
                    </td>
                    {user.role === 'agronomist' && (
                      <td>
                        <strong>{row.farmer_name || 'Guest'}</strong>
                      </td>
                    )}
                    <td className="timestamp-col">{row.timestamp}</td>
                    <td>
                      <span
                        className={`status-badge ${row.prediction?.toLowerCase().replace(/ /g, '-')}`}
                      >
                        {row.prediction}
                      </span>
                    </td>
                    <td className="conf-col font-mono">{row.confidence}%</td>
                    <td>{row.nutrient}</td>
                    <td>{row.fertilizer}</td>
                    <td>
                      <a href={`/download-report/${row.id}`} download className="btn-icon" title="Download PDF Report">
                        <i className="fa-solid fa-file-pdf"></i>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={user.role === 'agronomist' ? 9 : 8} className="empty-state-cell">
                    <div className="empty-state">
                      <i className="fa-solid fa-box-open"></i>
                      <h4>No Records Found</h4>
                      <p>
                        {searchTerm
                          ? 'Try adjusting your search keywords.'
                          : 'Upload leaf images in the Dashboard to begin building crop telemetry logs.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
