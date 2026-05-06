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
const viewRoutes = require('./src/routes/viewRoutes');

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
            scriptSrc: ["'self'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://static.cloudflareinsights.com"],
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

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests (300'den düşürüldü)
    message: { 
        success: false, 
        message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: { 
        success: false, 
        message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' 
    }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ==================== GENERAL MIDDLEWARE ====================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// i18n middleware
app.use(i18n.middleware());

// ==================== API ROUTES ====================

app.use('/api/auth', authRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/farmlabs', farmlabsRoutes);
app.use('/api/accounts', accountsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
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
    console.log('║   Status: ✅ Running                    ║');
    console.log('╚════════════════════════════════════════╝');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});
