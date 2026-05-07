const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

// Import database (initializes tables)
require('./src/config/database');

// Import i18n
const i18n = require('./src/middleware/i18n');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const earningsRoutes = require('./src/routes/earningsRoutes');
const farmlabsRoutes = require('./src/routes/farmlabsRoutes');
const accountsRoutes = require('./src/routes/accountsRoutes');
const tasksRoutes = require('./src/routes/tasks');
const proxiesRoutes = require('./src/routes/proxiesRoutes');
const viewRoutes = require('./src/routes/viewRoutes');

// Import task queue service
const taskQueueService = require('./src/services/taskQueueService');

// Import task executor worker
const taskExecutor = require('./src/workers/taskExecutor');

const app = express();
const PORT = process.env.PORT || 5050;

// ==================== SECURITY MIDDLEWARE ====================

// Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://unpkg.com"],
            scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://static.cloudflareinsights.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cloudflareinsights.com"],
        },
    },
}));

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5050',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==================== GENERAL MIDDLEWARE (BEFORE RATE LIMITING) ====================

// Cookie parser MUST be before rate limiting to read cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==================== RATE LIMITING ====================

// Rate limiting - Farklı kullanıcı tipleri için farklı limitler
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { success: false, message },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Anonim kullanıcılar için rate limiter (düşük limit)
const anonymousLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_ANONYMOUS_WINDOW_MS) || 15 * 60 * 1000, // 15 dakika
    parseInt(process.env.RATE_LIMIT_ANONYMOUS_MAX) || 100, // 100 istek
    'Çok fazla istek gönderildi. Lütfen giriş yapın veya daha sonra tekrar deneyin.'
);

// Login olan kullanıcılar için rate limiter (yüksek limit)
const authenticatedLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_AUTHENTICATED_WINDOW_MS) || 15 * 60 * 1000, // 15 dakika
    parseInt(process.env.RATE_LIMIT_AUTHENTICATED_MAX) || 1000, // 1000 istek (10x daha fazla)
    'Çok fazla istek gönderildi. Lütfen bir süre bekleyin.'
);

// Dinamik rate limiter - kullanıcı tipine göre limit uygula
const dynamicLimiter = (req, res, next) => {
    const token = req.cookies.token || 
                 (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    // Token varsa authenticated limiter, yoksa anonymous limiter kullan
    if (token) {
        authenticatedLimiter(req, res, next);
    } else {
        anonymousLimiter(req, res, next);
    }
};

// Apply dynamic rate limiting to API routes
app.use('/api/', dynamicLimiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 5, // 5 requests per window
    message: { 
        success: false, 
        message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' 
    }
});

// Kritik işlemler için rate limiter (şifre değiştirme, hesap silme vb.)
const criticalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_CRITICAL_WINDOW_MS) || 15 * 60 * 1000, // 15 dakika
    max: parseInt(process.env.RATE_LIMIT_CRITICAL_MAX) || 10, // 10 istek
    message: { 
        success: false, 
        message: 'Çok fazla işlem denemesi. Lütfen 15 dakika sonra tekrar deneyin.' 
    }
});

// Yazma işlemleri için rate limiter (POST/PUT/DELETE)
const writeLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WRITE_WINDOW_MS) || 1 * 60 * 1000, // 1 dakika
    max: parseInt(process.env.RATE_LIMIT_WRITE_MAX) || 30, // 30 istek
    message: { 
        success: false, 
        message: 'Çok fazla yazma işlemi. Lütfen bir dakika bekleyin.' 
    }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/change-password', criticalLimiter);

// Yazma işlemleri için ekstra koruma
app.use('/api/accounts', (req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        writeLimiter(req, res, next);
    } else {
        next();
    }
});

app.use('/api/tasks', (req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        writeLimiter(req, res, next);
    } else {
        next();
    }
});

app.use('/api/proxies', (req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        writeLimiter(req, res, next);
    } else {
        next();
    }
});

// ==================== STATIC FILES & i18n ====================

app.use(express.static('public'));

// i18n middleware
app.use(i18n.middleware());

// ==================== API ROUTES ====================

app.use('/api/auth', authRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/farmlabs', farmlabsRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/proxies', proxiesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint - Database info (only in development)
app.get('/api/debug/db', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            success: false,
            message: 'Debug endpoint is disabled in production'
        });
    }
    
    try {
        const db = require('./src/config/database');
        
        const users = db.prepare('SELECT id, email, created_at FROM users').all();
        const accounts = db.prepare('SELECT id, username, user_id FROM accounts').all();
        const sessions = db.prepare('SELECT user_id, expires_at FROM sessions WHERE expires_at > datetime("now")').all();
        const proxies = db.prepare('SELECT id, host, port, user_id, is_locked, cooldown_until FROM proxies').all();
        const tasks = db.prepare('SELECT id, type, status, user_id FROM tasks').all();
        
        res.json({
            success: true,
            data: {
                users: {
                    count: users.length,
                    list: users
                },
                accounts: {
                    count: accounts.length,
                    list: accounts
                },
                sessions: {
                    count: sessions.length,
                    list: sessions
                },
                proxies: {
                    count: proxies.length,
                    list: proxies
                },
                tasks: {
                    count: tasks.length,
                    list: tasks
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Language switching endpoint
app.post('/api/language', (req, res) => {
    const { lang } = req.body;
    const supportedLangs = ['tr', 'en'];
    
    if (!lang || !supportedLangs.includes(lang)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid language code'
        });
    }
    
    // Set language cookie (expires in 1 year)
    res.cookie('lang', lang, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    
    res.json({
        success: true,
        message: 'Language updated',
        lang: lang
    });
});

// ==================== FRONTEND ROUTES ====================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Redirect /panel to /panel/dashboard (must be before app.use)
app.get('/panel', (req, res) => {
    res.redirect('/panel/dashboard');
});

// Panel routes - serve separate pages
app.use('/panel', viewRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'API endpoint bulunamadı.' 
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Sunucu hatası.' 
            : err.message
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   🌟 SIRIUS STEAM AUTOMATION 🌟      ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║   Server: http://localhost:${PORT}       ║`);
    console.log(`║   Environment: ${process.env.NODE_ENV}            ║`);
    console.log('║   Database: SQLite (Local)             ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║   🔄 Task Queue: Active                ║');
    console.log('║   🔄 Task Executor: Active             ║');
    console.log('╚════════════════════════════════════════╝');
    
    // Start task queue processor
    taskQueueService.startTaskQueueProcessor();
    
    // Start task executor worker
    taskExecutor.startTaskExecutor();
    
    console.log('║   Status: ✅ Running                    ║');
    console.log('╚════════════════════════════════════════╝');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});
