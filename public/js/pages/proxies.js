// ==================== STATE ====================

let proxies = [];
let proxyStats = {};
let currentProxyMethod = 'manual';
let deletingProxyId = null;

// ==================== LOAD DATA ====================

async function loadProxyMethod() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.user) {
            currentProxyMethod = data.user.proxy_method || 'manual';
            updateMethodButtons();
            showMethodSection();
        }
    } catch (error) {
        console.error('Load proxy method error:', error);
    }
}

async function loadProxies() {
    try {
        const response = await fetch('/api/proxies', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            proxies = data.proxies;
            renderProxies();
        } else {
            showNotification(data.message || 'Proxy\'ler yüklenemedi', 'error');
        }
    } catch (error) {
        console.error('Load proxies error:', error);
        showNotification('Proxy\'ler yüklenirken hata oluştu', 'error');
    }
}

async function loadProxyStats() {
    try {
        const response = await fetch('/api/proxies/stats', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            proxyStats = data.stats;
            renderStats();
        }
    } catch (error) {
        console.error('Load proxy stats error:', error);
    }
}

// ==================== RENDER ====================

function renderStats() {
    document.getElementById('statTotalProxies').textContent = proxyStats.total || 0;
    document.getElementById('statAvailableProxies').textContent = proxyStats.available || 0;
    document.getElementById('statLockedProxies').textContent = proxyStats.locked || 0;
    document.getElementById('statCooldownProxies').textContent = proxyStats.in_cooldown || 0;
}

function renderProxies() {
    const tbody = document.getElementById('proxiesTableBody');
    const emptyState = document.getElementById('emptyProxiesState');
    const table = document.getElementById('proxiesTable');
    
    if (proxies.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    tbody.innerHTML = proxies.map(proxy => {
        const status = getProxyStatus(proxy);
        const health = getProxyHealth(proxy);
        const lastUsed = proxy.last_used_at 
            ? new Date(proxy.last_used_at).toLocaleString('tr-TR')
            : 'Hiç kullanılmadı';
        
        return `
            <tr data-id="${proxy.id}">
                <td class="proxy-ip">${escapeHtml(proxy.ip)}</td>
                <td class="proxy-port">${proxy.port}</td>
                <td class="proxy-username">${escapeHtml(proxy.username)}</td>
                <td class="proxy-status">
                    <span class="status-badge status-${status.class}">${status.text}</span>
                </td>
                <td class="proxy-health">
                    <div class="health-indicator">
                        <span class="health-success">✓ ${proxy.success_count}</span>
                        <span class="health-failure">✗ ${proxy.failure_count}</span>
                        <span class="health-rate">${health}%</span>
                    </div>
                </td>
                <td class="proxy-last-used">${lastUsed}</td>
                <td class="actions-cell">
                    <button class="btn-icon-small btn-delete" data-id="${proxy.id}" title="Sil">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Event listeners
    attachTableEventListeners();
}

function getProxyStatus(proxy) {
    const now = new Date();
    
    if (proxy.is_locked) {
        return { class: 'locked', text: 'Kilitli' };
    }
    
    if (proxy.cooldown_until && new Date(proxy.cooldown_until) > now) {
        return { class: 'cooldown', text: 'Beklemede' };
    }
    
    return { class: 'available', text: 'Kullanılabilir' };
}

function getProxyHealth(proxy) {
    const total = proxy.success_count + proxy.failure_count;
    if (total === 0) return 100;
    return Math.round((proxy.success_count / total) * 100);
}

function updateMethodButtons() {
    const manualBtn = document.getElementById('manualMethodBtn');
    const webshareBtn = document.getElementById('webshareMethodBtn');
    
    manualBtn.classList.toggle('active', currentProxyMethod === 'manual');
    webshareBtn.classList.toggle('active', currentProxyMethod === 'webshare');
}

function showMethodSection() {
    const manualSection = document.getElementById('manualProxySection');
    const webshareSection = document.getElementById('webshareSection');
    
    if (currentProxyMethod === 'manual') {
        manualSection.style.display = 'block';
        webshareSection.style.display = 'none';
    } else {
        manualSection.style.display = 'none';
        webshareSection.style.display = 'block';
    }
}

// ==================== MODAL FUNCTIONS ====================

function openAddProxyModal() {
    document.getElementById('proxyForm').reset();
    document.getElementById('proxyModal').classList.add('active');
}

function closeProxyModal() {
    document.getElementById('proxyModal').classList.remove('active');
    document.getElementById('proxyForm').reset();
}

function openDeleteProxyModal(proxyId) {
    const proxy = proxies.find(p => p.id === proxyId);
    if (!proxy) return;
    
    deletingProxyId = proxyId;
    document.getElementById('deleteProxyInfo').textContent = `${proxy.ip}:${proxy.port}`;
    document.getElementById('deleteProxyModal').classList.add('active');
}

function closeDeleteProxyModal() {
    document.getElementById('deleteProxyModal').classList.remove('active');
    deletingProxyId = null;
}

// ==================== API CALLS ====================

async function handleProxyFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitProxyBtn');
    const originalHTML = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ph-bold ph-circle-notch ph-spin"></i>';
    
    const formData = {
        ip: document.getElementById('proxyIp').value.trim(),
        port: parseInt(document.getElementById('proxyPort').value),
        username: document.getElementById('proxyUsername').value.trim(),
        password: document.getElementById('proxyPassword').value
    };
    
    try {
        const response = await fetch('/api/proxies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            closeProxyModal();
            await loadProxies();
            await loadProxyStats();
        } else {
            showNotification(data.message || 'İşlem başarısız', 'error');
        }
    } catch (error) {
        console.error('Form submit error:', error);
        showNotification('Bir hata oluştu', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    }
}

async function handleDeleteProxy() {
    if (!deletingProxyId) return;
    
    const confirmBtn = document.getElementById('confirmDeleteProxyBtn');
    const originalHTML = confirmBtn.innerHTML;
    
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="ph-bold ph-circle-notch ph-spin"></i>';
    
    try {
        const response = await fetch(`/api/proxies/${deletingProxyId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            closeDeleteProxyModal();
            await loadProxies();
            await loadProxyStats();
        } else {
            showNotification(data.message || 'Silme işlemi başarısız', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Bir hata oluştu', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalHTML;
    }
}

async function handleMethodChange(method) {
    try {
        const response = await fetch('/api/proxies/method', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ method })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentProxyMethod = method;
            updateMethodButtons();
            showMethodSection();
            showNotification(data.message, 'success');
        } else {
            showNotification(data.message || 'İşlem başarısız', 'error');
        }
    } catch (error) {
        console.error('Method change error:', error);
        showNotification('Bir hata oluştu', 'error');
    }
}

async function handleWebshareApiKeySubmit(e) {
    e.preventDefault();
    
    const apiKey = document.getElementById('webshareApiKey').value.trim();
    
    if (!apiKey) {
        showNotification('API key gereklidir', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/proxies/webshare/api-key', {
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
            document.getElementById('webshareApiKeyStatus').textContent = 'API key kaydedildi';
            document.getElementById('webshareApiKey').value = '';
        } else {
            showNotification(data.message || 'İşlem başarısız', 'error');
        }
    } catch (error) {
        console.error('API key save error:', error);
        showNotification('Bir hata oluştu', 'error');
    }
}

async function handleWebshareSync() {
    const syncBtn = document.getElementById('syncWebshareBtn');
    const originalHTML = syncBtn.innerHTML;
    
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="ph-bold ph-circle-notch ph-spin"></i> Senkronize ediliyor...';
    
    try {
        const response = await fetch('/api/proxies/webshare/sync', {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            await loadProxies();
            await loadProxyStats();
        } else {
            showNotification(data.message || 'Senkronizasyon başarısız', 'error');
        }
    } catch (error) {
        console.error('Webshare sync error:', error);
        showNotification('Bir hata oluştu', 'error');
    } finally {
        syncBtn.disabled = false;
        syncBtn.innerHTML = originalHTML;
    }
}

// ==================== EVENT LISTENERS ====================

function attachTableEventListeners() {
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const proxyId = parseInt(e.target.closest('.btn-delete').dataset.id);
            openDeleteProxyModal(proxyId);
        });
    });
}

// Method buttons
document.getElementById('manualMethodBtn').addEventListener('click', () => {
    handleMethodChange('manual');
});

document.getElementById('webshareMethodBtn').addEventListener('click', () => {
    handleMethodChange('webshare');
});

// Add proxy buttons
document.getElementById('addProxyBtn').addEventListener('click', openAddProxyModal);
document.getElementById('addFirstProxyBtn').addEventListener('click', openAddProxyModal);

// Modal close
document.getElementById('proxyModalOverlay').addEventListener('click', closeProxyModal);
document.getElementById('deleteProxyModalOverlay').addEventListener('click', closeDeleteProxyModal);
document.getElementById('cancelDeleteProxyBtn').addEventListener('click', closeDeleteProxyModal);

// Form submits
document.getElementById('proxyForm').addEventListener('submit', handleProxyFormSubmit);
document.getElementById('webshareApiKeyForm').addEventListener('submit', handleWebshareApiKeySubmit);

// Delete confirm
document.getElementById('confirmDeleteProxyBtn').addEventListener('click', handleDeleteProxy);

// Webshare sync
document.getElementById('syncWebshareBtn').addEventListener('click', handleWebshareSync);

// ==================== UTILITY ====================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== INITIALIZE ====================

loadProxyMethod();
loadProxies();
loadProxyStats();

// Refresh stats every 10 seconds
setInterval(() => {
    loadProxyStats();
}, 10000);
