/**
 * FilterSystem Component
 * 
 * Provides status-based task filtering with the following filters:
 * - All tasks
 * - Running tasks
 * - Pending tasks
 * - Failed tasks (includes timeout)
 * - Completed tasks
 * 
 * Features:
 * - Filter buttons with task counts
 * - Active filter highlighting
 * - Responsive design (horizontal on desktop, vertical on mobile)
 * - Real-time count updates
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

class FilterSystem {
    constructor(containerId, onFilterChange) {
        this.container = document.getElementById(containerId);
        this.onFilterChange = onFilterChange || (() => {});
        this.activeFilter = 'all';
        
        if (!this.container) {
            console.error(`FilterSystem: Container with id "${containerId}" not found`);
            return;
        }
        
        // Define filter configurations
        this.filters = [
            {
                id: 'all',
                label: window.t('tasks.filters.all'),
                status: null, // null means no status filter
                count: 0
            },
            {
                id: 'running',
                label: window.t('tasks.filters.running'),
                status: 'running',
                count: 0
            },
            {
                id: 'pending',
                label: window.t('tasks.filters.pending'),
                status: 'pending',
                count: 0
            },
            {
                id: 'failed',
                label: window.t('tasks.filters.failed'),
                status: ['failed', 'timeout'], // Failed includes timeout
                count: 0
            },
            {
                id: 'completed',
                label: window.t('tasks.filters.completed'),
                status: 'completed',
                count: 0
            }
        ];
        
        this.render();
    }
    
    /**
     * Update filter counts based on tasks
     * @param {Array} tasks - Array of task objects
     */
    updateCounts(tasks) {
        if (!tasks || !Array.isArray(tasks)) {
            tasks = [];
        }
        
        // Calculate counts for each filter
        this.filters.forEach(filter => {
            if (filter.id === 'all') {
                filter.count = tasks.length;
            } else if (Array.isArray(filter.status)) {
                // For filters with multiple statuses (e.g., failed includes timeout)
                filter.count = tasks.filter(task => 
                    filter.status.includes(task.status)
                ).length;
            } else {
                // For filters with single status
                filter.count = tasks.filter(task => 
                    task.status === filter.status
                ).length;
            }
        });
        
        this.render();
    }
    
    /**
     * Set active filter
     * @param {string} filterId - Filter ID
     */
    setActiveFilter(filterId) {
        const filter = this.filters.find(f => f.id === filterId);
        if (!filter) {
            console.error(`FilterSystem: Filter with id "${filterId}" not found`);
            return;
        }
        
        this.activeFilter = filterId;
        this.render();
        
        // Trigger callback
        this.onFilterChange(filterId);
    }
    
    /**
     * Get filtered tasks based on filter ID
     * @param {Array} tasks - Array of task objects
     * @param {string} filterId - Filter ID
     * @returns {Array} Filtered tasks
     */
    getFilteredTasks(tasks, filterId) {
        if (!tasks || !Array.isArray(tasks)) {
            return [];
        }
        
        const filter = this.filters.find(f => f.id === filterId);
        if (!filter) {
            return tasks;
        }
        
        // 'all' filter returns all tasks
        if (filter.status === null) {
            return tasks;
        }
        
        // Filter with multiple statuses
        if (Array.isArray(filter.status)) {
            return tasks.filter(task => filter.status.includes(task.status));
        }
        
        // Filter with single status
        return tasks.filter(task => task.status === filter.status);
    }
    
    /**
     * Render filter buttons
     */
    render() {
        const filtersHTML = this.filters.map(filter => {
            const isActive = filter.id === this.activeFilter;
            const activeClass = isActive ? 'filter-btn-active' : '';
            
            return `
                <button 
                    class="filter-btn ${activeClass}" 
                    data-filter-id="${filter.id}"
                    aria-pressed="${isActive}"
                >
                    <span class="filter-label">${filter.label}</span>
                    <span class="filter-count">${filter.count}</span>
                </button>
            `;
        }).join('');
        
        this.container.innerHTML = `
            <div class="filter-system">
                ${filtersHTML}
            </div>
        `;
        
        // Attach event listeners
        this.attachEventListeners();
    }
    
    /**
     * Attach event listeners to filter buttons
     */
    attachEventListeners() {
        const filterButtons = this.container.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filterId = e.currentTarget.dataset.filterId;
                this.setActiveFilter(filterId);
            });
        });
    }
    
    /**
     * Get current active filter ID
     * @returns {string} Active filter ID
     */
    getActiveFilter() {
        return this.activeFilter;
    }
    
    /**
     * Get filter configuration by ID
     * @param {string} filterId - Filter ID
     * @returns {Object|null} Filter configuration or null
     */
    getFilter(filterId) {
        return this.filters.find(f => f.id === filterId) || null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterSystem;
}
