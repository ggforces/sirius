// ==================== CHECK AUTHENTICATION ====================

// ==================== TRANSLATION HELPER ====================

/**
 * Get translation by key path (e.g., 'tasks.table.taskId')
 * @param {string} keyPath - Dot-separated key path
 * @param {object} params - Optional parameters for string interpolation
 * @returns {string} - Translated string or key path if not found
 */
function t(keyPath, params = {}) {
    if (!window.APP_TRANSLATIONS) {
        console.warn('Translations not loaded');
        return keyPath;
    }
    
    const keys = keyPath.split('.');
    let value = window.APP_TRANSLATIONS;
    
    // Navigate through nested object
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            console.warn(`Translation not found: ${keyPath}`);
            return keyPath;
        }
    }
    
    // Handle string interpolation
    if (typeof value === 'string' && Object.keys(params).length > 0) {
        Object.keys(params).forEach(param => {
            value = value.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
        });
    }
    
    return typeof value === 'string' ? value : keyPath;
}

// Make translation function globally available
window.t = t;

// ==================== CHECK AUTHENTICATION ====================

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            window.location.href = '/';
            return null;
        }
        
        const data = await response.json();
        if (data.success) {
            return data.data.user;
        } else {
            window.location.href = '/';
            return null;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/';
        return null;
    }
}

// ==================== LOAD USER DATA ====================

async function loadUserData() {
    const user = await checkAuth();
    if (!user) return;
    
    // Update sidebar user info
    const sidebarEmail = document.getElementById('sidebarUserEmail');
    const sidebarBalance = document.getElementById('sidebarUserBalance');
    const userInitial = document.getElementById('userInitial');
    
    if (sidebarEmail) sidebarEmail.textContent = user.email;
    if (sidebarBalance) sidebarBalance.textContent = parseFloat(user.balance).toFixed(2);
    if (userInitial) userInitial.textContent = user.email.charAt(0).toUpperCase();
    
    // Update settings page if exists
    const settingsEmail = document.getElementById('settingsEmail');
    const settingsCreatedAt = document.getElementById('settingsCreatedAt');
    const settingsLastLogin = document.getElementById('settingsLastLogin');
    
    if (settingsEmail) settingsEmail.textContent = user.email;
    
    if (settingsCreatedAt && user.created_at) {
        const date = new Date(user.created_at);
        settingsCreatedAt.textContent = date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    if (settingsLastLogin && user.last_login) {
        const date = new Date(user.last_login);
        settingsLastLogin.textContent = date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (settingsLastLogin) {
        settingsLastLogin.textContent = 'İlk giriş';
    }
    
    // Update join time if exists
    const joinTime = document.getElementById('joinTime');
    if (user.created_at && joinTime) {
        const createdDate = new Date(user.created_at);
        const now = new Date();
        const diffMinutes = Math.floor((now - createdDate) / 1000 / 60);
        
        if (diffMinutes < 1) {
            joinTime.textContent = 'Az önce';
        } else if (diffMinutes < 60) {
            joinTime.textContent = `${diffMinutes} dakika önce`;
        } else if (diffMinutes < 1440) {
            const hours = Math.floor(diffMinutes / 60);
            joinTime.textContent = `${hours} saat önce`;
        } else {
            const days = Math.floor(diffMinutes / 1440);
            joinTime.textContent = `${days} gün önce`;
        }
    }
    
    return user;
}

// ==================== LOGOUT ====================

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
                window.location.href = '/';
            }, 1000);
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Çıkış yapılırken hata oluştu.', 'error');
    }
}

// ==================== NOTIFICATION ====================

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

// Make showNotification globally available
window.showNotification = showNotification;

// ==================== UTILITY FUNCTIONS ====================

/**
 * Stat değerini günceller ve uzun sayılar için font boyutunu dinamik olarak ayarlar
 */
function updateStatValue(elementId, value, isDecimal = true) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Değeri formatla
    const formattedValue = isDecimal ? parseFloat(value).toFixed(2) : value.toString();
    element.textContent = formattedValue;
    
    // Parent stat-value elementini bul
    const statValueEl = element.parentElement;
    if (!statValueEl || !statValueEl.classList.contains('stat-value')) return;
    
    // $ sembolü + sayı uzunluğunu hesapla
    const totalLength = formattedValue.length + 1; // +1 for $ symbol
    let fontSize;
    
    // Daha agresif küçültme
    if (totalLength <= 5) {
        fontSize = '1.75rem';
    } else if (totalLength === 6) {
        fontSize = '1.65rem';
    } else if (totalLength === 7) {
        fontSize = '1.5rem';
    } else if (totalLength === 8) {
        fontSize = '1.35rem';
    } else if (totalLength === 9) {
        fontSize = '1.2rem';
    } else if (totalLength === 10) {
        fontSize = '1.1rem';
    } else if (totalLength === 11) {
        fontSize = '1rem';
    } else {
        fontSize = '0.9rem';
    }
    
    statValueEl.style.fontSize = fontSize;
}

// ==================== EVENT LISTENERS ====================

// Logout buttons (both topbar and sidebar)
document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
document.getElementById('sidebarLogoutBtn')?.addEventListener('click', handleLogout);

// Notification button
document.getElementById('notificationBtn')?.addEventListener('click', () => {
    showNotification('Bildirimler yakında eklenecek!', 'info');
});

// Language switcher (sidebar version)
document.querySelectorAll('.sidebar-lang-btn').forEach(btn => {
    const lang = btn.getAttribute('data-lang');
    
    // Set active state based on current language
    if (window.APP_LANG === lang) {
        btn.classList.add('active');
    }
    
    btn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/language', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ lang })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Save current scroll position
                sessionStorage.setItem('scrollPosition', window.scrollY);
                
                // Reload page to apply new language
                window.location.reload();
            } else {
                showNotification('Dil değiştirilemedi', 'error');
            }
        } catch (error) {
            console.error('Language switch error:', error);
            showNotification('Dil değiştirilemedi', 'error');
        }
    });
});

// Mobile sidebar toggle (for responsive)
const createMobileToggle = () => {
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        // Create toggle button if not exists
        if (!document.getElementById('sidebarToggle')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'sidebarToggle';
            toggleBtn.className = 'sidebar-toggle';
            toggleBtn.innerHTML = '☰';
            toggleBtn.style.cssText = `
                position: fixed;
                top: 15px;
                left: 15px;
                z-index: 1001;
                background: rgba(0, 212, 255, 0.2);
                border: 1px solid var(--primary);
                color: var(--primary);
                width: 40px;
                height: 40px;
                border-radius: 8px;
                font-size: 1.5rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            document.body.appendChild(toggleBtn);
            
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
            
            // Close sidebar when clicking outside
            mainContent?.addEventListener('click', () => {
                if (sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                }
            });
        }
    }
};

// ==================== INITIALIZE ====================

loadUserData();
createMobileToggle();

// Handle window resize
window.addEventListener('resize', createMobileToggle);

// Restore scroll position after language change
window.addEventListener('load', () => {
    const savedScrollPosition = sessionStorage.getItem('scrollPosition');
    if (savedScrollPosition) {
        window.scrollTo(0, parseInt(savedScrollPosition));
        sessionStorage.removeItem('scrollPosition');
    }
});
