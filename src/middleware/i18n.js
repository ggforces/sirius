const fs = require('fs');
const path = require('path');

class I18n {
    constructor() {
        this.translations = {};
        this.defaultLang = 'tr';
        this.supportedLangs = ['tr', 'en'];
        this.loadTranslations();
    }

    /**
     * Load all translation files
     */
    loadTranslations() {
        this.supportedLangs.forEach(lang => {
            const filePath = path.join(__dirname, '../../lang', `${lang}.json`);
            try {
                this.translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                console.log(`✓ Loaded ${lang} translations`);
            } catch (error) {
                console.error(`✗ Failed to load ${lang} translations:`, error.message);
            }
        });
    }

    /**
     * Get translation by key path (e.g., 'dashboard.stats.thisWeek')
     * @param {string} lang - Language code
     * @param {string} keyPath - Dot-separated key path
     * @param {object} params - Optional parameters for string interpolation
     * @returns {string}
     */
    t(lang, keyPath, params = {}) {
        // Fallback to default language if not supported
        if (!this.supportedLangs.includes(lang)) {
            lang = this.defaultLang;
        }

        const keys = keyPath.split('.');
        let value = this.translations[lang];

        // Navigate through nested object
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                // Fallback to key path if translation not found
                console.warn(`Translation not found: ${lang}.${keyPath}`);
                return keyPath;
            }
        }

        // Handle string interpolation
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            Object.keys(params).forEach(param => {
                value = value.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
            });
        }

        return value;
    }

    /**
     * Get all translations for a language
     * @param {string} lang - Language code
     * @returns {object}
     */
    getAll(lang) {
        if (!this.supportedLangs.includes(lang)) {
            lang = this.defaultLang;
        }
        return this.translations[lang] || {};
    }

    /**
     * Express middleware to attach i18n to request
     */
    middleware() {
        return (req, res, next) => {
            // Get language from cookie, query param, or header
            const lang = req.cookies?.lang || 
                        req.query?.lang || 
                        req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
                        this.defaultLang;

            // Normalize language code
            req.lang = this.supportedLangs.includes(lang) ? lang : this.defaultLang;

            // Attach translation function to request
            req.t = (keyPath, params) => this.t(req.lang, keyPath, params);
            
            // Attach all translations to request
            req.translations = this.getAll(req.lang);

            // Attach language info to response locals for views
            res.locals.lang = req.lang;
            res.locals.t = req.t;
            res.locals.translations = req.translations;

            next();
        };
    }
}

module.exports = new I18n();
