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
        this.userHasScrolledUp = false; // Track if user has manually scrolled up
        
        // Virtual scrolling properties
        this.virtualScrollEnabled = false; // Enable for 1000+ logs
        this.itemHeight = 20; // Approximate height of each log line in pixels
        this.visibleItems = 50; // Number of items to render at once
        this.bufferItems = 10; // Extra items to render above/below for smooth scrolling
        this.scrollTop = 0;
        this.virtualScrollHandler = null;
        
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
        this.userHasScrolledUp = false; // Reset scroll state when closing
        this.virtualScrollEnabled = false;
        this.scrollTop = 0;
        
        // Clean up scroll listener
        const logList = document.getElementById(`${this.modalId}-log-list`);
        if (logList && this.handleScroll) {
            logList.removeEventListener('scroll', this.handleScroll);
        }
        if (logList && this.virtualScrollHandler) {
            logList.removeEventListener('scroll', this.virtualScrollHandler);
            this.virtualScrollHandler = null;
        }
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
                    <div class="empty-icon"><i class="ph-bold ph-clipboard-text" style="font-size: 3rem; opacity: 0.5;"></i></div>
                    <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">${window.t('tasks.logModal.noLogs')}</p>
                    <p style="color: var(--gray); font-size: 0.9rem;">${window.t('tasks.logModal.noLogsDesc')}</p>
                </div>
            `;
            return;
        }
        
        // Enable virtual scrolling for 1000+ logs
        this.virtualScrollEnabled = this.logs.length >= 1000;
        
        if (this.virtualScrollEnabled) {
            this.renderLogsVirtual();
        } else {
            this.renderLogsStandard();
        }
        
        // Attach scroll listener to detect user scrolling
        this.attachScrollListener();
        
        // Auto-scroll to bottom if user hasn't scrolled up
        this.autoScrollToBottom();
    }
    
    /**
     * Render logs using standard method (for < 1000 logs)
     */
    renderLogsStandard() {
        const container = document.getElementById(`${this.modalId}-logs-container`);
        
        const logsHTML = this.logs.map(log => {
            const timestampCMD = this.formatTimestampCMD(log.created_at);
            const levelCMD = this.formatLevelCMD(log.level);
            const levelClass = this.getLevelClass(log.level);
            
            // Prepend timestamp and level to message in CMD style
            const formattedMessage = `${timestampCMD} ${levelCMD} ${this.escapeHtml(log.message)}`;
            
            return `
                <div class="log-entry log-entry-${levelClass}">
                    <div class="log-message">${formattedMessage}</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div class="log-list" id="${this.modalId}-log-list">
                ${logsHTML}
            </div>
        `;
    }
    
    /**
     * Render logs using virtual scrolling (for 1000+ logs)
     */
    renderLogsVirtual() {
        const container = document.getElementById(`${this.modalId}-logs-container`);
        
        // Calculate total height based on number of logs
        const totalHeight = this.logs.length * this.itemHeight;
        
        // Create virtual scroll container
        container.innerHTML = `
            <div class="log-list log-list-virtual" id="${this.modalId}-log-list">
                <div class="log-list-spacer" style="height: ${totalHeight}px; position: relative;">
                    <div class="log-list-viewport" id="${this.modalId}-log-viewport"></div>
                </div>
            </div>
        `;
        
        // Render initial visible items
        this.updateVirtualScroll();
        
        // Attach virtual scroll handler
        const logList = document.getElementById(`${this.modalId}-log-list`);
        if (logList) {
            // Remove existing handler if any
            if (this.virtualScrollHandler) {
                logList.removeEventListener('scroll', this.virtualScrollHandler);
            }
            
            // Create throttled scroll handler for performance
            this.virtualScrollHandler = this.throttle(() => {
                this.updateVirtualScroll();
            }, 16); // ~60fps
            
            logList.addEventListener('scroll', this.virtualScrollHandler);
        }
    }
    
    /**
     * Update virtual scroll viewport with visible items
     */
    updateVirtualScroll() {
        const logList = document.getElementById(`${this.modalId}-log-list`);
        const viewport = document.getElementById(`${this.modalId}-log-viewport`);
        
        if (!logList || !viewport) return;
        
        // Get current scroll position
        this.scrollTop = logList.scrollTop;
        
        // Calculate which items should be visible
        const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.bufferItems);
        const endIndex = Math.min(
            this.logs.length,
            Math.ceil((this.scrollTop + logList.clientHeight) / this.itemHeight) + this.bufferItems
        );
        
        // Use document fragment for batch DOM updates
        const fragment = document.createDocumentFragment();
        
        // Render only visible items
        for (let i = startIndex; i < endIndex; i++) {
            const log = this.logs[i];
            const timestampCMD = this.formatTimestampCMD(log.created_at);
            const levelCMD = this.formatLevelCMD(log.level);
            const levelClass = this.getLevelClass(log.level);
            
            // Prepend timestamp and level to message in CMD style
            const formattedMessage = `${timestampCMD} ${levelCMD} ${this.escapeHtml(log.message)}`;
            
            // Create log entry element
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry log-entry-${levelClass}`;
            logEntry.style.position = 'absolute';
            logEntry.style.top = `${i * this.itemHeight}px`;
            logEntry.style.left = '0';
            logEntry.style.right = '0';
            logEntry.style.height = `${this.itemHeight}px`;
            
            const logMessage = document.createElement('div');
            logMessage.className = 'log-message';
            logMessage.innerHTML = formattedMessage;
            
            logEntry.appendChild(logMessage);
            fragment.appendChild(logEntry);
        }
        
        // Clear viewport and append new items
        viewport.innerHTML = '';
        viewport.appendChild(fragment);
    }
    
    /**
     * Throttle function to limit execution rate
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Attach scroll listener to detect when user scrolls up
     */
    attachScrollListener() {
        const logList = document.getElementById(`${this.modalId}-log-list`);
        if (!logList) return;
        
        // Remove existing listener if any
        logList.removeEventListener('scroll', this.handleScroll);
        
        // Add new listener
        this.handleScroll = () => {
            const isAtBottom = this.isScrolledToBottom(logList);
            // If user is at bottom, reset the flag
            // If user is not at bottom, they've scrolled up
            this.userHasScrolledUp = !isAtBottom;
        };
        
        logList.addEventListener('scroll', this.handleScroll);
    }
    
    /**
     * Check if log container is scrolled to bottom
     * @param {HTMLElement} element - The scrollable element
     * @returns {boolean} True if scrolled to bottom
     */
    isScrolledToBottom(element) {
        if (!element) return false;
        
        // Allow 5px tolerance for "at bottom" detection
        const tolerance = 5;
        const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
        return scrollBottom <= tolerance;
    }
    
    /**
     * Auto-scroll to bottom if user hasn't scrolled up
     */
    autoScrollToBottom() {
        const logList = document.getElementById(`${this.modalId}-log-list`);
        if (!logList) return;
        
        // Only auto-scroll if user hasn't manually scrolled up
        if (!this.userHasScrolledUp) {
            // Use requestAnimationFrame for smooth scrolling
            requestAnimationFrame(() => {
                logList.scrollTop = logList.scrollHeight;
            });
        }
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
     * Format timestamp as [HH:MM:SS] for CMD-like display
     * @param {string} timestamp - ISO timestamp string
     * @returns {string} Formatted timestamp [HH:MM:SS]
     */
    formatTimestampCMD(timestamp) {
        try {
            const date = new Date(timestamp);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return '[00:00:00]';
            }
            
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            return `[${hours}:${minutes}:${seconds}]`;
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return '[00:00:00]';
        }
    }
    
    /**
     * Format log level as [LEVEL] for CMD-like display
     * @param {string} level - Log level (info, success, warning, error)
     * @returns {string} Formatted level [INFO], [SUCCESS], [WARNING], [ERROR]
     */
    formatLevelCMD(level) {
        const levelMap = {
            'info': '[INFO]',
            'success': '[SUCCESS]',
            'warning': '[WARNING]',
            'error': '[ERROR]'
        };
        return levelMap[level.toLowerCase()] || '[INFO]';
    }
    
    /**
     * Get CSS class for log level
     * @param {string} level - Log level (info, success, warning, error)
     * @returns {string} CSS class name
     */
    getLevelClass(level) {
        const levelMap = {
            'info': 'info',
            'success': 'success',
            'warning': 'warning',
            'error': 'error'
        };
        return levelMap[level] || 'info';
    }
    
    /**
     * Get icon for log level
     * @param {string} level - Log level (info, success, warning, error)
     * @returns {string} Icon class name
     */
    getLevelIcon(level) {
        const iconMap = {
            'info': 'ph-bold ph-info',
            'success': 'ph-bold ph-check-circle',
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
