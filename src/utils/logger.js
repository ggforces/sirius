const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Log formatı
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console formatı (daha okunabilir)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        
        // Meta bilgileri varsa ekle
        if (Object.keys(meta).length > 0) {
            // Stack trace varsa özel formatlama
            if (meta.stack) {
                msg += `\n${meta.stack}`;
            } else {
                msg += ` ${JSON.stringify(meta)}`;
            }
        }
        
        return msg;
    })
);

// Log dizini
const logDir = process.env.LOG_DIR || './logs';

// Transport'lar
const transports = [];

// Console transport (development için)
if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            format: consoleFormat,
            level: 'debug'
        })
    );
} else {
    // Production'da sadece info ve üstü
    transports.push(
        new winston.transports.Console({
            format: consoleFormat,
            level: 'info'
        })
    );
}

// Error log dosyası (sadece error ve fatal)
transports.push(
    new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true
    })
);

// Combined log dosyası (tüm loglar)
transports.push(
    new DailyRotateFile({
        filename: path.join(logDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true
    })
);

// HTTP request log dosyası
transports.push(
    new DailyRotateFile({
        filename: path.join(logDir, 'http-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '7d',
        zippedArchive: true
    })
);

// Winston logger oluştur
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false
});

// HTTP request logging için özel method
logger.logRequest = (req, res, duration) => {
    const logData = {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?.id || 'anonymous'
    };
    
    logger.http('HTTP Request', logData);
};

// Database query logging için özel method
logger.logQuery = (query, duration, params = null) => {
    logger.debug('Database Query', {
        query,
        duration: `${duration}ms`,
        params: params ? JSON.stringify(params) : null
    });
};

// Security event logging için özel method
logger.logSecurity = (event, details) => {
    logger.warn('Security Event', {
        event,
        ...details,
        timestamp: new Date().toISOString()
    });
};

// Task execution logging için özel method
logger.logTask = (taskId, status, details = {}) => {
    const level = status === 'failed' ? 'error' : 'info';
    logger.log(level, `Task ${taskId} ${status}`, details);
};

// Stream for Morgan (HTTP request logger middleware)
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

module.exports = logger;
