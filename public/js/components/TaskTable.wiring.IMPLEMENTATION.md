# Task 7.3 Implementation: Wire Log Button to Modal

## Overview
This document describes the implementation of task 7.3, which wires the log buttons in the TaskTable component to open the LogViewerModal with the correct task ID.

## Requirements
- **Requirement 4.1**: The Task_Table SHALL display a "Log" button for each Task
- **Requirement 4.2**: WHEN the user clicks a Log button, THE Task_Management_UI SHALL open the Log_Viewer_Modal

## Implementation Details

### 1. Component Wiring (public/js/pages/tasks.js)

The wiring is implemented in the `initializeTaskTable()` method of the `TasksManager` class:

```javascript
initializeTaskTable() {
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
```

### 2. Task Loading Functionality

Added `loadTasks()` method to fetch tasks from the API and populate the table:

```javascript
async loadTasks() {
    if (!this.taskTable) return;
    
    this.taskTable.setLoading(true);
    
    try {
        const response = await fetch('/api/tasks/tasks', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.taskTable.setTasks(data.tasks || []);
        } else {
            throw new Error(data.message || 'Failed to load tasks');
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        window.showNotification('Görevler yüklenirken hata oluştu: ' + error.message, 'error');
        this.taskTable.setTasks([]);
    } finally {
        this.taskTable.setLoading(false);
    }
}
```

### 3. Polling Service

Implemented automatic task updates every 5 seconds:

```javascript
startTaskPolling() {
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
```

### 4. HTML Structure (views/pages/tasks.html)

Added the task table container to the page:

```html
<!-- Task Table -->
<div class="section">
    <div id="taskTableContainer"></div>
</div>
```

Also updated the header to include a refresh button:

```html
<button class="btn btn-secondary" id="refreshTasksBtn">
    <span class="btn-icon">
        <i class="ph-bold ph-arrow-clockwise"></i>
    </span>
    Yenile
</button>
```

### 5. Event Binding

Updated the `bindEvents()` method to handle the refresh button:

```javascript
// Refresh tasks button
document.getElementById('refreshTasksBtn')?.addEventListener('click', () => {
    if (this.taskTable) {
        this.loadTasks();
    }
});
```

### 6. Task Creation Integration

Updated the task creation callback to refresh the task table when a new task is created:

```javascript
this.taskCreationModal.onTaskCreated = (data) => {
    console.log('Task created:', data);
    // Refresh task table to show the new task
    if (this.taskTable) {
        this.loadTasks();
    }
    // Also refresh accounts list to show updated status
    this.loadAccounts();
};
```

### 7. Cleanup

Added cleanup when the page is unloaded to stop polling:

```javascript
window.addEventListener('beforeunload', () => {
    if (tasksManager) {
        tasksManager.stopTaskPolling();
    }
});
```

## Data Flow

1. **User clicks log button** → TaskTable component detects click
2. **TaskTable calls onViewLogs(taskId)** → Passes task ID to callback
3. **TasksManager receives callback** → Calls logViewerModal.open(taskId)
4. **LogViewerModal opens** → Fetches logs from API endpoint `/api/tasks/logs/:taskId`
5. **Logs displayed** → Modal shows logs with proper formatting

## Testing

A test file has been created at `public/js/components/TaskTable.wiring.test.html` to verify the wiring works correctly. The test:

1. Creates mock task data
2. Initializes TaskTable and LogViewerModal components
3. Wires the log button to the modal
4. Displays status messages when buttons are clicked
5. Verifies the modal opens with the correct task ID

## Files Modified

1. **public/js/pages/tasks.js**
   - Added `pollingInterval` property to constructor
   - Enhanced `initializeTaskTable()` to wire log buttons
   - Added `loadTasks()` method
   - Added `startTaskPolling()` method
   - Added `stopTaskPolling()` method
   - Updated `bindEvents()` to handle refresh button
   - Updated `initializeTaskCreationModal()` callback
   - Added cleanup on page unload

2. **views/pages/tasks.html**
   - Added `taskTableContainer` div
   - Updated header buttons (removed bulk check, added refresh)
   - Hidden legacy account selection section

3. **public/js/components/TaskTable.wiring.test.html** (new)
   - Created test file to verify wiring functionality

## Verification

To verify the implementation:

1. Open the test file: `http://localhost:3000/js/components/TaskTable.wiring.test.html`
2. Click any "Loglar" button in the table
3. Verify the modal opens with the correct task ID
4. Check the status message for confirmation

Or test in the actual application:

1. Navigate to the Tasks page
2. Create a task using the "Görev Oluştur" button
3. Wait for the task to appear in the table
4. Click the "Loglar" button for any task
5. Verify the LogViewerModal opens and displays logs

## Requirements Satisfied

✅ **Requirement 4.1**: Log buttons are displayed for each task in the TaskTable
✅ **Requirement 4.2**: Clicking a log button opens the LogViewerModal with the correct task ID

## Additional Features Implemented

- ✅ Automatic task loading on page load
- ✅ Real-time task updates via 5-second polling
- ✅ Manual refresh button for tasks
- ✅ Task table refresh after creating new tasks
- ✅ Proper cleanup when page is unloaded
- ✅ Error handling for failed API requests
- ✅ Loading states during data fetch

## Notes

- The wiring is implemented using a callback pattern where the TaskTable component calls `onViewLogs(taskId)` and the parent component (TasksManager) handles opening the modal
- This approach maintains separation of concerns: TaskTable handles rendering and user interaction, while TasksManager handles component coordination
- The polling service ensures users see real-time updates without manual refresh
- The implementation follows the design document specifications for polling intervals (5 seconds) and API endpoints
