// Modal Elements
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');

// Buttons
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const heroRegisterBtn = document.getElementById('heroRegisterBtn');

// Close Buttons
const loginClose = document.getElementById('loginClose');
const registerClose = document.getElementById('registerClose');

// Overlays
const loginOverlay = document.getElementById('loginOverlay');
const registerOverlay = document.getElementById('registerOverlay');

// Switch Buttons
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');

// Forms
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// ==================== MODAL FUNCTIONS ====================

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ==================== EVENT LISTENERS ====================

// Open Modals
loginBtn.addEventListener('click', () => openModal(loginModal));
registerBtn.addEventListener('click', () => openModal(registerModal));
heroRegisterBtn.addEventListener('click', () => openModal(registerModal));

// Close Modals
loginClose.addEventListener('click', () => closeModal(loginModal));
registerClose.addEventListener('click', () => closeModal(registerModal));
loginOverlay.addEventListener('click', () => closeModal(loginModal));
registerOverlay.addEventListener('click', () => closeModal(registerModal));

// Switch Between Modals
switchToRegister.addEventListener('click', () => {
    loginModal.classList.remove('active');
    registerModal.classList.add('active');
});

switchToLogin.addEventListener('click', () => {
    registerModal.classList.remove('active');
    loginModal.classList.add('active');
});

// Close on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal(loginModal);
        closeModal(registerModal);
    }
});

// ==================== FORM VALIDATION ====================

// Login Form Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
    
    // Basic validation
    if (!email || !password) {
        showNotification('Lütfen tüm alanları doldurun', 'error');
        return;
    }
    
    // Email validation
    if (!isValidEmail(email)) {
        showNotification('Geçerli bir e-posta adresi girin', 'error');
        return;
    }
    
    // Disable submit button
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Giriş yapılıyor...';
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, rememberMe })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/panel/dashboard';
            }, 1500);
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Bağlantı hatası. Lütfen tekrar deneyin.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Giriş Yap';
    }
});

// Register Form Submit
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    // Basic validation
    if (!email || !password || !passwordConfirm) {
        showNotification('Lütfen tüm alanları doldurun', 'error');
        return;
    }
    
    // Email validation
    if (!isValidEmail(email)) {
        showNotification('Geçerli bir e-posta adresi girin', 'error');
        return;
    }
    
    // Password length validation
    if (password.length < 8) {
        showNotification('Şifre en az 8 karakter olmalıdır', 'error');
        return;
    }
    
    // Password match validation
    if (password !== passwordConfirm) {
        showNotification('Şifreler eşleşmiyor', 'error');
        return;
    }
    
    // Disable submit button
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Kayıt yapılıyor...';
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, passwordConfirm })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/panel/dashboard';
            }, 1500);
        } else {
            // Show validation errors if any
            if (data.errors && data.errors.length > 0) {
                data.errors.forEach(err => {
                    showNotification(err.message, 'error');
                });
            } else {
                showNotification(data.message, 'error');
            }
        }
    } catch (error) {
        console.error('Register error:', error);
        showNotification('Bağlantı hatası. Lütfen tekrar deneyin.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kayıt Ol';
    }
});

// ==================== HELPER FUNCTIONS ====================

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== SMOOTH SCROLL ====================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== PARALLAX EFFECT ====================

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-cards');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ==================== PASSWORD STRENGTH INDICATOR ====================

const registerPassword = document.getElementById('registerPassword');
if (registerPassword) {
    registerPassword.addEventListener('input', (e) => {
        const password = e.target.value;
        calculatePasswordStrength(password);
    });
}

function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    return strength;
}

// ==================== USER SESSION CHECK ====================

async function checkUserSession() {
    try {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // User is logged in
                localStorage.setItem('user', JSON.stringify(data.data.user));
                updateUIForLoggedInUser(data.data.user);
            }
        } else {
            // User is not logged in
            localStorage.removeItem('user');
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
}

function updateUIForLoggedInUser(user) {
    // Update navigation buttons
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons) {
        navButtons.innerHTML = `
            <div class="user-dropdown">
                <button class="btn btn-secondary dropdown-toggle" id="userDropdownBtn">
                    <span class="user-avatar-small">${user.email.charAt(0).toUpperCase()}</span>
                    <span class="user-email-nav">${user.email}</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div class="dropdown-menu" id="userDropdownMenu">
                    <a href="/panel/dashboard" class="dropdown-item">
                        <span class="dropdown-icon"><i class="ph-bold ph-house"></i></span>
                        <span>Panel</span>
                    </a>
                    <a href="#" class="dropdown-item" id="profileLink">
                        <span class="dropdown-icon"><i class="ph-bold ph-user"></i></span>
                        <span>Profil</span>
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item" id="logoutLink">
                        <span class="dropdown-icon"><i class="ph-bold ph-sign-out"></i></span>
                        <span>Çıkış Yap</span>
                    </a>
                </div>
            </div>
        `;
        
        // Add dropdown functionality
        const dropdownBtn = document.getElementById('userDropdownBtn');
        const dropdownMenu = document.getElementById('userDropdownMenu');
        
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdownMenu.classList.remove('show');
        });
        
        // Add logout functionality
        document.getElementById('logoutLink').addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
        
        // Profile link
        document.getElementById('profileLink').addEventListener('click', (e) => {
            e.preventDefault();
            showNotification('Profil sayfası yakında eklenecek!', 'info');
        });
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.removeItem('user');
            showNotification(data.message, 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Çıkış yapılırken hata oluştu.', 'error');
    }
}

// ==================== INITIALIZE ====================

// Check user session on page load
checkUserSession();
