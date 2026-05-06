// Tasks Page JavaScript
class TasksManager {
    constructor() {
        this.accounts = [];
        this.selectedAccounts = new Set();
        this.isChecking = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadAccounts();
    }

    bindEvents() {
        // Bulk check button
        document.getElementById('bulkCheckBtn')?.addEventListener('click', () => {
            this.openBulkCheckModal();
        });

        // Refresh accounts button
        document.getElementById('refreshAccountsBtn')?.addEventListener('click', () => {
            this.loadAccounts();
        });

        // Modal events
        document.getElementById('closeBulkCheckModal')?.addEventListener('click', () => {
            this.closeBulkCheckModal();
        });

        document.getElementById('cancelBulkCheck')?.addEventListener('click', () => {
            this.closeBulkCheckModal();
        });

        document.getElementById('startBulkCheck')?.addEventListener('click', () => {
            this.startBulkCheck();
        });

        // Select all checkbox
        document.getElementById('selectAllAccounts')?.addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // Close modal on outside click
        document.getElementById('bulkCheckModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'bulkCheckModal') {
                this.closeBulkCheckModal();
            }
        });
    }

    async loadAccounts() {
        const container = document.getElementById('accountsContainer');
        const loading = document.getElementById('accountsLoading');
        const empty = document.getElementById('accountsEmpty');
        const grid = document.getElementById('accountsGrid');

        // Show loading state
        loading.style.display = 'flex';
        empty.style.display = 'none';
        grid.style.display = 'none';

        try {
            const response = await fetch('/api/tasks/accounts', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.accounts = data.accounts;
                
                if (this.accounts.length === 0) {
                    loading.style.display = 'none';
                    empty.style.display = 'flex';
                } else {
                    loading.style.display = 'none';
                    grid.style.display = 'grid';
                    this.renderAccounts();
                }
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading accounts:', error);
            window.showNotification('Hesaplar yüklenirken hata oluştu: ' + error.message, 'error');
            loading.style.display = 'none';
            empty.style.display = 'flex';
        }
    }

    renderAccounts() {
        const grid = document.getElementById('accountsGrid');
        
        grid.innerHTML = this.accounts.map(account => `
            <div class="account-card" data-account-id="${account.id}">
                <div class="account-card-header">
                    <div class="account-username">${account.username}</div>
                    <div class="account-status ${account.last_checked_at ? 'checked' : 'unchecked'}">
                        ${account.last_checked_at ? 'Kontrol Edildi' : 'Kontrol Edilmedi'}
                    </div>
                </div>
                <div class="account-info">
                    <div class="account-info-item">
                        <div class="account-info-label">Steam ID</div>
                        <div class="account-info-value">${account.steamid || 'Bilinmiyor'}</div>
                    </div>
                    <div class="account-info-item">
                        <div class="account-info-label">Prime Status</div>
                        <div class="account-info-value">${account.is_prime ? 'Prime' : 'Non-Prime'}</div>
                    </div>
                    <div class="account-info-item">
                        <div class="account-info-label">Limited</div>
                        <div class="account-info-value">${this.getLimitedText(account.limited)}</div>
                    </div>
                    <div class="account-info-item">
                        <div class="account-info-label">Cüzdan</div>
                        <div class="account-info-value">${account.wallet_balance || 0} ${account.wallet_currency || 'USD'}</div>
                    </div>
                </div>
                <div class="account-actions">
                    <button class="account-check-btn" onclick="tasksManager.checkSingleAccount(${account.id})">
                        <span class="btn-icon">🔍</span>
                        Kontrol Et
                    </button>
                    <button class="account-inventory-btn" onclick="tasksManager.viewInventory(${account.id})">
                        <span class="btn-icon">📦</span>
                        Envanter
                    </button>
                </div>
            </div>
        `).join('');
    }

    getLimitedText(limited) {
        if (limited === null) return 'Bilinmiyor';
        if (limited === 0) return 'Unlimited';
        if (limited === 1) return 'Limited';
        if (limited === 2) return 'Limited (Wallet)';
        return 'Bilinmiyor';
    }

    async checkSingleAccount(accountId) {
        const button = document.querySelector(`[data-account-id="${accountId}"] .account-check-btn`);
        const originalText = button.innerHTML;
        
        button.disabled = true;
        button.innerHTML = '<span class="btn-icon">⏳</span> Kontrol Ediliyor...';

        try {
            const response = await fetch(`/api/tasks/check/${accountId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                window.showNotification('Hesap başarıyla kontrol edildi', 'success');
                this.loadAccounts(); // Refresh the accounts list
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error checking account:', error);
            window.showNotification('Hesap kontrol edilirken hata oluştu: ' + error.message, 'error');
        } finally {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    async viewInventory(accountId) {
        try {
            const response = await fetch(`/api/tasks/inventory/${accountId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showInventoryModal(data.inventory);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
            window.showNotification('Envanter yüklenirken hata oluştu: ' + error.message, 'error');
        }
    }

    showInventoryModal(inventory) {
        // Create a simple inventory display
        const inventoryText = inventory.length > 0 
            ? inventory.map(item => `${item.market_hash_name || 'Unknown Item'} (Context: ${item.context})`).join('\n')
            : 'Envanter boş';
        
        alert(`Envanter:\n\n${inventoryText}`);
    }

    openBulkCheckModal() {
        if (this.accounts.length === 0) {
            window.showNotification('Kontrol edilecek hesap bulunamadı', 'warning');
            return;
        }

        this.selectedAccounts.clear();
        this.renderBulkAccountsList();
        this.updateSelectedCount();
        this.resetBulkCheckModal();
        
        document.getElementById('bulkCheckModal').style.display = 'block';
    }

    closeBulkCheckModal() {
        document.getElementById('bulkCheckModal').style.display = 'none';
        this.selectedAccounts.clear();
        this.isChecking = false;
    }

    resetBulkCheckModal() {
        // Show account selection step
        document.getElementById('selectAccountsStep').style.display = 'block';
        document.getElementById('checkProgressStep').style.display = 'none';
        document.getElementById('checkResultsStep').style.display = 'none';
        
        // Reset buttons
        document.getElementById('cancelBulkCheck').style.display = 'inline-block';
        document.getElementById('startBulkCheck').style.display = 'inline-block';
        document.getElementById('startBulkCheck').textContent = 'Kontrolü Başlat';
    }

    renderBulkAccountsList() {
        const list = document.getElementById('bulkAccountsList');
        
        list.innerHTML = this.accounts.map(account => `
            <div class="bulk-account-item" onclick="tasksManager.toggleAccountSelection(${account.id})">
                <label class="checkbox-container">
                    <input type="checkbox" data-account-id="${account.id}">
                    <span class="checkmark"></span>
                </label>
                <div class="bulk-account-info">
                    <div class="bulk-account-username">${account.username}</div>
                    <div class="bulk-account-details">
                        ${account.steamid || 'Steam ID bilinmiyor'} • 
                        ${account.last_checked_at ? 'Son kontrol: ' + new Date(account.last_checked_at).toLocaleDateString('tr-TR') : 'Hiç kontrol edilmedi'}
                    </div>
                </div>
            </div>
        `).join('');
    }

    toggleAccountSelection(accountId) {
        const checkbox = document.querySelector(`input[data-account-id="${accountId}"]`);
        
        if (this.selectedAccounts.has(accountId)) {
            this.selectedAccounts.delete(accountId);
            checkbox.checked = false;
        } else {
            this.selectedAccounts.add(accountId);
            checkbox.checked = true;
        }
        
        this.updateSelectedCount();
        this.updateSelectAllCheckbox();
    }

    toggleSelectAll(selectAll) {
        this.selectedAccounts.clear();
        
        if (selectAll) {
            this.accounts.forEach(account => {
                this.selectedAccounts.add(account.id);
            });
        }
        
        // Update all checkboxes
        document.querySelectorAll('#bulkAccountsList input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = selectAll;
        });
        
        this.updateSelectedCount();
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAllAccounts');
        const totalAccounts = this.accounts.length;
        const selectedCount = this.selectedAccounts.size;
        
        selectAllCheckbox.checked = selectedCount === totalAccounts && totalAccounts > 0;
        selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalAccounts;
    }

    updateSelectedCount() {
        document.getElementById('selectedCount').textContent = `${this.selectedAccounts.size} hesap seçildi`;
        
        // Enable/disable start button
        const startButton = document.getElementById('startBulkCheck');
        startButton.disabled = this.selectedAccounts.size === 0;
    }

    async startBulkCheck() {
        if (this.selectedAccounts.size === 0) {
            window.showNotification('Lütfen kontrol edilecek hesapları seçin', 'warning');
            return;
        }

        this.isChecking = true;
        
        // Switch to progress step
        document.getElementById('selectAccountsStep').style.display = 'none';
        document.getElementById('checkProgressStep').style.display = 'block';
        document.getElementById('cancelBulkCheck').style.display = 'none';
        document.getElementById('startBulkCheck').style.display = 'none';

        const selectedAccountIds = Array.from(this.selectedAccounts);
        
        try {
            const response = await fetch('/api/tasks/check-bulk', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    accountIds: selectedAccountIds
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showBulkCheckResults(data.results, data.errors);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error in bulk check:', error);
            window.showNotification('Toplu kontrol sırasında hata oluştu: ' + error.message, 'error');
            this.closeBulkCheckModal();
        }
    }

    showBulkCheckResults(results, errors) {
        // Switch to results step
        document.getElementById('checkProgressStep').style.display = 'none';
        document.getElementById('checkResultsStep').style.display = 'block';
        
        // Show close button
        document.getElementById('cancelBulkCheck').style.display = 'inline-block';
        document.getElementById('cancelBulkCheck').textContent = 'Kapat';

        // Render results summary
        const summary = document.getElementById('resultsSummary');
        const totalChecked = results.length;
        const totalErrors = errors.length;
        
        summary.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; color: #22c55e; font-weight: bold;">${totalChecked}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Başarılı</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; color: #ef4444; font-weight: bold;">${totalErrors}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Hatalı</div>
                </div>
            </div>
            
            ${results.length > 0 ? `
                <h5 style="color: var(--text-primary); margin: 1rem 0 0.5rem 0;">Başarılı Kontroller:</h5>
                ${results.map(result => `
                    <div class="result-item">
                        <div class="result-info">
                            <div class="result-username">${result.username}</div>
                            <div class="result-details">
                                Prime: ${result.result.isPrime ? 'Evet' : 'Hayır'} • 
                                Limited: ${this.getLimitedText(result.result.limited)} • 
                                Cüzdan: ${result.result.walletBalance || 0} ${result.result.walletCurrency || 'USD'}
                            </div>
                        </div>
                        <div class="result-status success">Başarılı</div>
                    </div>
                `).join('')}
            ` : ''}
            
            ${errors.length > 0 ? `
                <h5 style="color: var(--text-primary); margin: 1rem 0 0.5rem 0;">Hatalar:</h5>
                ${errors.map(error => `
                    <div class="result-item">
                        <div class="result-info">
                            <div class="result-username">${error.username}</div>
                            <div class="result-details">${error.error}</div>
                        </div>
                        <div class="result-status error">Hata</div>
                    </div>
                `).join('')}
            ` : ''}
        `;

        // Refresh accounts list
        this.loadAccounts();
    }
}

// Initialize tasks manager when page loads
let tasksManager;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        tasksManager = new TasksManager();
    });
} else {
    tasksManager = new TasksManager();
}