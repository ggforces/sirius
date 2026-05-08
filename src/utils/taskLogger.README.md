# Task Logger Utility

## Overview

The `taskLogger` utility provides persistent logging functionality for task execution in the task management system. It writes log entries to the `task_logs` database table, enabling users to view execution history and debug issues.

## Files Created

1. **`src/utils/taskLogger.js`** - Main utility module
2. **`src/utils/taskLogger.test.js`** - Comprehensive test suite (20 tests)
3. **`src/utils/taskLogger.example.js`** - Usage examples
4. **`src/utils/taskLogger.integration.md`** - Integration guide
5. **`src/utils/taskLogger.README.md`** - This file

## API

### `logTaskMessage(taskId, level, message)`

Logs a message for a specific task to the `task_logs` database table.

**Parameters:**
- `taskId` (number, required): The ID of the task to log for
- `level` (string, required): The log level - must be one of: 'info', 'warning', 'error'
- `message` (string, required): The log message

**Returns:**
- `boolean`: Returns `true` if log was successfully inserted, `false` otherwise

**Example:**
```javascript
const { logTaskMessage } = require('./utils/taskLogger');

logTaskMessage(123, 'info', 'Task started with proxy 192.168.1.1:8080');
logTaskMessage(123, 'error', 'Proxy connection timeout');
```

### `VALID_LOG_LEVELS`

Exported constant array containing valid log levels: `['info', 'warning', 'error']`

## Features

### Input Validation

The utility validates all inputs before attempting database insertion:

1. **taskId validation**:
   - Must be a number
   - Must be greater than 0
   - Cannot be null or undefined

2. **level validation**:
   - Must be a string
   - Must be one of: 'info', 'warning', 'error'
   - Case-insensitive (automatically normalized to lowercase)

3. **message validation**:
   - Must be a string
   - Cannot be empty or whitespace-only
   - Automatically trimmed of leading/trailing whitespace

### Error Handling

The utility handles errors gracefully:

1. **Input validation errors**: Returns `false` and logs warning to application logger
2. **Database insertion errors**: Returns `false` and logs error with full context
3. **Foreign key constraint errors**: Returns `false` (e.g., when taskId doesn't exist)
4. **Never throws exceptions**: Won't break task execution flow

### Database Integration

- Inserts logs into the `task_logs` table
- Uses parameterized queries to prevent SQL injection
- Respects foreign key constraints (task_id references tasks.id)
- Logs are automatically deleted when parent task is deleted (CASCADE)

## Testing

The utility includes a comprehensive test suite with 20 tests covering:

- Valid log insertion (info, warning, error levels)
- Case-insensitive level validation
- Input validation (null, invalid types, empty values)
- Message trimming
- Long messages
- Special characters
- Non-existent task IDs
- Foreign key constraint handling

**Run tests:**
```bash
node src/utils/taskLogger.test.js
```

**Expected output:**
```
✅ All tests passed
Tests passed: 20
Tests failed: 0
```

## Usage Examples

### Basic Usage

```javascript
const { logTaskMessage } = require('./utils/taskLogger');

// Log task start
logTaskMessage(taskId, 'info', 'Task started');

// Log progress
logTaskMessage(taskId, 'info', 'Connecting to Steam...');

// Log warning
logTaskMessage(taskId, 'warning', 'Proxy response slow, retrying...');

// Log error
logTaskMessage(taskId, 'error', 'Connection failed: timeout');
```

### Integration with Task Executor

```javascript
async function executeTask(taskId) {
    try {
        // Log task start
        logTaskMessage(taskId, 'info', `Task started with proxy ${proxy.ip}:${proxy.port}`);
        
        // Execute task logic
        logTaskMessage(taskId, 'info', 'Checking account status...');
        const result = await checkAccount(account, proxy);
        
        // Log success
        logTaskMessage(taskId, 'info', 'Account check completed successfully');
        
        return { success: true, result };
    } catch (error) {
        // Log error
        logTaskMessage(taskId, 'error', `Task failed: ${error.message}`);
        throw error;
    }
}
```

### Error Handling

```javascript
// The function returns false if logging fails
const success = logTaskMessage(taskId, 'info', 'Task started');

if (!success) {
    // Logging failed, but task execution can continue
    // Error is already logged by the utility
    console.warn('Failed to log task message');
}
```

## Database Schema

The utility writes to the `task_logs` table:

```sql
CREATE TABLE task_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('info', 'warning', 'error')),
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_task_logs_created_at ON task_logs(created_at);
```

## Requirements Compliance

This implementation satisfies **Requirement 5.3** from the task-management-ui-redesign spec:

> "WHEN a Task is executed, THE Backend_Task_System SHALL write log entries to the task_logs table"

**Acceptance Criteria Met:**
- ✅ Validates log level (info, warning, error)
- ✅ Handles database insertion errors gracefully
- ✅ Writes to task_logs table with proper format
- ✅ Returns boolean indicating success/failure
- ✅ Logs errors to application logger

## Next Steps

To complete the logging system:

1. **Task 2.2**: Integrate `logTaskMessage` into `src/workers/taskExecutor.js`
2. **Task 2.3**: Create API endpoint `GET /api/tasks/logs/:taskId`
3. **Task 2.4**: Build Log Viewer Modal in frontend

## Performance Considerations

- Uses prepared statements for efficient database operations
- Minimal overhead (single INSERT query per log)
- Indexes on task_id and created_at ensure fast retrieval
- Debug-level logging to application logger prevents noise

## Security Considerations

- Uses parameterized queries (prevents SQL injection)
- Validates all inputs before database operations
- Does not expose sensitive information in logs
- Respects foreign key constraints

## Maintenance

- Keep VALID_LOG_LEVELS in sync with database CHECK constraint
- Monitor task_logs table size and implement log rotation if needed
- Consider archiving old logs (> 30 days) for performance
