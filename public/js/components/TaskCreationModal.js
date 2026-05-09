/**
 * TaskCreationModal Component
 * 
 * Modal for creating multiple tasks by selecting Steam accounts.
 * 
 * Features:
 * - Multi-select accounts with checkboxes
 * - Bulk selection filters (All, Prime, Non-Prime, Clear)
 * - Minimal, compact account display
 * - Batch task creation
 * - Shows success/error notifications
 * 
 * Usage:
 * ```javascript
 * const modal = new TaskCreationModal('taskCreationModal');
 * modal.onTaskCreated = (data) => {
 *     taskTable.refresh();
 * };
 * modal.open();
 * ```
 */

class TaskCreationModal {
    constructor(modalId) {
        this.modalId = modalId;
        this.modal = null;
        this.accounts = [];
        this.selectedAccountIds = new Set();
        this.isLoading = false;
        this.onTaskCreated = null;
        this.escapeKeyHandler = null;
        
        this.init();
    }
    
    init() {
        this.createModalHTML();
        this.modal = document.getElementById(this.modalId);
        this.attachEventListeners();
        this.searchQuery = '';
    }
    
    createModalHTML() {
        if (document.getElementById(this.modalId)) {
            return;
        }
        
        const modalHTML = `
            <div class="modal" id="${this.modalId}">
                <div class="modal-overlay"></div>
                <div class="modal-content modal-medium">
                    <div class="modal-header">
                        <h3 class="modal-title">${window.t('tasks.createModal.title')}</h3>
                    </div>
                    <div class="modal-body">
                        <!-- Search Bar -->
                        <div class="search-bar">
                            <i class="ph-bold ph-magnifying-glass"></i>
                            <input type="text" id="${this.modalId}-search" placeholder="${window.t('tasks.createModal.searchPlaceholder')}" />
                        </div>
                        
                        <!-- Bulk Selection Toolbar -->
                        <div class="bulk-selection-toolbar">
                            <button class="filter-btn" id="${this.modalId}-select-all">
                                <i class="ph-bold ph-check-square"></i>
                                ${window.t('tasks.createModal.selectAll')}
                            </button>
                            <button class="filter-btn" id="${this.modalId}-select-prime">
                                <i class="ph-fill ph-crown"></i>
                                ${window.t('tasks.createModal.selectPrime')}
                            </button>
                            <button class="filter-btn" id="${this.modalId}-select-nonprime">
                                <i class="ph-bold ph-user"></i>
                                ${window.t('tasks.createModal.selectNonPrime')}
                            </button>
                            <button class="filter-btn" id="${this.modalId}-clear-selection">
                                <i class="ph-bold ph-x-circle"></i>
                                ${window.t('tasks.createModal.clearSelection')}
                            </button>
                            <div class="selection-counter">
                                <span id="${this.modalId}-selection-count">0</span> ${window.t('tasks.createModal.accountsSelected')}
                            </div>
                        </div>
                        
                        <!-- Accounts Container -->
                        <div id="${this.modalId}-accounts-container" class="accounts-container-compact">
                            <!-- Accounts will be loaded here -->
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="${this.modalId}-create" disabled>
                            <i class="ph-bold ph-plus"></i>
                            ${window.t('tasks.createModal.createTasks')}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    attachEventListeners() {
        // Create button
        const createBtn = document.getElementById(`${this.modalId}-create`);
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createTasks());
        }
        
        // Search input
        const searchInput = document.getElementById(`${this.modalId}-search`);
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderAccounts();
            });
        }
        
        // Bulk selection buttons
        document.getElementById(`${this.modalId}-select-all`)?.addEventListener('click', () => this.selectAll());
        document.getElementById(`${this.modalId}-select-prime`)?.addEventListener('click', () => this.selectPrime());
        document.getElementById(`${this.modalId}-select-nonprime`)?.addEventListener('click', () => this.selectNonPrime());
        document.getElementById(`${this.modalId}-clear-selection`)?.addEventListener('click', () => this.clearSelection());
        
        // Close on overlay click
        const overlay = this.modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }
        
        // Prevent event bubbling from modal content to overlay
        const modalContent = this.modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }
    
    async open() {
        this.modal.classList.add('active');
        this.selectedAccountIds.clear();
        this.updateSelectionCounter();
        
        // Add Escape key handler when modal opens
        this.escapeKeyHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escapeKeyHandler);
        
        await this.loadAccounts();
    }
    
    close() {
        this.modal.classList.remove('active');
        this.selectedAccountIds.clear();
        this.updateCreateButton();
        
        // Remove Escape key handler when modal closes
        if (this.escapeKeyHandler) {
            document.removeEventListener('keydown', this.escapeKeyHandler);
            this.escapeKeyHandler = null;
        }
    }
    
    async loadAccounts(retryCount = 0) {
        const container = document.getElementById(`${this.modalId}-accounts-container`);
        
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>${window.t('tasks.createModal.loading')}</p>
            </div>
        `;
        
        try {
            const response = await fetch('/api/accounts', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(window.t('tasks.createModal.loadError'));
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.accounts = data.data || [];
                this.renderAccounts();
            } else {
                throw new Error(data.message || window.t('tasks.createModal.loadError'));
            }
        } catch (error) {
            console.error('Error loading accounts:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <p style="color: var(--danger);">❌ ${error.message}</p>
                </div>
            `;
        }
    }
    
    renderAccounts() {
        const container = document.getElementById(`${this.modalId}-accounts-container`);
        
        if (this.accounts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="ph-bold ph-game-controller" style="font-size: 3rem; opacity: 0.5;"></i></div>
                    <p>${window.t('tasks.createModal.noAccounts')}</p>
                </div>
            `;
            return;
        }
        
        // Filter accounts based on search query
        const filteredAccounts = this.accounts.filter(account => 
            account.username.toLowerCase().includes(this.searchQuery)
        );
        
        if (filteredAccounts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>${window.t('tasks.createModal.noResults')}</p>
                </div>
            `;
            return;
        }
        
        const accountsHTML = filteredAccounts.map(account => {
            const isSelected = this.selectedAccountIds.has(account.id);
            const primeIcon = account.is_prime ? '<i class="ph-fill ph-crown"></i>' : '';
            const limitedBadge = account.limited === 1 ? '<span class="limited-badge">L</span>' : '';
            
            return `
                <button class="account-chip ${isSelected ? 'selected' : ''}" 
                        data-account-id="${account.id}" 
                        data-is-prime="${account.is_prime ? '1' : '0'}">
                    ${primeIcon}
                    <span class="account-chip-name">${account.username}</span>
                    ${limitedBadge}
                </button>
            `;
        }).join('');
        
        container.innerHTML = accountsHTML;
        
        // Attach click handlers to account chips
        const accountChips = container.querySelectorAll('.account-chip');
        accountChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.preventDefault();
                const accountId = parseInt(chip.dataset.accountId);
                
                if (this.selectedAccountIds.has(accountId)) {
                    this.selectedAccountIds.delete(accountId);
                    chip.classList.remove('selected');
                } else {
                    this.selectedAccountIds.add(accountId);
                    chip.classList.add('selected');
                }
                
                this.updateSelectionCounter();
                this.updateCreateButton();
            });
        });
    }
    
    selectAll() {
        this.selectedAccountIds.clear();
        this.accounts.forEach(account => {
            this.selectedAccountIds.add(account.id);
        });
        this.updateCheckboxes();
        this.updateSelectionCounter();
        this.updateCreateButton();
    }
    
    selectPrime() {
        this.selectedAccountIds.clear();
        this.accounts.forEach(account => {
            if (account.is_prime) {
                this.selectedAccountIds.add(account.id);
            }
        });
        this.updateCheckboxes();
        this.updateSelectionCounter();
        this.updateCreateButton();
    }
    
    selectNonPrime() {
        this.selectedAccountIds.clear();
        this.accounts.forEach(account => {
            if (!account.is_prime) {
                this.selectedAccountIds.add(account.id);
            }
        });
        this.updateCheckboxes();
        this.updateSelectionCounter();
        this.updateCreateButton();
    }
    
    clearSelection() {
        this.selectedAccountIds.clear();
        this.updateCheckboxes();
        this.updateSelectionCounter();
        this.updateCreateButton();
    }
    
    updateCheckboxes() {
        const chips = document.querySelectorAll(`#${this.modalId}-accounts-container .account-chip`);
        chips.forEach(chip => {
            const accountId = parseInt(chip.dataset.accountId);
            if (this.selectedAccountIds.has(accountId)) {
                chip.classList.add('selected');
            } else {
                chip.classList.remove('selected');
            }
        });
    }
    
    updateSelectionCounter() {
        const counter = document.getElementById(`${this.modalId}-selection-count`);
        if (counter) {
            counter.textContent = this.selectedAccountIds.size;
        }
    }
    
    updateCreateButton() {
        const createBtn = document.getElementById(`${this.modalId}-create`);
        if (createBtn) {
            createBtn.disabled = this.selectedAccountIds.size === 0;
            const count = this.selectedAccountIds.size;
            if (count > 0) {
                createBtn.innerHTML = `
                    <i class="ph-bold ph-plus"></i>
                    ${window.t('tasks.createModal.createTasks')} (${count})
                `;
            } else {
                createBtn.innerHTML = `
                    <i class="ph-bold ph-plus"></i>
                    ${window.t('tasks.createModal.createTasks')}
                `;
            }
        }
    }
    
    async createTasks() {
        if (this.selectedAccountIds.size === 0) {
            window.showNotification(window.t('tasks.createModal.noSelection'), 'warning');
            return;
        }
        
        const createBtn = document.getElementById(`${this.modalId}-create`);
        const originalHTML = createBtn.innerHTML;
        
        try {
            createBtn.disabled = true;
            createBtn.innerHTML = `<i class="ph-bold ph-spinner"></i> ${window.t('tasks.createModal.creating')}`;
            
            const accountIds = Array.from(this.selectedAccountIds);
            let successCount = 0;
            let failCount = 0;
            
            // Create tasks sequentially
            for (const accountId of accountIds) {
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
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    failCount++;
                }
            }
            
            // Show result notification
            if (successCount > 0 && failCount === 0) {
                window.showNotification(
                    `${successCount} ${window.t('tasks.createModal.tasksCreatedSuccess')}`,
                    'success'
                );
            } else if (successCount > 0 && failCount > 0) {
                window.showNotification(
                    `${successCount} ${window.t('tasks.createModal.tasksCreatedPartial')}, ${failCount} ${window.t('tasks.createModal.tasksFailed')}`,
                    'warning'
                );
            } else {
                window.showNotification(
                    window.t('tasks.createModal.allTasksFailed'),
                    'error'
                );
            }
            
            this.close();
            
            // Call callback if provided
            if (typeof this.onTaskCreated === 'function') {
                this.onTaskCreated({ successCount, failCount });
            }
        } catch (error) {
            console.error('Error creating tasks:', error);
            window.showNotification(window.t('tasks.notifications.taskCreationFailed'), 'error');
            createBtn.disabled = false;
            createBtn.innerHTML = originalHTML;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskCreationModal;
}
