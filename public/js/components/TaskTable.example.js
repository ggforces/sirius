/**
 * TaskTable Component - Usage Example
 * 
 * This file demonstrates how to use the TaskTable component in the Tasks page.
 * 
 * INTEGRATION STEPS:
 * 
 * 1. Include the TaskTable component script in your HTML:
 *    <script src="/js/components/TaskTable.js"></script>
 * 
 * 2. Include the TaskTable CSS in your HTML:
 *    <link rel="stylesheet" href="/css/components/task-table.css">
 * 
 * 3. Add a container element in your HTML where the table will be rendered:
 *    <div id="taskTableContainer"></div>
 * 
 * 4. Initialize and use the TaskTable component in your JavaScript:
 */

// Example: Initialize TaskTable component
const taskTable = new TaskTable('taskTableContainer');

// Example: Set loading state
taskTable.setLoading(true);

// Example: Fetch tasks from API and display them
async function loadTasks() {
    try {
        taskTable.setLoading(true);
        
        const response = await fetch('/api/tasks/tasks', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Set tasks data
            taskTable.setTasks(data.tasks);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        window.showNotification('Görevler yüklenirken hata oluştu: ' + error.message, 'error');
        taskTable.setTasks([]);
    }
}

// Example: Handle log button clicks
taskTable.onViewLogs = (taskId) => {
    console.log('Opening logs for task:', taskId);
    // Open log viewer modal
    openLogViewerModal(taskId);
};

// Example: Polling for task updates every 5 seconds
let pollingInterval;

function startPolling() {
    // Initial load
    loadTasks();
    
    // Poll every 5 seconds
    pollingInterval = setInterval(() => {
        loadTasks();
    }, 5000);
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// Example: Start polling when page loads
startPolling();

// Example: Stop polling when user navigates away
window.addEventListener('beforeunload', () => {
    stopPolling();
});

// Example: Update a single task
function updateTaskStatus(taskId, newStatus) {
    const task = taskTable.getTask(taskId);
    if (task) {
        task.status = newStatus;
        taskTable.updateTask(task);
    }
}

// Example: Mock data for testing
const mockTasks = [
    {
        id: 1,
        account_username: 'testuser1',
        proxy_id: 1,
        proxy_ip: '192.168.1.1',
        proxy_port: 8080,
        status: 'pending'
    },
    {
        id: 2,
        account_username: 'testuser2',
        proxy_id: 2,
        proxy_ip: '192.168.1.2',
        proxy_port: 8080,
        status: 'running'
    },
    {
        id: 3,
        account_username: 'testuser3',
        proxy_id: null,
        proxy_ip: null,
        proxy_port: null,
        status: 'completed'
    },
    {
        id: 4,
        account_username: 'testuser4',
        proxy_id: 999,
        proxy_ip: null,
        proxy_port: null,
        status: 'failed'
    }
];

// Example: Use mock data for testing
// taskTable.setTasks(mockTasks);

/**
 * EXPECTED API RESPONSE FORMAT:
 * 
 * GET /api/tasks/tasks
 * 
 * Response:
 * {
 *   "success": true,
 *   "tasks": [
 *     {
 *       "id": 1,
 *       "user_id": 1,
 *       "account_id": 1,
 *       "account_username": "testuser1",
 *       "proxy_id": 1,
 *       "proxy_ip": "192.168.1.1",
 *       "proxy_port": 8080,
 *       "status": "pending",
 *       "task_type": "account_check",
 *       "result": null,
 *       "error": null,
 *       "created_at": "2026-05-08T10:00:00.000Z",
 *       "started_at": null,
 *       "completed_at": null
 *     },
 *     ...
 *   ]
 * }
 * 
 * NOTES:
 * - The API should join the accounts table to get account_username
 * - The API should join the proxies table to get proxy_ip and proxy_port
 * - If proxy is deleted, proxy_ip and proxy_port will be null but proxy_id will still exist
 * - If task is waiting for proxy, proxy_id will be null
 */
