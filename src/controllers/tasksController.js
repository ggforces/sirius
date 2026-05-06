const db = require('../config/database');
const { checkAccount } = require('../services/accountChecker');

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

// Check single account
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

        // Check the account
        const result = await checkAccount(account);
        
        res.json({ 
            success: true, 
            message: 'Hesap başarıyla kontrol edildi',
            result 
        });
    } catch (error) {
        console.error('Error checking account:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Hesap kontrol edilirken hata oluştu' 
        });
    }
};

// Check multiple accounts (bulk check)
const checkMultipleAccounts = async (req, res) => {
    try {
        const { accountIds } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Geçerli hesap ID\'leri gerekli' });
        }

        // Get accounts
        const placeholders = accountIds.map(() => '?').join(',');
        const accounts = db.prepare(`
            SELECT * FROM steam_accounts 
            WHERE id IN (${placeholders}) AND user_id = ?
        `).all(...accountIds, userId);

        if (accounts.length === 0) {
            return res.status(404).json({ success: false, message: 'Hesap bulunamadı' });
        }

        const results = [];
        const errors = [];

        // Check accounts sequentially to avoid rate limiting
        for (const account of accounts) {
            try {
                const result = await checkAccount(account);
                results.push({
                    accountId: account.id,
                    username: account.username,
                    success: true,
                    result
                });
            } catch (error) {
                errors.push({
                    accountId: account.id,
                    username: account.username,
                    success: false,
                    error: error.message
                });
            }
            
            // Wait 2 seconds between checks to avoid rate limiting
            if (accounts.indexOf(account) < accounts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        res.json({
            success: true,
            message: `${results.length} hesap başarıyla kontrol edildi, ${errors.length} hata`,
            results,
            errors
        });
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

module.exports = {
    getUserAccounts,
    checkSingleAccount,
    checkMultipleAccounts,
    getAccountInventory
};