const db = require('../config/database');
const proxyService = require('../services/proxyService');
const { encrypt } = require('../utils/encryption');

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
 * Sync proxies from Webshare
 */
const syncWebshareProxies = async (req, res) => {
    try {
        const userId = req.user.id;
        const { apiKey } = req.body;
        
        // Validate API key parameter
        if (!apiKey || typeof apiKey !== 'string') {
            return res.status(400).json({ 
                success: false, 
                message: 'API key gereklidir' 
            });
        }
        
        const trimmedKey = apiKey.trim();
        if (trimmedKey.length < 20) {
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz API key' 
            });
        }
        
        // Fetch proxies from Webshare API
        const response = await fetch('https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page=1&page_size=999999', {
            headers: {
                'Authorization': `Token ${trimmedKey}`
            }
        });
        
        if (!response.ok) {
            return res.status(400).json({ 
                success: false, 
                message: 'Webshare API hatası' 
            });
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
        
        // API key is NOT stored - discarded after use
        
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
    syncWebshareProxies
};
