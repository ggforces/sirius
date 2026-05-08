/**
 * TaskTable Component
 * 
 * Displays tasks in a table format with the following columns:
 * - Task ID
 * - Account (username)
 * - Proxy (IP:Port format)
 * - Status (with color-coded badges)
 * - Logs (button to view logs)
 * 
 * Features:
 * - Responsive design (table on desktop, cards on mobile)
 * - Real-time status updates via polling
 * - Empty state when no tasks exist
 * - Loading state during data fetch
 */

class TaskTable {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tasks = [];
        this.isLoading = false;
        
        if (!this.container) {
            console.error(`TaskTable: Container with id "${containerId}" not found`);
            return;
        }
        
        this.render();
    }
    
    /**
     * Set tasks data and re-render the table
     * @param {Array} tasks - Array of task objects
     */
    setTasks(tasks) {
        // Save scroll position before updating
        const scrollPosition = this.saveScrollPosition();
        
        this.tasks = tasks || [];
        this.render();
        
        // Restore scroll position after updating
        this.restoreScrollPosition(scrollPosition);
    }
    
    /**
     * Save current scroll position
     * @returns {Object} Scroll position object
     */
    saveScrollPosition() {
        const tableContainer = this.container.querySelector('.task-table-container');
        const cardsContainer = this.container.querySelector('.task-cards-container');
        
        return {
            table: tableContainer ? tableContainer.scrollTop : 0,
            cards: cardsContainer ? cardsContainer.scrollTop : 0,
            window: window.scrollY
        };
    }
    
    /**
     * Restore scroll position
     * @param {Object} scrollPosition - Scroll position object
     */
    restoreScrollPosition(scrollPosition) {
        if (!scrollPosition) return;
        
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
            const tableContainer = this.container.querySelector('.task-table-container');
            const cardsContainer = this.container.querySelector('.task-cards-container');
            
            if (tableContainer && scrollPosition.table) {
                tableContainer.scrollTop = scrollPosition.table;
            }
            
            if (cardsContainer && scrollPosition.cards) {
                cardsContainer.scrollTop = scrollPosition.cards;
            }
            
            if (scrollPosition.window) {
                window.scrollTo(0, scrollPosition.window);
            }
        });
    }
    
    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        this.render();
    }
    
    /**
     * Main render method
     */
    render() {
        if (this.isLoading) {
            this.renderLoading();
        } else if (this.tasks.length === 0) {
            this.renderEmpty();
        } else {
            this.renderTable();
        }
    }
    
    /**
     * Render loading state
     */
    renderLoading() {
        this.container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p style="color: var(--text-secondary); margin-top: 1rem;">${window.t('tasks.table.loading')}</p>
            </div>
        `;
    }
    
    /**
     * Render empty state (no tasks)
     */
    renderEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p style="color: var(--text-secondary); font-size: 1.1rem; margin-bottom: 0.5rem;">${window.t('tasks.table.noTasks')}</p>
                <p style="color: var(--gray); font-size: 0.9rem;">${window.t('tasks.table.noTasksDesc')}</p>
            </div>
        `;
    }
    
    /**
     * Render task table
     */
    renderTable() {
        // Desktop table view
        const tableHTML = `
            <div class="task-table-container">
                <table class="task-table">
                    <thead>
                        <tr>
                            <th>${window.t('tasks.table.taskId')}</th>
                            <th>${window.t('tasks.table.account')}</th>
                            <th>${window.t('tasks.table.proxy')}</th>
                            <th>${window.t('tasks.table.status')}</th>
                            <th>${window.t('tasks.table.logs')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.tasks.map(task => this.renderTableRow(task)).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // Mobile card view
        const cardsHTML = `
            <div class="task-cards-container">
                ${this.tasks.map(task => this.renderTaskCard(task)).join('')}
            </div>
        `;
        
        this.container.innerHTML = `
            ${tableHTML}
            ${cardsHTML}
        `;
        
        // Attach event listeners
        this.attachEventListeners();
    }
    
    /**
     * Render a single table row
     * @param {Object} task - Task object
     * @returns {string} HTML string
     */
    renderTableRow(task) {
        const proxyInfo = this.formatProxyInfo(task);
        const statusBadge = this.getStatusBadge(task.status);
        const accountUsername = task.account_username || window.t('tasks.card.unknown');
        
        return `
            <tr data-task-id="${task.id}">
                <td class="task-id-cell">#${task.id}</td>
                <td class="task-account-cell">${accountUsername}</td>
                <td class="task-proxy-cell">${proxyInfo}</td>
                <td class="task-status-cell">${statusBadge}</td>
                <td class="task-logs-cell">
                    <button class="btn-view-logs" data-task-id="${task.id}">
                        <span class="btn-icon">📄</span>
                        ${window.t('tasks.table.viewLogs')}
                    </button>
                </td>
            </tr>
        `;
    }
    
    /**
     * Render a single task card (mobile view)
     * @param {Object} task - Task object
     * @returns {string} HTML string
     */
    renderTaskCard(task) {
        const proxyInfo = this.formatProxyInfo(task);
        const statusBadge = this.getStatusBadge(task.status);
        const accountUsername = task.account_username || window.t('tasks.card.unknown');
        
        return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-card-header">
                    <div class="task-card-id">#${task.id}</div>
                    ${statusBadge}
                </div>
                <div class="task-card-body">
                    <div class="task-card-row">
                        <span class="task-card-label">${window.t('tasks.table.account')}:</span>
                        <span class="task-card-value">${accountUsername}</span>
                    </div>
                    <div class="task-card-row">
                        <span class="task-card-label">${window.t('tasks.table.proxy')}:</span>
                        <span class="task-card-value">${proxyInfo}</span>
                    </div>
                </div>
                <div class="task-card-footer">
                    <button class="btn-view-logs-card" data-task-id="${task.id}">
                        <span class="btn-icon">📄</span>
                        ${window.t('tasks.table.viewLogsCard')}
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Format proxy information for display
     * @param {Object} task - Task object
     * @returns {string} Formatted proxy info
     */
    formatProxyInfo(task) {
        // If proxy_id is null, task is waiting for proxy assignment
        if (task.proxy_id === null) {
            return `<span class="proxy-waiting">${window.t('tasks.proxy.waiting')}</span>`;
        }
        
        // If proxy info is available
        if (task.proxy_ip && task.proxy_port) {
            return `<span class="proxy-info">${task.proxy_ip}:${task.proxy_port}</span>`;
        }
        
        // If proxy was deleted
        return `<span class="proxy-deleted">${window.t('tasks.proxy.deleted')}</span>`;
    }
    
    /**
     * Get status badge HTML
     * @param {string} status - Task status
     * @returns {string} Status badge HTML
     */
    getStatusBadge(status) {
        const statusConfig = {
            pending: {
                label: window.t('tasks.status.pending'),
                class: 'status-pending'
            },
            running: {
                label: window.t('tasks.status.running'),
                class: 'status-running'
            },
            completed: {
                label: window.t('tasks.status.completed'),
                class: 'status-completed'
            },
            failed: {
                label: window.t('tasks.status.failed'),
                class: 'status-failed'
            },
            timeout: {
                label: window.t('tasks.status.timeout'),
                class: 'status-timeout'
            }
        };
        
        const config = statusConfig[status] || {
            label: status,
            class: 'status-unknown'
        };
        
        return `<span class="status-badge ${config.class}">${config.label}</span>`;
    }
    
    /**
     * Attach event listeners to log buttons
     */
    attachEventListeners() {
        // Desktop view log buttons
        const logButtons = this.container.querySelectorAll('.btn-view-logs');
        logButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = parseInt(e.currentTarget.dataset.taskId);
                this.onViewLogs(taskId);
            });
        });
        
        // Mobile view log buttons
        const logButtonsCard = this.container.querySelectorAll('.btn-view-logs-card');
        logButtonsCard.forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = parseInt(e.currentTarget.dataset.taskId);
                this.onViewLogs(taskId);
            });
        });
    }
    
    /**
     * Handle view logs button click
     * Override this method to implement custom behavior
     * @param {number} taskId - Task ID
     */
    onViewLogs(taskId) {
        console.log('View logs for task:', taskId);
        // This method should be overridden by the parent component
        // Example: taskTable.onViewLogs = (taskId) => { openLogModal(taskId); }
    }
    
    /**
     * Update a single task in the table
     * @param {Object} updatedTask - Updated task object
     */
    updateTask(updatedTask) {
        const index = this.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
            this.tasks[index] = updatedTask;
            this.render();
        }
    }
    
    /**
     * Get task by ID
     * @param {number} taskId - Task ID
     * @returns {Object|null} Task object or null
     */
    getTask(taskId) {
        return this.tasks.find(t => t.id === taskId) || null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskTable;
}
