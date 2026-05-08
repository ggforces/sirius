const logger = require('../utils/logger');

/**
 * HTTP Request Logging Middleware
 * Logs all incoming requests with timing information
 */
function requestLogger(req, res, next) {
    const startTime = Date.now();
    
    // Log request start
    logger.debug('Incoming request', {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?.id || 'anonymous'
    });
    
    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
        res.send = originalSend;
        
        const duration = Date.now() - startTime;
        
        // Log response
        const logLevel = res.statusCode >= 500 ? 'error' : 
                        res.statusCode >= 400 ? 'warn' : 
                        'http';
        
        logger.log(logLevel, 'HTTP Response', {
            method: req.method,
            url: req.originalUrl || req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user?.id || 'anonymous',
            contentLength: res.get('content-length') || 0
        });
        
        return originalSend.call(this, data);
    };
    
    next();
}

module.exports = requestLogger;
