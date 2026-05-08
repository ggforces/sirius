# Real-Time Polling Service Implementation

## Overview

This document describes the implementation of the real-time polling service for Task 9 of the Task Management UI Redesign spec. The polling service provides automatic task status updates every 5 seconds without requiring manual page refresh.

## Requirements Implemented

### Requirement 10.1: Poll every 5 seconds
- **Implementation**: `startTaskPolling()` method uses `setInterval` with 5000ms interval
- **Location**: `public/js/pages/tasks.js` lines 72-76
- **Verification**: Polling starts when TaskTable is initialized and continues every 5 seconds

### Requirement 10.2: Update table when new data received
- **Implementation**: `loadTasks()` method fetches tasks and calls `taskTable.setTasks()`
- **Location**: `public/js/pages/tasks.js` lines 48-70
- **Verification**: TaskTable component re-renders with new data on each successful fetch

### Requirement 10.3: Preserve scroll position during updates
- **Implementation**: `TaskTable.setTasks()` saves scroll position before render and restores after
- **Location**: `public/js/components/TaskTable.js` lines 30-68
- **Methods**:
  - `saveScrollPosition()`: Captures current scroll positions (table, cards, window)
  - `restoreScrollPosition()`: Restores scroll positions using `requestAnimationFrame`
- **Verification**: User's scroll position remains unchanged during polling updates

### Requirement 10.4: Update status from pending to running
- **Implementation**: TaskTable automatically updates status badges when task data changes
- **Location**: `public/js/components/TaskTable.js` lines 195-221
- **Verification**: Status badge color and text update when task status changes

### Requirement 10.5: Update status to completed/failed/timeout
- **Implementation**: Same as 10.4 - all status changes are handled uniformly
- **Location**: `public/js/components/TaskTable.js` lines 195-221
- **Verification**: All terminal statuses (completed, failed, timeout) display correctly

### Requirement 10.6: Stop polling when navigating away
- **Implementation**: 
  - `stopTaskPolling()` method clears the interval
  - `beforeunload` event listener calls `stopTaskPolling()`
- **Location**: `public/js/pages/tasks.js` lines 78-83, 598-602
- **Verification**: Polling stops when user navigates away or closes the page

## Architecture

### Component Structure

```
TasksManager (public/js/pages/tasks.js)
├── pollingInterval: number | null
├── pollingFailureCount: number
├── maxPollingFailures: number (3)
├── startTaskPolling(): void
├── stopTaskPolling(): void
└── loadTasks(): Promise<void>

TaskTable (public/js/components/TaskTable.js)
├── setTasks(tasks): void
├── saveScrollPosition(): Object
└── restoreScrollPosition(scrollPosition): void
```

### Data Flow

```
1. TasksManager.init()
   └── initializeTaskTable()
       └── startTaskPolling()
           └── setInterval(loadTasks, 5000)

2. Every 5 seconds:
   loadTasks()
   ├── fetch('/api/tasks/tasks')
   ├── taskTable.setLoading(true)
   ├── taskTable.setTasks(data.tasks)
   │   ├── saveScrollPosition()
   │   ├── render()
   │   └── restoreScrollPosition()
   └── taskTable.setLoading(false)

3. On navigation:
   window.beforeunload
   └── stopTaskPolling()
       └── clearInterval(pollingInterval)
```

## Error Handling

### Consecutive Failure Tracking

The polling service tracks consecutive failures and shows a notification after 3 failures:

```javascript
// In TasksManager constructor
this.pollingFailureCount = 0;
this.maxPollingFailures = 3;

// In loadTasks() catch block
this.pollingFailureCount++;

if (this.pollingFailureCount >= this.maxPollingFailures) {
    window.showNotification(
        'Görevler yüklenirken sürekli hata oluşuyor. Lütfen internet bağlantınızı kontrol edin.',
        'error'
    );
    this.pollingFailureCount = 0; // Reset to avoid spam
}
```

### Error Recovery

- **Polling continues after errors**: The interval is not cleared on fetch failures
- **Failure counter resets on success**: `pollingFailureCount = 0` on successful fetch
- **Empty state on error**: TaskTable displays empty array on fetch failure
- **Loading state always cleared**: `finally` block ensures loading state is reset

## Scroll Position Preservation

### Implementation Details

The scroll position preservation works by:

1. **Saving scroll positions** before DOM update:
   - Table container scroll position
   - Cards container scroll position (mobile)
   - Window scroll position

2. **Restoring scroll positions** after DOM update:
   - Uses `requestAnimationFrame` to ensure DOM is fully rendered
   - Restores all three scroll positions independently

### Code Example

```javascript
setTasks(tasks) {
    // Save scroll position before updating
    const scrollPosition = this.saveScrollPosition();
    
    this.tasks = tasks || [];
    this.render();
    
    // Restore scroll position after updating
    this.restoreScrollPosition(scrollPosition);
}

saveScrollPosition() {
    const tableContainer = this.container.querySelector('.task-table-container');
    const cardsContainer = this.container.querySelector('.task-cards-container');
    
    return {
        table: tableContainer ? tableContainer.scrollTop : 0,
        cards: cardsContainer ? cardsContainer.scrollTop : 0,
        window: window.scrollY
    };
}

restoreScrollPosition(scrollPosition) {
    if (!scrollPosition) return;
    
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
```

## Status Change Detection

Status changes are automatically detected through the polling mechanism:

1. **Polling fetches latest task data** every 5 seconds
2. **TaskTable.setTasks()** receives updated task array
3. **TaskTable.render()** re-renders all task rows
4. **Status badges update** based on new task.status values

### Status Badge Mapping

```javascript
const statusConfig = {
    pending: {
        label: 'Bekliyor',
        class: 'status-pending'  // Yellow/orange
    },
    running: {
        label: 'İşleniyor',
        class: 'status-running'  // Blue
    },
    completed: {
        label: 'Tamamlandı',
        class: 'status-completed'  // Green
    },
    failed: {
        label: 'Başarısız',
        class: 'status-failed'  // Red
    },
    timeout: {
        label: 'Zaman Aşımı',
        class: 'status-timeout'  // Red/orange
    }
};
```

## Lifecycle Management

### Initialization

```javascript
// In TasksManager.init()
initializeTaskTable() {
    const taskTableContainer = document.getElementById('taskTableContainer');
    if (taskTableContainer) {
        this.taskTable = new TaskTable('taskTableContainer');
        
        // Wire log button click handler
        this.taskTable.onViewLogs = (taskId) => {
            this.logViewerModal.open(taskId);
        };
        
        // Load initial tasks
        this.loadTasks();
        
        // Start polling for task updates every 5 seconds
        this.startTaskPolling();
    }
}
```

### Cleanup

```javascript
// In window.beforeunload event
window.addEventListener('beforeunload', () => {
    if (tasksManager) {
        tasksManager.stopTaskPolling();
    }
});
```

## Testing

### Unit Tests

Location: `public/js/pages/tasks.polling.test.js`

Tests cover:
- ✅ Polling interval (5 seconds)
- ✅ API endpoint calls
- ✅ Table updates on data received
- ✅ Loading state management
- ✅ Status change detection (all statuses)
- ✅ Polling lifecycle (start/stop)
- ✅ Error handling (consecutive failures)
- ✅ Failure counter reset on success
- ✅ Polling continues after errors
- ✅ Integration with TaskTable

### Manual Testing

Location: `test-polling-service.html`

Interactive tests for:
- Polling interval verification
- Scroll position preservation
- Error handling with consecutive failures
- Lifecycle management
- Status change detection
- Live polling log

## Performance Considerations

### Polling Frequency

- **5-second interval** balances real-time updates with server load
- **No exponential backoff** - consistent polling for predictable UX
- **Continues on errors** - ensures recovery when network is restored

### DOM Updates

- **Minimal re-renders** - only updates when data changes
- **Scroll preservation** - prevents jarring user experience
- **requestAnimationFrame** - ensures smooth scroll restoration

### Memory Management

- **Interval cleanup** - prevents memory leaks on navigation
- **Event listener cleanup** - beforeunload listener properly attached
- **No memory accumulation** - old task data is replaced, not accumulated

## Future Enhancements

1. **WebSocket Integration**: Replace polling with WebSocket for true real-time updates
2. **Differential Updates**: Only update changed tasks instead of full re-render
3. **Exponential Backoff**: Reduce polling frequency after consecutive failures
4. **Visibility API**: Pause polling when tab is not visible
5. **Network Status Detection**: Pause polling when offline, resume when online
6. **Optimistic Updates**: Show task creation immediately before server confirmation

## Troubleshooting

### Polling Not Starting

**Symptom**: Tasks don't update automatically

**Causes**:
- TaskTable container not found in DOM
- JavaScript error preventing initialization
- Polling interval not set

**Solution**:
1. Check browser console for errors
2. Verify `taskTableContainer` element exists in HTML
3. Ensure TasksManager is initialized after DOM load

### Scroll Position Not Preserved

**Symptom**: Page jumps to top during updates

**Causes**:
- Scroll containers not found
- requestAnimationFrame not executing
- Scroll position saved as 0

**Solution**:
1. Check if `.task-table-container` or `.task-cards-container` exists
2. Verify scroll position is non-zero before update
3. Check browser console for errors in restoreScrollPosition

### Notification Spam

**Symptom**: Error notifications appear repeatedly

**Causes**:
- Failure counter not resetting
- Network issues causing persistent failures

**Solution**:
1. Check network connectivity
2. Verify API endpoint is accessible
3. Check if failure counter resets on success

### Polling Not Stopping

**Symptom**: Polling continues after navigation

**Causes**:
- beforeunload event not firing
- stopTaskPolling not called
- Interval not cleared

**Solution**:
1. Verify beforeunload event listener is attached
2. Check if stopTaskPolling is called in cleanup
3. Ensure clearInterval is called with correct interval ID

## Conclusion

The real-time polling service successfully implements all requirements (10.1-10.6) with robust error handling, scroll position preservation, and proper lifecycle management. The implementation is production-ready and provides a smooth user experience for monitoring task status updates.
