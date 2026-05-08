const fs = require('fs');
const path = require('path');

class ViewRenderer {
    constructor() {
        this.layoutPath = path.join(__dirname, '../../views/layout.html');
        this.adminLayoutPath = path.join(__dirname, '../../views/admin-layout.html');
        this.pagesPath = path.join(__dirname, '../../views/pages');
    }

    /**
     * Render a page with layout and translations
     * @param {string} pageName - Name of the page (dashboard, accounts, admin/dashboard, etc.)
     * @param {object} data - Data to replace in template
     * @param {object} translations - Translation object from i18n
     * @param {string} lang - Language code
     * @param {object} user - User object (optional, for admin link)
     * @returns {string} - Rendered HTML
     */
    render(pageName, data = {}, translations = {}, lang = 'tr', user = null) {
        try {
            // Check if it's an admin page
            const isAdminPage = pageName.startsWith('admin/');
            
            // Read appropriate layout
            const layoutPath = isAdminPage ? this.adminLayoutPath : this.layoutPath;
            let layout = fs.readFileSync(layoutPath, 'utf-8');
            
            // Read page content
            const pagePath = path.join(this.pagesPath, `${pageName}.html`);
            let pageContent = fs.readFileSync(pagePath, 'utf-8');
            
            // Apply translations to page content
            pageContent = this.applyTranslations(pageContent, translations);
            
            // Set active navigation
            const activeNav = isAdminPage ? this.getAdminActiveNav(pageName) : this.getUserActiveNav(pageName);
            
            // Generate admin panel link (only for non-admin pages and admin users)
            const adminPanelLink = !isAdminPage && user && user.role === 'admin' 
                ? this.getAdminPanelLink() 
                : '';
            
            // Default data
            const defaultData = {
                PAGE_TITLE: this.getPageTitle(pageName, translations),
                CONTENT: pageContent,
                EXTRA_HEAD: '',
                EXTRA_SCRIPTS: `<script>window.APP_LANG = '${lang}'; window.APP_TRANSLATIONS = ${JSON.stringify(translations)};</script>`,
                ADMIN_PANEL_LINK: adminPanelLink,
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
     * Get admin panel link HTML (only for admin users)
     */
    getAdminPanelLink() {
        return `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <a href="/panel/admin" class="nav-item" style="background: linear-gradient(90deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 217, 61, 0.1) 100%); border-left: 3px solid #ff6b6b;">
                    <span class="nav-icon">
                        <i class="ph-bold ph-shield-check"></i>
                    </span>
                    <span class="nav-label">Admin Panel</span>
                </a>
            </div>
        `;
    }
    
    /**
     * Get active navigation for user pages
     */
    getUserActiveNav(pageName) {
        return {
            ACTIVE_DASHBOARD: pageName === 'dashboard' ? 'active' : '',
            ACTIVE_ACCOUNTS: pageName === 'accounts' ? 'active' : '',
            ACTIVE_PROXIES: pageName === 'proxies' ? 'active' : '',
            ACTIVE_TASKS: pageName === 'tasks' ? 'active' : '',
            ACTIVE_REPORTS: pageName === 'reports' ? 'active' : '',
            ACTIVE_SETTINGS: pageName === 'settings' ? 'active' : ''
        };
    }
    
    /**
     * Get active navigation for admin pages
     */
    getAdminActiveNav(pageName) {
        return {
            ACTIVE_ADMIN_DASHBOARD: pageName === 'admin/dashboard' ? 'active' : '',
            ACTIVE_ADMIN_USERS: pageName === 'admin/users' ? 'active' : '',
            ACTIVE_ADMIN_LOGS: pageName === 'admin/logs' ? 'active' : ''
        };
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
            settings: 'settings.title',
            'admin/dashboard': 'Admin Dashboard',
            'admin/users': 'User Management',
            'admin/logs': 'System Logs'
        };
        
        const keyPath = titleMap[pageName];
        if (!keyPath) return 'Panel';
        
        // If it's a direct string (admin pages), return it
        if (!keyPath.includes('.')) return keyPath;
        
        // Otherwise, look up in translations
        if (translations) {
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
