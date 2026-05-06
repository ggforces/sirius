const express = require('express');
const router = express.Router();
const farmlabsController = require('../controllers/farmlabsController');
const { authenticateToken } = require('../middleware/auth');

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

// API Key yönetimi
router.post('/api-key/test', farmlabsController.testApiKey);
router.post('/api-key', farmlabsController.saveApiKey);
router.get('/api-key', farmlabsController.getApiKey);

// Drop senkronizasyonu
router.post('/sync', farmlabsController.syncDrops);

// İstatistikler
router.get('/stats', farmlabsController.getStats);

// Bot yönetimi
router.get('/bot-groups', farmlabsController.getBotGroups);
router.get('/bots', farmlabsController.getBots);

module.exports = router;
