// Authentication functions
async function login(username, password) {
    const errorEl = document.getElementById('errorMessage');
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save user to localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            
            // Redirect to instructions
            window.location.href = 'instructions.html';
        } else {
            // Show error
            if (errorEl) {
                errorEl.textContent = data.message || 'Login gagal';
                errorEl.classList.add('show');
            } else {
                alert(data.message || 'Login gagal');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        if (errorEl) {
            errorEl.textContent = 'Terjadi kesalahan pada server';
            errorEl.classList.add('show');
        } else {
            alert('Terjadi kesalahan pada server');
        }
    }
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('examSoal');
    localStorage.removeItem('jawaban');
    localStorage.removeItem('startTime');
    window.location.href = 'login.html';
}

// Check if user is logged in
function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(user);
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

