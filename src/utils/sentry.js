const Sentry = require('@sentry/node');
const logger = require('./logger');

/**
 * Initialize Sentry for error tracking
 */
function initSentry(app) {
    // Sentry sadece production'da aktif
    if (process.env.NODE_ENV !== 'production' || !process.env.SENTRY_DSN) {
        logger.info('Sentry disabled (not in production or SENTRY_DSN not set)');
        return;
    }

    try {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            
            // Release tracking (optional)
            release: process.env.APP_VERSION || '1.0.0',
            
            // Performance monitoring
            tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
            
            // Profiling (optional)
            profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) || 0.1,
            
            // Integrations
            integrations: [
                // HTTP integration
                new Sentry.Integrations.Http({ tracing: true }),
                
                // Express integration
                new Sentry.Integrations.Express({ 
                    app,
                    // Capture request body
                    shouldHandleError: (error) => {
                        // Sadece 500+ hataları Sentry'ye gönder
                        return error.status >= 500;
                    }
                }),
            ],
            
            // Hassas bilgileri filtreleme
            beforeSend(event, hint) {
                // Password, token gibi hassas bilgileri temizle
                if (event.request) {
                    // Headers'dan hassas bilgileri kaldır
                    if (event.request.headers) {
                        delete event.request.headers.authorization;
                        delete event.request.headers.cookie;
                    }
                    
                    // Body'den hassas bilgileri kaldır
                    if (event.request.data) {
                        const sensitiveFields = ['password', 'token', 'api_key', 'apiKey', 'secret'];
                        sensitiveFields.forEach(field => {
                            if (event.request.data[field]) {
                                event.request.data[field] = '[REDACTED]';
                            }
                        });
                    }
                }
                
                return event;
            },
            
            // Ignore specific errors
            ignoreErrors: [
                // Network errors
                'NetworkError',
                'Network request failed',
                
                // Client-side errors
                'ResizeObserver loop limit exceeded',
                
                // Rate limiting
                'Too many requests',
                
                // Authentication errors (bunlar normal flow)
                'Invalid token',
                'Token expired',
                'Unauthorized'
            ],
        });

        logger.info('✅ Sentry initialized successfully', {
            environment: process.env.NODE_ENV,
            dsn: process.env.SENTRY_DSN.substring(0, 20) + '...'
        });
    } catch (error) {
        logger.error('Failed to initialize Sentry', { error: error.message });
    }
}

/**
 * Capture exception to Sentry
 */
function captureException(error, context = {}) {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.captureException(error, {
            extra: context
        });
    }
    
    // Her zaman logger'a da yaz
    logger.error('Exception captured', {
        error: error.message,
        stack: error.stack,
        ...context
    });
}

/**
 * Capture message to Sentry
 */
function captureMessage(message, level = 'info', context = {}) {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.captureMessage(message, {
            level,
            extra: context
        });
    }
    
    logger.log(level, message, context);
}

/**
 * Set user context for Sentry
 */
function setUser(user) {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.setUser({
            id: user.id,
            email: user.email
        });
    }
}

/**
 * Clear user context
 */
function clearUser() {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.setUser(null);
    }
}

/**
 * Add breadcrumb (for debugging)
 */
function addBreadcrumb(message, category = 'default', data = {}) {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.addBreadcrumb({
            message,
            category,
            data,
            level: 'info'
        });
    }
}

/**
 * Get Sentry request handler middleware
 */
function getRequestHandler() {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        return Sentry.Handlers.requestHandler();
    }
    return (req, res, next) => next();
}

/**
 * Get Sentry tracing handler middleware
 */
function getTracingHandler() {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        return Sentry.Handlers.tracingHandler();
    }
    return (req, res, next) => next();
}

/**
 * Get Sentry error handler middleware
 */
function getErrorHandler() {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        return Sentry.Handlers.errorHandler({
            shouldHandleError(error) {
                // Sadece 500+ hataları Sentry'ye gönder
                return error.status >= 500;
            }
        });
    }
    return (err, req, res, next) => next(err);
}

module.exports = {
    initSentry,
    captureException,
    captureMessage,
    setUser,
    clearUser,
    addBreadcrumb,
    getRequestHandler,
    getTracingHandler,
    getErrorHandler,
    Sentry
};
