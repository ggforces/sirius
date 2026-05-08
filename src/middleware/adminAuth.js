const logger = require('../utils/logger');

/**
 * Admin authentication middleware
 * Checks if user is authenticated AND has admin role
 * Returns 404 for unauthorized users (security through obscurity)
 */
function requireAdmin(req, res, next) {
    const isApiRequest = req.originalUrl.startsWith('/api/');
    
    // Check if user is authenticated
    if (!req.user) {
        logger.logSecurity('admin_access_denied', {
            reason: 'not_authenticated',
            ip: req.ip,
            url: req.originalUrl,
            userAgent: req.get('user-agent')
        });
        
        // For page requests: return 404 (don't reveal admin panel exists)
        if (!isApiRequest) {
            return res.status(404).sendFile('404.html', { root: './public' });
        }
        
        // For API requests: return JSON error
        return res.status(401).json({
            success: false,
            message: 'Unauthorized access'
        });
    }
    
    // Check if user has admin role
    if (req.user.role !== 'admin') {
        logger.logSecurity('admin_access_denied', {
            reason: 'insufficient_permissions',
            userId: req.user.id,
            userRole: req.user.role,
            ip: req.ip,
            url: req.originalUrl,
            userAgent: req.get('user-agent')
        });
        
        // For page requests: return 404 (don't reveal admin panel exists)
        if (!isApiRequest) {
            return res.status(404).sendFile('404.html', { root: './public' });
        }
        
        // For API requests: return generic 404 (don't reveal endpoint exists)
        return res.status(404).json({
            success: false,
            message: 'Not found'
        });
    }
    
    // Check if admin account is active
    if (!req.user.is_active) {
        logger.logSecurity('admin_access_denied', {
            reason: 'account_inactive',
            userId: req.user.id,
            ip: req.ip,
            url: req.originalUrl
        });
        
        // For page requests: return 404
        if (!isApiRequest) {
            return res.status(404).sendFile('404.html', { root: './public' });
        }
        
        // For API requests: return error
        return res.status(403).json({
            success: false,
            message: 'Account disabled'
        });
    }
    
    // Log admin access (only log successful access, not every attempt)
    logger.info('Admin access granted', {
        userId: req.user.id,
        email: req.user.email,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });
    
    next();
}

/**
 * Admin authentication middleware for API routes only
 * Returns JSON errors instead of redirects
 */
function requireAdminApi(req, res, next) {
    // Check if user is authenticated
    if (!req.user) {
        logger.logSecurity('admin_api_access_denied', {
            reason: 'not_authenticated',
            ip: req.ip,
            url: req.originalUrl
        });
        
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }
    
    // Check if user has admin role
    if (req.user.role !== 'admin') {
        logger.logSecurity('admin_api_access_denied', {
            reason: 'insufficient_permissions',
            userId: req.user.id,
            userRole: req.user.role,
            ip: req.ip,
            url: req.originalUrl
        });
        
        // Return 404 to hide endpoint existence
        return res.status(404).json({
            success: false,
            message: 'Not found'
        });
    }
    
    // Check if admin account is active
    if (!req.user.is_active) {
        logger.logSecurity('admin_api_access_denied', {
            reason: 'account_inactive',
            userId: req.user.id,
            ip: req.ip,
            url: req.originalUrl
        });
        
        return res.status(403).json({
            success: false,
            message: 'Account disabled'
        });
    }
    
    next();
}

module.exports = { requireAdmin, requireAdminApi };
