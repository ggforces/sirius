const express = require('express');
const router = express.Router();
const { getAccounts, addAccount, addAccountsBulk, updateAccount, deleteAccount, deleteAccountsBulk } = require('../controllers/accountsController');
const { authenticateToken } = require('../middleware/auth');

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

/**
 * @route   GET /api/accounts
 * @desc    Kullanıcının tüm Steam hesaplarını getir
 * @access  Private
 */
router.get('/', getAccounts);

/**
 * @route   POST /api/accounts
 * @desc    Yeni Steam hesabı ekle
 * @access  Private
 */
router.post('/', addAccount);

/**
 * @route   POST /api/accounts/bulk
 * @desc    Toplu Steam hesabı ekle
 * @access  Private
 */
router.post('/bulk', addAccountsBulk);

/**
 * @route   DELETE /api/accounts/bulk
 * @desc    Toplu Steam hesabı sil
 * @access  Private
 */
router.delete('/bulk', deleteAccountsBulk);

/**
 * @route   PUT /api/accounts/:id
 * @desc    Steam hesabını güncelle
 * @access  Private
 */
router.put('/:id', updateAccount);

/**
 * @route   DELETE /api/accounts/:id
 * @desc    Steam hesabını sil
 * @access  Private
 */
router.delete('/:id', deleteAccount);

module.exports = router;
