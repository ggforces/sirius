const db = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Steam hesap bilgilerini validate eder
 */
function validateSteamAccount(data) {
    const { username, password, shared_secret, identity_secret } = data;
    
    // Boş kontrol
    if (!username || !password || !shared_secret || !identity_secret) {
        return { valid: false, message: 'Tüm alanlar zorunludur.' };
    }
    
    // Username format (3-64 karakter, alfanumerik ve bazı özel karakterler)
    if (!/^[a-zA-Z0-9_-]{3,64}$/.test(username)) {
        return { valid: false, message: 'Geçersiz kullanıcı adı formatı. (3-64 karakter, sadece harf, rakam, _ ve -)' };
    }
    
    // Password length (minimum 6, maximum 256)
    if (password.length < 6 || password.length > 256) {
        return { valid: false, message: 'Şifre 6-256 karakter arasında olmalıdır.' };
    }
    
    // Shared secret format (base64, genellikle 28 karakter ama esneklik için 20-40 arası)
    if (!/^[A-Za-z0-9+/=]{20,40}$/.test(shared_secret)) {
        return { valid: false, message: 'Geçersiz shared secret formatı.' };
    }
    
    // Identity secret format (base64, genellikle 28 karakter ama esneklik için 20-40 arası)
    if (!/^[A-Za-z0-9+/=]{20,40}$/.test(identity_secret)) {
        return { valid: false, message: 'Geçersiz identity secret formatı.' };
    }
    
    return { valid: true };
}

/**
 * Tüm Steam hesaplarını getir
 */
const getAccounts = (req, res) => {
    try {
        const userId = req.user.id;
        
        const accounts = db.prepare(`
            SELECT 
                id, 
                username, 
                password, 
                shared_secret, 
                identity_secret, 
                created_at,
                steamid,
                is_prime,
                limited,
                wallet_balance,
                wallet_currency,
                last_checked_at
            FROM steam_accounts
            WHERE user_id = ?
            ORDER BY created_at DESC
        `).all(userId);
        
        // Şifrelenmiş verileri çöz
        const decryptedAccounts = accounts.map(account => ({
            id: account.id,
            username: account.username,
            password: decrypt(account.password),
            shared_secret: decrypt(account.shared_secret),
            identity_secret: decrypt(account.identity_secret),
            created_at: account.created_at,
            steamid: account.steamid,
            is_prime: account.is_prime,
            limited: account.limited,
            wallet_balance: account.wallet_balance,
            wallet_currency: account.wallet_currency,
            last_checked_at: account.last_checked_at
        }));
        
        res.json({
            success: true,
            data: decryptedAccounts
        });
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Hesaplar yüklenirken hata oluştu.'
        });
    }
};

/**
 * Yeni Steam hesabı ekle
 */
const addAccount = (req, res) => {
    try {
        const userId = req.user.id;
        const { username, password, shared_secret, identity_secret } = req.body;
        
        // Validasyon
        const validation = validateSteamAccount({ username, password, shared_secret, identity_secret });
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }
        
        // Username'in sistemde olup olmadığını kontrol et (tüm kullanıcılarda)
        const existingAccount = db.prepare(`
            SELECT id, user_id FROM steam_accounts WHERE username = ?
        `).get(username);
        
        if (existingAccount) {
            return res.status(400).json({
                success: false,
                message: 'Bu Steam hesabı zaten sistemde kayıtlı.'
            });
        }
        
        // Verileri şifrele
        const encryptedPassword = encrypt(password);
        const encryptedSharedSecret = encrypt(shared_secret);
        const encryptedIdentitySecret = encrypt(identity_secret);
        
        // Database'e ekle
        const stmt = db.prepare(`
            INSERT INTO steam_accounts (user_id, username, password, shared_secret, identity_secret)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            userId,
            username,
            encryptedPassword,
            encryptedSharedSecret,
            encryptedIdentitySecret
        );
        
        res.status(201).json({
            success: true,
            message: 'Steam hesabı başarıyla eklendi.',
            data: {
                id: result.lastInsertRowid,
                username
            }
        });
    } catch (error) {
        console.error('Add account error:', error);
        res.status(500).json({
            success: false,
            message: 'Hesap eklenirken hata oluştu.'
        });
    }
};

/**
 * Steam hesabını güncelle
 */
const updateAccount = (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;
        const { username, password, shared_secret, identity_secret } = req.body;
        
        // Validasyon
        const validation = validateSteamAccount({ username, password, shared_secret, identity_secret });
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }
        
        // Hesabın kullanıcıya ait olduğunu kontrol et
        const account = db.prepare(`
            SELECT id FROM steam_accounts WHERE id = ? AND user_id = ?
        `).get(accountId, userId);
        
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Hesap bulunamadı.'
            });
        }
        
        // Verileri şifrele
        const encryptedPassword = encrypt(password);
        const encryptedSharedSecret = encrypt(shared_secret);
        const encryptedIdentitySecret = encrypt(identity_secret);
        
        // Güncelle
        db.prepare(`
            UPDATE steam_accounts
            SET username = ?, password = ?, shared_secret = ?, identity_secret = ?
            WHERE id = ? AND user_id = ?
        `).run(
            username,
            encryptedPassword,
            encryptedSharedSecret,
            encryptedIdentitySecret,
            accountId,
            userId
        );
        
        res.json({
            success: true,
            message: 'Steam hesabı başarıyla güncellendi.'
        });
    } catch (error) {
        console.error('Update account error:', error);
        res.status(500).json({
            success: false,
            message: 'Hesap güncellenirken hata oluştu.'
        });
    }
};

/**
 * Steam hesabını sil
 */
const deleteAccount = (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;
        
        // Hesabın kullanıcıya ait olduğunu kontrol et
        const account = db.prepare(`
            SELECT id FROM steam_accounts WHERE id = ? AND user_id = ?
        `).get(accountId, userId);
        
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Hesap bulunamadı.'
            });
        }
        
        // Sil
        db.prepare(`
            DELETE FROM steam_accounts WHERE id = ? AND user_id = ?
        `).run(accountId, userId);
        
        res.json({
            success: true,
            message: 'Steam hesabı başarıyla silindi.'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Hesap silinirken hata oluştu.'
        });
    }
};

/**
 * Toplu Steam hesabı ekle
 */
const addAccountsBulk = (req, res) => {
    try {
        const userId = req.user.id;
        const { accounts } = req.body;
        
        // Accounts array kontrolü
        if (!Array.isArray(accounts) || accounts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir hesap listesi gönderilmedi.'
            });
        }
        
        // Maksimum 500 hesap sınırı
        if (accounts.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Bir seferde en fazla 500 hesap ekleyebilirsiniz.'
            });
        }
        
        const results = {
            success: [],
            failed: []
        };
        
        // Her hesabı ekle
        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            const { username, password, shared_secret, identity_secret } = account;
            
            try {
                // Validasyon
                const validation = validateSteamAccount({ username, password, shared_secret, identity_secret });
                if (!validation.valid) {
                    results.failed.push({
                        index: i,
                        username: username || 'unknown',
                        reason: validation.message
                    });
                    continue;
                }
                
                // Username'in sistemde olup olmadığını kontrol et (tüm kullanıcılarda)
                const existingAccount = db.prepare(`
                    SELECT id, user_id FROM steam_accounts WHERE username = ?
                `).get(username);
                
                if (existingAccount) {
                    results.failed.push({
                        index: i,
                        username: username,
                        reason: 'Bu Steam hesabı zaten sistemde kayıtlı.'
                    });
                    continue;
                }
                
                // Verileri şifrele
                const encryptedPassword = encrypt(password);
                const encryptedSharedSecret = encrypt(shared_secret);
                const encryptedIdentitySecret = encrypt(identity_secret);
                
                // Database'e ekle
                const stmt = db.prepare(`
                    INSERT INTO steam_accounts (user_id, username, password, shared_secret, identity_secret)
                    VALUES (?, ?, ?, ?, ?)
                `);
                
                const result = stmt.run(
                    userId,
                    username,
                    encryptedPassword,
                    encryptedSharedSecret,
                    encryptedIdentitySecret
                );
                
                results.success.push({
                    index: i,
                    id: result.lastInsertRowid,
                    username
                });
            } catch (error) {
                results.failed.push({
                    index: i,
                    username: username || 'unknown',
                    reason: error.message || 'Bilinmeyen hata'
                });
            }
        }
        
        res.status(201).json({
            success: true,
            message: `${results.success.length} hesap eklendi, ${results.failed.length} hesap eklenemedi.`,
            data: {
                successCount: results.success.length,
                failedCount: results.failed.length,
                success: results.success,
                failed: results.failed
            }
        });
    } catch (error) {
        console.error('Bulk add accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Toplu hesap eklenirken hata oluştu.'
        });
    }
};

/**
 * Toplu Steam hesabı sil
 */
const deleteAccountsBulk = (req, res) => {
    try {
        const userId = req.user.id;
        const { accountIds } = req.body;
        
        // AccountIds array kontrolü
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir hesap ID listesi gönderilmedi.'
            });
        }
        
        // Maksimum 500 hesap sınırı
        if (accountIds.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Bir seferde en fazla 500 hesap silebilirsiniz.'
            });
        }
        
        const results = {
            success: [],
            failed: []
        };
        
        // Her hesabı sil
        for (let i = 0; i < accountIds.length; i++) {
            const accountId = accountIds[i];
            
            try {
                // Hesabın kullanıcıya ait olduğunu kontrol et
                const account = db.prepare(`
                    SELECT id, username FROM steam_accounts WHERE id = ? AND user_id = ?
                `).get(accountId, userId);
                
                if (!account) {
                    results.failed.push({
                        id: accountId,
                        reason: 'Hesap bulunamadı veya size ait değil.'
                    });
                    continue;
                }
                
                // Sil
                db.prepare(`
                    DELETE FROM steam_accounts WHERE id = ? AND user_id = ?
                `).run(accountId, userId);
                
                results.success.push({
                    id: accountId,
                    username: account.username
                });
            } catch (error) {
                results.failed.push({
                    id: accountId,
                    reason: error.message || 'Bilinmeyen hata'
                });
            }
        }
        
        res.json({
            success: true,
            message: `${results.success.length} hesap silindi, ${results.failed.length} hesap silinemedi.`,
            data: {
                successCount: results.success.length,
                failedCount: results.failed.length,
                success: results.success,
                failed: results.failed
            }
        });
    } catch (error) {
        console.error('Bulk delete accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Toplu hesap silinirken hata oluştu.'
        });
    }
};

module.exports = {
    getAccounts,
    addAccount,
    addAccountsBulk,
    updateAccount,
    deleteAccount,
    deleteAccountsBulk
};
