const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './database.sqlite';
const db = new Database(dbPath);

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

    console.log('✅ Database initialized successfully');
}

// Initialize on module load
initializeDatabase();

module.exports = db;
