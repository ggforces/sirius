// ==================== CHECK AUTHENTICATION ====================

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            // 429 (rate limit) durumunda logout etme
            if (response.status === 429) {
                showNotification('Çok fazla istek gönderildi. Lütfen bekleyin.', 'error');
                return null; // Logout etmeden null dön
            }
            
            // Diğer hatalar için logout et (401, 403, vb.)
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = '/';
            return null;
        }
        
        const data = await response.json();
        if (data.success) {
            return data.data.user;
        } else {
            // Clear any stored user data and redirect
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = '/';
            return null;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        // Clear any stored user data and redirect
        localStorage.removeItem('user');
        localStorage.removeItem('token');
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
    
    // Update stats
    const statBalance = document.getElementById('statBalance');
    if (statBalance) statBalance.textContent = parseFloat(user.balance).toFixed(2);
    
    // Update settings page
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
    
    // Update join time
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
    
    // Load earnings data
    loadEarningsData();
}

// ==================== LOAD EARNINGS DATA ====================

let earningsChart = null;

async function loadEarningsData() {
    try {
        const response = await fetch('/api/earnings/stats', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        if (!data.success) return;
        
        const earnings = data.data;
        
        // Update stats cards with dynamic font sizing
        updateStatValue('statThisWeek', earnings.thisWeek);
        updateStatValue('statThisMonth', earnings.thisMonth);
        updateStatValue('statLast3Months', earnings.last3Months);
        updateStatValue('statTotal', earnings.total);
        
        // Update last update time
        updateLastUpdateTime(earnings.lastUpdate);
        
        // Create chart
        createEarningsChart(earnings.weekly, earnings.monthBoundaries);
        
    } catch (error) {
        console.error('Load earnings error:', error);
    }
}

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

function updateLastUpdateTime(lastUpdate) {
    const lastUpdateEl = document.getElementById('earningsLastUpdate');
    if (!lastUpdateEl) return;
    
    if (!lastUpdate) {
        lastUpdateEl.textContent = 'Son güncelleme: Henüz veri yok';
        return;
    }
    
    const updateDate = new Date(lastUpdate);
    const timeString = updateDate.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    lastUpdateEl.textContent = `Son güncelleme: ${timeString}`;
}

async function refreshEarningsData() {
    const btn = document.getElementById('refreshEarningsBtn');
    if (!btn) return;
    
    // Disable button and show loading
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="btn-icon">⏳</span>Güncelleniyor...';
    
    try {
        // Check if FarmLabs API key exists
        const apiKeyResponse = await fetch('/api/farmlabs/api-key', {
            method: 'GET',
            credentials: 'include'
        });
        
        const apiKeyData = await apiKeyResponse.json();
        
        if (!apiKeyData.success || !apiKeyData.data.hasApiKey) {
            showNotification('⚠️ FarmLabs API key ayarlanmamış. Lütfen önce Ayarlar sayfasından API key ekleyin.', 'error');
            return;
        }
        
        // Sync drops from FarmLabs
        btn.innerHTML = '<span class="btn-icon">🔄</span>Senkronize ediliyor...';
        const syncResponse = await fetch('/api/farmlabs/sync', {
            method: 'POST',
            credentials: 'include'
        });
        
        const syncData = await syncResponse.json();
        
        if (!syncData.success) {
            showNotification(`❌ ${syncData.message}`, 'error');
            return;
        }
        
        // Reload earnings data
        btn.innerHTML = '<span class="btn-icon">📊</span>Yükleniyor...';
        await loadEarningsData();
        
        // Show success message with details
        showNotification(
            `✅ ${syncData.data.totalDrops} drop senkronize edildi! (${syncData.data.daysProcessed} gün)`,
            'success'
        );
    } catch (error) {
        console.error('Refresh earnings error:', error);
        showNotification('❌ Güncelleme hatası!', 'error');
    } finally {
        // Re-enable button
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function createEarningsChart(weeklyData, monthBoundaries) {
    const ctx = document.getElementById('earningsChart');
    if (!ctx) return;
    
    // Destroy existing chart if any
    if (earningsChart) {
        earningsChart.destroy();
    }
    
    const labels = weeklyData.map(w => w.week);
    const amounts = weeklyData.map(w => parseFloat(w.amount));
    const counts = weeklyData.map(w => w.count);
    
    // Ay sınırlarında dikey çizgi plugin
    const monthLinePlugin = {
        id: 'monthLines',
        afterDraw(chart) {
            const ctx = chart.ctx;
            monthBoundaries.forEach(i => {
                const x = chart.scales.x.getPixelForValue(i);
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(x, chart.chartArea.top);
                ctx.lineTo(x, chart.chartArea.bottom);
                ctx.stroke();
                ctx.restore();
            });
        }
    };
    
    // Çubuk üzerinde bilgi gösterme plugin
    const barLabelPlugin = {
        id: 'barLabels',
        afterDatasetsDraw(chart) {
            const ctx = chart.ctx;
            chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                meta.data.forEach((bar, index) => {
                    const val = dataset.data[index];
                    const cnt = counts[index];
                    
                    if (val > 0 && cnt > 0) {
                        // Gerçek drop sayısı (hesap sayısı = drop / 2)
                        const realDropCount = Math.floor(cnt / 2);
                        
                        // Drop sayısı (üstte)
                        ctx.fillStyle = '#ccd6f6';
                        ctx.font = 'bold 11px Rajdhani';
                        ctx.textAlign = 'center';
                        ctx.fillText(realDropCount + ' drop', bar.x, bar.y - 34);
                        
                        // Toplam kazanç (ortada, yeşil)
                        ctx.fillStyle = '#00ff88';
                        ctx.font = 'bold 13px Rajdhani';
                        ctx.fillText('$' + val.toFixed(2), bar.x, bar.y - 19);
                        
                        // Ortalama kazanç (altta, turuncu) - gerçek drop sayısına göre
                        const avg = realDropCount > 0 ? (val / realDropCount).toFixed(2) : '0.00';
                        ctx.fillStyle = '#ffa500';
                        ctx.font = 'bold 11px Rajdhani';
                        ctx.fillText('~$' + avg, bar.x, bar.y - 5);
                    }
                });
            });
        }
    };
    
    earningsChart = new Chart(ctx, {
        type: 'bar',
        plugins: [monthLinePlugin, barLabelPlugin],
        data: {
            labels,
            datasets: [{
                label: 'Haftalık Kazanç ($)',
                data: amounts,
                backgroundColor: 'rgba(0, 212, 255, 0.7)',
                borderColor: '#00d4ff',
                borderWidth: 1,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grace: '40%',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#8892b0',
                        font: {
                            family: 'Rajdhani',
                            size: 12
                        },
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#8892b0',
                        font: {
                            family: 'Rajdhani',
                            size: 10
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
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

// ==================== PAGE NAVIGATION ====================

function switchPage(pageName) {
    // Update URL without reload
    const url = `/panel/${pageName}`;
    window.history.pushState({ page: pageName }, '', url);
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show selected page
    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'accounts': 'Steam Hesapları',
        'tasks': 'Görevler',
        'reports': 'Raporlar',
        'settings': 'Ayarlar'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[pageName] || 'Dashboard';
    }
    
    // Initialize page-specific functionality
    if (pageName === 'tasks' && typeof tasksManager !== 'undefined') {
        // Reinitialize tasks manager to refresh data
        tasksManager.loadAccounts();
    }
    
    if (pageName === 'accounts' && typeof loadAccounts !== 'undefined') {
        // Reload accounts when switching to accounts page
        loadAccounts();
    }
}

// Load correct page based on URL
function loadPageFromURL() {
    const path = window.location.pathname;
    const match = path.match(/\/panel\/(\w+)/);
    
    if (match && match[1]) {
        const pageName = match[1];
        switchPage(pageName);
    } else if (path === '/panel' || path === '/panel/') {
        switchPage('dashboard');
    }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        switchPage(event.state.page);
    } else {
        loadPageFromURL();
    }
});

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

// Make dashboard functions globally available
window.dashboard = {
    showPage: switchPage
};

// ==================== CHANGE PASSWORD ====================

async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    // Validation
    if (newPassword.length < 8) {
        showNotification('Yeni şifre en az 8 karakter olmalıdır', 'error');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showNotification('Yeni şifreler eşleşmiyor', 'error');
        return;
    }
    
    if (currentPassword === newPassword) {
        showNotification('Yeni şifre mevcut şifreden farklı olmalıdır', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Değiştiriliyor...';
    
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            document.getElementById('changePasswordForm').reset();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Change password error:', error);
        showNotification('Bağlantı hatası. Lütfen tekrar deneyin.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-icon">💾</span>Şifreyi Değiştir';
    }
}

// ==================== FARMLABS API KEY ====================

async function loadFarmlabsApiKey() {
    try {
        const response = await fetch('/api/farmlabs/api-key', {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.data.hasApiKey) {
            const statusEl = document.getElementById('apiKeyStatus');
            if (statusEl) {
                statusEl.textContent = `API key kaydedilmiş (${data.data.updatedAt})`;
                statusEl.style.color = '#00d084';
            }
        }
    } catch (error) {
        console.error('Load FarmLabs API key error:', error);
    }
}

async function testFarmlabsApiKey() {
    const apiKeyInput = document.getElementById('farmlabsApiKey');
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showNotification('Lütfen API key girin', 'error');
        return;
    }
    
    const btn = document.getElementById('testApiKeyBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span>Test ediliyor...';
    
    try {
        const response = await fetch('/api/farmlabs/api-key/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ apiKey })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ API key geçerli!', 'success');
        } else {
            showNotification('❌ API key geçersiz!', 'error');
        }
    } catch (error) {
        console.error('Test API key error:', error);
        showNotification('Test edilirken hata oluştu', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">🧪</span>Test Et';
    }
}

async function saveFarmlabsApiKey(e) {
    e.preventDefault();
    
    const apiKeyInput = document.getElementById('farmlabsApiKey');
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showNotification('Lütfen API key girin', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span>Kaydediliyor...';
    
    try {
        const response = await fetch('/api/farmlabs/api-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ apiKey })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            apiKeyInput.value = '';
            loadFarmlabsApiKey();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Save API key error:', error);
        showNotification('Kaydedilirken hata oluştu', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-icon">💾</span>Kaydet';
    }
}

async function syncFarmlabsDrops() {
    const btn = document.getElementById('syncDropsBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span>Senkronize ediliyor...';
    
    try {
        const response = await fetch('/api/farmlabs/sync', {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(
                `✅ ${data.data.totalDrops} drop senkronize edildi! (${data.data.daysProcessed} gün)`,
                'success'
            );
            
            // Kazanç verilerini yenile
            if (typeof loadEarningsData === 'function') {
                await loadEarningsData();
            }
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Sync drops error:', error);
        showNotification('Senkronize edilirken hata oluştu', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">🔄</span>Dropleri Senkronize Et';
    }
}

// ==================== EVENT LISTENERS ====================

// Logout button
document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

// Change password form
document.getElementById('changePasswordForm')?.addEventListener('submit', handleChangePassword);

// FarmLabs API key form
document.getElementById('testApiKeyBtn')?.addEventListener('click', testFarmlabsApiKey);
document.getElementById('farmlabsApiKeyForm')?.addEventListener('submit', saveFarmlabsApiKey);
document.getElementById('syncDropsBtn')?.addEventListener('click', syncFarmlabsDrops);

// Add account buttons (from empty states)
document.getElementById('addFirstAccountDashboard')?.addEventListener('click', () => {
    // Switch to accounts page and open add modal
    switchPage('accounts');
    // Wait a bit for page to load, then trigger add modal
    setTimeout(() => {
        if (typeof openAddModal === 'function') {
            openAddModal();
        } else {
            // Fallback: click the add account button
            document.getElementById('addAccountBtn')?.click();
        }
    }, 100);
});

document.getElementById('addAccountFromTasks')?.addEventListener('click', () => {
    // Switch to accounts page
    switchPage('accounts');
});

// Navigation items
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = item.getAttribute('data-page');
        if (pageName) {
            switchPage(pageName);
        }
    });
});

// Action buttons (placeholder)
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showNotification('Bu özellik yakında eklenecek!', 'info');
    });
});

// Notification button
document.getElementById('notificationBtn')?.addEventListener('click', () => {
    showNotification('Bildirimler yakında eklenecek!', 'info');
});

// Refresh earnings button
document.getElementById('refreshEarningsBtn')?.addEventListener('click', refreshEarningsData);

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
            mainContent.addEventListener('click', () => {
                if (sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                }
            });
        }
    }
};

// ==================== INITIALIZE ====================

loadUserData();
loadPageFromURL(); // Load correct page based on URL
loadFarmlabsApiKey(); // Load FarmLabs API key status
createMobileToggle();

// Handle window resize
window.addEventListener('resize', createMobileToggle);
