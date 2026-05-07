const db = require('../config/database');
const proxyService = require('../services/proxyService');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Get all proxies for the user
 */
const getUserProxies = (req, res) => {
    try {
        const userId = req.user.id;
        const proxies = proxyService.getUserProxies(userId);
        
        // Don't send passwords to frontend
        const sanitizedProxies = proxies.map(proxy => ({
            id: proxy.id,
            username: proxy.username,
            ip: proxy.ip,
            port: proxy.port,
            is_locked: proxy.is_locked,
            last_used_at: proxy.last_used_at,
            cooldown_until: proxy.cooldown_until,
            success_count: proxy.success_count,
            failure_count: proxy.failure_count,
            created_at: proxy.created_at
        }));
        
        res.json({ success: true, proxies: sanitizedProxies });
    } catch (error) {
        console.error('Error fetching proxies:', error);
        res.status(500).json({ success: false, message: 'Proxyler alınırken hata oluştu' });
    }
};

/**
 * Add a new proxy
 */
const addProxy = (req, res) => {
    try {
        const userId = req.user.id;
        const { username, password, ip, port } = req.body;
        
        // Validation
        if (!username || !password || !ip || !port) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tüm alanlar gereklidir' 
            });
        }
        
        // Validate port
        const portNum = parseInt(port);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz port numarası' 
            });
        }
        
        // Validate IP
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz IP adresi' 
            });
        }
        
        // Encrypt password
        const encryptedPassword = encrypt(password);
        
        // Add proxy
        const proxyId = proxyService.addProxy(userId, {
            username,
            password: encryptedPassword,
            ip,
            port: portNum
        });
        
        res.json({ 
            success: true, 
            message: 'Proxy başarıyla eklendi',
            proxyId 
        });
    } catch (error) {
        console.error('Error adding proxy:', error);
        res.status(500).json({ success: false, message: 'Proxy eklenirken hata oluştu' });
    }
};

/**
 * Delete a proxy
 */
const deleteProxy = (req, res) => {
    try {
        const userId = req.user.id;
        const { proxyId } = req.params;
        
        const deleted = proxyService.deleteProxy(proxyId, userId);
        
        if (!deleted) {
            return res.status(404).json({ 
                success: false, 
                message: 'Proxy bulunamadı' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Proxy başarıyla silindi' 
        });
    } catch (error) {
        console.error('Error deleting proxy:', error);
        res.status(500).json({ success: false, message: 'Proxy silinirken hata oluştu' });
    }
};

/**
 * Get proxy statistics
 */
const getProxyStats = (req, res) => {
    try {
        const userId = req.user.id;
        const stats = proxyService.getProxyStats(userId);
        
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching proxy stats:', error);
        res.status(500).json({ success: false, message: 'İstatistikler alınırken hata oluştu' });
    }
};

/**
 * Update proxy method (manual or webshare)
 */
const updateProxyMethod = (req, res) => {
    try {
        const userId = req.user.id;
        const { method } = req.body;
        
        if (!['manual', 'webshare'].includes(method)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz proxy yöntemi' 
            });
        }
        
        db.prepare(`
            UPDATE users 
            SET proxy_method = ?
            WHERE id = ?
        `).run(method, userId);
        
        res.json({ 
            success: true, 
            message: 'Proxy yöntemi güncellendi' 
        });
    } catch (error) {
        console.error('Error updating proxy method:', error);
        res.status(500).json({ success: false, message: 'Proxy yöntemi güncellenirken hata oluştu' });
    }
};

/**
 * Save Webshare API key
 */
const saveWebshareApiKey = (req, res) => {
    try {
        const userId = req.user.id;
        const { apiKey } = req.body;
        
        if (!apiKey || !apiKey.startsWith('ws_')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz Webshare API key' 
            });
        }
        
        // Encrypt API key
        const encryptedApiKey = encrypt(apiKey);
        
        db.prepare(`
            UPDATE users 
            SET webshare_api_key = ?
            WHERE id = ?
        `).run(encryptedApiKey, userId);
        
        res.json({ 
            success: true, 
            message: 'Webshare API key kaydedildi' 
        });
    } catch (error) {
        console.error('Error saving Webshare API key:', error);
        res.status(500).json({ success: false, message: 'API key kaydedilirken hata oluştu' });
    }
};

/**
 * Sync proxies from Webshare
 */
const syncWebshareProxies = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user's Webshare API key
        const user = db.prepare(`
            SELECT webshare_api_key, proxy_method FROM users WHERE id = ?
        `).get(userId);
        
        if (!user.webshare_api_key) {
            return res.status(400).json({ 
                success: false, 
                message: 'Webshare API key bulunamadı' 
            });
        }
        
        if (user.proxy_method !== 'webshare') {
            return res.status(400).json({ 
                success: false, 
                message: 'Proxy yöntemi Webshare olarak ayarlanmalı' 
            });
        }
        
        // Decrypt API key
        const apiKey = decrypt(user.webshare_api_key);
        
        // Fetch proxies from Webshare API
        const response = await fetch('https://proxy.webshare.io/api/v2/proxy/list/', {
            headers: {
                'Authorization': `Token ${apiKey}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Webshare API hatası');
        }
        
        const data = await response.json();
        
        // Delete existing proxies
        db.prepare(`DELETE FROM proxies WHERE user_id = ?`).run(userId);
        
        // Add new proxies
        let addedCount = 0;
        for (const proxy of data.results) {
            const encryptedPassword = encrypt(proxy.password);
            
            proxyService.addProxy(userId, {
                username: proxy.username,
                password: encryptedPassword,
                ip: proxy.proxy_address,
                port: proxy.port
            });
            
            addedCount++;
        }
        
        res.json({ 
            success: true, 
            message: `${addedCount} proxy senkronize edildi`,
            count: addedCount
        });
    } catch (error) {
        console.error('Error syncing Webshare proxies:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Proxyler senkronize edilirken hata oluştu: ' + error.message 
        });
    }
};

module.exports = {
    getUserProxies,
    addProxy,
    deleteProxy,
    getProxyStats,
    updateProxyMethod,
    saveWebshareApiKey,
    syncWebshareProxies
};
