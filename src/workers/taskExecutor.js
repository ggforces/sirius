const db = require('../config/database');
const taskQueueService = require('../services/taskQueueService');
const proxyService = require('../services/proxyService');
const { checkAccount } = require('../services/accountChecker');

// Track tasks currently being executed to avoid duplicate execution
const executingTasks = new Set();

/**
 * Execute a single task
 */
async function executeTask(taskId) {
    // Check if task is already being executed
    if (executingTasks.has(taskId)) {
        return;
    }
    
    // Mark task as being executed
    executingTasks.add(taskId);
    
    try {
        const task = taskQueueService.getTaskById(taskId);
        
        if (!task || task.status !== 'running') {
            console.log(`⚠️ Task ${taskId} is not in running state, skipping`);
            executingTasks.delete(taskId);
            return;
        }
        
        // Get account details
        const account = db.prepare(`
            SELECT * FROM steam_accounts 
            WHERE id = ?
        `).get(task.account_id);
        
        if (!account) {
            throw new Error('Hesap bulunamadı');
        }
        
        // Get proxy
        const proxy = proxyService.getProxyById(task.proxy_id);
        
        if (!proxy) {
            throw new Error('Proxy bulunamadı');
        }
        
        console.log(`🔄 Executing task ${taskId} for account ${account.username} with proxy ${proxy.ip}:${proxy.port}`);
        
        // Execute check with proxy
        const result = await checkAccount(account, proxy);
        
        // Complete task successfully
        taskQueueService.completeTask(taskId, true, result);
        
        console.log(`✅ Task ${taskId} completed successfully`);
        
        return { success: true, result };
    } catch (error) {
        console.error(`❌ Task ${taskId} failed:`, error.message);
        
        // Complete task with failure
        taskQueueService.completeTask(taskId, false, null, error.message);
        
        return { success: false, error: error.message };
    } finally {
        // Remove from executing set
        executingTasks.delete(taskId);
    }
}

/**
 * Process all running tasks
 */
async function processRunningTasks() {
    const runningTasks = db.prepare(`
        SELECT id FROM tasks 
        WHERE status = 'running'
    `).all();
    
    for (const task of runningTasks) {
        // Skip if already executing
        if (executingTasks.has(task.id)) {
            continue;
        }
        
        // Execute task in background (don't await)
        executeTask(task.id).catch(error => {
            console.error(`Error executing task ${task.id}:`, error);
        });
    }
}

/**
 * Start the task executor worker
 */
function startTaskExecutor() {
    console.log('🚀 Task executor worker started');
    
    // Process running tasks every 2 seconds
    setInterval(() => {
        processRunningTasks();
    }, 2000);
}

module.exports = {
    executeTask,
    processRunningTasks,
    startTaskExecutor
};
