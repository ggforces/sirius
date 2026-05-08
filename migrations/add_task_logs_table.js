const db = require('../src/config/database');
const logger = require('../src/utils/logger');

/**
 * Migration: Add task_logs table
 * 
 * This migration creates a new table to store task execution logs persistently.
 * Logs are linked to tasks via foreign key with CASCADE delete.
 */

function up() {
    try {
        logger.info('Running migration: add_task_logs_table (up)');

        // Create task_logs table
        db.exec(`
            CREATE TABLE IF NOT EXISTS task_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                level TEXT NOT NULL CHECK(level IN ('info', 'warning', 'error')),
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );
        `);

        logger.info('task_logs table created successfully');

        // Create indexes for performance
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
        `);

        logger.info('Index idx_task_logs_task_id created successfully');

        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON task_logs(created_at);
        `);

        logger.info('Index idx_task_logs_created_at created successfully');

        logger.info('Migration completed: add_task_logs_table (up)');
        return { success: true, message: 'task_logs table and indexes created successfully' };
    } catch (error) {
        logger.error('Failed to run migration: add_task_logs_table (up)', { error: error.message });
        throw error;
    }
}

function down() {
    try {
        logger.info('Running migration: add_task_logs_table (down)');

        // Drop indexes first
        db.exec('DROP INDEX IF EXISTS idx_task_logs_created_at;');
        logger.info('Index idx_task_logs_created_at dropped successfully');

        db.exec('DROP INDEX IF EXISTS idx_task_logs_task_id;');
        logger.info('Index idx_task_logs_task_id dropped successfully');

        // Drop table
        db.exec('DROP TABLE IF EXISTS task_logs;');
        logger.info('task_logs table dropped successfully');

        logger.info('Migration completed: add_task_logs_table (down)');
        return { success: true, message: 'task_logs table and indexes dropped successfully' };
    } catch (error) {
        logger.error('Failed to run migration: add_task_logs_table (down)', { error: error.message });
        throw error;
    }
}

// Allow running migration directly from command line
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'up') {
        try {
            const result = up();
            console.log('✓ Migration up completed:', result.message);
            process.exit(0);
        } catch (error) {
            console.error('✗ Migration up failed:', error.message);
            process.exit(1);
        }
    } else if (command === 'down') {
        try {
            const result = down();
            console.log('✓ Migration down completed:', result.message);
            process.exit(0);
        } catch (error) {
            console.error('✗ Migration down failed:', error.message);
            process.exit(1);
        }
    } else {
        console.log('Usage: node migrations/add_task_logs_table.js [up|down]');
        process.exit(1);
    }
}

module.exports = { up, down };
