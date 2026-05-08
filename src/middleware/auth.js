const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token and check session
const authenticateToken = (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.token || 
                     (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Erişim reddedildi. Lütfen giriş yapın.' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if session exists and is valid
        const session = db.prepare(`
            SELECT s.*, u.email, u.balance, u.role, u.is_active 
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > datetime('now')
        `).get(token);

        if (!session) {
            // Clear invalid cookie
            res.clearCookie('token');
            return res.status(401).json({ 
                success: false, 
                message: 'Oturum geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.' 
            });
        }

        // Check if user is active
        if (!session.is_active) {
            res.clearCookie('token');
            return res.status(403).json({ 
                success: false, 
                message: 'Hesabınız devre dışı bırakılmış.' 
            });
        }

        // Attach user info to request
        req.user = {
            id: session.user_id,
            email: session.email,
            balance: session.balance,
            role: session.role || 'user',
            is_active: session.is_active
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Geçersiz token.' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token süresi dolmuş.' 
            });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası.' 
        });
    }
};

module.exports = { authenticateToken };
