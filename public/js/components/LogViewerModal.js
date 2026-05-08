/**
 * LogViewerModal Component
 * 
 * Modal for viewing task execution logs.
 * 
 * Features:
 * - Displays task logs in chronological order
 * - Color-codes log levels (info, warning, error)
 * - Handles empty state (no logs)
 * - Provides scrollable log view
 * - Formats timestamps for readability
 * 
 * Usage:
 * ```javascript
 * const logModal = new LogViewerModal('logViewerModal');
 * 
 * // Open the modal with a task ID
 * logModal.open(123);
 * ```
 */

class LogViewerModal {
    constructor(modalId) {
        this.modalId = modalId;
        this.modal = null;
        this.currentTaskId = null;
        this.logs = [];
        this.isLoading = false;
        
        this.init();
    }
    
    /**
     * Initialize the modal
     */
    init() {
        this.createModalHTML();
        this.modal = document.getElementById(this.modalId);
        this.attachEventListeners();
    }
    
    /**
     * Create modal HTML structure
     */
    createModalHTML() {
        // Check if modal already exists
        if (document.getElementById(this.modalId)) {
            return;
        }
        
        const modalHTML = `
            <div class="modal" id="${this.modalId}">
                <div class="modal-overlay"></div>
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3 class="modal-title">${window.t('tasks.logModal.title')}</h3>
                    </div>
                    <div class="modal-body">
                        <div id="${this.modalId}-logs-container">
                            <!-- Logs will be loaded here -->
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="${this.modalId}-close">${window.t('tasks.logModal.close')}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        const closeBtn = document.getElementById(`${this.modalId}-close`);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Close on overlay click
        const overlay = this.modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }
    
    /**
     * Open the modal with a specific task ID
     * @param {number} taskId - Task ID to load logs for
     */
    async open(taskId) {
        if (!taskId) {
            console.error('Task ID is required to open log viewer');
            return;
        }
        
        this.currentTaskId = taskId;
        this.modal.classList.add('active');
        await this.loadLogs(taskId);
    }
    
    /**
     * Close the modal
     */
    close() {
        this.modal.classList.remove('active');
        this.currentTaskId = null;
        this.logs = [];
    }
    
    /**
     * Load logs for a specific task with retry logic
     * @param {number} taskId - Task ID
     * @param {number} retryCount - Current retry attempt (default: 0)
     */
    async loadLogs(taskId, retryCount = 0) {
        const container = document.getElementById(`${this.modalId}-logs-container`);
        
        // Show loading state
        container.innerHTML = `
            <div class="loading-state" style="padding: 2rem; text-align: center;">
                <div class="loading-spinner"></div>
                <p style="color: var(--text-secondary); margin-top: 1rem;">${window.t('tasks.logModal.loading')}</p>
            </div>
        `;
        
        try {
            const response = await fetch(`/api/tasks/logs/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            // Handle HTTP errors
            if (!response.ok) {
                let errorMessage = window.t('tasks.logModal.loadError');
                let canRetry = false;
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                    
                    // Check if error is retryable
                    if (response.status >= 500 || response.status === 408 || response.status === 429) {
                        canRetry = true;
                    }
                } catch (parseError) {
                    errorMessage = `${window.t('tasks.notifications.serverError')}: ${response.status} ${response.statusText}`;
                    
                    if (response.status >= 500) {
                        canRetry = true;
                    }
                }
                
                const error = new Error(errorMessage);
                error.canRetry = canRetry;
                error.statusCode = response.status;
                throw error;
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.logs = data.logs || [];
                this.renderLogs();
            } else {
                throw new Error(data.message || window.t('tasks.logModal.loadError'));
            }
        } catch (error) {
            console.error('Error loading logs:', error);
            
            let errorMessage = window.t('tasks.logModal.loadError');
            let canRetry = error.canRetry || false;
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                errorMessage = window.t('tasks.notifications.connectionError');
                canRetry = true;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            // Show error with retry button if applicable
            if (canRetry && retryCount < 2) {
                container.innerHTML = `
                    <div class="empty-state" style="padding: 2rem; text-align: center;">
                        <p style="color: var(--danger); margin-bottom: 1rem;">❌ ${errorMessage}</p>
                        <button class="btn btn-primary" id="${this.modalId}-retry-btn" style="margin-top: 1rem;">
                            ${window.t('tasks.notifications.retry')}
                        </button>
                    </div>
                `;
                
                // Attach retry handler
                const retryBtn = document.getElementById(`${this.modalId}-retry-btn`);
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        this.loadLogs(taskId, retryCount + 1);
                    });
                }
            } else {
                container.innerHTML = `
                    <div class="empty-state" style="padding: 2rem; text-align: center;">
                        <p style="color: var(--danger); margin-bottom: 1rem;">❌ ${errorMessage}</p>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">${window.t('tasks.logModal.retryLimitReached')}</p>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Render logs list
     */
    renderLogs() {
        const container = document.getElementById(`${this.modalId}-logs-container`);
        
        if (this.logs.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center;">
                    <div class="empty-icon">📋</div>
                    <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">${window.t('tasks.logModal.noLogs')}</p>
                    <p style="color: var(--gray); font-size: 0.9rem;">${window.t('tasks.logModal.noLogsDesc')}</p>
                </div>
            `;
            return;
        }
        
        const logsHTML = this.logs.map(log => {
            const timestamp = this.formatTimestamp(log.created_at);
            const levelClass = this.getLevelClass(log.level);
            const levelIcon = this.getLevelIcon(log.level);
            
            return `
                <div class="log-entry log-entry-${levelClass}">
                    <div class="log-header">
                        <span class="log-level">
                            <i class="${levelIcon}"></i>
                            ${log.level.toUpperCase()}
                        </span>
                        <span class="log-timestamp">${timestamp}</span>
                    </div>
                    <div class="log-message">${this.escapeHtml(log.message)}</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div class="log-list">
                ${logsHTML}
            </div>
        `;
    }
    
    /**
     * Format timestamp for display
     * @param {string} timestamp - ISO timestamp string
     * @returns {string} Formatted timestamp
     */
    formatTimestamp(timestamp) {
        try {
            const date = new Date(timestamp);
            
            // Format as: "08 May 2026, 10:30:15"
            const options = {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };
            
            return date.toLocaleString('tr-TR', options);
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return timestamp;
        }
    }
    
    /**
     * Get CSS class for log level
     * @param {string} level - Log level (info, warning, error)
     * @returns {string} CSS class name
     */
    getLevelClass(level) {
        const levelMap = {
            'info': 'info',
            'warning': 'warning',
            'error': 'error'
        };
        return levelMap[level] || 'info';
    }
    
    /**
     * Get icon for log level
     * @param {string} level - Log level (info, warning, error)
     * @returns {string} Icon class name
     */
    getLevelIcon(level) {
        const iconMap = {
            'info': 'ph-bold ph-info',
            'warning': 'ph-bold ph-warning',
            'error': 'ph-bold ph-x-circle'
        };
        return iconMap[level] || 'ph-bold ph-info';
    }
    
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogViewerModal;
}
