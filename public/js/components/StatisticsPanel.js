/**
 * StatisticsPanel Component
 * 
 * Displays real-time task statistics in color-coded cards.
 * 
 * Features:
 * - Shows total, running, pending, completed, and failed task counts
 * - Color-coded statistics (running: blue, pending: yellow, completed: green, failed: red)
 * - Responsive grid layout
 * - Client-side statistics calculation (no additional API calls)
 * - Real-time updates when task data changes
 * 
 * Usage:
 * ```javascript
 * const statsPanel = new StatisticsPanel('statisticsPanel');
 * 
 * // Update statistics with task array
 * statsPanel.update(tasks);
 * ```
 */

class StatisticsPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.statistics = {
            total: 0,
            running: 0,
            pending: 0,
            completed: 0,
            failed: 0
        };
        
        if (!this.container) {
            console.error(`StatisticsPanel: Container with id "${containerId}" not found`);
            return;
        }
        
        this.render();
    }
    
    /**
     * Calculate statistics from task array
     * @param {Array} tasks - Array of task objects
     * @returns {Object} Statistics object with counts
     */
    calculateStatistics(tasks) {
        if (!Array.isArray(tasks)) {
            console.warn('StatisticsPanel: tasks must be an array');
            return {
                total: 0,
                running: 0,
                pending: 0,
                completed: 0,
                failed: 0
            };
        }
        
        const stats = {
            total: tasks.length,
            running: 0,
            pending: 0,
            completed: 0,
            failed: 0
        };
        
        // Count tasks by status
        tasks.forEach(task => {
            const status = task.status ? task.status.toLowerCase() : '';
            
            switch (status) {
                case 'running':
                    stats.running++;
                    break;
                case 'pending':
                    stats.pending++;
                    break;
                case 'completed':
                    stats.completed++;
                    break;
                case 'failed':
                case 'timeout':
                    // Count timeout as failed for statistics
                    stats.failed++;
                    break;
            }
        });
        
        return stats;
    }
    
    /**
     * Update statistics with new task data
     * Efficiently updates only changed values in the DOM
     * @param {Array} tasks - Array of task objects
     */
    update(tasks) {
        const newStatistics = this.calculateStatistics(tasks);
        
        // Track which statistics have changed
        const changedKeys = [];
        Object.keys(newStatistics).forEach(key => {
            if (this.statistics[key] !== newStatistics[key]) {
                changedKeys.push(key);
            }
        });
        
        // If no changes, skip DOM update entirely
        if (changedKeys.length === 0) {
            return;
        }
        
        // Update only the changed statistics in the DOM
        changedKeys.forEach(key => {
            const statCard = this.container.querySelector(`.stat-card.stat-${key}`);
            if (statCard) {
                const valueElement = statCard.querySelector('.stat-value');
                if (valueElement) {
                    valueElement.textContent = newStatistics[key];
                }
            }
        });
        
        // Update internal state
        this.statistics = newStatistics;
    }
    
    /**
     * Render the statistics panel
     */
    render() {
        const statsCards = [
            {
                key: 'total',
                label: window.t('tasks.statistics.total'),
                value: this.statistics.total,
                icon: 'ph-clipboard-text',
                colorClass: 'stat-total'
            },
            {
                key: 'running',
                label: window.t('tasks.statistics.running'),
                value: this.statistics.running,
                icon: 'ph-play-circle',
                colorClass: 'stat-running'
            },
            {
                key: 'pending',
                label: window.t('tasks.statistics.pending'),
                value: this.statistics.pending,
                icon: 'ph-clock',
                colorClass: 'stat-pending'
            },
            {
                key: 'completed',
                label: window.t('tasks.statistics.completed'),
                value: this.statistics.completed,
                icon: 'ph-check-circle',
                colorClass: 'stat-completed'
            },
            {
                key: 'failed',
                label: window.t('tasks.statistics.failed'),
                value: this.statistics.failed,
                icon: 'ph-x-circle',
                colorClass: 'stat-failed'
            }
        ];
        
        const cardsHTML = statsCards.map(card => this.renderStatCard(card)).join('');
        
        this.container.innerHTML = `
            <div class="statistics-grid">
                ${cardsHTML}
            </div>
        `;
    }
    
    /**
     * Render a single statistics card
     * @param {Object} card - Card configuration object
     * @returns {string} HTML string for the card
     */
    renderStatCard(card) {
        return `
            <div class="stat-card ${card.colorClass}">
                <div class="stat-icon">
                    <i class="ph-bold ${card.icon}"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${card.value}</div>
                    <div class="stat-label">${card.label}</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get current statistics
     * @returns {Object} Current statistics object
     */
    getStatistics() {
        return { ...this.statistics };
    }
    
    /**
     * Reset statistics to zero
     */
    reset() {
        this.statistics = {
            total: 0,
            running: 0,
            pending: 0,
            completed: 0,
            failed: 0
        };
        this.render();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsPanel;
}
