const db = require('../config/database');
const taskQueueService = require('../services/taskQueueService');
const proxyService = require('../services/proxyService');
const { checkAccount } = require('../services/accountChecker');
const logger = require('../utils/logger');
const { captureException } = require('../utils/sentry');
const { logTaskMessage } = require('../utils/taskLogger');

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
            logger.warn('Task not in running state', { taskId, status: task?.status });
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
        
        logger.info('Executing task', { 
            taskId, 
            accountUsername: account.username, 
            proxyIp: proxy.ip, 
            proxyPort: proxy.port 
        });
        
        // Log task start
        logTaskMessage(taskId, 'info', 'Task started');
        logTaskMessage(taskId, 'info', `Proxy: ${proxy.ip}:${proxy.port}`);
        logTaskMessage(taskId, 'info', `Account: ${account.username}`);
        
        // Execute check with proxy
        const result = await checkAccount(account, proxy);
        
        // Log results
        const primeStatus = result.isPrime ? 'Prime' : 'Non-Prime';
        const limitedStatus = result.limited === 0 ? 'Unlimited' : 
                             result.limited === 1 ? 'Limited' : 
                             result.limited === 2 ? 'Limited (Wallet)' : 'Unknown';
        
        logTaskMessage(taskId, 'info', `Status: ${primeStatus}, ${limitedStatus}`);
        
        // Wallet
        if (result.walletBalance > 0) {
            logTaskMessage(taskId, 'info', `Wallet: ${result.walletBalance} ${result.walletCurrency}`);
        }
        
        // Inventory
        const totalItems = (result.ctx2 || 0) + (result.ctx16 || 0);
        if (totalItems > 0) {
            const tradableItems = result.ctx2 || 0;
            const tradeBannedItems = result.ctx16 || 0;
            logTaskMessage(taskId, 'info', `Inventory: ${totalItems} items (${tradableItems} tradable, ${tradeBannedItems} trade-banned)`);
        }
        
        // Trade Guard ban
        if (result.guardBanUntil) {
            const banDate = new Date(result.guardBanUntil);
            const daysRemaining = Math.ceil((banDate - new Date()) / (1000 * 60 * 60 * 24));
            logTaskMessage(taskId, 'warning', `Trade Guard Ban: ${daysRemaining} days remaining`);
        }
        
        // Steam ID
        if (result.steamid) {
            logTaskMessage(taskId, 'info', `Steam ID: ${result.steamid}`);
        }
        
        logTaskMessage(taskId, 'info', 'Account check completed successfully');
        
        // Complete task successfully
        taskQueueService.completeTask(taskId, true, result);
        
        logger.info('Task completed successfully', { taskId, accountUsername: account.username });
        
        return { success: true, result };
    } catch (error) {
        logger.error('Task execution failed', { 
            taskId, 
            error: error.message,
            stack: error.stack
        });
        
        // Log error with appropriate level
        logTaskMessage(taskId, 'error', `Task failed: ${error.message}`);
        
        captureException(error, { taskId });
        
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
            logger.error('Error executing task', { 
                taskId: task.id, 
                error: error.message 
            });
            captureException(error, { taskId: task.id });
        });
    }
}

/**
 * Start the task executor worker
 */
function startTaskExecutor() {
    logger.info('Task executor worker started');
    
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
