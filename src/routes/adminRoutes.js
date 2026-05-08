const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAdminApi } = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// All admin API routes require authentication AND admin role
router.use(authenticateToken);
router.use(requireAdminApi);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);

// System monitoring
router.get('/stats', adminController.getSystemStats);
router.get('/logs', adminController.getSystemLogs);

// Admin management
router.post('/create-admin', adminController.createAdmin);

module.exports = router;
