const Database = require('better-sqlite3');
const db = new Database('./data/database.sqlite');

console.log('=== USERS ===');
const users = db.prepare('SELECT id, email, created_at FROM users').all();
console.log(users);

console.log('\n=== SESSIONS ===');
const sessions = db.prepare('SELECT user_id, expires_at FROM sessions').all();
console.log(sessions);

console.log('\n=== STEAM ACCOUNTS ===');
const accounts = db.prepare('SELECT * FROM steam_accounts').all();
console.log(accounts);

db.close();
