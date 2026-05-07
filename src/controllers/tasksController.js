const db = require('../config/database');
const taskQueueService = require('../services/taskQueueService');
const proxyService = require('../services/proxyService');

// Get all Steam accounts for the user
const getUserAccounts = (req, res) => {
    try {
        const userId = req.user.id;
        const accounts = db.prepare(`
            SELECT id, username, steamid, is_prime, limited, 
                   wallet_balance, wallet_currency, last_checked_at,
                   nickname, avatar, level
            FROM steam_accounts 
            WHERE user_id = ?
            ORDER BY username
        `).all(userId);

        res.json({ success: true, accounts });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ success: false, message: 'Hesaplar alınırken hata oluştu' });
    }
};

// Check single account (with proxy and task queue)
const checkSingleAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const userId = req.user.id;

        // Get account details
        const account = db.prepare(`
            SELECT * FROM steam_accounts 
            WHERE id = ? AND user_id = ?
        `).get(accountId, userId);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Hesap bulunamadı' });
        }
        
        // Check if user has any proxies
        const proxyCount = db.prepare(`
            SELECT COUNT(*) as count FROM proxies WHERE user_id = ?
        `).get(userId);
        
        if (proxyCount.count === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Proxy bulunamadı. Lütfen önce proxy ekleyin.' 
            });
        }

        // Create task
        const taskId = taskQueueService.createTask(userId, accountId, 'check_account');
        
        // Try to start task immediately
        const started = await taskQueueService.tryStartTask(taskId);
        
        if (!started) {
            return res.json({ 
                success: true, 
                message: 'Task oluşturuldu, proxy bekliyor...',
                taskId,
                status: 'pending'
            });
        }
        
        // Task started successfully, worker will execute it
        res.json({ 
            success: true, 
            message: 'Task başlatıldı, işleniyor...',
            taskId,
            status: 'running'
        });
    } catch (error) {
        console.error('Error checking account:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Hesap kontrol edilirken hata oluştu' 
        });
    }
};

// Check multiple accounts (bulk check with proxy and task queue)
const checkMultipleAccounts = async (req, res) => {
    try {
        const { accountIds } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Geçerli hesap ID\'leri gerekli' });
        }
        
        // Validate all accountIds are integers
        const validAccountIds = accountIds.filter(id => Number.isInteger(id) && id > 0);
        
        if (validAccountIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Geçerli hesap ID\'leri gerekli' });
        }
        
        if (validAccountIds.length !== accountIds.length) {
            console.warn(`⚠️ Filtered out ${accountIds.length - validAccountIds.length} invalid account IDs`);
        }
        
        // Check if user has any proxies
        const proxyCount = db.prepare(`
            SELECT COUNT(*) as count FROM proxies WHERE user_id = ?
        `).get(userId);
        
        if (proxyCount.count === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Proxy bulunamadı. Lütfen önce proxy ekleyin.' 
            });
        }

        // Get accounts
        const placeholders = validAccountIds.map(() => '?').join(',');
        const accounts = db.prepare(`
            SELECT * FROM steam_accounts 
            WHERE id IN (${placeholders}) AND user_id = ?
        `).all(...validAccountIds, userId);

        if (accounts.length === 0) {
            return res.status(404).json({ success: false, message: 'Hesap bulunamadı' });
        }

        // Create tasks for all accounts
        const taskIds = [];
        for (const account of accounts) {
            const taskId = taskQueueService.createTask(userId, account.id, 'check_account');
            taskIds.push(taskId);
        }

        // Return immediately - tasks will be processed by queue
        res.json({
            success: true,
            message: `${accounts.length} hesap için task oluşturuldu`,
            taskIds,
            accountCount: accounts.length
        });

        // Tasks will be processed automatically by the task queue processor
    } catch (error) {
        console.error('Error in bulk check:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Toplu kontrol sırasında hata oluştu' 
        });
    }
};

// Get account inventory
const getAccountInventory = (req, res) => {
    try {
        const { accountId } = req.params;
        const userId = req.user.id;

        // Verify account ownership
        const account = db.prepare(`
            SELECT id FROM steam_accounts 
            WHERE id = ? AND user_id = ?
        `).get(accountId, userId);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Hesap bulunamadı' });
        }

        // Get inventory
        const inventory = db.prepare(`
            SELECT assetid, market_hash_name, tradable, trade_unlock_at, context, fetched_at
            FROM inventories 
            WHERE account_id = ?
            ORDER BY context, market_hash_name
        `).all(accountId);

        res.json({ success: true, inventory });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ success: false, message: 'Envanter alınırken hata oluştu' });
    }
};

// Get task status
const getTaskStatus = (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;

        const task = db.prepare(`
            SELECT * FROM tasks 
            WHERE id = ? AND user_id = ?
        `).get(taskId, userId);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task bulunamadı' });
        }

        res.json({ success: true, task });
    } catch (error) {
        console.error('Error fetching task status:', error);
        res.status(500).json({ success: false, message: 'Task durumu alınırken hata oluştu' });
    }
};

// Get user's tasks
const getUserTasks = (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = `
            SELECT t.*, a.username as account_username
            FROM tasks t
            LEFT JOIN steam_accounts a ON t.account_id = a.id
            WHERE t.user_id = ?
        `;
        
        const params = [userId];
        
        if (status) {
            query += ` AND t.status = ?`;
            params.push(status);
        }
        
        query += ` ORDER BY t.created_at DESC LIMIT 100`;

        const tasks = db.prepare(query).all(...params);

        res.json({ success: true, tasks });
    } catch (error) {
        console.error('Error fetching user tasks:', error);
        res.status(500).json({ success: false, message: 'Task\'ler alınırken hata oluştu' });
    }
};

// Get task statistics
const getTaskStatistics = (req, res) => {
    try {
        const userId = req.user.id;
        const stats = taskQueueService.getTaskStats(userId);
        
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching task statistics:', error);
        res.status(500).json({ success: false, message: 'İstatistikler alınırken hata oluştu' });
    }
};

module.exports = {
    getUserAccounts,
    checkSingleAccount,
    checkMultipleAccounts,
    getAccountInventory,
    getTaskStatus,
    getUserTasks,
    getTaskStatistics
};