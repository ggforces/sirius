# TaskTable Component

A responsive table component for displaying task information with support for desktop table layout and mobile card layout.

## Features

- **Responsive Design**: Automatically switches between table layout (desktop) and card layout (mobile)
- **Status Visualization**: Color-coded status badges for quick task status identification
- **Proxy Information**: Displays proxy details with special handling for waiting/deleted proxies
- **Log Access**: Built-in log viewing button for each task
- **Loading State**: Shows loading spinner while fetching data
- **Empty State**: Displays helpful message when no tasks exist
- **Real-time Updates**: Supports polling for task status updates

## Installation

### 1. Include CSS

Add the TaskTable CSS file to your HTML:

```html
<link rel="stylesheet" href="/css/components/task-table.css">
```

### 2. Include JavaScript

Add the TaskTable component script to your HTML:

```html
<script src="/js/components/TaskTable.js"></script>
```

### 3. Add Container Element

Add a container element where the table will be rendered:

```html
<div id="taskTableContainer"></div>
```

## Usage

### Basic Initialization

```javascript
// Initialize the component
const taskTable = new TaskTable('taskTableContainer');

// Set tasks data
taskTable.setTasks(tasks);
```

### Loading Tasks from API

```javascript
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
            taskTable.setTasks(data.tasks);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        taskTable.setTasks([]);
    }
}
```

### Handling Log Button Clicks

```javascript
// Override the onViewLogs method to handle log button clicks
taskTable.onViewLogs = (taskId) => {
    console.log('Opening logs for task:', taskId);
    // Open your log viewer modal here
    openLogViewerModal(taskId);
};
```

### Polling for Updates

```javascript
let pollingInterval;

function startPolling() {
    loadTasks(); // Initial load
    
    pollingInterval = setInterval(() => {
        loadTasks();
    }, 5000); // Poll every 5 seconds
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// Start polling
startPolling();

// Stop polling when user navigates away
window.addEventListener('beforeunload', stopPolling);
```

### Updating a Single Task

```javascript
// Update a single task without re-rendering the entire table
const updatedTask = {
    id: 1,
    account_username: 'testuser1',
    proxy_id: 1,
    proxy_ip: '192.168.1.1',
    proxy_port: 8080,
    status: 'completed'
};

taskTable.updateTask(updatedTask);
```

## API Methods

### `setTasks(tasks)`

Set the tasks data and re-render the table.

**Parameters:**
- `tasks` (Array): Array of task objects

**Example:**
```javascript
taskTable.setTasks([
    {
        id: 1,
        account_username: 'testuser1',
        proxy_id: 1,
        proxy_ip: '192.168.1.1',
        proxy_port: 8080,
        status: 'pending'
    }
]);
```

### `setLoading(loading)`

Set the loading state.

**Parameters:**
- `loading` (boolean): Loading state

**Example:**
```javascript
taskTable.setLoading(true);
```

### `updateTask(updatedTask)`

Update a single task in the table.

**Parameters:**
- `updatedTask` (Object): Updated task object

**Example:**
```javascript
taskTable.updateTask({
    id: 1,
    status: 'completed'
});
```

### `getTask(taskId)`

Get a task by ID.

**Parameters:**
- `taskId` (number): Task ID

**Returns:**
- `Object|null`: Task object or null if not found

**Example:**
```javascript
const task = taskTable.getTask(1);
```

### `onViewLogs(taskId)`

Handle log button click. Override this method to implement custom behavior.

**Parameters:**
- `taskId` (number): Task ID

**Example:**
```javascript
taskTable.onViewLogs = (taskId) => {
    openLogViewerModal(taskId);
};
```

## Task Object Format

The component expects task objects with the following structure:

```javascript
{
    id: number,                    // Task ID
    account_username: string,      // Account username
    proxy_id: number|null,         // Proxy ID (null if waiting for proxy)
    proxy_ip: string|null,         // Proxy IP (null if proxy deleted)
    proxy_port: number|null,       // Proxy port (null if proxy deleted)
    status: string,                // Task status: 'pending', 'running', 'completed', 'failed', 'timeout'
    task_type: string,             // Task type (optional)
    result: string|null,           // Task result (optional)
    error: string|null,            // Error message (optional)
    created_at: string,            // Creation timestamp (optional)
    started_at: string|null,       // Start timestamp (optional)
    completed_at: string|null      // Completion timestamp (optional)
}
```

## Status Values

The component supports the following status values:

- `pending`: Task is waiting to be executed (yellow/orange badge)
- `running`: Task is currently executing (blue badge)
- `completed`: Task completed successfully (green badge)
- `failed`: Task failed (red badge)
- `timeout`: Task timed out (orange badge)

## Proxy Display Logic

The component handles proxy information display with the following logic:

1. **Proxy Assigned**: If `proxy_id` is not null and `proxy_ip`/`proxy_port` are available, displays "IP:Port"
2. **Waiting for Proxy**: If `proxy_id` is null, displays "Bekliyor" (Waiting)
3. **Proxy Deleted**: If `proxy_id` is not null but `proxy_ip`/`proxy_port` are null, displays "Proxy Silinmiş" (Proxy Deleted)

## Responsive Breakpoints

- **Desktop (> 768px)**: Table layout
- **Mobile (≤ 768px)**: Card layout

## Styling

The component uses CSS variables for theming. Make sure your project includes the following CSS variables:

```css
:root {
    --primary: #00d4ff;
    --light: #ffffff;
    --gray: #9ca3af;
    --gray-light: #d1d5db;
    --text-secondary: #9ca3af;
    --radius-md: 12px;
    --radius-sm: 6px;
    --transition-fast: 0.2s ease;
    --transition-normal: 0.3s ease;
}
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Requirements

This component validates the following requirements from the design document:

- **Requirement 2.1**: Display Task_Table showing all user tasks
- **Requirement 2.2**: Display columns for Task ID, Account, Proxy, Status, and Logs
- **Requirement 11.1**: Responsive design with mobile card layout
- **Requirement 11.2**: Standard table layout for desktop

## Example Integration

See `TaskTable.example.js` for a complete integration example.

## License

This component is part of the Sirius Steam Automation project.
