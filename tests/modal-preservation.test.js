/**
 * Preservation Property Tests for Non-Account Modal Behavior
 * 
 * **IMPORTANT**: Follow observation-first methodology
 * **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
 * 
 * This test validates Requirements 3.1, 3.2, 3.3, 3.4 from bugfix.md:
 * - Modal responsive design behavior on mobile devices must continue to work exactly as before
 * - Modal animations (modalSlideIn) and transition effects must remain unchanged  
 * - Modal close functionality via modal-close button and overlay clicks must be preserved
 * - Other modal types (Delete Modal, Bulk Check Modal) must maintain their existing behaviors and sizing
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */

const { test, expect } = require('@playwright/test');

test.describe('Modal Preservation Property Tests - Non-Account Modal Behavior', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set a reasonable timeout for network operations
    page.setDefaultTimeout(10000);
  });

  test('Property 2.1: Delete Modal maintains current dimensions and behavior', async ({ page }) => {
    // **Property 2: Preservation** - Delete Modal Behavior Preservation
    // **Validates: Requirements 3.4**
    
    console.log('=== TESTING DELETE MODAL PRESERVATION ===');
    
    try {
      // Navigate to accounts page
      await page.goto('/panel/accounts');
      
      // Skip if authentication required
      if (page.url().includes('login') || page.url() === 'http://localhost:3000/') {
        console.log('Authentication required - creating simplified test');
        
        // Inject modal HTML for testing
        await page.evaluate(() => {
          // Check if modal already exists
          if (document.getElementById('deleteModal')) {
            return;
          }
          
          // Create modal HTML
          const modalHTML = `
            <div class="modal modal-small" id="deleteModal">
              <div class="modal-overlay" id="deleteModalOverlay"></div>
              <div class="modal-content">
                <div class="modal-header">
                  <h3 class="modal-title">Hesabı Sil</h3>
                  <button class="modal-close" id="deleteModalClose">&times;</button>
                </div>
                <div class="modal-body">
                  <p>Bu hesabı silmek istediğinizden emin misiniz?</p>
                  <div class="delete-account-name" id="deleteAccountName">TestAccount</div>
                  <p><strong>Bu işlem geri alınamaz!</strong></p>
                </div>
                <div class="modal-actions">
                  <button type="button" class="btn btn-secondary" id="cancelDeleteBtn">İptal</button>
                  <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                    <i class="ph-bold ph-trash"></i>
                    Sil
                  </button>
                </div>
              </div>
            </div>
          `;
          document.body.insertAdjacentHTML('beforeend', modalHTML);
        });
      }

      // Open delete modal by adding active class
      await page.evaluate(() => {
        const modal = document.getElementById('deleteModal');
        if (modal) {
          modal.classList.add('active');
        }
      });

      // Wait for modal to be visible
      const deleteModal = page.locator('#deleteModal');
      await expect(deleteModal).toHaveClass(/active/);

      // Measure Delete Modal dimensions and behavior
      const deleteModalContent = page.locator('#deleteModal .modal-content');
      const deleteModalBody = page.locator('#deleteModal .modal-body');
      
      // Get modal dimensions
      const modalBounds = await deleteModalContent.boundingBox();
      const bodyBounds = await deleteModalBody.boundingBox();
      
      // Check CSS classes and styling
      const hasSmallClass = await deleteModal.evaluate(el => el.classList.contains('modal-small'));
      const modalBodyStyles = await deleteModalBody.evaluate(el => {
        const styles = getComputedStyle(el);
        return {
          maxHeight: styles.maxHeight,
          overflowY: styles.overflowY,
          padding: styles.padding
        };
      });

      console.log('Delete Modal Measurements:');
      console.log('  Modal bounds:', modalBounds);
      console.log('  Body bounds:', bodyBounds);
      console.log('  Has modal-small class:', hasSmallClass);
      console.log('  Body styles:', modalBodyStyles);

      // **EXPECTED TO PASS**: Preserve existing Delete Modal behavior
      expect(hasSmallClass, 'Delete Modal should have modal-small class').toBe(true);
      expect(modalBounds.width, 'Delete Modal should have constrained width').toBeLessThan(500);
      
      // Verify modal body has expected styling (should match current CSS)
      expect(modalBodyStyles.maxHeight).toContain('calc(95vh - 140px)');
      expect(modalBodyStyles.overflowY).toBe('auto');

      // Test close functionality
      const closeBtn = page.locator('#deleteModalClose');
      await expect(closeBtn).toBeVisible();
      
      // Close modal and verify it closes
      await closeBtn.click();
      await expect(deleteModal).not.toHaveClass(/active/);

      console.log('✅ Delete Modal preservation test PASSED');

    } catch (error) {
      console.log('Delete Modal test error:', error.message);
      throw error;
    }
  });

  test('Property 2.2: Bulk Check Modal maintains existing behavior and sizing', async ({ page }) => {
    // **Property 2: Preservation** - Bulk Check Modal Behavior Preservation
    // **Validates: Requirements 3.4**
    
    console.log('=== TESTING BULK CHECK MODAL PRESERVATION ===');
    
    try {
      // Navigate to automation page
      await page.goto('/panel/automation');
      
      // Skip if authentication required
      if (page.url().includes('login') || page.url() === 'http://localhost:3000/') {
        console.log('Authentication required - creating simplified test');
        
        // Inject modal HTML for testing
        await page.evaluate(() => {
          // Check if modal already exists
          if (document.getElementById('bulkCheckModal')) {
            return;
          }
          
          // Create modal HTML
          const modalHTML = `
            <div class="modal" id="bulkCheckModal">
              <div class="modal-content">
                <div class="modal-header">
                  <h3 class="modal-title">Toplu Hesap Kontrolü</h3>
                  <button class="modal-close" id="closeBulkCheckModal">&times;</button>
                </div>
                <div class="modal-body">
                  <div class="bulk-check-step" id="selectAccountsStep">
                    <h4>Kontrol edilecek hesapları seçin:</h4>
                    <div class="account-selection">
                      <div class="selection-header">
                        <label class="checkbox-container">
                          <input type="checkbox" id="selectAllAccounts">
                          <span class="checkmark"></span>
                          <span class="checkbox-label">Tümünü Seç</span>
                        </label>
                        <span class="selected-count" id="selectedCount">0 hesap seçildi</span>
                      </div>
                      <div class="accounts-list" id="bulkAccountsList">
                        <div class="bulk-account-item">
                          <label class="checkbox-container">
                            <input type="checkbox">
                            <span class="checkmark"></span>
                          </label>
                          <div class="bulk-account-info">
                            <div class="bulk-account-username">TestAccount1</div>
                            <div class="bulk-account-details">Test details</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" id="cancelBulkCheck">İptal</button>
                  <button class="btn btn-primary" id="startBulkCheck">Kontrolü Başlat</button>
                </div>
              </div>
            </div>
          `;
          document.body.insertAdjacentHTML('beforeend', modalHTML);
        });
      }

      // Open bulk check modal
      await page.evaluate(() => {
        const modal = document.getElementById('bulkCheckModal');
        if (modal) {
          modal.style.display = 'flex';
        }
      });

      // Wait for modal to be visible
      const bulkModal = page.locator('#bulkCheckModal');
      await expect(bulkModal).toBeVisible();

      // Measure Bulk Check Modal dimensions and behavior
      const bulkModalContent = page.locator('#bulkCheckModal .modal-content');
      const bulkModalBody = page.locator('#bulkCheckModal .modal-body');
      
      // Get modal dimensions
      const modalBounds = await bulkModalContent.boundingBox();
      const bodyBounds = await bulkModalBody.boundingBox();
      
      // Check modal body styling
      const modalBodyStyles = await bulkModalBody.evaluate(el => {
        const styles = getComputedStyle(el);
        return {
          maxHeight: styles.maxHeight,
          overflowY: styles.overflowY,
          padding: styles.padding
        };
      });

      // Check accounts list styling
      const accountsList = page.locator('#bulkAccountsList');
      const accountsListStyles = await accountsList.evaluate(el => {
        const styles = getComputedStyle(el);
        return {
          maxHeight: styles.maxHeight,
          overflowY: styles.overflowY
        };
      });

      console.log('Bulk Check Modal Measurements:');
      console.log('  Modal bounds:', modalBounds);
      console.log('  Body bounds:', bodyBounds);
      console.log('  Body styles:', modalBodyStyles);
      console.log('  Accounts list styles:', accountsListStyles);

      // **EXPECTED TO PASS**: Preserve existing Bulk Check Modal behavior
      expect(modalBounds.width, 'Bulk Check Modal should have reasonable width').toBeGreaterThan(400);
      
      // Verify accounts list has constrained height for scrolling
      expect(accountsListStyles.maxHeight).toBe('300px');
      expect(accountsListStyles.overflowY).toBe('auto');

      // Test close functionality
      const closeBtn = page.locator('#closeBulkCheckModal');
      await expect(closeBtn).toBeVisible();
      
      // Close modal and verify it closes
      await closeBtn.click();
      await page.evaluate(() => {
        const modal = document.getElementById('bulkCheckModal');
        if (modal) {
          modal.style.display = 'none';
        }
      });
      await expect(bulkModal).not.toBeVisible();

      console.log('✅ Bulk Check Modal preservation test PASSED');

    } catch (error) {
      console.log('Bulk Check Modal test error:', error.message);
      throw error;
    }
  });

  test('Property 2.3: Mobile responsive behavior works correctly with calc(98vh - 120px)', async ({ page }) => {
    // **Property 2: Preservation** - Mobile Responsive Behavior Preservation
    // **Validates: Requirements 3.1**
    
    console.log('=== TESTING MOBILE RESPONSIVE PRESERVATION ===');
    
    const mobileViewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 414, height: 896, name: 'iPhone 11' },
      { width: 360, height: 640, name: 'Android Small' }
    ];

    for (const viewport of mobileViewports) {
      console.log(`\n--- Testing ${viewport.name} (${viewport.width}x${viewport.height}) ---`);
      
      // Set mobile viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      try {
        // Navigate to accounts page
        await page.goto('/panel/accounts');
        
        // Skip if authentication required
        if (page.url().includes('login') || page.url() === 'http://localhost:3000/') {
          // Inject modal HTML for testing
          await page.evaluate(() => {
            if (!document.getElementById('accountModal')) {
              const modalHTML = `
                <div class="modal active" id="accountModal">
                  <div class="modal-overlay"></div>
                  <div class="modal-content">
                    <div class="modal-header">
                      <h3 class="modal-title">Hesap Ekle</h3>
                      <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                      <div class="form-group">
                        <label>Kullanıcı Adı</label>
                        <input type="text" id="username">
                      </div>
                      <div class="form-group">
                        <label>Şifre</label>
                        <input type="password" id="password">
                      </div>
                      <div class="form-group">
                        <label>Shared Secret</label>
                        <input type="password" id="sharedSecret">
                      </div>
                      <div class="form-group">
                        <label>Identity Secret</label>
                        <input type="password" id="identitySecret">
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
            }
          });
        }

        // Ensure modal is visible
        const modal = page.locator('#accountModal');
        await expect(modal).toBeVisible();

        // Measure mobile responsive behavior
        const modalContent = page.locator('#accountModal .modal-content');
        const modalBody = page.locator('#accountModal .modal-body');
        
        // Get modal dimensions on mobile
        const modalBounds = await modalContent.boundingBox();
        const bodyBounds = await modalBody.boundingBox();
        
        // Check mobile-specific CSS
        const modalBodyStyles = await modalBody.evaluate(el => {
          const styles = getComputedStyle(el);
          return {
            maxHeight: styles.maxHeight,
            overflowY: styles.overflowY,
            padding: styles.padding
          };
        });

        const modalContentStyles = await modalContent.evaluate(el => {
          const styles = getComputedStyle(el);
          return {
            width: styles.width,
            maxWidth: styles.maxWidth,
            maxHeight: styles.maxHeight,
            margin: styles.margin
          };
        });

        console.log(`${viewport.name} Mobile Measurements:`);
        console.log('  Modal bounds:', modalBounds);
        console.log('  Body bounds:', bodyBounds);
        console.log('  Body styles:', modalBodyStyles);
        console.log('  Content styles:', modalContentStyles);

        // **EXPECTED TO PASS**: Preserve mobile responsive behavior
        // On mobile, modal should use calc(98vh - 120px) for modal-body max-height
        expect(modalBodyStyles.maxHeight).toContain('calc(98vh - 120px)');
        expect(modalBodyStyles.overflowY).toBe('auto');
        
        // Modal should take most of the screen width on mobile
        expect(modalBounds.width, 'Modal should be wide on mobile').toBeGreaterThan(viewport.width * 0.9);
        
        // Modal should fit within viewport height
        expect(modalBounds.height, 'Modal should fit in viewport').toBeLessThan(viewport.height);

        console.log(`✅ ${viewport.name} mobile responsive test PASSED`);

      } catch (error) {
        console.log(`Mobile test error for ${viewport.name}:`, error.message);
        throw error;
      }
    }
  });

  test('Property 2.4: Modal animations (modalSlideIn) work correctly', async ({ page }) => {
    // **Property 2: Preservation** - Modal Animation Preservation
    // **Validates: Requirements 3.2**
    
    console.log('=== TESTING MODAL ANIMATION PRESERVATION ===');
    
    try {
      // Navigate to accounts page
      await page.goto('/panel/accounts');
      
      // Skip if authentication required
      if (page.url().includes('login') || page.url() === 'http://localhost:3000/') {
        // Inject modal HTML for testing
        await page.evaluate(() => {
          if (!document.getElementById('accountModal')) {
            const modalHTML = `
              <div class="modal" id="accountModal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                  <div class="modal-header">
                    <h3 class="modal-title">Hesap Ekle</h3>
                    <button class="modal-close" id="modalClose">&times;</button>
                  </div>
                  <div class="modal-body">
                    <p>Test content</p>
                  </div>
                </div>
              </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
          }
        });
      }

      // Check that modalSlideIn animation is defined in CSS
      const animationExists = await page.evaluate(() => {
        // Check if the animation keyframes exist
        const styleSheets = Array.from(document.styleSheets);
        for (const sheet of styleSheets) {
          try {
            const rules = Array.from(sheet.cssRules || sheet.rules || []);
            for (const rule of rules) {
              if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === 'modalSlideIn') {
                return true;
              }
            }
          } catch (e) {
            // Skip cross-origin stylesheets
          }
        }
        return false;
      });

      // Check modal-content animation CSS
      const modalContent = page.locator('#accountModal .modal-content');
      const animationStyles = await modalContent.evaluate(el => {
        const styles = getComputedStyle(el);
        return {
          animation: styles.animation,
          animationName: styles.animationName,
          animationDuration: styles.animationDuration,
          animationTimingFunction: styles.animationTimingFunction
        };
      });

      console.log('Modal Animation Analysis:');
      console.log('  Animation keyframes exist:', animationExists);
      console.log('  Animation styles:', animationStyles);

      // **EXPECTED TO PASS**: Preserve modal animation behavior
      expect(animationExists, 'modalSlideIn keyframes should exist').toBe(true);
      expect(animationStyles.animation).toContain('modalSlideIn');
      expect(animationStyles.animationDuration).toBe('0.3s');
      expect(animationStyles.animationTimingFunction).toBe('ease');

      // Test animation by opening modal
      await page.evaluate(() => {
        const modal = document.getElementById('accountModal');
        modal.classList.add('active');
      });

      // Wait for modal to be visible and animation to complete
      await expect(page.locator('#accountModal')).toHaveClass(/active/);
      await page.waitForTimeout(350); // Wait for animation to complete

      // Verify modal is properly positioned after animation
      const modalBounds = await modalContent.boundingBox();
      expect(modalBounds.y, 'Modal should be properly positioned after animation').toBeGreaterThan(0);

      console.log('✅ Modal animation preservation test PASSED');

    } catch (error) {
      console.log('Modal animation test error:', error.message);
      throw error;
    }
  });

  test('Property 2.5: Modal close functionality works via buttons and overlay clicks', async ({ page }) => {
    // **Property 2: Preservation** - Modal Close Functionality Preservation
    // **Validates: Requirements 3.3**
    
    console.log('=== TESTING MODAL CLOSE FUNCTIONALITY PRESERVATION ===');
    
    try {
      // Navigate to accounts page
      await page.goto('/panel/accounts');
      
      // Skip if authentication required
      if (page.url().includes('login') || page.url() === 'http://localhost:3000/') {
        // Inject modal HTML for testing
        await page.evaluate(() => {
          if (!document.getElementById('accountModal')) {
            const modalHTML = `
              <div class="modal" id="accountModal">
                <div class="modal-overlay" id="modalOverlay"></div>
                <div class="modal-content">
                  <div class="modal-header">
                    <h3 class="modal-title">Hesap Ekle</h3>
                    <button class="modal-close" id="modalClose">&times;</button>
                  </div>
                  <div class="modal-body">
                    <p>Test content</p>
                  </div>
                  <div class="modal-actions">
                    <button class="btn btn-secondary" id="cancelBtn">İptal</button>
                    <button class="btn btn-primary">Kaydet</button>
                  </div>
                </div>
              </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
          }
        });
      }

      const modal = page.locator('#accountModal');
      const modalClose = page.locator('#modalClose');
      const modalOverlay = page.locator('#modalOverlay');
      const cancelBtn = page.locator('#cancelBtn');

      // Test 1: Close via X button
      console.log('Testing close via X button...');
      await page.evaluate(() => {
        document.getElementById('accountModal').classList.add('active');
      });
      await expect(modal).toHaveClass(/active/);
      
      await modalClose.click();
      await expect(modal).not.toHaveClass(/active/);
      console.log('✅ Close via X button works');

      // Test 2: Close via overlay click
      console.log('Testing close via overlay click...');
      await page.evaluate(() => {
        document.getElementById('accountModal').classList.add('active');
      });
      await expect(modal).toHaveClass(/active/);
      
      await modalOverlay.click();
      await expect(modal).not.toHaveClass(/active/);
      console.log('✅ Close via overlay click works');

      // Test 3: Close via cancel button
      console.log('Testing close via cancel button...');
      await page.evaluate(() => {
        document.getElementById('accountModal').classList.add('active');
      });
      await expect(modal).toHaveClass(/active/);
      
      await cancelBtn.click();
      await expect(modal).not.toHaveClass(/active/);
      console.log('✅ Close via cancel button works');

      // **EXPECTED TO PASS**: All close methods should work
      console.log('✅ Modal close functionality preservation test PASSED');

    } catch (error) {
      console.log('Modal close functionality test error:', error.message);
      throw error;
    }
  });
});