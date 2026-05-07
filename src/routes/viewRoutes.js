const express = require('express');
const router = express.Router();
const viewRenderer = require('../utils/viewRenderer');

/**
 * Dashboard page
 */
router.get('/dashboard', (req, res) => {
    try {
        const html = viewRenderer.render('dashboard', {
            EXTRA_HEAD: '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
            EXTRA_SCRIPTS: '<script src="/js/pages/dashboard.js"></script>'
        }, req.translations, req.lang);
        res.send(html);
    } catch (error) {
        console.error('Dashboard render error:', error);
        res.status(500).send(req.t('common.error'));
    }
});

/**
 * Accounts page
 */
router.get('/accounts', (req, res) => {
    try {
        const html = viewRenderer.render('accounts', {
            EXTRA_SCRIPTS: '<script src="/js/pages/accounts.js"></script>'
        }, req.translations, req.lang);
        res.send(html);
    } catch (error) {
        console.error('Accounts render error:', error);
        res.status(500).send(req.t('common.error'));
    }
});

/**
 * Proxies page
 */
router.get('/proxies', (req, res) => {
    try {
        const html = viewRenderer.render('proxies', {
            EXTRA_SCRIPTS: '<script src="/js/pages/proxies.js"></script>'
        }, req.translations, req.lang);
        res.send(html);
    } catch (error) {
        console.error('Proxies render error:', error);
        res.status(500).send(req.t('common.error'));
    }
});

/**
 * Tasks page
 */
router.get('/tasks', (req, res) => {
    try {
        const html = viewRenderer.render('tasks', {
            EXTRA_SCRIPTS: '<script src="/js/pages/tasks.js"></script>'
        }, req.translations, req.lang);
        res.send(html);
    } catch (error) {
        console.error('Tasks render error:', error);
        res.status(500).send(req.t('common.error'));
    }
});

/**
 * Reports page
 */
router.get('/reports', (req, res) => {
    try {
        const html = viewRenderer.render('reports', {
            EXTRA_HEAD: '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
            EXTRA_SCRIPTS: '<script src="/js/pages/reports.js"></script>'
        }, req.translations, req.lang);
        res.send(html);
    } catch (error) {
        console.error('Reports render error:', error);
        res.status(500).send(req.t('common.error'));
    }
});

/**
 * Settings page
 */
router.get('/settings', (req, res) => {
    try {
        const html = viewRenderer.render('settings', {
            EXTRA_SCRIPTS: '<script src="/js/pages/settings.js"></script>'
        }, req.translations, req.lang);
        res.send(html);
    } catch (error) {
        console.error('Settings render error:', error);
        res.status(500).send(req.t('common.error'));
    }
});

module.exports = router;
