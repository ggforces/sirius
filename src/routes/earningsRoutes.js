const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earningsController');
const { authenticateToken } = require('../middleware/auth');

// All routes are protected
router.get('/stats', authenticateToken, earningsController.getEarningsStats);
router.post('/sync', authenticateToken, earningsController.syncEarnings);
router.get('/daily', authenticateToken, earningsController.getDailyEarnings);

module.exports = router;
