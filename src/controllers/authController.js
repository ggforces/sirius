const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Register new user
const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bu e-posta adresi zaten kullanılıyor.' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert user
        const result = db.prepare(`
            INSERT INTO users (email, password, balance) 
            VALUES (?, ?, 0.00)
        `).run(email, hashedPassword);

        const userId = result.lastInsertRowid;

        // Create JWT token
        const token = jwt.sign(
            { userId, email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        // Save session
        db.prepare(`
            INSERT INTO sessions (user_id, token, expires_at) 
            VALUES (?, ?, ?)
        `).run(userId, token, expiresAt.toISOString());

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: 'Kayıt başarılı!',
            data: {
                user: {
                    id: userId,
                    email,
                    balance: 0.00
                },
                token
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası. Lütfen tekrar deneyin.' 
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        
        console.log('🔐 Login attempt:', { email, hasPassword: !!password, rememberMe });

        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        console.log('👤 User lookup result:', user ? { id: user.id, email: user.email, hasPassword: !!user.password } : 'User not found');
        
        if (!user) {
            console.log('❌ Login failed: User not found for email:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'E-posta veya şifre hatalı.' 
            });
        }

        // Verify password
        console.log('🔍 Verifying password...');
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('🔑 Password verification result:', isValidPassword);
        
        if (!isValidPassword) {
            console.log('❌ Login failed: Invalid password for user:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'E-posta veya şifre hatalı.' 
            });
        }

        console.log('✅ Login successful for user:', email);

        // Update last login
        db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
        
        // Clean expired sessions
        cleanExpiredSessions();

        // Create JWT token
        const expiresIn = rememberMe ? '30d' : process.env.JWT_EXPIRES_IN;
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

        // Delete old sessions for this user (optional: keep only latest)
        const deletedSessions = db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
        console.log('🧹 Deleted old sessions:', deletedSessions.changes);

        // Save new session
        db.prepare(`
            INSERT INTO sessions (user_id, token, expires_at) 
            VALUES (?, ?, ?)
        `).run(user.id, token, expiresAt.toISOString());
        
        console.log('💾 New session created for user:', user.id);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'Giriş başarılı!',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    balance: user.balance
                },
                token
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası. Lütfen tekrar deneyin.' 
        });
    }
};

// Logout user
const logout = (req, res) => {
    try {
        const token = req.cookies.token || 
                     (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (token) {
            // Delete session from database
            db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
        }
        
        // Clean expired sessions
        cleanExpiredSessions();

        // Clear cookie
        res.clearCookie('token');

        res.json({
            success: true,
            message: 'Çıkış başarılı!'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası.' 
        });
    }
};

// Get current user
const getCurrentUser = (req, res) => {
    try {
        const user = db.prepare(`
            SELECT id, email, balance, created_at, last_login 
            FROM users 
            WHERE id = ?
        `).get(req.user.id);

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası.' 
        });
    }
};

// Debug: List all users (DEVELOPMENT ONLY)
const debugListUsers = (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ 
                success: false, 
                message: 'Bu endpoint sadece development modunda kullanılabilir.' 
            });
        }

        const users = db.prepare(`
            SELECT id, email, created_at, last_login 
            FROM users 
            ORDER BY created_at DESC
        `).all();

        console.log('📋 Debug: All users in database:', users);

        res.json({
            success: true,
            data: { users, count: users.length }
        });

    } catch (error) {
        console.error('Debug list users error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası.' 
        });
    }
};

// Clean expired sessions (utility function)
const cleanExpiredSessions = () => {
    try {
        const result = db.prepare(`
            DELETE FROM sessions 
            WHERE expires_at < datetime('now')
        `).run();
        
        if (result.changes > 0) {
            console.log(`🧹 Cleaned ${result.changes} expired sessions`);
        }
    } catch (error) {
        console.error('Clean sessions error:', error);
    }
};

// Run cleanup every hour
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Get user
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kullanıcı bulunamadı.' 
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Mevcut şifre hatalı.' 
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);

        res.json({
            success: true,
            message: 'Şifre başarıyla değiştirildi!'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası. Lütfen tekrar deneyin.' 
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    changePassword,
    debugListUsers
};
