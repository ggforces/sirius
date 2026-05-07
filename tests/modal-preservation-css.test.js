/**
 * CSS-Based Preservation Property Tests for Non-Account Modal Behavior
 * 
 * **IMPORTANT**: Follow observation-first methodology
 * **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
 * 
 * This test validates Requirements 3.1, 3.2, 3.3, 3.4 from bugfix.md by observing
 * CSS rules and modal behavior patterns that must be preserved after the fix.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */

const { test, expect } = require('@playwright/test');

test.describe('CSS-Based Modal Preservation Property Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set a reasonable timeout
    page.setDefaultTimeout(10000);
    
    // Navigate to the dashboard page to load CSS
    await page.goto('http://localhost:5050/panel/accounts');
  });

  test('Property 2.1: Observe Delete Modal CSS classes and styling patterns', async ({ page }) => {
    // **Property 2: Preservation** - Delete Modal CSS Preservation
    // **Validates: Requirements 3.4**
    
    console.log('=== OBSERVING DELETE MODAL CSS PATTERNS ===');
    
    // Inject Delete Modal HTML to observe CSS behavior
    await page.evaluate(() => {
      const modalHTML = `
        <div class="modal modal-small" id="deleteModal" style="display: flex;">
          <div class="modal-overlay"></div>
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">Hesabı Sil</h3>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
              <p>Bu hesabı silmek istediğinizden emin misiniz?</p>
              <div class="delete-account-name">TestAccount</div>
              <p><strong>Bu işlem geri alınamaz!</strong></p>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary">İptal</button>
              <button type="button" class="btn btn-danger">Sil</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    });

    // Observe Delete Modal CSS behavior
    const deleteModal = page.locator('#deleteModal');
    const deleteModalContent = page.locator('#deleteModal .modal-content');
    const deleteModalBody = page.locator('#deleteModal .modal-body');
    
    // Get computed styles
    const modalStyles = await deleteModal.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        display: styles.display,
        position: styles.position,
        zIndex: styles.zIndex
      };
    });

    const contentStyles = await deleteModalContent.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        maxWidth: styles.maxWidth,
        width: styles.width,
        maxHeight: styles.maxHeight,
        background: styles.background,
        borderRadius: styles.borderRadius
      };
    });

    const bodyStyles = await deleteModalBody.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        maxHeight: styles.maxHeight,
        overflowY: styles.overflowY,
        padding: styles.padding
      };
    });

    // Check modal-small class behavior
    const hasSmallClass = await deleteModal.evaluate(el => el.classList.contains('modal-small'));
    const modalBounds = await deleteModalContent.boundingBox();

    console.log('Delete Modal CSS Observations:');
    console.log('  Modal styles:', modalStyles);
    console.log('  Content styles:', contentStyles);
    console.log('  Body styles:', bodyStyles);
    console.log('  Has modal-small class:', hasSmallClass);
    console.log('  Modal bounds:', modalBounds);

    // **EXPECTED TO PASS**: Observe and preserve current Delete Modal behavior
    expect(hasSmallClass, 'Delete Modal should have modal-small class').toBe(true);
    expect(contentStyles.maxWidth, 'Delete Modal should have constrained max-width').toBe('450px');
    expect(bodyStyles.maxHeight, 'Delete Modal body should not have max-height constraint').toBe('none');
    expect(bodyStyles.overflowY, 'Delete Modal body should have visible overflow').toBe('visible');
    expect(modalBounds.width, 'Delete Modal should be around 450px wide').toBeGreaterThan(400);

    console.log('✅ Delete Modal CSS preservation observations PASSED');
  });

  test('Property 2.2: Observe Bulk Check Modal CSS patterns and dimensions', async ({ page }) => {
    // **Property 2: Preservation** - Bulk Check Modal CSS Preservation
    // **Validates: Requirements 3.4**
    
    console.log('=== OBSERVING BULK CHECK MODAL CSS PATTERNS ===');
    
    // Inject Bulk Check Modal HTML to observe CSS behavior
    await page.evaluate(() => {
      const modalHTML = `
        <div class="modal" id="bulkCheckModal" style="display: flex;">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">Toplu Hesap Kontrolü</h3>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
              <div class="bulk-check-step">
                <h4>Kontrol edilecek hesapları seçin:</h4>
                <div class="account-selection">
                  <div class="accounts-list" id="bulkAccountsList">
                    <div class="bulk-account-item">Test Account 1</div>
                    <div class="bulk-account-item">Test Account 2</div>
                    <div class="bulk-account-item">Test Account 3</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary">İptal</button>
              <button class="btn btn-primary">Kontrolü Başlat</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    });

    // Observe Bulk Check Modal CSS behavior
    const bulkModal = page.locator('#bulkCheckModal');
    const bulkModalContent = page.locator('#bulkCheckModal .modal-content');
    const bulkModalBody = page.locator('#bulkCheckModal .modal-body');
    const accountsList = page.locator('#bulkAccountsList');
    
    // Get computed styles
    const modalStyles = await bulkModal.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        display: styles.display,
        backgroundColor: styles.backgroundColor,
        backdropFilter: styles.backdropFilter
      };
    });

    const contentStyles = await bulkModalContent.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        maxWidth: styles.maxWidth,
        width: styles.width,
        background: styles.background
      };
    });

    const bodyStyles = await bulkModalBody.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        maxHeight: styles.maxHeight,
        overflowY: styles.overflowY,
        padding: styles.padding
      };
    });

    const accountsListStyles = await accountsList.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        maxHeight: styles.maxHeight,
        overflowY: styles.overflowY
      };
    });

    const modalBounds = await bulkModalContent.boundingBox();

    console.log('Bulk Check Modal CSS Observations:');
    console.log('  Modal styles:', modalStyles);
    console.log('  Content styles:', contentStyles);
    console.log('  Body styles:', bodyStyles);
    console.log('  Accounts list styles:', accountsListStyles);
    console.log('  Modal bounds:', modalBounds);

    // **EXPECTED TO PASS**: Observe and preserve current Bulk Check Modal behavior
    expect(contentStyles.maxWidth, 'Bulk Check Modal should have standard max-width').toBe('450px');
    expect(bodyStyles.maxHeight, 'Bulk Check Modal body should not have max-height constraint').toBe('none');
    expect(bodyStyles.overflowY, 'Bulk Check Modal body should have visible overflow').toBe('visible');
    expect(accountsListStyles.maxHeight, 'Accounts list should not have height constraint').toBe('none');
    expect(accountsListStyles.overflowY, 'Accounts list should have visible overflow').toBe('visible');
    expect(modalBounds.width, 'Bulk Check Modal should be standard width').toBeGreaterThan(400);

    console.log('✅ Bulk Check Modal CSS preservation observations PASSED');
  });

  test('Property 2.3: Observe mobile responsive CSS behavior patterns', async ({ page }) => {
    // **Property 2: Preservation** - Mobile Responsive CSS Preservation
    // **Validates: Requirements 3.1**
    
    console.log('=== OBSERVING MOBILE RESPONSIVE CSS PATTERNS ===');
    
    const mobileViewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 768, height: 1024, name: 'iPad Portrait' }
    ];

    for (const viewport of mobileViewports) {
      console.log(`\n--- Observing ${viewport.name} (${viewport.width}x${viewport.height}) ---`);
      
      // Set mobile viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Inject Account Modal HTML to observe mobile CSS behavior
      await page.evaluate(() => {
        // Remove existing modal if present
        const existing = document.getElementById('testAccountModal');
        if (existing) existing.remove();
        
        const modalHTML = `
          <div class="modal active" id="testAccountModal" style="display: flex;">
            <div class="modal-overlay"></div>
            <div class="modal-content">
              <div class="modal-header">
                <h3 class="modal-title">Hesap Ekle</h3>
                <button class="modal-close">&times;</button>
              </div>
              <div class="modal-body">
                <div class="form-group">
                  <label>Kullanıcı Adı</label>
                  <input type="text">
                </div>
                <div class="form-group">
                  <label>Şifre</label>
                  <input type="password">
                </div>
                <div class="form-group">
                  <label>Shared Secret</label>
                  <input type="password">
                </div>
                <div class="form-group">
                  <label>Identity Secret</label>
                  <input type="password">
                </div>
              </div>
              <div class="modal-actions">
                <button class="btn btn-secondary">İptal</button>
                <button class="btn btn-primary">Kaydet</button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
      });

      // Observe mobile responsive behavior
      const modal = page.locator('#testAccountModal');
      const modalContent = page.locator('#testAccountModal .modal-content');
      const modalBody = page.locator('#testAccountModal .modal-body');
      
      // Get mobile-specific styles
      const contentStyles = await modalContent.evaluate(el => {
        const styles = getComputedStyle(el);
        return {
          width: styles.width,
          maxWidth: styles.maxWidth,
          maxHeight: styles.maxHeight,
          margin: styles.margin
        };
      });

      const bodyStyles = await modalBody.evaluate(el => {
        const styles = getComputedStyle(el);
        return {
          maxHeight: styles.maxHeight,
          overflowY: styles.overflowY,
          padding: styles.padding
        };
      });

      const modalBounds = await modalContent.boundingBox();

      console.log(`${viewport.name} Mobile CSS Observations:`);
      console.log('  Content styles:', contentStyles);
      console.log('  Body styles:', bodyStyles);
      console.log('  Modal bounds:', modalBounds);

      // **EXPECTED TO PASS**: Observe mobile responsive behavior
      if (viewport.width <= 768) {
        // On mobile, modal should not have special max-height constraints in current implementation
        expect(bodyStyles.maxHeight, `${viewport.name} should not have max-height constraint`).toBe('none');
        expect(contentStyles.width, `${viewport.name} should have calculated width`).toMatch(/\d+px/);
        expect(contentStyles.maxWidth, `${viewport.name} should have max-width constraint`).toBe('450px');
        expect(contentStyles.maxHeight, `${viewport.name} should not have max-height constraint`).toBe('none');
        expect(modalBounds.width, `${viewport.name} should fit in viewport`).toBeLessThan(viewport.width);
      } else {
        // On larger screens, should use desktop styles
        expect(bodyStyles.maxHeight, `${viewport.name} should not have max-height constraint`).toBe('none');
        expect(contentStyles.maxWidth, `${viewport.name} should have max-width constraint`).toBe('450px');
      }

      console.log(`✅ ${viewport.name} mobile responsive observations PASSED`);
    }
  });

  test('Property 2.4: Observe modalSlideIn animation CSS keyframes and properties', async ({ page }) => {
    // **Property 2: Preservation** - Modal Animation CSS Preservation
    // **Validates: Requirements 3.2**
    
    console.log('=== OBSERVING MODAL ANIMATION CSS PATTERNS ===');
    
    // Check that modalSlideIn animation keyframes exist in CSS
    const animationKeyframes = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      let modalSlideInFound = false;
      let keyframeRules = [];
      
      for (const sheet of styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          for (const rule of rules) {
            if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === 'modalSlideIn') {
              modalSlideInFound = true;
              // Get keyframe rules
              const keyframes = Array.from(rule.cssRules || []);
              keyframeRules = keyframes.map(kf => ({
                keyText: kf.keyText,
                style: kf.style.cssText
              }));
              break;
            }
          }
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      }
      
      return { found: modalSlideInFound, keyframes: keyframeRules };
    });

    // Inject modal to observe animation CSS
    await page.evaluate(() => {
      const modalHTML = `
        <div class="modal active" id="testAnimationModal" style="display: flex;">
          <div class="modal-overlay"></div>
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">Test Animation</h3>
            </div>
            <div class="modal-body">
              <p>Testing animation</p>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    });

    // Observe modal-content animation properties
    const modalContent = page.locator('#testAnimationModal .modal-content');
    const animationStyles = await modalContent.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        animation: styles.animation,
        animationName: styles.animationName,
        animationDuration: styles.animationDuration,
        animationTimingFunction: styles.animationTimingFunction,
        animationFillMode: styles.animationFillMode
      };
    });

    console.log('Modal Animation CSS Observations:');
    console.log('  Keyframes found:', animationKeyframes.found);
    console.log('  Keyframe rules:', animationKeyframes.keyframes);
    console.log('  Animation styles:', animationStyles);

    // **EXPECTED TO PASS**: Observe and preserve modal animation behavior
    expect(animationKeyframes.found, 'modalSlideIn keyframes should exist in CSS').toBe(true);
    expect(animationKeyframes.keyframes.length, 'modalSlideIn should have from/to keyframes').toBeGreaterThan(0);
    expect(animationStyles.animationName, 'Modal content should use modalSlideIn animation').toContain('modalSlideIn');
    expect(animationStyles.animationDuration, 'Animation should be 0.3s duration').toBe('0.3s');
    expect(animationStyles.animationTimingFunction, 'Animation should use ease timing').toBe('ease');

    // Verify keyframe content
    const fromKeyframe = animationKeyframes.keyframes.find(kf => kf.keyText === 'from' || kf.keyText === '0%');
    const toKeyframe = animationKeyframes.keyframes.find(kf => kf.keyText === 'to' || kf.keyText === '100%');
    
    expect(fromKeyframe, 'Should have from/0% keyframe').toBeDefined();
    expect(toKeyframe, 'Should have to/100% keyframe').toBeDefined();
    expect(fromKeyframe.style, 'From keyframe should set opacity and transform').toContain('opacity');
    expect(toKeyframe.style, 'To keyframe should set opacity and transform').toContain('opacity');

    console.log('✅ Modal animation CSS preservation observations PASSED');
  });

  test('Property 2.5: Observe modal close functionality CSS selectors and event handling', async ({ page }) => {
    // **Property 2: Preservation** - Modal Close CSS and Behavior Preservation
    // **Validates: Requirements 3.3**
    
    console.log('=== OBSERVING MODAL CLOSE CSS PATTERNS ===');
    
    // Inject modal with all close elements to observe CSS behavior
    await page.evaluate(() => {
      const modalHTML = `
        <div class="modal active" id="testCloseModal" style="display: flex;">
          <div class="modal-overlay" id="testModalOverlay"></div>
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">Test Close</h3>
              <button class="modal-close" id="testModalClose">&times;</button>
            </div>
            <div class="modal-body">
              <p>Testing close functionality</p>
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" id="testCancelBtn">İptal</button>
              <button class="btn btn-primary">Kaydet</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    });

    // Observe close button CSS
    const modalClose = page.locator('#testModalClose');
    const modalOverlay = page.locator('#testModalOverlay');
    const cancelBtn = page.locator('#testCancelBtn');
    
    // Get close button styles
    const closeButtonStyles = await modalClose.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        width: styles.width,
        height: styles.height,
        display: styles.display,
        alignItems: styles.alignItems,
        justifyContent: styles.justifyContent,
        background: styles.background,
        border: styles.border,
        borderRadius: styles.borderRadius,
        cursor: styles.cursor,
        transition: styles.transition
      };
    });

    // Get overlay styles
    const overlayStyles = await modalOverlay.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        position: styles.position,
        top: styles.top,
        left: styles.left,
        width: styles.width,
        height: styles.height,
        background: styles.background,
        backdropFilter: styles.backdropFilter
      };
    });

    // Get cancel button styles
    const cancelButtonStyles = await cancelBtn.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        background: styles.background,
        color: styles.color,
        border: styles.border,
        borderRadius: styles.borderRadius,
        cursor: styles.cursor
      };
    });

    console.log('Modal Close CSS Observations:');
    console.log('  Close button styles:', closeButtonStyles);
    console.log('  Overlay styles:', overlayStyles);
    console.log('  Cancel button styles:', cancelButtonStyles);

    // **EXPECTED TO PASS**: Observe and preserve close functionality CSS
    expect(closeButtonStyles.width, 'Close button should be 40px wide').toBe('40px');
    expect(closeButtonStyles.height, 'Close button should be 40px tall').toBe('40px');
    expect(closeButtonStyles.display, 'Close button should be flex').toBe('flex');
    expect(closeButtonStyles.cursor, 'Close button should be clickable').toBe('pointer');
    
    expect(overlayStyles.position, 'Overlay should be absolute positioned').toBe('absolute');
    expect(overlayStyles.width, 'Overlay should cover full width').toMatch(/\d+px/);
    expect(overlayStyles.height, 'Overlay should cover full height').toMatch(/\d+px/);
    expect(overlayStyles.backdropFilter, 'Overlay should have backdrop blur').toContain('blur');
    
    expect(cancelButtonStyles.cursor, 'Cancel button should be clickable').toBe('pointer');

    // Test that elements are properly positioned and visible
    const closeButtonBounds = await modalClose.boundingBox();
    const overlayBounds = await modalOverlay.boundingBox();
    
    expect(closeButtonBounds.width, 'Close button should be approximately 40px wide').toBeGreaterThan(30);
    expect(closeButtonBounds.width, 'Close button should not be too wide').toBeLessThan(50);
    expect(closeButtonBounds.height, 'Close button should be approximately 40px tall').toBeGreaterThan(30);
    expect(closeButtonBounds.height, 'Close button should not be too tall').toBeLessThan(50);
    expect(overlayBounds.width, 'Overlay should cover viewport width').toBeGreaterThan(300);
    expect(overlayBounds.height, 'Overlay should cover viewport height').toBeGreaterThan(300);

    console.log('✅ Modal close CSS preservation observations PASSED');
  });
});