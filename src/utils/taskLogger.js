const db = require('../config/database');
const logger = require('./logger');

/**
 * Task Logger Utility
 * 
 * Provides functionality to log task execution messages to the task_logs table.
 * Validates inputs and handles database errors gracefully.
 * 
 * @module taskLogger
 */

/**
 * Valid log levels for task logging
 * @constant {string[]}
 */
const VALID_LOG_LEVELS = ['info', 'warning', 'error'];

/**
 * Log a message for a specific task
 * 
 * Validates inputs and inserts a log entry into the task_logs table.
 * Handles database insertion errors gracefully by logging to the application logger.
 * 
 * @param {number} taskId - The ID of the task to log for
 * @param {string} level - The log level ('info', 'warning', or 'error')
 * @param {string} message - The log message
 * @returns {boolean} - Returns true if log was successfully inserted, false otherwise
 * 
 * @example
 * logTaskMessage(123, 'info', 'Task started with proxy 192.168.1.1:8080');
 * logTaskMessage(123, 'error', 'Proxy connection timeout');
 */
function logTaskMessage(taskId, level, message) {
    // Input validation
    if (!taskId || typeof taskId !== 'number' || taskId <= 0) {
        logger.warn('Invalid taskId provided to logTaskMessage', { taskId, level, message });
        return false;
    }

    if (!level || typeof level !== 'string') {
        logger.warn('Invalid level provided to logTaskMessage', { taskId, level, message });
        return false;
    }

    // Normalize level to lowercase for case-insensitive comparison
    const normalizedLevel = level.toLowerCase();

    if (!VALID_LOG_LEVELS.includes(normalizedLevel)) {
        logger.warn('Invalid log level provided to logTaskMessage', { 
            taskId, 
            level, 
            validLevels: VALID_LOG_LEVELS,
            message 
        });
        return false;
    }

    if (!message || typeof message !== 'string') {
        logger.warn('Invalid message provided to logTaskMessage', { taskId, level, message });
        return false;
    }

    // Trim message to prevent excessive whitespace
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
        logger.warn('Empty message provided to logTaskMessage', { taskId, level });
        return false;
    }

    // Insert log entry into database
    try {
        const stmt = db.prepare(`
            INSERT INTO task_logs (task_id, level, message)
            VALUES (?, ?, ?)
        `);

        stmt.run(taskId, normalizedLevel, trimmedMessage);

        // Log to application logger for debugging (at debug level to avoid noise)
        logger.debug('Task log entry created', { taskId, level: normalizedLevel, message: trimmedMessage });

        return true;
    } catch (error) {
        // Handle database insertion errors gracefully
        logger.error('Failed to insert task log entry', {
            taskId,
            level: normalizedLevel,
            message: trimmedMessage,
            error: error.message,
            stack: error.stack
        });

        return false;
    }
}

module.exports = {
    logTaskMessage,
    VALID_LOG_LEVELS
};
