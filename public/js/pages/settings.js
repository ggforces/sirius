// ==================== SETTINGS PAGE SPECIFIC ====================

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
    btn.innerHTML = '<span class="btn-icon"><i class="ph-bold ph-circle-notch ph-spin"></i></span>Test ediliyor...';
    
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
        btn.innerHTML = '<span class="btn-icon"><i class="ph-bold ph-flask"></i></span>Test Et';
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
    submitBtn.innerHTML = '<span class="btn-icon"><i class="ph-bold ph-circle-notch ph-spin"></i></span>Kaydediliyor...';
    
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
        submitBtn.innerHTML = '<span class="btn-icon"><i class="ph-bold ph-floppy-disk"></i></span>Kaydet';
    }
}

async function syncFarmlabsDrops() {
    const btn = document.getElementById('syncDropsBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon"><i class="ph-bold ph-circle-notch ph-spin"></i></span>Senkronize ediliyor...';
    
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
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Sync drops error:', error);
        showNotification('Senkronize edilirken hata oluştu', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon"><i class="ph-bold ph-arrows-clockwise"></i></span>Dropleri Senkronize Et';
    }
}

// ==================== EVENT LISTENERS ====================

// Change password form
document.getElementById('changePasswordForm')?.addEventListener('submit', handleChangePassword);

// FarmLabs API key form
document.getElementById('testApiKeyBtn')?.addEventListener('click', testFarmlabsApiKey);
document.getElementById('farmlabsApiKeyForm')?.addEventListener('submit', saveFarmlabsApiKey);
document.getElementById('syncDropsBtn')?.addEventListener('click', syncFarmlabsDrops);

// ==================== INITIALIZE ====================

loadFarmlabsApiKey();
