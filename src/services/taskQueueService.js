const db = require('../config/database');
const proxyService = require('./proxyService');

const TASK_TIMEOUT = 120 * 1000; // 120 seconds
const PENDING_CHECK_INTERVAL = 5000; // Check pending tasks every 5 seconds

/**
 * Create a new task
 */
function createTask(userId, accountId, type) {
    const result = db.prepare(`
        INSERT INTO tasks (user_id, account_id, type, status)
        VALUES (?, ?, ?, 'pending')
    `).run(userId, accountId, type);
    
    return result.lastInsertRowid;
}

/**
 * Get task by ID
 */
function getTaskById(taskId) {
    return db.prepare(`
        SELECT * FROM tasks WHERE id = ?
    `).get(taskId);
}

/**
 * Update task status
 */
function updateTaskStatus(taskId, status, data = {}) {
    const updates = [`status = ?`];
    const params = [status];
    
    if (data.proxyId !== undefined) {
        updates.push('proxy_id = ?');
        params.push(data.proxyId);
    }
    
    if (data.startedAt !== undefined) {
        updates.push('started_at = ?');
        params.push(data.startedAt);
    }
    
    if (data.completedAt !== undefined) {
        updates.push('completed_at = ?');
        params.push(data.completedAt);
    }
    
    if (data.timeoutAt !== undefined) {
        updates.push('timeout_at = ?');
        params.push(data.timeoutAt);
    }
    
    if (data.result !== undefined) {
        updates.push('result = ?');
        params.push(typeof data.result === 'string' ? data.result : JSON.stringify(data.result));
    }
    
    if (data.error !== undefined) {
        updates.push('error = ?');
        params.push(data.error);
    }
    
    params.push(taskId);
    
    db.prepare(`
        UPDATE tasks 
        SET ${updates.join(', ')}
        WHERE id = ?
    `).run(...params);
}

/**
 * Get pending tasks for a user
 */
function getPendingTasks(userId) {
    return db.prepare(`
        SELECT * FROM tasks 
        WHERE user_id = ? AND status = 'pending'
        ORDER BY created_at ASC
    `).all(userId);
}

/**
 * Get running tasks for a user
 */
function getRunningTasks(userId) {
    return db.prepare(`
        SELECT * FROM tasks 
        WHERE user_id = ? AND status = 'running'
        ORDER BY started_at ASC
    `).all(userId);
}

/**
 * Try to start a pending task
 * Returns true if task started, false if no proxy available
 */
async function tryStartTask(taskId) {
    const task = getTaskById(taskId);
    
    if (!task || task.status !== 'pending') {
        return false;
    }
    
    const now = new Date().toISOString();
    const timeoutAt = new Date(Date.now() + TASK_TIMEOUT).toISOString();
    
    // Atomic operation: Select and lock proxy in single transaction
    // This prevents race condition where two tasks select the same proxy
    const proxy = db.transaction(() => {
        // Select available proxy
        const availableProxy = db.prepare(`
            SELECT * FROM proxies 
            WHERE user_id = ? 
            AND is_locked = 0 
            AND (cooldown_until IS NULL OR cooldown_until < ?)
            ORDER BY last_used_at ASC NULLS FIRST
            LIMIT 1
        `).get(task.user_id, now);
        
        if (!availableProxy) {
            return null;
        }
        
        // Lock the proxy immediately
        db.prepare(`
            UPDATE proxies 
            SET is_locked = 1, 
                locked_by_task_id = ?, 
                locked_at = ?
            WHERE id = ? AND is_locked = 0
        `).run(taskId, now, availableProxy.id);
        
        // Update task to running
        db.prepare(`
            UPDATE tasks 
            SET status = 'running',
                proxy_id = ?,
                started_at = ?,
                timeout_at = ?
            WHERE id = ?
        `).run(availableProxy.id, now, timeoutAt, taskId);
        
        return availableProxy;
    })();
    
    return proxy !== null;
}

/**
 * Complete a task (success or failure)
 */
function completeTask(taskId, success, result = null, error = null) {
    const task = getTaskById(taskId);
    
    if (!task) {
        return false;
    }
    
    // Unlock proxy if assigned
    if (task.proxy_id) {
        proxyService.unlockProxy(task.proxy_id, success);
    }
    
    // Update task
    const now = new Date().toISOString();
    updateTaskStatus(taskId, success ? 'completed' : 'failed', {
        completedAt: now,
        result: result,
        error: error
    });
    
    return true;
}

/**
 * Timeout a task
 */
function timeoutTask(taskId) {
    const task = getTaskById(taskId);
    
    if (!task) {
        return false;
    }
    
    // Unlock proxy if assigned
    if (task.proxy_id) {
        proxyService.unlockProxy(task.proxy_id, false);
    }
    
    // Update task
    const now = new Date().toISOString();
    updateTaskStatus(taskId, 'timeout', {
        completedAt: now,
        error: 'Task timed out after 120 seconds'
    });
    
    return true;
}

/**
 * Check for timed out tasks
 */
function checkTimeouts() {
    const now = new Date().toISOString();
    
    const timedOutTasks = db.prepare(`
        SELECT id FROM tasks 
        WHERE status = 'running' 
        AND timeout_at < ?
    `).all(now);
    
    timedOutTasks.forEach(task => {
        console.log(`⏱️ Task ${task.id} timed out`);
        timeoutTask(task.id);
    });
    
    return timedOutTasks.length;
}

/**
 * Process pending tasks queue
 * Try to start pending tasks if proxies are available
 */
async function processPendingQueue() {
    // Get all users with pending tasks
    const usersWithPending = db.prepare(`
        SELECT DISTINCT user_id FROM tasks 
        WHERE status = 'pending'
    `).all();
    
    for (const { user_id } of usersWithPending) {
        const pendingTasks = getPendingTasks(user_id);
        
        for (const task of pendingTasks) {
            const started = await tryStartTask(task.id);
            
            if (started) {
                console.log(`✅ Task ${task.id} started with proxy`);
            } else {
                // No proxy available, task stays pending
                console.log(`⏳ Task ${task.id} waiting for available proxy`);
                break; // Don't try other tasks for this user
            }
        }
    }
}

/**
 * Get task statistics for a user
 */
function getTaskStats(userId) {
    return db.prepare(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status = 'timeout' THEN 1 ELSE 0 END) as timeout
        FROM tasks 
        WHERE user_id = ?
    `).get(userId);
}

/**
 * Reset running tasks to pending on startup
 * This handles server restarts where tasks were interrupted
 */
function resetRunningTasksOnStartup() {
    try {
        // Get all running tasks
        const runningTasks = db.prepare(`
            SELECT id, proxy_id FROM tasks 
            WHERE status = 'running'
        `).all();
        
        if (runningTasks.length === 0) {
            return;
        }
        
        console.log(`🔄 Found ${runningTasks.length} interrupted tasks, resetting to pending...`);
        
        // Reset tasks to pending and unlock their proxies
        db.transaction(() => {
            for (const task of runningTasks) {
                // Unlock proxy if assigned
                if (task.proxy_id) {
                    db.prepare(`
                        UPDATE proxies 
                        SET is_locked = 0,
                            locked_by_task_id = NULL,
                            locked_at = NULL
                        WHERE id = ?
                    `).run(task.proxy_id);
                }
                
                // Reset task to pending
                db.prepare(`
                    UPDATE tasks 
                    SET status = 'pending',
                        proxy_id = NULL,
                        started_at = NULL,
                        timeout_at = NULL
                    WHERE id = ?
                `).run(task.id);
            }
        })();
        
        console.log(`✅ Reset ${runningTasks.length} tasks to pending`);
    } catch (error) {
        console.error('Error resetting running tasks:', error);
    }
}

/**
 * Start the task queue processor
 */
function startTaskQueueProcessor() {
    console.log('🚀 Task queue processor started');
    
    // Reset interrupted tasks on startup
    resetRunningTasksOnStartup();
    
    // Check timeouts every 10 seconds
    setInterval(() => {
        checkTimeouts();
    }, 10000);
    
    // Process pending queue every 5 seconds
    setInterval(() => {
        processPendingQueue();
    }, PENDING_CHECK_INTERVAL);
}

module.exports = {
    createTask,
    getTaskById,
    updateTaskStatus,
    getPendingTasks,
    getRunningTasks,
    tryStartTask,
    completeTask,
    timeoutTask,
    checkTimeouts,
    processPendingQueue,
    getTaskStats,
    startTaskQueueProcessor,
    TASK_TIMEOUT
};
