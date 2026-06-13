/* ==========================================================================
   LeafSentry Core JavaScript Features
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileNav();
    initChatbot();
    initConsultation();

    // Route-specific initializations
    if (document.getElementById('upload-zone')) {
        initDashboard();
    }
    
    if (document.getElementById('diseaseChart') || document.getElementById('confidenceChart')) {
        initAnalytics();
    }
});

/* ==========================================================================
   Theme Management (Light / Dark Mode)
   ========================================================================== */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme') || 'dark-theme';
    body.className = savedTheme;
    updateThemeUI(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (body.classList.contains('dark-theme')) {
                body.classList.remove('dark-theme');
                body.classList.add('light-theme');
                localStorage.setItem('theme', 'light-theme');
                updateThemeUI('light-theme');
                showToast('Switched to Light Theme', 'success');
            } else {
                body.classList.remove('light-theme');
                body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark-theme');
                updateThemeUI('dark-theme');
                showToast('Switched to Dark Theme', 'success');
            }
        });
    }
}

function updateThemeUI(theme) {
    const themeText = document.querySelector('.theme-text');
    if (!themeText) return;
    
    if (theme === 'dark-theme') {
        themeText.textContent = 'Dark Mode';
    } else {
        themeText.textContent = 'Light Mode';
    }
}

/* ==========================================================================
   Mobile Sidebar Navigation Toggle
   ========================================================================== */
function initMobileNav() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('mobile-open');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('mobile-open') && !sidebar.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        });
    }
}

/* ==========================================================================
   Toast Notifications System
   ========================================================================== */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === 'error') {
        icon = '<i class="fa-solid fa-circle-xmark"></i>';
    }
    
    toast.innerHTML = `
        <span style="display:flex;align-items:center;gap:8px;">
            ${icon} ${message}
        </span>
        <button class="toast-close-btn">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Setup close button click
    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
        toast.remove();
    });
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 4000);
}

/* ==========================================================================
   Dashboard Page Logic (Predictions & Image Handlers)
   ========================================================================== */
function initDashboard() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('leaf-file-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removePreviewBtn = document.getElementById('remove-preview-btn');
    const uploadContent = document.querySelector('.upload-zone-content');
    
    const loadingState = document.getElementById('analyzer-loading');
    const resultsWrapper = document.getElementById('results-wrapper');
    
    let selectedFile = null;

    // Trigger click on file input
    uploadZone.addEventListener('click', (e) => {
        if (e.target === fileInput) return; // Ignore bubbling clicks from fileInput
        if (e.target !== removePreviewBtn && !removePreviewBtn.contains(e.target)) {
            fileInput.click();
        }
    });

    // Handle drag events
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.remove('dragover');
        }, false);
    });

    // Handle dropped files
    uploadZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    // Handle manual file selection
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
            handleFileSelection(fileInput.files[0]);
        }
    });

    function handleFileSelection(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file.', 'error');
            return;
        }
        
        selectedFile = file;
        
        // Render Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            uploadContent.style.display = 'none';
            previewContainer.style.display = 'flex';
            analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    // Remove Preview
    removePreviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        selectedFile = null;
        imagePreview.src = '#';
        previewContainer.style.display = 'none';
        uploadContent.style.display = 'flex';
        analyzeBtn.disabled = true;
        resultsWrapper.style.display = 'none';
    });

    // Run Inference
    analyzeBtn.addEventListener('click', () => {
        if (!selectedFile) return;

        // Reset UI states
        resultsWrapper.style.display = 'none';
        loadingState.style.display = 'flex';
        analyzeBtn.disabled = true;

        const formData = new FormData();
        formData.append('image', selectedFile);

        fetch('/analyze', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Analysis failed.');
            }
            return response.json();
        })
        .then(data => {
            loadingState.style.display = 'none';
            analyzeBtn.disabled = false;
            
            if (data.error) {
                showToast(data.error, 'error');
                return;
            }

            // Populate Results UI
            document.getElementById('result-prediction').textContent = data.prediction;
            document.getElementById('result-prediction').className = `status-badge ${data.prediction.toLowerCase().replace(/ /g, '-')}`;
            
            document.getElementById('result-confidence').textContent = `${data.confidence}%`;
            document.getElementById('result-confidence-bar').style.width = `${data.confidence}%`;
            
            document.getElementById('result-nutrient').textContent = data.nutrient;
            document.getElementById('result-fertilizer').textContent = data.fertilizer;
            document.getElementById('result-prevention').textContent = data.prevention;
            
            // Set Report Download Link
            document.getElementById('pdf-download-link').href = `/download-report/${data.id}`;

            // Reveal Results card
            resultsWrapper.style.display = 'block';
            resultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            showToast('Diagnosis Complete!', 'success');
        })
        .catch(err => {
            loadingState.style.display = 'none';
            analyzeBtn.disabled = false;
            showToast('Error connecting to server. Please try again.', 'error');
            console.error(err);
        });
    });
}

/* ==========================================================================
   Interactive Chatbot Interface
   ========================================================================== */
function initChatbot() {
    const trigger = document.getElementById('chatbot-trigger');
    const container = document.getElementById('chatbot-container');
    const closeBtn = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const messagesBox = document.getElementById('chat-messages');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');

    if (!trigger) return; // Only loads if chatbot exists in DOM (Farmer role)

    // Toggle container
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.toggle('active');
        if (container.classList.contains('active')) {
            chatInput.focus();
        }
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.remove('active');
    });

    // Close on outer clicks
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target) && e.target !== trigger && !trigger.contains(e.target)) {
            container.classList.remove('active');
        }
    });

    // Send Message
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Wire suggestion chips
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const msg = chip.getAttribute('data-msg');
            chatInput.value = msg;
            sendMessage();
        });
    });

    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Append User Message
        appendMessage(text, 'user-message');
        chatInput.value = '';

        // Append Typing Indicator
        const typingEl = appendTypingIndicator();

        // Call chatbot API
        fetch('/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: text })
        })
        .then(res => res.json())
        .then(data => {
            // Simulated network delay (800ms) for high-fidelity interactive chat
            setTimeout(() => {
                removeTypingIndicator(typingEl);
                appendMessage(data.response, 'bot-message');
            }, 800);
        })
        .catch(() => {
            removeTypingIndicator(typingEl);
            appendMessage("Sorry, I'm having trouble connecting to the agronomy server.", 'bot-message');
        });
    }

    function appendMessage(text, className) {
        const msg = document.createElement('div');
        msg.className = `message ${className}`;
        
        // Simple Markdown formatter for bold tags and list format
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/### (.*?)\n/g, '<h5>$1</h5>')
            .replace(/- \*\*(.*?)\*\*:/g, '• <strong>$1</strong>:')
            .replace(/\n\n/g, '<br><br>');
            
        msg.innerHTML = formattedText;
        messagesBox.appendChild(msg);
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    function appendTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        `;
        messagesBox.appendChild(typingDiv);
        messagesBox.scrollTop = messagesBox.scrollHeight;
        return typingDiv;
    }

    function removeTypingIndicator(el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }
}

/* ==========================================================================
   Farmer - Agronomist Consultation Chat
   ========================================================================== */
function initConsultation() {
    const sendBtn = document.getElementById('consult-send-btn');
    const inputField = document.getElementById('consult-input');
    const messageWindow = document.getElementById('consult-message-window');
    
    if (!sendBtn || !inputField) return;

    // Scroll chat window to bottom initially
    if (messageWindow) {
        messageWindow.scrollTop = messageWindow.scrollHeight;
    }

    sendBtn.addEventListener('click', submitMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitMessage();
        }
    });

    // Simple poller to refresh messages periodically (every 5 seconds)
    const farmerId = sendBtn.getAttribute('data-farmer-id');
    const agronomistId = sendBtn.getAttribute('data-agronomist-id');
    
    setInterval(() => {
        refreshMessages(farmerId, agronomistId);
    }, 5000);

    function submitMessage() {
        const text = inputField.value.trim();
        if (!text) return;

        inputField.value = '';

        const payload = { message: text };
        if (farmerId) {
            payload.farmer_id = farmerId;
        } else if (agronomistId) {
            payload.agronomist_id = agronomistId;
        }

        fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                // Immediate update
                refreshMessages(farmerId, agronomistId);
                
                // If farmer role sends message to agronomist, simulate expert auto-reply for interactive experience
                if (agronomistId) {
                    simulateExpertReply(text, agronomistId);
                }
            } else {
                showToast('Failed to send message.', 'error');
            }
        })
        .catch(() => {
            showToast('Connection error.', 'error');
        });
    }

    function refreshMessages(fId, aId) {
        let url = '/api/messages';
        if (fId) {
            url += `?farmer_id=${fId}`;
        } else if (aId) {
            url += `?agronomist_id=${aId}`;
        }

        fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.messages) {
                // Empty the chat element first (except empty state which gets overwritten)
                messageWindow.innerHTML = '';
                
                data.messages.forEach(msg => {
                    const bubbleRow = document.createElement('div');
                    const isSelf = (fId && msg.sender_role === 'agronomist') || (aId && msg.sender_role === 'farmer');
                    
                    bubbleRow.className = `chat-bubble-row ${isSelf ? 'sender-self' : 'sender-other'}`;
                    bubbleRow.innerHTML = `
                        <div class="chat-bubble">
                            <p>${msg.message}</p>
                            <span class="chat-time">${msg.timestamp.substring(11, 16)}</span>
                        </div>
                    `;
                    messageWindow.appendChild(bubbleRow);
                });
                messageWindow.scrollTop = messageWindow.scrollHeight;
            }
        });
    }

    function simulateExpertReply(farmerMessageText, agId) {
        const textLower = farmerMessageText.toLowerCase();
        let reply = "Hello! I received your message. I am currently evaluating your fields and latest diagnostics logs, and will reply in detail shortly.";
        
        if (textLower.includes('blight') || textLower.includes('spots') || textLower.includes('brown')) {
            reply = "I see. If you uploaded a photo showing dark brown or black spots on the leaves, it could be Bacterial Blight. Please check the expert recommendations section, where I have drafted potassic fertilizer dosage recommendations.";
        } else if (textLower.includes('yellow') || textLower.includes('nutrient') || textLower.includes('fertilizer')) {
            reply = "For yellowing issues, it depends on whether the yellowing is interveinal (Magnesium stress) or along the margins (Potassium). I recommend foliar sprays once we confirm via leaf analysis.";
        } else if (textLower.includes('red') || textLower.includes('redding')) {
            reply = "Red leaves on cotton usually stem from waterlogging or cold soil restricting phosphorus uptake. Make sure your drainage lines are clear.";
        }

        // Wait 3.5 seconds to simulate agronomist reply
        setTimeout(() => {
            fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    farmer_id: null, // Serves as the agronomist writing to the current farmer
                    message: reply,
                    sender_role: 'agronomist' // Server route will handle assignment
                })
            })
            .then(() => {
                // Directly simulate client fetch
                fetch(`/api/messages?agronomist_id=${agId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.messages) {
                        messageWindow.innerHTML = '';
                        data.messages.forEach(msg => {
                            const bubbleRow = document.createElement('div');
                            const isSelf = msg.sender_role === 'farmer';
                            bubbleRow.className = `chat-bubble-row ${isSelf ? 'sender-self' : 'sender-other'}`;
                            bubbleRow.innerHTML = `
                                <div class="chat-bubble">
                                    <p>${msg.message}</p>
                                    <span class="chat-time">${msg.timestamp.substring(11, 16)}</span>
                                </div>
                            `;
                            messageWindow.appendChild(bubbleRow);
                        });
                        messageWindow.scrollTop = messageWindow.scrollHeight;
                        showToast("New message received from Dr. Sarah Jenkins", "success");
                    }
                });
            });
        }, 3500);
    }
}

/* ==========================================================================
   Analytics Dashboard Logic (Chart.js & History Tables)
   ========================================================================== */
function initAnalytics() {
    const historySearch = document.getElementById('history-search');
    const historyTableBody = document.getElementById('history-table-body');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // Search filter
    if (historySearch && historyTableBody) {
        historySearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = historyTableBody.querySelectorAll('.history-row');
            let visibleCount = 0;

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(term)) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });

            // Toggle empty state if all rows filtered out
            let emptyRow = document.getElementById('empty-table-row');
            if (visibleCount === 0) {
                if (!emptyRow) {
                    emptyRow = document.createElement('tr');
                    emptyRow.id = 'empty-table-row';
                    emptyRow.innerHTML = `
                        <td colspan="8" class="empty-state-cell">
                            <div class="empty-state">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <h4>No Matching Records</h4>
                                <p>Try adjusting your search keywords.</p>
                            </div>
                        </td>
                    `;
                    historyTableBody.appendChild(emptyRow);
                } else {
                    emptyRow.style.display = '';
                }
            } else if (emptyRow) {
                emptyRow.style.display = 'none';
            }
        });
    }

    // Clear history
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you absolutely sure you want to permanently clear the entire log database? This action cannot be undone.')) {
                fetch('/api/clear-history', {
                    method: 'POST'
                })
                .then(res => res.json())
                .then(data => {
                    showToast(data.message, 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                })
                .catch(() => {
                    showToast('Failed to clear database.', 'error');
                });
            }
        });
    }

    // Fetch and build Charts
    fetch('/api/stats')
        .then(res => res.json())
        .then(data => {
            const isDark = document.body.classList.contains('dark-theme');
            const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
            const textColor = isDark ? '#a0b2a0' : '#5e6b5e';
            
            // Build Disease Chart
            const diseaseCanvas = document.getElementById('diseaseChart');
            const noData1 = document.getElementById('chart-nodata-1');
            
            if (diseaseCanvas) {
                const hasData = Object.keys(data.disease_counts).length > 0;
                
                if (hasData) {
                    if (noData1) noData1.style.display = 'none';
                    diseaseCanvas.style.display = 'block';
                    
                    const labels = Object.keys(data.disease_counts);
                    const values = Object.values(data.disease_counts);
                    
                    // Color palette
                    const chartColors = [
                        '#2e7d32', // green
                        '#e57373', // red
                        '#ffb74d', // orange
                        '#ba68c8', // purple
                        '#4fc3f7', // light blue
                        '#c62828', // dark red
                        '#d4e157'  // yellow-green
                    ];

                    new Chart(diseaseCanvas, {
                        type: 'doughnut',
                        data: {
                            labels: labels,
                            datasets: [{
                                data: values,
                                backgroundColor: chartColors.slice(0, labels.length),
                                borderWidth: 2,
                                borderColor: isDark ? '#111811' : '#ffffff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'right',
                                    labels: {
                                        font: { family: 'Outfit', size: 11 },
                                        color: textColor
                                    }
                                }
                            }
                        }
                    });
                } else {
                    if (noData1) noData1.style.display = 'flex';
                    diseaseCanvas.style.display = 'none';
                }
            }

            // Build Confidence Trends Chart
            const confidenceCanvas = document.getElementById('confidenceChart');
            const noData2 = document.getElementById('chart-nodata-2');

            if (confidenceCanvas) {
                if (data.recent_confidence && data.recent_confidence.length > 0) {
                    if (noData2) noData2.style.display = 'none';
                    confidenceCanvas.style.display = 'block';

                    const dates = data.recent_confidence.map(row => {
                        const dt = new Date(row.timestamp);
                        return dt.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    });
                    const scores = data.recent_confidence.map(row => row.confidence);

                    new Chart(confidenceCanvas, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: [{
                                label: 'Diagnosis Confidence (%)',
                                data: scores,
                                borderColor: '#4caf50',
                                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                borderWidth: 3,
                                fill: true,
                                tension: 0.3,
                                pointBackgroundColor: '#2e7d32',
                                pointHoverRadius: 7
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false }
                            },
                            scales: {
                                x: {
                                    grid: { color: gridColor },
                                    ticks: { color: textColor, font: { family: 'Outfit', size: 10 } }
                                },
                                y: {
                                    grid: { color: gridColor },
                                    ticks: { color: textColor, font: { family: 'Outfit', size: 10 } },
                                    min: 0,
                                    max: 100
                                }
                            }
                        }
                    });
                } else {
                    if (noData2) noData2.style.display = 'flex';
                    confidenceCanvas.style.display = 'none';
                }
            }
        })
        .catch(err => {
            console.error('Error fetching analytics:', err);
        });
}
