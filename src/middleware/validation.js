const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            message: 'Validasyon hatası',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Register validation rules
const registerValidation = [
    body('email')
        .isEmail()
        .withMessage('Geçerli bir e-posta adresi girin')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Şifre en az 8 karakter olmalıdır'),
    body('passwordConfirm')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Şifreler eşleşmiyor')
];

// Login validation rules
const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Geçerli bir e-posta adresi girin')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Şifre gereklidir')
];

module.exports = {
    validate,
    registerValidation,
    loginValidation
};
