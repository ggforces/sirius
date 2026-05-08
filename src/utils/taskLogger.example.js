/**
 * Task Logger Usage Examples
 * 
 * This file demonstrates how to use the taskLogger utility
 * in the task execution system.
 */

const { logTaskMessage } = require('./taskLogger');

/**
 * Example 1: Logging task start
 */
function exampleTaskStart(taskId, proxyInfo) {
    logTaskMessage(taskId, 'info', `Task started with proxy ${proxyInfo}`);
}

/**
 * Example 2: Logging task progress
 */
function exampleTaskProgress(taskId, step) {
    logTaskMessage(taskId, 'info', `Task progress: ${step}`);
}

/**
 * Example 3: Logging warnings
 */
function exampleTaskWarning(taskId, warningMessage) {
    logTaskMessage(taskId, 'warning', `Warning: ${warningMessage}`);
}

/**
 * Example 4: Logging errors
 */
function exampleTaskError(taskId, error) {
    logTaskMessage(taskId, 'error', `Task failed: ${error.message}`);
}

/**
 * Example 5: Complete task execution with logging
 */
async function executeTaskWithLogging(task) {
    const taskId = task.id;
    
    try {
        // Log task start
        logTaskMessage(taskId, 'info', `Task started for account ${task.account_id}`);
        
        // Simulate proxy allocation
        if (task.proxy_id) {
            logTaskMessage(taskId, 'info', `Proxy allocated: ${task.proxy_id}`);
        } else {
            logTaskMessage(taskId, 'warning', 'No proxy available, task waiting in queue');
            return;
        }
        
        // Simulate task execution steps
        logTaskMessage(taskId, 'info', 'Connecting to Steam...');
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        logTaskMessage(taskId, 'info', 'Steam connection established');
        
        // Simulate account check
        logTaskMessage(taskId, 'info', 'Checking account status...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Log completion
        logTaskMessage(taskId, 'info', 'Account check completed successfully');
        
    } catch (error) {
        // Log error
        logTaskMessage(taskId, 'error', `Task execution failed: ${error.message}`);
        
        // Log additional error details if available
        if (error.code) {
            logTaskMessage(taskId, 'error', `Error code: ${error.code}`);
        }
        
        throw error;
    }
}

/**
 * Example 6: Handling database errors gracefully
 */
function exampleGracefulErrorHandling(taskId, message) {
    // logTaskMessage returns false if it fails
    const success = logTaskMessage(taskId, 'info', message);
    
    if (!success) {
        // The error is already logged by the utility
        // You can add additional error handling here if needed
        console.error('Failed to log task message, but continuing execution');
    }
}

/**
 * Example 7: Integration with taskExecutor
 * 
 * This shows how to integrate taskLogger into the existing taskExecutor.js
 */
async function integrateWithTaskExecutor(task) {
    const taskId = task.id;
    
    // Log at the start of task execution
    logTaskMessage(taskId, 'info', 'Task execution started');
    
    try {
        // Your existing task execution logic here
        // ...
        
        // Log important steps
        logTaskMessage(taskId, 'info', 'Step 1 completed');
        logTaskMessage(taskId, 'info', 'Step 2 completed');
        
        // Log success
        logTaskMessage(taskId, 'info', 'Task completed successfully');
        
    } catch (error) {
        // Log error with details
        logTaskMessage(taskId, 'error', `Task failed: ${error.message}`);
        
        // Re-throw to maintain existing error handling
        throw error;
    }
}

module.exports = {
    exampleTaskStart,
    exampleTaskProgress,
    exampleTaskWarning,
    exampleTaskError,
    executeTaskWithLogging,
    exampleGracefulErrorHandling,
    integrateWithTaskExecutor
};
