// Admin Logs JavaScript

let autoRefreshInterval = null;
let isAutoRefreshing = false;
let currentLogs = [];

// Load logs
async function loadLogs() {
    const level = document.getElementById('logLevel').value;
    const limit = document.getElementById('logLimit').value;
    
    try {
        const response = await fetch(`/api/admin/logs?level=${level}&limit=${limit}`);
        const data = await response.json();

        if (data.success) {
            currentLogs = data.logs;
            updateLogStats();
            renderLogs(data.logs);
            updateLastUpdate();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error loading logs:', error);
        showNotification('Error loading logs', 'error');
    }
}

// Update log stats
function updateLogStats() {
    const total = currentLogs.length;
    const errors = currentLogs.filter(l => l.level === 'error').length;
    const warns = currentLogs.filter(l => l.level === 'warn').length;
    const infos = currentLogs.filter(l => l.level === 'info').length;
    
    document.getElementById('logCount').textContent = total;
    document.getElementById('errorCount').textContent = errors;
    document.getElementById('warnCount').textContent = warns;
    document.getElementById('infoCount').textContent = infos;
}

// Update last update time
function updateLastUpdate() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('lastUpdate').textContent = `Last update: ${timeStr}`;
}

// Render logs
function renderLogs(logs) {
    const container = document.getElementById('logsContainer');
    
    if (logs.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 3rem;">
                <i class="ph-bold ph-file-text"></i>
                <p>No logs found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = logs.map(log => {
        const meta = Object.keys(log)
            .filter(key => !['level', 'message', 'timestamp'].includes(key))
            .map(key => `${key}: ${JSON.stringify(log[key])}`)
            .join(', ');
        
        return `
            <div class="log-entry">
                <span class="log-timestamp">${log.timestamp}</span>
                <span class="log-level log-level-${log.level}">${log.level.toUpperCase()}</span>
                <span class="log-message">${escapeHtml(log.message)}</span>
                ${meta ? `<div class="log-meta">${escapeHtml(meta)}</div>` : ''}
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Toggle auto refresh
function toggleAutoRefresh() {
    const btn = document.getElementById('autoRefreshBtn');
    const status = document.getElementById('autoRefreshStatus');
    
    if (isAutoRefreshing) {
        clearInterval(autoRefreshInterval);
        isAutoRefreshing = false;
        btn.innerHTML = '<i class="ph-bold ph-play"></i> Auto Refresh';
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-secondary');
        status.textContent = '';
    } else {
        autoRefreshInterval = setInterval(loadLogs, 5000);
        isAutoRefreshing = true;
        btn.innerHTML = '<i class="ph-bold ph-stop"></i> Stop';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-danger');
        status.textContent = '🔄 Auto-refreshing every 5s';
        loadLogs();
    }
}

// Clear logs display
function clearLogsDisplay() {
    const container = document.getElementById('logsContainer');
    container.innerHTML = `
        <div class="empty-state" style="padding: 3rem;">
            <i class="ph-bold ph-broom"></i>
            <p>Display cleared. Click refresh to reload logs.</p>
        </div>
    `;
    currentLogs = [];
    updateLogStats();
}

// Export logs
function exportLogs() {
    if (currentLogs.length === 0) {
        showNotification('No logs to export', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(currentLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Logs exported successfully', 'success');
}

// Helper function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadLogs();
    
    // Reload on filter change
    document.getElementById('logLevel').addEventListener('change', loadLogs);
    document.getElementById('logLimit').addEventListener('change', loadLogs);
    
    // Button event listeners
    document.getElementById('refreshLogsBtn')?.addEventListener('click', loadLogs);
    document.getElementById('autoRefreshBtn')?.addEventListener('click', toggleAutoRefresh);
    document.getElementById('clearLogsBtn')?.addEventListener('click', clearLogsDisplay);
    document.getElementById('exportLogsBtn')?.addEventListener('click', exportLogs);
});
