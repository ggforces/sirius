// Tasks Page JavaScript
class TasksManager {
    constructor() {
        this.accounts = [];
        this.taskCreationModal = null;
        this.logViewerModal = null;
        this.taskTable = null;
        this.statisticsPanel = null;
        this.pollingInterval = null;
        this.pollingFailureCount = 0;
        this.maxPollingFailures = 3;
        this.init();
    }

    init() {
        this.initializeTaskCreationModal();
        this.initializeLogViewerModal();
        this.initializeStatisticsPanel();
        this.initializeTaskTable();
        this.bindEvents();
        this.loadAccounts();
    }

    initializeTaskCreationModal() {
        // Initialize TaskCreationModal component
        this.taskCreationModal = new TaskCreationModal('taskCreationModal');
        
        // Set callback for when task is created
        this.taskCreationModal.onTaskCreated = (data) => {
            console.log('Task created:', data);
            // Refresh task table to show the new task
            if (this.taskTable) {
                this.loadTasks();
            }
            // Also refresh accounts list to show updated status
            this.loadAccounts();
        };
    }

    initializeLogViewerModal() {
        // Initialize LogViewerModal component
        this.logViewerModal = new LogViewerModal('logViewerModal');
    }

    initializeStatisticsPanel() {
        // Initialize StatisticsPanel component if container exists
        const statisticsPanelContainer = document.getElementById('statisticsPanel');
        if (statisticsPanelContainer) {
            this.statisticsPanel = new StatisticsPanel('statisticsPanel');
        }
    }

    initializeTaskTable() {
        // Initialize TaskTable component if container exists
        const taskTableContainer = document.getElementById('taskTableContainer');
        if (taskTableContainer) {
            this.taskTable = new TaskTable('taskTableContainer');
            
            // Wire log button click handler to open LogViewerModal
            this.taskTable.onViewLogs = (taskId) => {
                console.log('Opening log viewer for task:', taskId);
                this.logViewerModal.open(taskId);
            };
            
            // Load initial tasks
            this.loadTasks();
            
            // Start polling for task updates every 5 seconds
            this.startTaskPolling();
        }
    }
    
    async loadTasks() {
        if (!this.taskTable) return;
        
        this.taskTable.setLoading(true);
        
        try {
            const response = await fetch('/api/tasks/tasks', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            // Handle HTTP errors
            if (!response.ok) {
                let errorMessage = window.t('tasks.notifications.tasksLoadError');
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `${window.t('tasks.notifications.serverError')}: ${response.status}`;
                }
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.taskTable.setTasks(data.tasks || []);
                
                // Update statistics panel with new task data
                if (this.statisticsPanel) {
                    this.statisticsPanel.update(data.tasks || []);
                }
                
                // Reset failure count on success
                this.pollingFailureCount = 0;
            } else {
                throw new Error(data.message || 'Failed to load tasks');
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            
            // Increment failure count
            this.pollingFailureCount++;
            
            // Show notification after 3 consecutive failures
            if (this.pollingFailureCount >= this.maxPollingFailures) {
                // Determine error type for better messaging
                let errorMessage = window.t('tasks.notifications.tasksLoadError');
                
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    errorMessage = window.t('tasks.notifications.connectionError');
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                // Show notification with retry option
                this.showPollingErrorNotification(errorMessage);
                
                // Reset counter to avoid spamming notifications
                this.pollingFailureCount = 0;
            }
            
            // Don't clear tasks on error - keep showing last successful data
            // this.taskTable.setTasks([]);
        } finally {
            this.taskTable.setLoading(false);
        }
    }
    
    /**
     * Show polling error notification with manual retry option
     * @param {string} errorMessage - Error message to display
     */
    showPollingErrorNotification(errorMessage) {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element with retry button
        const notification = document.createElement('div');
        notification.className = 'notification notification-error notification-with-action';
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = errorMessage;
        
        const retryBtn = document.createElement('button');
        retryBtn.className = 'notification-retry-btn';
        retryBtn.textContent = window.t('tasks.notifications.retryNow');
        retryBtn.onclick = () => {
            notification.remove();
            this.loadTasks();
        };
        
        notification.appendChild(messageSpan);
        notification.appendChild(retryBtn);
        
        // Add to body
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after 7 seconds (longer for error notifications)
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 7000);
    }
    
    startTaskPolling() {
        // Poll every 5 seconds for task updates
        this.pollingInterval = setInterval(() => {
            this.loadTasks();
        }, 5000);
    }
    
    stopTaskPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    bindEvents() {
        // Create task button
        document.getElementById('createTaskBtn')?.addEventListener('click', () => {
            this.openTaskCreationModal();
        });

        // Refresh tasks button
        document.getElementById('refreshTasksBtn')?.addEventListener('click', () => {
            if (this.taskTable) {
                this.loadTasks();
            }
        });

        // Refresh accounts button (legacy)
        document.getElementById('refreshAccountsBtn')?.addEventListener('click', () => {
            this.loadAccounts();
        });
    }

    async loadAccounts() {
        // Simply load accounts data without rendering
        // This is kept for backward compatibility with account check buttons if they exist
        try {
            const response = await fetch('/api/tasks/accounts', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Handle HTTP errors
            if (!response.ok) {
                let errorMessage = window.t('tasks.notifications.accountsLoadFailed');
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `${window.t('tasks.notifications.serverError')}: ${response.status}`;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.success) {
                this.accounts = data.accounts || [];
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading accounts:', error);
            
            let errorMessage = window.t('tasks.notifications.accountsLoadFailed');
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                errorMessage = window.t('tasks.notifications.connectionError');
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            // Don't show notification for account loading errors in new design
            // Accounts are loaded in TaskCreationModal when needed
            console.warn('Account loading failed:', errorMessage);
        }
    }

    renderAccounts() {
        // Legacy function - no longer used in new task-centric design
        // Accounts are now loaded in TaskCreationModal when needed
        console.log('renderAccounts called (legacy function, no-op in new design)');
    }

    getLimitedText(limited) {
        if (limited === null) return window.t('tasks.card.unknown');
        if (limited === 0) return window.t('tasks.card.unlimited');
        if (limited === 1) return window.t('tasks.card.limited');
        if (limited === 2) return window.t('tasks.card.limitedWallet');
        return window.t('tasks.card.unknown');
    }

    openTaskCreationModal() {
        if (this.taskCreationModal) {
            this.taskCreationModal.open();
        }
    }

    async checkSingleAccount(accountId) {
        // Legacy function - kept for backward compatibility if account cards exist
        try {
            const response = await fetch(`/api/tasks/check/${accountId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            // Handle HTTP errors
            if (!response.ok) {
                let errorMessage = window.t('tasks.notifications.accountCheckFailed');
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `${window.t('tasks.notifications.serverError')}: ${response.status}`;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.success) {
                window.showNotification(window.t('tasks.notifications.accountCheckSuccess'), 'success');
                this.loadAccounts(); // Refresh the accounts list
                
                // Also refresh task table if it exists
                if (this.taskTable) {
                    this.loadTasks();
                }
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error checking account:', error);
            
            let errorMessage = window.t('tasks.notifications.accountCheckFailed');
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                errorMessage = window.t('tasks.notifications.connectionError');
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            window.showNotification(errorMessage, 'error');
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

            // Handle HTTP errors
            if (!response.ok) {
                let errorMessage = window.t('tasks.notifications.inventoryLoadFailed');
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `${window.t('tasks.notifications.serverError')}: ${response.status}`;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.success) {
                window.showNotification(window.t('tasks.notifications.accountCheckSuccess'), 'success');
                
                // Refresh task table if it exists
                if (this.taskTable) {
                    this.loadTasks();
                }
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error checking account:', error);
            
            let errorMessage = window.t('tasks.notifications.accountCheckFailed');
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                errorMessage = window.t('tasks.notifications.connectionError');
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            window.showNotification(errorMessage, 'error');
        }
    }

    async viewInventory(accountId) {
        // Legacy function - kept for backward compatibility
        try {
            const response = await fetch(`/api/tasks/inventory/${accountId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Handle HTTP errors
            if (!response.ok) {
                let errorMessage = window.t('tasks.notifications.inventoryLoadFailed');
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `${window.t('tasks.notifications.serverError')}: ${response.status}`;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.success) {
                this.showInventoryModal(data.inventory);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
            
            let errorMessage = window.t('tasks.notifications.inventoryLoadFailed');
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                errorMessage = window.t('tasks.notifications.connectionError');
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            window.showNotification(errorMessage, 'error');
        }
    }

    showInventoryModal(inventory) {
        // Create a simple inventory display
        const inventoryText = inventory.length > 0 
            ? inventory.map(item => `${item.market_hash_name || window.t('tasks.inventory.unknownItem')} (Context: ${item.context})`).join('\n')
            : window.t('tasks.inventory.empty');
        
        alert(`${window.t('tasks.inventory.title')}:\n\n${inventoryText}`);
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

// Cleanup when page is unloaded
window.addEventListener('beforeunload', () => {
    if (tasksManager) {
        tasksManager.stopTaskPolling();
    }
});