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
            SELECT id, username, password, shared_secret, identity_secret, created_at
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
            created_at: account.created_at
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

module.exports = {
    getAccounts,
    addAccount,
    updateAccount,
    deleteAccount
};
