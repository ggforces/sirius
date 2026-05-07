const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './database.sqlite';
const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            balance REAL DEFAULT 0.00,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )
    `);

    // Sessions table
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Earnings table
    db.exec(`
        CREATE TABLE IF NOT EXISTS earnings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date DATE NOT NULL,
            amount REAL DEFAULT 0.00,
            drop_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, date)
        )
    `);

    // FarmLabs settings table
    db.exec(`
        CREATE TABLE IF NOT EXISTS farmlabs_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            api_key TEXT NOT NULL,
            last_sync DATETIME,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Steam accounts table
    db.exec(`
        CREATE TABLE IF NOT EXISTS steam_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            shared_secret TEXT NOT NULL,
            identity_secret TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create indexes for better performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_earnings_user_date ON earnings(user_id, date);
        CREATE INDEX IF NOT EXISTS idx_farmlabs_settings_user_id ON farmlabs_settings(user_id);
        CREATE INDEX IF NOT EXISTS idx_steam_accounts_user_id ON steam_accounts(user_id);
    `);

    // Migration: Add drop_count column if it doesn't exist
    try {
        db.exec(`ALTER TABLE earnings ADD COLUMN drop_count INTEGER DEFAULT 0`);
        console.log('✅ Migration: drop_count column added to earnings table');
    } catch (error) {
        // Column already exists, ignore error
        if (!error.message.includes('duplicate column name')) {
            console.error('Migration error:', error.message);
        }
    }

    // Migration: Add last_login column if it doesn't exist
    try {
        db.exec(`ALTER TABLE users ADD COLUMN last_login DATETIME`);
        console.log('✅ Migration: last_login column added to users table');
    } catch (error) {
        // Column already exists, ignore error
        if (!error.message.includes('duplicate column name')) {
            console.error('Migration error:', error.message);
        }
    }

    // Migration: Add Steam account check columns
    const steamAccountColumns = [
        'steamid TEXT',
        'is_prime INTEGER DEFAULT 0',
        'limited INTEGER DEFAULT NULL',
        'trade_link TEXT',
        'first_purchase_at TEXT',
        'tfa_enabled_at TEXT',
        'wallet_balance REAL DEFAULT 0',
        'wallet_currency TEXT DEFAULT "USD"',
        'last_checked_at TEXT',
        'refresh_token TEXT',
        'nickname TEXT',
        'avatar TEXT',
        'level INTEGER'
    ];

    steamAccountColumns.forEach(column => {
        try {
            db.exec(`ALTER TABLE steam_accounts ADD COLUMN ${column}`);
            console.log(`✅ Migration: ${column.split(' ')[0]} column added to steam_accounts table`);
        } catch (error) {
            if (!error.message.includes('duplicate column name')) {
                console.error('Migration error:', error.message);
            }
        }
    });

    // Migration: Add proxy columns to users table
    const userProxyColumns = [
        'proxy_method TEXT DEFAULT "manual"',
        'webshare_api_key TEXT DEFAULT NULL'
    ];

    userProxyColumns.forEach(column => {
        try {
            db.exec(`ALTER TABLE users ADD COLUMN ${column}`);
            console.log(`✅ Migration: ${column.split(' ')[0]} column added to users table`);
        } catch (error) {
            if (!error.message.includes('duplicate column name')) {
                console.error('Migration error:', error.message);
            }
        }
    });

    // Inventories table
    db.exec(`
        CREATE TABLE IF NOT EXISTS inventories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            assetid TEXT,
            market_hash_name TEXT,
            tradable INTEGER DEFAULT 0,
            trade_unlock_at TEXT DEFAULT NULL,
            context INTEGER DEFAULT 2,
            fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_id) REFERENCES steam_accounts(id) ON DELETE CASCADE
        )
    `);

    // Proxies table
    db.exec(`
        CREATE TABLE IF NOT EXISTS proxies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            ip TEXT NOT NULL,
            port INTEGER NOT NULL,
            is_locked INTEGER DEFAULT 0,
            locked_by_task_id INTEGER DEFAULT NULL,
            locked_at DATETIME DEFAULT NULL,
            last_used_at DATETIME DEFAULT NULL,
            cooldown_until DATETIME DEFAULT NULL,
            success_count INTEGER DEFAULT 0,
            failure_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Tasks table
    db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            account_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            proxy_id INTEGER DEFAULT NULL,
            started_at DATETIME DEFAULT NULL,
            completed_at DATETIME DEFAULT NULL,
            timeout_at DATETIME DEFAULT NULL,
            result TEXT DEFAULT NULL,
            error TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (account_id) REFERENCES steam_accounts(id) ON DELETE CASCADE,
            FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE SET NULL
        )
    `);

    // Create indexes for inventories
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_inventories_account_id ON inventories(account_id);
        CREATE INDEX IF NOT EXISTS idx_inventories_market_hash_name ON inventories(market_hash_name);
    `);

    // Create indexes for proxies
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_proxies_user_id ON proxies(user_id);
        CREATE INDEX IF NOT EXISTS idx_proxies_is_locked ON proxies(is_locked);
        CREATE INDEX IF NOT EXISTS idx_proxies_last_used ON proxies(last_used_at);
        CREATE INDEX IF NOT EXISTS idx_proxies_cooldown ON proxies(cooldown_until);
    `);

    // Create indexes for tasks
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_proxy_id ON tasks(proxy_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_account_id ON tasks(account_id);
    `);

    console.log('✅ Database initialized successfully');
}

// Initialize on module load
initializeDatabase();

// Clean expired sessions on startup
function cleanupExpiredSessions() {
    try {
        const result = db.prepare(`
            DELETE FROM sessions 
            WHERE expires_at < datetime('now')
        `).run();
        
        if (result.changes > 0) {
            console.log(`🧹 Startup cleanup: Removed ${result.changes} expired sessions`);
        }
    } catch (error) {
        console.error('Startup session cleanup error:', error);
    }
}

// Run cleanup on startup
cleanupExpiredSessions();

module.exports = db;
