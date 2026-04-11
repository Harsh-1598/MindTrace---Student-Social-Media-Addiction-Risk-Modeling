// frontend/app.js

// Constants - since we are served by the same Flask server, we can use relative paths!
const API_URL = '/api';

// --- AUTHENTICATION MODULE --- //

// Check if user is logged in
function checkAuth() {
    const userId = localStorage.getItem('authToken');
    const path = window.location.pathname;
    const isAuthPage = path.endsWith('index.html') || path === '/' || path === '';

    if (userId && isAuthPage) {
        window.location.href = 'dashboard.html';
    } else if (!userId && !isAuthPage) {
        window.location.href = 'index.html';
    }
    
    return userId;
}

// Fetch user data from backend
async function fetchUserData() {
    const userId = localStorage.getItem('authToken');
    if (!userId) return null;
    
    try {
        const response = await fetch(`${API_URL}/user/${userId}`);
        const result = await response.json();
        if(result.success) return result.user;
        return null;
    } catch(e) {
        console.error(e);
        return null;
    }
}

// Register user
async function registerUser(name, email, password, gender) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, gender })
        });
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('authToken', result.token);
            return { success: true };
        }
        return { success: false, message: result.message };
    } catch(e) {
        return { success: false, message: e.message };
    }
}

// Login user
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('authToken', result.token);
            return { success: true };
        }
        return { success: false, message: result.message };
    } catch(e) {
        return { success: false, message: e.message };
    }
}

// Logout user
function logoutUser() {
    localStorage.removeItem('authToken');
    window.location.href = 'index.html';
}

// --- HISTORY MODULE --- //

// Get user predictions directly from sqlite via API
async function getPredictionHistory() {
    const userId = localStorage.getItem('authToken');
    if (!userId) return [];
    
    try {
        const response = await fetch(`${API_URL}/history/${userId}`);
        const result = await response.json();
        if(result.success) return result.history;
        return [];
    } catch(e) {
        console.error(e);
        return [];
    }
}

// --- PREDICTION MODULE --- //

async function predictAddiction(formData) {
    try {
        const userId = localStorage.getItem('authToken');
        // append user_id so backend knows who to log/predict for 
        // (and backend pulls gender automatically!)
        const payload = { ...formData, user_id: parseInt(userId) };
        console.log('Sending prediction request:', payload);
        
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        console.log('Server response status:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('Server error data:', error);
            throw new Error(error.error || `Server returned ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Prediction result:', result);
        return result;
    } catch (error) {
        console.error('Fetch error:', error);
        showToast(`Error: ${error.message}`, 'error');
        throw error;
    }
}

// --- UI HELPERS --- //

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'rgba(139,0,0,0.9)' : 'rgba(0,100,0,0.9)';
    toast.style.cssText = `background: ${bgColor}; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); opacity: 0; transform: translateY(-20px); transition: all 0.3s ease; border-left: 4px solid var(--secondary); font-family: var(--font-body); backdrop-filter: blur(10px);`;
    toast.innerText = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add Dropdown logic
function setupDropdown(user) {
    const userContainer = document.getElementById('nav-user-container');
    if (!userContainer) return;

    userContainer.innerHTML = `
        <div class="user-profile" id="userProfileBtn">
            <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
            <span class="user-name">${user.name.split(' ')[0]} ▾</span>
        </div>
        <div class="dropdown-menu" id="userDropdown">
            <div class="dropdown-header">
                <strong>${user.name}</strong>
                <div style="font-size:0.8rem;color:#888;">${user.email}</div>
            </div>
            <hr style="margin: 0.5rem 0; border-color: rgba(255,255,255,0.1)">
            <a href="insights.html">📊 Model Insights</a>
            <a href="settings.html">⚙️ Settings</a>
            <a href="#" id="logout-btn" style="color: #ff4c4c;">🚪 Sign Out</a>
        </div>
    `;

    const userProfileBtn = document.getElementById('userProfileBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logout-btn');

    userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!userContainer.contains(e.target)) {
            userDropdown.classList.remove('show');
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
    });
}

// Set up UI components when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const userId = checkAuth();
    
    if (userId) {
        const user = await fetchUserData();
        if (user) {
            setupDropdown(user);
        }
    }
    
    // Connect range sliders to displays
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const display = document.getElementById(`${slider.id}Display`);
        if (display) {
            // Initial value
            display.textContent = slider.value;
            // Update on input
            slider.addEventListener('input', () => {
                display.textContent = slider.value;
            });
        }
    });
});
