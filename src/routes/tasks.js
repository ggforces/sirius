const express = require('express');
const router = express.Router();
const { 
    getUserAccounts, 
    checkSingleAccount, 
    checkMultipleAccounts, 
    getAccountInventory 
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

module.exports = router;