// ==================== DASHBOARD SPECIFIC ====================

let earningsChart = null;

// ==================== LOAD EARNINGS DATA ====================

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
    btn.innerHTML = '<span class="btn-icon"><i class="ph-bold ph-circle-notch ph-spin"></i></span>Güncelleniyor...';
    
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
        btn.innerHTML = '<span class="btn-icon"><i class="ph ph-arrows-clockwise ph-spin"></i></span>Senkronize ediliyor...';
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
        btn.innerHTML = '<span class="btn-icon"><i class="ph ph-chart-bar"></i></span>Yükleniyor...';
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

// ==================== EVENT LISTENERS ====================

// Refresh earnings button
document.getElementById('refreshEarningsBtn')?.addEventListener('click', refreshEarningsData);

// Action buttons (placeholder)
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showNotification('Bu özellik yakında eklenecek!', 'info');
    });
});

// ==================== INITIALIZE ====================

console.log('Dashboard Page - Loaded');
loadEarningsData();
