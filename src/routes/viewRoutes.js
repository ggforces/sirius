const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { adminPageLimiter, trackSuspiciousActivity } = require('../middleware/adminRateLimit');
const viewRenderer = require('../utils/viewRenderer');
const logger = require('../utils/logger');

/**
 * Dashboard page
 */
router.get('/dashboard', authenticateToken, (req, res) => {
    try {
        const html = viewRenderer.render('dashboard', {
            EXTRA_HEAD: '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
            EXTRA_SCRIPTS: '<script src="/js/pages/dashboard.js"></script>'
        }, req.translations, req.lang, req.user);
        res.send(html);
    } catch (error) {
        logger.error('Dashboard render error', { error: error.message });
        res.status(500).send(req.t('common.error'));
    }
});

/**
 * Accounts page
 */
router.get('/accounts', authenticateToken, (req, res) => {
    try {
        const html = viewRenderer.render('accounts', {
            EXTRA_SCRIPTS: '<script src="/js/pages/accounts.js"></script>'
        }, req.translations, req.lang, req.user);
        res.send(html);
    } catch (error) {
        logger.error('Accounts render error', { error: error.message });
        res.status(500).send(req.t('common.error'));
    }
});

/**
 * Proxies page
 */
router.get('/proxies', authenticateToken, (req, res) => {
    try {
        const html = viewRenderer.render('proxies', {
            EXTRA_SCRIPTS: '<script src="/js/pages/proxies.js"></script>'
        }, req.translations, req.lang, req.user);
        res.send(html);
    } catch (error) {
        logger.error('Proxies render error', { error: error.message });
        res.status(500).send(req.t('common.error'));
    }
});

/**
 * Tasks page
 */
router.get('/tasks', authenticateToken, (req, res) => {
    try {
        const html = viewRenderer.render('tasks', {
            EXTRA_SCRIPTS: '<script src="/js/pages/tasks.js"></script>'
        }, req.translations, req.lang, req.user);
        res.send(html);
    } catch (error) {
        logger.error('Tasks render error', { error: error.message });
        res.status(500).send(req.t('common.error'));
    }
});

/**
 * Reports page
 */
router.get('/reports', authenticateToken, (req, res) => {
    try {
        const html = viewRenderer.render('reports', {
            EXTRA_HEAD: '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
            EXTRA_SCRIPTS: '<script src="/js/pages/reports.js"></script>'
        }, req.translations, req.lang, req.user);
        res.send(html);
    } catch (error) {
        logger.error('Reports render error', { error: error.message });
        res.status(500).send(req.t('common.error'));
    }
});

/**
 * Settings page
 */
router.get('/settings', authenticateToken, (req, res) => {
    try {
        const html = viewRenderer.render('settings', {
            EXTRA_SCRIPTS: '<script src="/js/pages/settings.js"></script>'
        }, req.translations, req.lang, req.user);
        res.send(html);
    } catch (error) {
        logger.error('Settings render error', { error: error.message });
        res.status(500).send(req.t('common.error'));
    }
});

// ==================== ADMIN ROUTES ====================

/**
 * Admin dashboard
 * Protected with: rate limiting, suspicious activity tracking, admin auth
 */
router.get('/admin', adminPageLimiter, trackSuspiciousActivity, authenticateToken, requireAdmin, (req, res) => {
    try {
        const html = viewRenderer.render('admin/dashboard', {
            EXTRA_HEAD: '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
            EXTRA_SCRIPTS: '<script src="/js/pages/admin/dashboard.js"></script>'
        }, req.translations, req.lang, req.user);
        res.send(html);
    } catch (error) {
        logger.error('Admin dashboard render error', { error: error.message });
        res.status(404).sendFile('404.html', { root: './public' });
    }
});

/**
 * Admin users page
 */
router.get('/admin/users', adminPageLimiter, trackSuspiciousActivity, authenticateToken, requireAdmin, (req, res) => {
    try {
        const html = viewRenderer.render('admin/users', {
            EXTRA_SCRIPTS: '<script src="/js/pages/admin/users.js"></script>'
        }, req.translations, req.lang, req.user);
        res.send(html);
    } catch (error) {
        logger.error('Admin users render error', { error: error.message });
        res.status(404).sendFile('404.html', { root: './public' });
    }
});

/**
 * Admin logs page
 */
router.get('/admin/logs', adminPageLimiter, trackSuspiciousActivity, authenticateToken, requireAdmin, (req, res) => {
    try {
        const html = viewRenderer.render('admin/logs', {
            EXTRA_SCRIPTS: '<script src="/js/pages/admin/logs.js"></script>'
        }, req.translations, req.lang, req.user);
        res.send(html);
    } catch (error) {
        logger.error('Admin logs render error', { error: error.message });
        res.status(404).sendFile('404.html', { root: './public' });
    }
});

module.exports = router;
