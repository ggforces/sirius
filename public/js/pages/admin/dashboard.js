// Admin Dashboard JavaScript

let registrationsChart = null;
let tasksChart = null;

// Load system stats
async function loadSystemStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();

        if (data.success) {
            updateStatsCards(data.stats);
            updateCharts(data.stats);
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showNotification('İstatistikler yüklenirken hata oluştu', 'error');
    }
}

// Update stats cards
function updateStatsCards(stats) {
    document.getElementById('totalUsers').textContent = stats.users.total_users || 0;
    document.getElementById('activeUsers').textContent = stats.users.active_users || 0;
    document.getElementById('totalAccounts').textContent = stats.accounts.total_accounts || 0;
    document.getElementById('totalProxies').textContent = stats.proxies.total_proxies || 0;
    document.getElementById('totalTasks').textContent = stats.tasks.total_tasks || 0;
    document.getElementById('pendingTasks').textContent = stats.tasks.pending_tasks || 0;
    document.getElementById('dbSize').textContent = stats.database.sizeFormatted || '0 KB';
    
    // Calculate success rate
    const total = (stats.proxies.total_success || 0) + (stats.proxies.total_failures || 0);
    const successRate = total > 0 ? ((stats.proxies.total_success / total) * 100).toFixed(1) : 0;
    document.getElementById('successRate').textContent = successRate + '%';
}

// Update charts
function updateCharts(stats) {
    // Registrations chart
    const regLabels = stats.recentRegistrations.map(r => r.date).reverse();
    const regData = stats.recentRegistrations.map(r => r.count).reverse();
    
    if (registrationsChart) {
        registrationsChart.destroy();
    }
    
    const regCtx = document.getElementById('registrationsChart').getContext('2d');
    registrationsChart = new Chart(regCtx, {
        type: 'line',
        data: {
            labels: regLabels,
            datasets: [{
                label: 'Yeni Kayıtlar',
                data: regData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Tasks chart
    const taskLabels = stats.recentTasks.map(t => t.hour).reverse();
    const taskCompleted = stats.recentTasks.map(t => t.completed).reverse();
    const taskFailed = stats.recentTasks.map(t => t.failed).reverse();
    
    if (tasksChart) {
        tasksChart.destroy();
    }
    
    const taskCtx = document.getElementById('tasksChart').getContext('2d');
    tasksChart = new Chart(taskCtx, {
        type: 'bar',
        data: {
            labels: taskLabels,
            datasets: [
                {
                    label: 'Başarılı',
                    data: taskCompleted,
                    backgroundColor: '#10b981'
                },
                {
                    label: 'Başarısız',
                    data: taskFailed,
                    backgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Refresh stats
function refreshStats() {
    loadSystemStats();
    showNotification('Statistics refreshed', 'success');
}

// Export data function
function exportData() {
    const confirmed = confirm('Export all system data to JSON?');
    if (!confirmed) return;
    
    fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const dataStr = JSON.stringify(data.stats, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `system-stats-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
                showNotification('Data exported successfully', 'success');
            }
        })
        .catch(error => {
            console.error('Export error:', error);
            showNotification('Export failed', 'error');
        });
}

// Update system health
function updateSystemHealth() {
    // Server status
    document.getElementById('serverStatus').textContent = 'Online';
    document.getElementById('serverStatus').className = 'badge badge-active';
    
    // System uptime (mock - would need server endpoint)
    const uptime = Math.floor(Math.random() * 72) + 1;
    document.getElementById('systemUptime').textContent = `${uptime}h`;
    
    // Memory usage (mock - would need server endpoint)
    const memUsage = Math.floor(Math.random() * 40) + 30;
    document.getElementById('memoryUsage').textContent = `${memUsage}%`;
    
    // Last backup (mock - would need server endpoint)
    document.getElementById('lastBackup').textContent = 'Never';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSystemStats();
    updateSystemHealth();
    
    // Add event listeners for buttons
    const refreshBtn = document.getElementById('refreshStatsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshStats);
    }
    
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // Auto refresh every 30 seconds
    setInterval(loadSystemStats, 30000);
    
    // Update quick stats in topbar
    setInterval(() => {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const quickStatUsers = document.getElementById('quickStatUsers');
                    const quickStatTasks = document.getElementById('quickStatTasks');
                    if (quickStatUsers) quickStatUsers.textContent = data.stats.users.active_users || 0;
                    if (quickStatTasks) quickStatTasks.textContent = data.stats.tasks.running_tasks || 0;
                }
            })
            .catch(err => console.error('Quick stats error:', err));
    }, 10000);
});
