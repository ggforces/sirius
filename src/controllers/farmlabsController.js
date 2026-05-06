const db = require('../config/database');
const farmlabsService = require('../services/farmlabsService');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * FarmLabs API key'i test eder
 */
const testApiKey = async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: 'API key gereklidir.'
            });
        }
        
        const result = await farmlabsService.testApiKey(apiKey);
        
        res.json({
            success: result.valid,
            message: result.message,
            data: result
        });
        
    } catch (error) {
        console.error('Test API key error:', error);
        res.status(500).json({
            success: false,
            message: 'API key test edilirken hata oluştu.'
        });
    }
};

/**
 * FarmLabs API key'i kaydeder
 */
const saveApiKey = async (req, res) => {
    try {
        const userId = req.user.id;
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: 'API key gereklidir.'
            });
        }
        
        // API key'i test et
        const testResult = await farmlabsService.testApiKey(apiKey);
        
        if (!testResult.valid) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz API key.'
            });
        }
        
        // API key'i kaydet (şifreli olarak)
        const encryptedApiKey = encrypt(apiKey);
        
        db.prepare(`
            INSERT INTO farmlabs_settings (user_id, api_key, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(user_id) 
            DO UPDATE SET 
                api_key = excluded.api_key,
                updated_at = datetime('now')
        `).run(userId, encryptedApiKey);
        
        res.json({
            success: true,
            message: 'API key başarıyla kaydedildi.'
        });
        
    } catch (error) {
        console.error('Save API key error:', error);
        res.status(500).json({
            success: false,
            message: 'API key kaydedilirken hata oluştu.'
        });
    }
};

/**
 * Kullanıcının FarmLabs API key'ini getirir
 */
const getApiKey = (req, res) => {
    try {
        const userId = req.user.id;
        
        const settings = db.prepare(`
            SELECT api_key, updated_at
            FROM farmlabs_settings
            WHERE user_id = ?
        `).get(userId);
        
        if (!settings) {
            return res.json({
                success: true,
                data: {
                    hasApiKey: false,
                    apiKey: null
                }
            });
        }
        
        // API key'in sadece son 4 karakterini göster
        // Önce şifreyi çöz
        let decryptedKey = null;
        try {
            decryptedKey = decrypt(settings.api_key);
        } catch (error) {
            console.error('API key decryption error:', error);
        }
        
        const maskedKey = decryptedKey 
            ? `flabs_${'*'.repeat(20)}${decryptedKey.slice(-4)}`
            : null;
        
        res.json({
            success: true,
            data: {
                hasApiKey: true,
                apiKey: maskedKey,
                updatedAt: settings.updated_at
            }
        });
        
    } catch (error) {
        console.error('Get API key error:', error);
        res.status(500).json({
            success: false,
            message: 'API key alınırken hata oluştu.'
        });
    }
};

/**
 * FarmLabs'dan drop'ları senkronize eder
 */
const syncDrops = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // API key'i al
        const settings = db.prepare(`
            SELECT api_key FROM farmlabs_settings WHERE user_id = ?
        `).get(userId);
        
        if (!settings || !settings.api_key) {
            return res.status(400).json({
                success: false,
                message: 'FarmLabs API key ayarlanmamış.'
            });
        }
        
        // API key'i çöz
        const decryptedApiKey = decrypt(settings.api_key);
        
        // Son 6 ay (26 hafta) için drop'ları çek
        const now = new Date();
        const currentWeekStart = farmlabsService.getWednesdayWeekStart(now);
        const sixMonthsAgo = new Date(currentWeekStart);
        sixMonthsAgo.setDate(currentWeekStart.getDate() - 26 * 7);
        
        const drops = await farmlabsService.fetchAllDrops(decryptedApiKey, {
            startDate: sixMonthsAgo.toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0]
        });
        
        // Drop'ları günlük kazançlara dönüştür
        const dailyEarnings = farmlabsService.convertDropsToDaily(drops);
        
        // Veritabanına kaydet
        const stmt = db.prepare(`
            INSERT INTO earnings (user_id, date, amount, drop_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(user_id, date) 
            DO UPDATE SET 
                amount = excluded.amount,
                drop_count = excluded.drop_count,
                updated_at = datetime('now')
        `);
        
        let inserted = 0;
        
        for (const earning of dailyEarnings) {
            const info = stmt.run(userId, earning.date, earning.amount, earning.dropCount);
            if (info.changes > 0) {
                inserted++;
            }
        }
        
        // Son senkronizasyon zamanını güncelle
        db.prepare(`
            UPDATE farmlabs_settings 
            SET last_sync = datetime('now')
            WHERE user_id = ?
        `).run(userId);
        
        res.json({
            success: true,
            message: 'Dropler başarıyla senkronize edildi.',
            data: {
                totalDrops: drops.length,
                daysProcessed: dailyEarnings.length,
                recordsInserted: inserted
            }
        });
        
    } catch (error) {
        console.error('Sync drops error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Dropler senkronize edilirken hata oluştu.'
        });
    }
};

/**
 * FarmLabs istatistiklerini getirir
 */
const getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // API key'i al
        const settings = db.prepare(`
            SELECT api_key FROM farmlabs_settings WHERE user_id = ?
        `).get(userId);
        
        if (!settings || !settings.api_key) {
            return res.status(400).json({
                success: false,
                message: 'FarmLabs API key ayarlanmamış.'
            });
        }
        
        // API key'i çöz
        const decryptedApiKey = decrypt(settings.api_key);
        
        // Son 30 gün için istatistikleri çek
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const stats = await farmlabsService.fetchDropStats(decryptedApiKey, {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('Get FarmLabs stats error:', error);
        res.status(500).json({
            success: false,
            message: 'İstatistikler alınırken hata oluştu.'
        });
    }
};

/**
 * Bot gruplarını listeler
 */
const getBotGroups = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // API key'i al
        const settings = db.prepare(`
            SELECT api_key FROM farmlabs_settings WHERE user_id = ?
        `).get(userId);
        
        if (!settings || !settings.api_key) {
            return res.status(400).json({
                success: false,
                message: 'FarmLabs API key ayarlanmamış.'
            });
        }
        
        // API key'i çöz
        const decryptedApiKey = decrypt(settings.api_key);
        
        const groups = await farmlabsService.fetchBotGroups(decryptedApiKey);
        
        res.json({
            success: true,
            data: groups
        });
        
    } catch (error) {
        console.error('Get bot groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Bot grupları alınırken hata oluştu.'
        });
    }
};

/**
 * Botları listeler
 */
const getBots = async (req, res) => {
    try {
        const userId = req.user.id;
        const { botGroupId } = req.query;
        
        // API key'i al
        const settings = db.prepare(`
            SELECT api_key FROM farmlabs_settings WHERE user_id = ?
        `).get(userId);
        
        if (!settings || !settings.api_key) {
            return res.status(400).json({
                success: false,
                message: 'FarmLabs API key ayarlanmamış.'
            });
        }
        
        // API key'i çöz
        const decryptedApiKey = decrypt(settings.api_key);
        
        const bots = await farmlabsService.fetchBots(decryptedApiKey, {
            botGroupId
        });
        
        res.json({
            success: true,
            data: bots
        });
        
    } catch (error) {
        console.error('Get bots error:', error);
        res.status(500).json({
            success: false,
            message: 'Botlar alınırken hata oluştu.'
        });
    }
};

module.exports = {
    testApiKey,
    saveApiKey,
    getApiKey,
    syncDrops,
    getStats,
    getBotGroups,
    getBots
};
