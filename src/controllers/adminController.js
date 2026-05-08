const db = require('../config/database');
const logger = require('../utils/logger');
const { captureException } = require('../utils/sentry');
const bcrypt = require('bcrypt');

/**
 * Get all users with statistics
 */
const getAllUsers = (req, res) => {
    try {
        const users = db.prepare(`
            SELECT 
                u.id,
                u.email,
                u.role,
                u.is_active,
                u.balance,
                u.created_at,
                u.last_login,
                u.proxy_method,
                COUNT(DISTINCT a.id) as account_count,
                COUNT(DISTINCT p.id) as proxy_count,
                COUNT(DISTINCT t.id) as task_count
            FROM users u
            LEFT JOIN steam_accounts a ON u.id = a.user_id
            LEFT JOIN proxies p ON u.id = p.user_id
            LEFT JOIN tasks t ON u.id = t.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `).all();

        logger.info('Admin fetched all users', {
            adminId: req.user.id,
            userCount: users.length
        });

        res.json({ success: true, users });
    } catch (error) {
        logger.error('Error fetching users', { 
            error: error.message,
            adminId: req.user.id
        });
        captureException(error, { adminId: req.user.id });
        res.status(500).json({ 
            success: false, 
            message: 'Kullanıcılar alınırken hata oluştu' 
        });
    }
};

/**
 * Get user details by ID
 */
const getUserDetails = (req, res) => {
    try {
        const { userId } = req.params;

        // Get user info
        const user = db.prepare(`
            SELECT 
                id, email, role, is_active, balance, 
                created_at, last_login, proxy_method
            FROM users 
            WHERE id = ?
        `).get(userId);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kullanıcı bulunamadı' 
            });
        }

        // Get user's accounts
        const accounts = db.prepare(`
            SELECT id, username, steamid, is_prime, limited, 
                   wallet_balance, last_checked_at
            FROM steam_accounts 
            WHERE user_id = ?
        `).all(userId);

        // Get user's proxies
        const proxies = db.prepare(`
            SELECT id, ip, port, is_locked, success_count, 
                   failure_count, last_used_at
            FROM proxies 
            WHERE user_id = ?
        `).all(userId);

        // Get user's recent tasks
        const tasks = db.prepare(`
            SELECT id, type, status, created_at, completed_at
            FROM tasks 
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `).all(userId);

        // Get user's earnings
        const earnings = db.prepare(`
            SELECT date, amount, drop_count
            FROM earnings 
            WHERE user_id = ?
            ORDER BY date DESC
            LIMIT 30
        `).all(userId);

        logger.info('Admin fetched user details', {
            adminId: req.user.id,
            targetUserId: userId
        });

        res.json({ 
            success: true, 
            user,
            accounts,
            proxies,
            tasks,
            earnings
        });
    } catch (error) {
        logger.error('Error fetching user details', { 
            error: error.message,
            adminId: req.user.id,
            targetUserId: req.params.userId
        });
        captureException(error, { 
            adminId: req.user.id,
            targetUserId: req.params.userId
        });
        res.status(500).json({ 
            success: false, 
            message: 'Kullanıcı detayları alınırken hata oluştu' 
        });
    }
};

/**
 * Update user (role, active status, balance)
 */
const updateUser = (req, res) => {
    try {
        const { userId } = req.params;
        const { role, is_active, balance } = req.body;

        // Prevent admin from modifying themselves
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Kendi hesabınızı düzenleyemezsiniz' 
            });
        }

        // Validate role
        if (role && !['user', 'admin'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz rol' 
            });
        }

        // Build update query
        const updates = [];
        const params = [];

        if (role !== undefined) {
            updates.push('role = ?');
            params.push(role);
        }

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active ? 1 : 0);
        }

        if (balance !== undefined) {
            updates.push('balance = ?');
            params.push(parseFloat(balance));
        }

        if (updates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Güncellenecek alan belirtilmedi' 
            });
        }

        params.push(userId);

        const result = db.prepare(`
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = ?
        `).run(...params);

        if (result.changes === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kullanıcı bulunamadı' 
            });
        }

        logger.warn('Admin updated user', {
            adminId: req.user.id,
            targetUserId: userId,
            changes: { role, is_active, balance }
        });

        res.json({ 
            success: true, 
            message: 'Kullanıcı güncellendi' 
        });
    } catch (error) {
        logger.error('Error updating user', { 
            error: error.message,
            adminId: req.user.id,
            targetUserId: req.params.userId
        });
        captureException(error, { 
            adminId: req.user.id,
            targetUserId: req.params.userId
        });
        res.status(500).json({ 
            success: false, 
            message: 'Kullanıcı güncellenirken hata oluştu' 
        });
    }
};

/**
 * Delete user and all related data
 */
const deleteUser = (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent admin from deleting themselves
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Kendi hesabınızı silemezsiniz' 
            });
        }

        // Check if user exists
        const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kullanıcı bulunamadı' 
            });
        }

        // Delete user (CASCADE will delete related data)
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);

        logger.warn('Admin deleted user', {
            adminId: req.user.id,
            deletedUserId: userId,
            deletedUserEmail: user.email
        });

        res.json({ 
            success: true, 
            message: 'Kullanıcı ve tüm verileri silindi' 
        });
    } catch (error) {
        logger.error('Error deleting user', { 
            error: error.message,
            adminId: req.user.id,
            targetUserId: req.params.userId
        });
        captureException(error, { 
            adminId: req.user.id,
            targetUserId: req.params.userId
        });
        res.status(500).json({ 
            success: false, 
            message: 'Kullanıcı silinirken hata oluştu' 
        });
    }
};

/**
 * Get system statistics
 */
const getSystemStats = (req, res) => {
    try {
        // User statistics
        const userStats = db.prepare(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN last_login > datetime('now', '-7 days') THEN 1 ELSE 0 END) as active_last_week
            FROM users
        `).get();

        // Account statistics
        const accountStats = db.prepare(`
            SELECT 
                COUNT(*) as total_accounts,
                SUM(CASE WHEN is_prime = 1 THEN 1 ELSE 0 END) as prime_accounts,
                SUM(CASE WHEN limited = 0 THEN 1 ELSE 0 END) as unlimited_accounts
            FROM steam_accounts
        `).get();

        // Proxy statistics
        const proxyStats = db.prepare(`
            SELECT 
                COUNT(*) as total_proxies,
                SUM(CASE WHEN is_locked = 1 THEN 1 ELSE 0 END) as locked_proxies,
                SUM(success_count) as total_success,
                SUM(failure_count) as total_failures
            FROM proxies
        `).get();

        // Task statistics
        const taskStats = db.prepare(`
            SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
                SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running_tasks,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tasks
            FROM tasks
        `).get();

        // Recent registrations (last 7 days)
        const recentRegistrations = db.prepare(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM users
            WHERE created_at > datetime('now', '-7 days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `).all();

        // Recent tasks (last 24 hours)
        const recentTasks = db.prepare(`
            SELECT 
                strftime('%H:00', created_at) as hour,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM tasks
            WHERE created_at > datetime('now', '-24 hours')
            GROUP BY strftime('%H:00', created_at)
            ORDER BY hour DESC
        `).all();

        // Database size (SQLite specific)
        const dbStats = db.prepare(`
            SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()
        `).get();

        logger.info('Admin fetched system stats', {
            adminId: req.user.id
        });

        res.json({ 
            success: true, 
            stats: {
                users: userStats,
                accounts: accountStats,
                proxies: proxyStats,
                tasks: taskStats,
                recentRegistrations,
                recentTasks,
                database: {
                    size: dbStats.size,
                    sizeFormatted: formatBytes(dbStats.size)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching system stats', { 
            error: error.message,
            adminId: req.user.id
        });
        captureException(error, { adminId: req.user.id });
        res.status(500).json({ 
            success: false, 
            message: 'İstatistikler alınırken hata oluştu' 
        });
    }
};

/**
 * Get system logs (last N entries)
 */
const getSystemLogs = (req, res) => {
    try {
        const { level = 'all', limit = 100 } = req.query;
        const fs = require('fs');
        const path = require('path');

        const logDir = process.env.LOG_DIR || './logs';
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(logDir, `combined-${today}.log`);

        // Check if log file exists
        if (!fs.existsSync(logFile)) {
            return res.json({ 
                success: true, 
                logs: [],
                message: 'Bugüne ait log dosyası bulunamadı'
            });
        }

        // Read log file
        const logContent = fs.readFileSync(logFile, 'utf-8');
        const logLines = logContent.trim().split('\n').filter(line => line);

        // Parse JSON logs
        let logs = logLines
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return null;
                }
            })
            .filter(log => log !== null);

        // Filter by level
        if (level !== 'all') {
            logs = logs.filter(log => log.level === level);
        }

        // Get last N logs
        logs = logs.slice(-parseInt(limit));

        // Reverse to show newest first
        logs.reverse();

        logger.info('Admin fetched system logs', {
            adminId: req.user.id,
            level,
            count: logs.length
        });

        res.json({ 
            success: true, 
            logs,
            total: logs.length
        });
    } catch (error) {
        logger.error('Error fetching system logs', { 
            error: error.message,
            adminId: req.user.id
        });
        captureException(error, { adminId: req.user.id });
        res.status(500).json({ 
            success: false, 
            message: 'Loglar alınırken hata oluştu' 
        });
    }
};

/**
 * Create admin user (super admin only)
 */
const createAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email ve şifre gereklidir' 
            });
        }

        // Check if email already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bu email zaten kullanılıyor' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const result = db.prepare(`
            INSERT INTO users (email, password, role, is_active)
            VALUES (?, ?, 'admin', 1)
        `).run(email, hashedPassword);

        logger.warn('Admin created new admin user', {
            adminId: req.user.id,
            newAdminId: result.lastInsertRowid,
            newAdminEmail: email
        });

        res.json({ 
            success: true, 
            message: 'Admin kullanıcı oluşturuldu',
            userId: result.lastInsertRowid
        });
    } catch (error) {
        logger.error('Error creating admin', { 
            error: error.message,
            adminId: req.user.id
        });
        captureException(error, { adminId: req.user.id });
        res.status(500).json({ 
            success: false, 
            message: 'Admin oluşturulurken hata oluştu' 
        });
    }
};

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = {
    getAllUsers,
    getUserDetails,
    updateUser,
    deleteUser,
    getSystemStats,
    getSystemLogs,
    createAdmin
};
