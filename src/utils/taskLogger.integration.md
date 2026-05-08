# Task Logger Integration Guide

## Overview

The `taskLogger` utility provides persistent logging for task execution. This document explains how to integrate it with the existing task execution system.

## Integration with taskExecutor.js

### Step 1: Import the taskLogger

```javascript
const { logTaskMessage } = require('../utils/taskLogger');
```

### Step 2: Add logging to executeTask function

```javascript
async function executeTask(taskId) {
    // ... existing code ...
    
    try {
        const task = taskQueueService.getTaskById(taskId);
        
        if (!task || task.status !== 'running') {
            logTaskMessage(taskId, 'warning', `Task not in running state: ${task?.status}`);
            executingTasks.delete(taskId);
            return;
        }
        
        // Get account details
        const account = db.prepare(`
            SELECT * FROM steam_accounts 
            WHERE id = ?
        `).get(task.account_id);
        
        if (!account) {
            logTaskMessage(taskId, 'error', 'Account not found');
            throw new Error('Hesap bulunamadı');
        }
        
        // Get proxy
        const proxy = proxyService.getProxyById(task.proxy_id);
        
        if (!proxy) {
            logTaskMessage(taskId, 'error', 'Proxy not found');
            throw new Error('Proxy bulunamadı');
        }
        
        // Log task start
        logTaskMessage(taskId, 'info', `Task started with proxy ${proxy.ip}:${proxy.port}`);
        
        logger.info('Executing task', { 
            taskId, 
            accountUsername: account.username, 
            proxyIp: proxy.ip, 
            proxyPort: proxy.port 
        });
        
        // Execute check with proxy
        logTaskMessage(taskId, 'info', 'Connecting to Steam...');
        const result = await checkAccount(account, proxy);
        
        // Complete task successfully
        taskQueueService.completeTask(taskId, true, result);
        
        logTaskMessage(taskId, 'info', 'Account check completed successfully');
        logger.info('Task completed successfully', { taskId, accountUsername: account.username });
        
        return { success: true, result };
    } catch (error) {
        // Log error to task_logs
        logTaskMessage(taskId, 'error', `Task failed: ${error.message}`);
        
        logger.error('Task execution failed', { 
            taskId, 
            error: error.message,
            stack: error.stack
        });
        
        captureException(error, { taskId });
        
        // Complete task with failure
        taskQueueService.completeTask(taskId, false, null, error.message);
        
        return { success: false, error: error.message };
    } finally {
        // Remove from executing set
        executingTasks.delete(taskId);
    }
}
```

## Key Integration Points

### 1. Task Start
Log when a task begins execution:
```javascript
logTaskMessage(taskId, 'info', `Task started with proxy ${proxy.ip}:${proxy.port}`);
```

### 2. Task Progress
Log important steps during execution:
```javascript
logTaskMessage(taskId, 'info', 'Connecting to Steam...');
logTaskMessage(taskId, 'info', 'Checking account status...');
```

### 3. Task Warnings
Log non-critical issues:
```javascript
logTaskMessage(taskId, 'warning', 'Proxy response slow, retrying...');
```

### 4. Task Errors
Log errors with details:
```javascript
logTaskMessage(taskId, 'error', `Task failed: ${error.message}`);
```

### 5. Task Completion
Log successful completion:
```javascript
logTaskMessage(taskId, 'info', 'Account check completed successfully');
```

## Best Practices

1. **Log at Key Points**: Log at task start, major steps, and completion
2. **Include Context**: Include relevant information like proxy details, account info
3. **Use Appropriate Levels**:
   - `info`: Normal execution flow
   - `warning`: Non-critical issues that don't stop execution
   - `error`: Failures that prevent task completion
4. **Keep Messages Concise**: Messages should be clear but not overly verbose
5. **Don't Log Sensitive Data**: Avoid logging passwords, secrets, or tokens

## Error Handling

The `logTaskMessage` function handles errors gracefully:
- Returns `false` if logging fails
- Logs errors to the application logger
- Does not throw exceptions (won't break task execution)

```javascript
const success = logTaskMessage(taskId, 'info', 'Task started');
if (!success) {
    // Logging failed, but task execution continues
    // Error is already logged by the utility
}
```

## Testing

Run the test suite to verify the logger works correctly:
```bash
node src/utils/taskLogger.test.js
```

## API Endpoint

The logs can be retrieved via the API endpoint (to be implemented in Task 2.2):
```
GET /api/tasks/logs/:taskId
```

This will return all logs for a specific task, which will be displayed in the Log Viewer Modal on the frontend.
