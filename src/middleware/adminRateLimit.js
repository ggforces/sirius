const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate limiting for admin routes
 * Prevents brute force attacks while allowing normal usage
 */
const adminPageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per 15 minutes (normal usage)
    skipSuccessfulRequests: false,
    handler: (req, res) => {
        logger.logSecurity('admin_rate_limit_exceeded', {
            ip: req.ip,
            url: req.originalUrl,
            userAgent: req.get('user-agent')
        });
        
        // Return 404 - don't reveal rate limiting
        res.status(404).sendFile('404.html', { root: './public' });
    },
    standardHeaders: false, // Don't send rate limit headers
    legacyHeaders: false, // Don't send X-RateLimit headers
});

/**
 * API rate limiting for admin endpoints
 */
const adminApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 minutes (API calls)
    skipSuccessfulRequests: false,
    handler: (req, res) => {
        logger.logSecurity('admin_api_rate_limit_exceeded', {
            ip: req.ip,
            url: req.originalUrl,
            userId: req.user?.id
        });
        
        // Return 404 to hide endpoint
        res.status(404).json({
            success: false,
            message: 'Not found'
        });
    },
    standardHeaders: false,
    legacyHeaders: false,
});

/**
 * Track suspicious activity
 * Multiple failed admin access attempts from same IP
 */
const suspiciousIPs = new Map();

function trackSuspiciousActivity(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    
    // Clean old entries (older than 1 hour)
    for (const [trackedIp, data] of suspiciousIPs.entries()) {
        if (now - data.firstAttempt > 60 * 60 * 1000) {
            suspiciousIPs.delete(trackedIp);
        }
    }
    
    // Track this IP
    if (!suspiciousIPs.has(ip)) {
        suspiciousIPs.set(ip, {
            attempts: 1,
            firstAttempt: now,
            lastAttempt: now
        });
    } else {
        const data = suspiciousIPs.get(ip);
        data.attempts++;
        data.lastAttempt = now;
        
        // If more than 50 attempts in 1 hour, log as suspicious
        if (data.attempts > 50) {
            logger.logSecurity('suspicious_admin_access_pattern', {
                ip,
                attempts: data.attempts,
                duration: now - data.firstAttempt,
                url: req.originalUrl,
                userAgent: req.get('user-agent')
            });
            
            // Block after 100 attempts (very high threshold for normal usage)
            if (data.attempts > 100) {
                logger.logSecurity('admin_access_blocked', {
                    ip,
                    attempts: data.attempts,
                    reason: 'too_many_attempts'
                });
                
                // Return 404
                return res.status(404).sendFile('404.html', { root: './public' });
            }
        }
    }
    
    next();
}

module.exports = {
    adminPageLimiter,
    adminApiLimiter,
    trackSuspiciousActivity
};
