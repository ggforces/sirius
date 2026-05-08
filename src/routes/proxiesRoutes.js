const express = require('express');
const router = express.Router();
const { 
    getUserProxies, 
    addProxy, 
    deleteProxy, 
    getProxyStats,
    syncWebshareProxies
} = require('../controllers/proxiesController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user's proxies
router.get('/', getUserProxies);

// Add a new proxy
router.post('/', addProxy);

// Delete a proxy
router.delete('/:proxyId', deleteProxy);

// Get proxy statistics
router.get('/stats', getProxyStats);

// Sync proxies from Webshare
router.post('/webshare/sync', syncWebshareProxies);

module.exports = router;
