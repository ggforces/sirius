const express = require('express');
const router = express.Router();
const { 
    getUserAccounts, 
    checkSingleAccount, 
    checkMultipleAccounts, 
    getAccountInventory,
    getTaskStatus,
    getUserTasks,
    getTaskStatistics,
    getTaskLogs
} = require('../controllers/tasksController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user's Steam accounts
router.get('/accounts', getUserAccounts);

// Check single account
router.post('/check/:accountId', checkSingleAccount);

// Check multiple accounts (bulk)
router.post('/check-bulk', checkMultipleAccounts);

// Get account inventory
router.get('/inventory/:accountId', getAccountInventory);

// Get task status
router.get('/task/:taskId', getTaskStatus);

// Get user's tasks
router.get('/tasks', getUserTasks);

// Get task statistics
router.get('/statistics', getTaskStatistics);

// Get task logs
router.get('/logs/:taskId', getTaskLogs);

module.exports = router;