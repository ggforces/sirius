const db = require('../config/database');

/**
 * Select an available proxy for a user
 * Returns the oldest unused proxy that is not locked and not in cooldown
 */
function selectAvailableProxy(userId) {
    const now = new Date().toISOString();
    
    const proxy = db.prepare(`
        SELECT * FROM proxies 
        WHERE user_id = ? 
        AND is_locked = 0 
        AND (cooldown_until IS NULL OR cooldown_until < ?)
        ORDER BY last_used_at ASC NULLS FIRST
        LIMIT 1
    `).get(userId, now);
    
    return proxy || null;
}

/**
 * Lock a proxy for a task
 */
function lockProxy(proxyId, taskId) {
    const now = new Date().toISOString();
    
    db.prepare(`
        UPDATE proxies 
        SET is_locked = 1, 
            locked_by_task_id = ?, 
            locked_at = ?
        WHERE id = ?
    `).run(taskId, now, proxyId);
}

/**
 * Unlock a proxy and set cooldown (5 minutes)
 * Update success/failure count
 */
function unlockProxy(proxyId, success = true) {
    const now = new Date();
    const cooldownUntil = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
    
    db.prepare(`
        UPDATE proxies 
        SET is_locked = 0,
            locked_by_task_id = NULL,
            locked_at = NULL,
            last_used_at = ?,
            cooldown_until = ?,
            success_count = success_count + ?,
            failure_count = failure_count + ?
        WHERE id = ?
    `).run(
        now.toISOString(),
        cooldownUntil.toISOString(),
        success ? 1 : 0,
        success ? 0 : 1,
        proxyId
    );
}

/**
 * Get all proxies for a user
 */
function getUserProxies(userId) {
    return db.prepare(`
        SELECT id, username, ip, port, is_locked, last_used_at, 
               cooldown_until, success_count, failure_count, created_at
        FROM proxies 
        WHERE user_id = ?
        ORDER BY created_at DESC
    `).all(userId);
}

/**
 * Add a new proxy
 */
function addProxy(userId, { username, password, ip, port }) {
    const result = db.prepare(`
        INSERT INTO proxies (user_id, username, password, ip, port)
        VALUES (?, ?, ?, ?, ?)
    `).run(userId, username, password, ip, port);
    
    return result.lastInsertRowid;
}

/**
 * Delete a proxy
 */
function deleteProxy(proxyId, userId) {
    const result = db.prepare(`
        DELETE FROM proxies 
        WHERE id = ? AND user_id = ?
    `).run(proxyId, userId);
    
    return result.changes > 0;
}

/**
 * Get proxy by ID
 */
function getProxyById(proxyId) {
    return db.prepare(`
        SELECT * FROM proxies WHERE id = ?
    `).get(proxyId);
}

/**
 * Check if proxy is available (not locked and not in cooldown)
 */
function isProxyAvailable(proxyId) {
    const now = new Date().toISOString();
    
    const proxy = db.prepare(`
        SELECT id FROM proxies 
        WHERE id = ? 
        AND is_locked = 0 
        AND (cooldown_until IS NULL OR cooldown_until < ?)
    `).get(proxyId, now);
    
    return proxy !== undefined;
}

/**
 * Unlock all proxies locked by a specific task (cleanup)
 */
function unlockProxiesByTask(taskId) {
    db.prepare(`
        UPDATE proxies 
        SET is_locked = 0,
            locked_by_task_id = NULL,
            locked_at = NULL
        WHERE locked_by_task_id = ?
    `).run(taskId);
}

/**
 * Get proxy statistics for a user
 */
function getProxyStats(userId) {
    return db.prepare(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_locked = 0 AND (cooldown_until IS NULL OR cooldown_until < datetime('now')) THEN 1 ELSE 0 END) as available,
            SUM(CASE WHEN is_locked = 1 THEN 1 ELSE 0 END) as locked,
            SUM(CASE WHEN cooldown_until > datetime('now') THEN 1 ELSE 0 END) as in_cooldown,
            SUM(success_count) as total_success,
            SUM(failure_count) as total_failure
        FROM proxies 
        WHERE user_id = ?
    `).get(userId);
}

module.exports = {
    selectAvailableProxy,
    lockProxy,
    unlockProxy,
    getUserProxies,
    addProxy,
    deleteProxy,
    getProxyById,
    isProxyAvailable,
    unlockProxiesByTask,
    getProxyStats
};
