// Anti-cheat detection system
let violationCount = 0;
const MAX_VIOLATIONS = 5;
let isLocked = false;
let isFullscreen = false;

// Initialize anti-cheat
function initAntiCheat() {
  // Detect fullscreen changes
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  
  // Detect window blur/focus
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('focus', handleWindowFocus);
  
  // Detect F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
  document.addEventListener('keydown', handleKeyDown);
  
  // Detect right click
  document.addEventListener('contextmenu', handleRightClick);
  
  // Detect copy/paste
  document.addEventListener('copy', handleCopy);
  document.addEventListener('paste', handlePaste);
  
  // Detect refresh (Ctrl+R, F5)
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Detect DevTools (simple detection)
  detectDevTools();
  
  // Periodic check for lock status
  setInterval(checkLockStatus, 5000);
  
  // Check for fullscreen on init
  checkFullscreen();
}

// Handle fullscreen change
function handleFullscreenChange() {
  const isCurrentlyFullscreen = !!(document.fullscreenElement || 
    document.webkitFullscreenElement || 
    document.mozFullScreenElement || 
    document.msFullscreenElement);
  
  if (isFullscreen && !isCurrentlyFullscreen) {
    logViolation('fullscreen_exit', 'Keluar dari mode fullscreen');
  }
  
  isFullscreen = isCurrentlyFullscreen;
}

// Check current fullscreen status
function checkFullscreen() {
  isFullscreen = !!(document.fullscreenElement || 
    document.webkitFullscreenElement || 
    document.mozFullScreenElement || 
    document.msFullscreenElement);
}

// Handle window blur (Alt+Tab, switching windows)
function handleWindowBlur() {
  logViolation('window_blur', 'Window kehilangan fokus (kemungkinan Alt+Tab)');
}

// Handle window focus
function handleWindowFocus() {
  checkLockStatus();
}

// Handle keyboard shortcuts
function handleKeyDown(e) {
  // F12
  if (e.key === 'F12') {
    e.preventDefault();
    logViolation('f12_pressed', 'Tombol F12 ditekan');
    return false;
  }
  
  // Ctrl+Shift+I (DevTools)
  if (e.ctrlKey && e.shiftKey && e.key === 'I') {
    e.preventDefault();
    logViolation('devtools_shortcut', 'Shortcut DevTools (Ctrl+Shift+I) ditekan');
    return false;
  }
  
  // Ctrl+Shift+J (Console)
  if (e.ctrlKey && e.shiftKey && e.key === 'J') {
    e.preventDefault();
    logViolation('console_shortcut', 'Shortcut Console (Ctrl+Shift+J) ditekan');
    return false;
  }
  
  // Ctrl+U (View Source)
  if (e.ctrlKey && e.key === 'u') {
    e.preventDefault();
    logViolation('view_source', 'Shortcut View Source (Ctrl+U) ditekan');
    return false;
  }
  
  // Ctrl+R or F5 (Refresh)
  if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
    // Allow refresh but log it
    logViolation('page_refresh', 'Page refresh terdeteksi');
  }
  
  // Ctrl+Shift+C (Inspect)
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    logViolation('inspect_shortcut', 'Shortcut Inspect (Ctrl+Shift+C) ditekan');
    return false;
  }
}

// Handle right click
function handleRightClick(e) {
  e.preventDefault();
  logViolation('right_click', 'Klik kanan diblokir');
  return false;
}

// Handle copy
function handleCopy(e) {
  e.preventDefault();
  logViolation('copy_attempt', 'Copy diblokir');
  return false;
}

// Handle paste
function handlePaste(e) {
  e.preventDefault();
  logViolation('paste_attempt', 'Paste diblokir');
  return false;
}

// Handle before unload (refresh)
function handleBeforeUnload(e) {
  const examSoal = localStorage.getItem('examSoal');
  if (examSoal) {
    logViolation('page_unload', 'Mencoba meninggalkan halaman');
    e.preventDefault();
    e.returnValue = '';
  }
}

// Detect DevTools (simple method)
function detectDevTools() {
  let devtools = false;
  const threshold = 160;
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools) {
        devtools = true;
        logViolation('devtools_open', 'DevTools terdeteksi terbuka');
      }
    } else {
      devtools = false;
    }
  }, 1000);
}

// Log violation to backend
async function logViolation(jenis, deskripsi) {
  if (isLocked) return;
  
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    const response = await fetch('/api/anticheat/violation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user.id,
        jenis,
        deskripsi
      })
    });
    
    const result = await response.json();
    if (result.success) {
      violationCount = result.violation_count || violationCount + 1;
      
      // Show warning
      if (violationCount >= 3 && violationCount < MAX_VIOLATIONS) {
        showViolationWarning(`Peringatan: Anda telah melakukan ${violationCount} pelanggaran. Hati-hati!`);
      }
      
      // Lock if exceeded
      if (violationCount >= MAX_VIOLATIONS) {
        lockExam('Anda telah di-lock karena melebihi batas pelanggaran');
      }
    }
  } catch (error) {
    console.error('Error logging violation:', error);
  }
}

// Check lock status from server
async function checkLockStatus() {
  if (isLocked) return;
  
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    const response = await fetch(`/api/anticheat/lock-status/${user.id}`);
    const result = await response.json();
    
    if (result.success && result.locked) {
      lockExam('Akun Anda telah di-lock oleh administrator');
    }
  } catch (error) {
    console.error('Error checking lock status:', error);
  }
}

// Lock exam
function lockExam(reason) {
  if (isLocked) return;
  
  isLocked = true;
  
  // Clear intervals
  if (typeof timerInterval !== 'undefined') {
    clearInterval(timerInterval);
  }
  if (typeof autoSaveInterval !== 'undefined') {
    clearInterval(autoSaveInterval);
  }
  if (typeof autoSyncInterval !== 'undefined') {
    clearInterval(autoSyncInterval);
  }
  
  // Show lock message
  showLockMessage(reason);
  
  // Auto submit after 5 seconds
  setTimeout(() => {
    if (typeof finishExam === 'function') {
      finishExam();
    } else {
      window.location.href = 'result.html';
    }
  }, 5000);
}

// Show violation warning
function showViolationWarning(message) {
  const warningEl = document.getElementById('violationWarning');
  if (warningEl) {
    warningEl.textContent = message;
    warningEl.style.display = 'block';
    warningEl.classList.add('show');
    
    setTimeout(() => {
      warningEl.style.display = 'none';
      warningEl.classList.remove('show');
    }, 5000);
  } else {
    alert(message);
  }
}

// Show lock message
function showLockMessage(reason) {
  const lockModal = document.createElement('div');
  lockModal.id = 'lockModal';
  lockModal.className = 'lock-modal';
  lockModal.innerHTML = `
    <div class="lock-modal-content">
      <h2>⚠️ Akses Diblokir</h2>
      <p>${reason}</p>
      <p>Ujian akan otomatis diselesaikan dalam 5 detik...</p>
    </div>
  `;
  document.body.appendChild(lockModal);
}

// Request fullscreen
function requestFullscreen() {
  const elem = document.documentElement;
  
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Only init on exam page
    if (window.location.pathname.includes('exam.html')) {
      initAntiCheat();
      
      // Request fullscreen
      setTimeout(() => {
        requestFullscreen();
      }, 1000);
    }
  });
}

