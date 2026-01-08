let currentQuestionIndex = 0;
let examSoal = [];
let jawaban = {};
let startTime = null;
let timerInterval = null;
let autoSaveInterval = null;
let autoSyncInterval = null;
let lastSavedState = null;
const EXAM_DURATION = 3600; // 60 minutes in seconds
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds
const AUTO_SYNC_INTERVAL = 10000; // 10 seconds

// Initialize exam
async function initExam() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize watermark
    initWatermark(user);
    
    // Initialize activity logging
    initActivityLogging(user);
    
    // Check if exam data exists in localStorage
    const savedExam = localStorage.getItem('examSoal');
    const savedJawaban = localStorage.getItem('jawaban');
    const savedStartTime = localStorage.getItem('startTime');
    const savedElapsed = localStorage.getItem('elapsedTime');
    const savedIndex = localStorage.getItem('currentIndex');
    
    if (savedExam && savedJawaban) {
        examSoal = JSON.parse(savedExam);
        jawaban = JSON.parse(savedJawaban);
        currentQuestionIndex = parseInt(savedIndex) || 0;
        
        // Restore timer from saved elapsed time
        if (savedElapsed) {
            const elapsed = parseInt(savedElapsed);
            const remaining = Math.max(0, EXAM_DURATION - elapsed);
            startTime = new Date(Date.now() - (elapsed * 1000));
        } else if (savedStartTime) {
            startTime = new Date(savedStartTime);
        } else {
            startTime = new Date();
            await startExamSession(user.id);
            localStorage.setItem('startTime', startTime.toISOString());
        }
        
        lastSavedState = JSON.stringify(jawaban);
        
        renderQuestion();
        updateNavigation();
        startTimer();
        startAutoSave();
        startAutoSync(user);
    } else {
        // Load new exam
        await loadSoal(user.id);
    }
}

// Start exam session
async function startExamSession(userId) {
    try {
        await fetch('/api/ujian/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId })
        });
    } catch (error) {
        console.error('Error starting exam session:', error);
    }
}

// Load soal from API
async function loadSoal(userId) {
    try {
        const response = await fetch('/api/soal/random?jumlah=10');
        const result = await response.json();
        
        if (result.success && result.data) {
            // Shuffle soal array using Fisher-Yates
            examSoal = shuffleArray([...result.data]);
            
            // Shuffle options for each soal
            examSoal = examSoal.map(soal => shuffleOptions(soal));
            
            // Save to localStorage
            localStorage.setItem('examSoal', JSON.stringify(examSoal));
            
            // Initialize answers
            jawaban = {};
            localStorage.setItem('jawaban', JSON.stringify(jawaban));
            
            // Start exam session
            await startExamSession(userId);
            startTime = new Date();
            localStorage.setItem('startTime', startTime.toISOString());
            
            renderQuestion();
            updateNavigation();
            startTimer();
        } else {
            alert('Gagal memuat soal');
            window.location.href = 'instructions.html';
        }
    } catch (error) {
        console.error('Error loading soal:', error);
        alert('Terjadi kesalahan saat memuat soal');
        window.location.href = 'instructions.html';
    }
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Shuffle options A, B, C, D
function shuffleOptions(soal) {
    const options = [
        { key: 'a', value: soal.opsi_a },
        { key: 'b', value: soal.opsi_b },
        { key: 'c', value: soal.opsi_c },
        { key: 'd', value: soal.opsi_d }
    ];
    
    // Shuffle options array
    const shuffled = shuffleArray(options);
    
    // Create mapping
    const mapping = {};
    shuffled.forEach((opt, index) => {
        mapping[String.fromCharCode(97 + index)] = soal.jawaban_benar.toLowerCase() === opt.key;
    });
    
    // Find new correct answer
    let newCorrectAnswer = '';
    shuffled.forEach((opt, index) => {
        if (opt.key === soal.jawaban_benar.toLowerCase()) {
            newCorrectAnswer = String.fromCharCode(97 + index);
        }
    });
    
    return {
        ...soal,
        opsi_a: shuffled[0].value,
        opsi_b: shuffled[1].value,
        opsi_c: shuffled[2].value,
        opsi_d: shuffled[3].value,
        jawaban_benar: newCorrectAnswer,
        original_id: soal.id // Keep original ID for submission
    };
}

// Render current question
function renderQuestion() {
    if (examSoal.length === 0) return;
    
    const soal = examSoal[currentQuestionIndex];
    const questionContainer = document.getElementById('questionContent');
    
    questionContainer.innerHTML = `
        <h2>${soal.pertanyaan}</h2>
        <ul class="options">
            <li class="option-item">
                <label class="option-label">
                    <input type="radio" name="answer" value="a" ${jawaban[soal.original_id] === 'a' ? 'checked' : ''} onchange="submitJawaban(${soal.original_id}, 'a')">
                    <span>A. ${soal.opsi_a}</span>
                </label>
            </li>
            <li class="option-item">
                <label class="option-label">
                    <input type="radio" name="answer" value="b" ${jawaban[soal.original_id] === 'b' ? 'checked' : ''} onchange="submitJawaban(${soal.original_id}, 'b')">
                    <span>B. ${soal.opsi_b}</span>
                </label>
            </li>
            <li class="option-item">
                <label class="option-label">
                    <input type="radio" name="answer" value="c" ${jawaban[soal.original_id] === 'c' ? 'checked' : ''} onchange="submitJawaban(${soal.original_id}, 'c')">
                    <span>C. ${soal.opsi_c}</span>
                </label>
            </li>
            <li class="option-item">
                <label class="option-label">
                    <input type="radio" name="answer" value="d" ${jawaban[soal.original_id] === 'd' ? 'checked' : ''} onchange="submitJawaban(${soal.original_id}, 'd')">
                    <span>D. ${soal.opsi_d}</span>
                </label>
            </li>
        </ul>
    `;
    
    // Update question counter
    document.getElementById('questionNumber').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = examSoal.length;
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Save current index
    localStorage.setItem('currentIndex', currentQuestionIndex.toString());
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const finishBtn = document.getElementById('finishBtn');
    
    prevBtn.style.display = currentQuestionIndex === 0 ? 'none' : 'inline-block';
    
    if (currentQuestionIndex === examSoal.length - 1) {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        finishBtn.style.display = 'none';
    }
}

// Next question
function nextSoal() {
    if (currentQuestionIndex < examSoal.length - 1) {
        const questionContainer = document.getElementById('questionContainer');
        questionContainer.classList.remove('slide-right');
        questionContainer.classList.add('slide-left');
        
        setTimeout(() => {
            currentQuestionIndex++;
            renderQuestion();
            questionContainer.classList.remove('slide-left');
            questionContainer.classList.add('slide-right');
        }, 250);
    }
}

// Previous question
function prevSoal() {
    if (currentQuestionIndex > 0) {
        const questionContainer = document.getElementById('questionContainer');
        questionContainer.classList.remove('slide-left');
        questionContainer.classList.add('slide-right');
        
        setTimeout(() => {
            currentQuestionIndex--;
            renderQuestion();
            questionContainer.classList.remove('slide-right');
            questionContainer.classList.add('slide-left');
        }, 250);
    }
}

// Submit answer
async function submitJawaban(soalId, answer) {
    const user = getCurrentUser();
    if (!user) return;
    
    // Save to local storage
    jawaban[soalId] = answer;
    localStorage.setItem('jawaban', JSON.stringify(jawaban));
    
    // Update navigation
    updateNavigation();
    
    // Submit to server (immediate save)
    try {
        await fetch('/api/ujian/jawab', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: user.id,
                soal_id: soalId,
                jawaban: answer
            })
        });
    } catch (error) {
        console.error('Error submitting answer:', error);
    }
}

// Auto-save to localStorage every 5 seconds
function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        if (examSoal.length > 0) {
            // Save current state
            localStorage.setItem('examSoal', JSON.stringify(examSoal));
            localStorage.setItem('jawaban', JSON.stringify(jawaban));
            localStorage.setItem('currentIndex', currentQuestionIndex.toString());
            
            // Save elapsed time for timer persistence
            if (startTime) {
                const now = new Date();
                const elapsed = Math.floor((now - startTime) / 1000);
                localStorage.setItem('elapsedTime', elapsed.toString());
            }
        }
    }, AUTO_SAVE_INTERVAL);
}

// Auto-sync to backend every 10 seconds (only if changed)
async function startAutoSync(user) {
    if (!user) {
        user = getCurrentUser();
        if (!user) return;
    }
    
    // Initial state
    lastSavedState = JSON.stringify(jawaban);
    updateSyncStatus('synced');
    
    autoSyncInterval = setInterval(async () => {
        const currentState = JSON.stringify(jawaban);
        
        // Only sync if changed
        if (currentState !== lastSavedState) {
            updateSyncStatus('syncing');
            
            try {
                const jawabanData = Object.keys(jawaban).map(soalId => ({
                    soal_id: parseInt(soalId),
                    jawaban: jawaban[soalId]
                }));
                
                const response = await fetch('/api/ujian/jawab-auto', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        jawaban_data: jawabanData
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    lastSavedState = currentState;
                    updateSyncStatus('synced');
                } else {
                    updateSyncStatus('error');
                }
            } catch (error) {
                console.error('Auto-sync error:', error);
                updateSyncStatus('offline');
            }
        }
    }, AUTO_SYNC_INTERVAL);
}

// Update sync status indicator (positioned above watermark)
function updateSyncStatus(status) {
    let statusEl = document.getElementById('syncStatus');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'syncStatus';
        statusEl.style.cssText = 'position: fixed; bottom: 60px; right: 15px; padding: 10px 15px; border-radius: 8px; font-size: 12px; z-index: 9999; backdrop-filter: blur(10px);';
        document.body.appendChild(statusEl);
    }
    
    const statusMap = {
        'synced': { text: '✓ Tersinkron', color: '#28a745', bg: '#d4edda' },
        'syncing': { text: '↻ Menyinkronkan...', color: '#ffc107', bg: '#fff3cd' },
        'error': { text: '✗ Error', color: '#dc3545', bg: '#f8d7da' },
        'offline': { text: '○ Offline', color: '#6c757d', bg: '#e2e3e5' }
    };
    
    const statusInfo = statusMap[status] || statusMap['offline'];
    statusEl.textContent = statusInfo.text;
    statusEl.style.color = statusInfo.color;
    statusEl.style.background = statusInfo.bg;
    statusEl.style.border = `1px solid ${statusInfo.color}`;
}

// Initialize watermark (adjusted to not block content)
function initWatermark(user) {
    const watermark = document.createElement('div');
    watermark.id = 'watermark';
    watermark.style.cssText = `
        position: fixed;
        bottom: 15px;
        right: 15px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.15);
        pointer-events: none;
        z-index: 1;
        white-space: nowrap;
        font-weight: 500;
        user-select: none;
        background: rgba(0, 0, 0, 0.1);
        padding: 4px 8px;
        border-radius: 4px;
        backdrop-filter: blur(2px);
        font-family: 'Inter', monospace;
    `;
    watermark.textContent = `${user.nama} | ${new Date().toLocaleString('id-ID')}`;
    document.body.appendChild(watermark);
    
    // Update timestamp every minute
    setInterval(() => {
        watermark.textContent = `${user.nama} | ${new Date().toLocaleString('id-ID')}`;
    }, 60000);
}

// Initialize activity logging
function initActivityLogging(user) {
    // Log focus/blur
    window.addEventListener('focus', () => {
        logActivity(user.id, 'focus', 'Window mendapat fokus');
    });
    
    window.addEventListener('blur', () => {
        logActivity(user.id, 'blur', 'Window kehilangan fokus');
    });
    
    // Log connection status
    window.addEventListener('online', () => {
        logActivity(user.id, 'online', 'Koneksi internet tersedia');
    });
    
    window.addEventListener('offline', () => {
        logActivity(user.id, 'offline', 'Koneksi internet terputus');
    });
}

// Log activity to backend
async function logActivity(userId, type, details) {
    try {
        await fetch('/api/activity/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                activity_type: type,
                details
            })
        });
    } catch (error) {
        // Silent fail for activity logging
    }
}

// Update question navigation
function updateNavigation() {
    const navGrid = document.getElementById('questionNav');
    navGrid.innerHTML = '';
    
    examSoal.forEach((soal, index) => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.textContent = index + 1;
        
        if (jawaban[soal.original_id]) {
            btn.classList.add('answered');
        }
        
        if (index === currentQuestionIndex) {
            btn.classList.add('current');
        }
        
        btn.onclick = () => {
            currentQuestionIndex = index;
            renderQuestion();
            updateNavigation();
        };
        
        navGrid.appendChild(btn);
    });
}

// Start timer
function startTimer() {
    if (!startTime) return;
    
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

// Update timer display (persistent - continues after refresh)
function updateTimer() {
    if (!startTime) return;
    
    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000);
    const remaining = Math.max(0, EXAM_DURATION - elapsed);
    
    // Save elapsed time for persistence
    localStorage.setItem('elapsedTime', elapsed.toString());
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    
    const timerEl = document.getElementById('timer');
    if (timerEl) {
        timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Auto submit when time is up
        if (remaining === 0) {
            clearInterval(timerInterval);
            if (autoSaveInterval) clearInterval(autoSaveInterval);
            if (autoSyncInterval) clearInterval(autoSyncInterval);
            finishExam();
            return;
        }
        
        // Warning when less than 5 minutes
        if (remaining < 300 && remaining > 0) {
            timerEl.style.color = '#dc3545';
            if (!timerEl.classList.contains('pulse-animation')) {
                timerEl.classList.add('pulse-animation');
            }
        }
    }
}

// Finish exam
async function finishExam(skipConfirm = false) {
    if (!skipConfirm && !confirm('Apakah Anda yakin ingin menyelesaikan ujian?')) {
        return;
    }
    
    const user = getCurrentUser();
    if (!user) return;
    
    // Clear all intervals
    if (timerInterval) clearInterval(timerInterval);
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    
    // Prepare answer data
    const jawabanData = Object.keys(jawaban).map(soalId => ({
        soal_id: parseInt(soalId),
        jawaban: jawaban[soalId]
    }));
    
    try {
        const response = await fetch('/api/ujian/selesai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: user.id,
                jawaban_data: jawabanData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Clear localStorage
            localStorage.removeItem('examSoal');
            localStorage.removeItem('jawaban');
            localStorage.removeItem('startTime');
            localStorage.removeItem('elapsedTime');
            localStorage.removeItem('currentIndex');
            
            // Redirect to result page
            window.location.href = 'result.html';
        } else {
            alert('Gagal menyelesaikan ujian: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error finishing exam:', error);
        alert('Terjadi kesalahan saat menyelesaikan ujian');
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', initExam);

// Warn before leaving page
window.addEventListener('beforeunload', (e) => {
    const examSoal = localStorage.getItem('examSoal');
    if (examSoal) {
        e.preventDefault();
        e.returnValue = '';
    }
});

