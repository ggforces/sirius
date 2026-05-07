const fs = require('fs');
const path = require('path');

class ViewRenderer {
    constructor() {
        this.layoutPath = path.join(__dirname, '../../views/layout.html');
        this.pagesPath = path.join(__dirname, '../../views/pages');
    }

    /**
     * Render a page with layout and translations
     * @param {string} pageName - Name of the page (dashboard, accounts, etc.)
     * @param {object} data - Data to replace in template
     * @param {object} translations - Translation object from i18n
     * @param {string} lang - Language code
     * @returns {string} - Rendered HTML
     */
    render(pageName, data = {}, translations = {}, lang = 'tr') {
        try {
            // Read layout
            let layout = fs.readFileSync(this.layoutPath, 'utf-8');
            
            // Read page content
            const pagePath = path.join(this.pagesPath, `${pageName}.html`);
            let pageContent = fs.readFileSync(pagePath, 'utf-8');
            
            // Apply translations to page content
            pageContent = this.applyTranslations(pageContent, translations);
            
            // Set active navigation
            const activeNav = {
                ACTIVE_DASHBOARD: pageName === 'dashboard' ? 'active' : '',
                ACTIVE_ACCOUNTS: pageName === 'accounts' ? 'active' : '',
                ACTIVE_PROXIES: pageName === 'proxies' ? 'active' : '',
                ACTIVE_TASKS: pageName === 'tasks' ? 'active' : '',
                ACTIVE_REPORTS: pageName === 'reports' ? 'active' : '',
                ACTIVE_SETTINGS: pageName === 'settings' ? 'active' : ''
            };
            
            // Default data
            const defaultData = {
                PAGE_TITLE: this.getPageTitle(pageName, translations),
                CONTENT: pageContent,
                EXTRA_HEAD: '',
                EXTRA_SCRIPTS: `<script>window.APP_LANG = '${lang}'; window.APP_TRANSLATIONS = ${JSON.stringify(translations)};</script>`,
                ...activeNav
            };
            
            // Merge with provided data
            const finalData = { ...defaultData, ...data };
            
            // Apply translations to layout
            layout = this.applyTranslations(layout, translations);
            
            // Replace placeholders
            Object.keys(finalData).forEach(key => {
                const placeholder = `{{${key}}}`;
                layout = layout.replace(new RegExp(placeholder, 'g'), finalData[key]);
            });
            
            return layout;
        } catch (error) {
            console.error('View rendering error:', error);
            throw error;
        }
    }
    
    /**
     * Apply translations to HTML content
     * @param {string} html - HTML content
     * @param {object} translations - Translation object
     * @returns {string} - Translated HTML
     */
    applyTranslations(html, translations) {
        // Replace {{t:key.path}} with translation
        return html.replace(/\{\{t:([a-zA-Z0-9._]+)\}\}/g, (match, keyPath) => {
            const keys = keyPath.split('.');
            let value = translations;
            
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    return match; // Return original if not found
                }
            }
            
            return typeof value === 'string' ? value : match;
        });
    }
    
    /**
     * Get page title based on page name
     * @param {string} pageName 
     * @param {object} translations
     * @returns {string}
     */
    getPageTitle(pageName, translations = {}) {
        const titleMap = {
            dashboard: 'dashboard.title',
            accounts: 'accounts.title',
            proxies: 'proxies.title',
            tasks: 'tasks.title',
            reports: 'reports.title',
            settings: 'settings.title'
        };
        
        const keyPath = titleMap[pageName];
        if (keyPath && translations) {
            const keys = keyPath.split('.');
            let value = translations;
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    return 'Panel';
                }
            }
            return value;
        }
        
        return 'Panel';
    }
}

module.exports = new ViewRenderer();
