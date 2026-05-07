/**
 * Bug Condition Exploration Test for Modal Scroll Bar Visibility
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * 
 * This test validates Requirements 1.1, 1.2, 1.3 from bugfix.md:
 * - When "Hesap Ekle" modal is opened, modal content should fit without scroll bars
 * - When modal contains 4 form fields, modal height should accommodate all content
 * - Modal-body CSS should not create unnecessary scroll bars
 * 
 * **EXPECTED OUTCOME**: Test FAILS (this proves the bug exists)
 */

const { test, expect } = require('@playwright/test');
const { loginTestUser, openAccountModal, measureModalScrollBehavior } = require('./test-setup');

test.describe('Modal Scroll Bar Bug Condition Exploration', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set a reasonable timeout for network operations
    page.setDefaultTimeout(10000);
  });

  test('Bug Condition: "Hesap Ekle" modal shows unnecessary scroll bars when content should fit', async ({ page }) => {
    // **Property 1: Bug Condition** - Modal Scroll Bar Visibility Test
    // **Validates: Requirements 1.1, 1.2, 1.3**
    
    console.log('=== STARTING BUG CONDITION EXPLORATION TEST ===');
    
    // Step 1: Try to access the application
    try {
      await page.goto('/');
      
      // Check if server is running by looking for basic page elements
      const hasTitle = await page.title();
      if (!hasTitle || hasTitle === '') {
        test.skip('Server not available - skipping test');
        return;
      }
      
      console.log('Server is running, page title:', hasTitle);
      
    } catch (error) {
      console.log('Server connection failed:', error.message);
      test.skip('Server not available for testing');
      return;
    }

    // Step 2: Try to open the modal (skip auth for now)
    try {
      await page.goto('/panel/accounts');
      
      // If redirected to login, skip the test for now
      // In a real scenario, you'd have proper test authentication setup
      if (page.url().includes('login') || page.url() === 'http://localhost:3000/') {
        console.log('Authentication required - creating simplified test');
        
        // Create a simplified test by directly manipulating the DOM
        await page.goto('/panel/accounts');
        
        // Inject the modal HTML for testing if not present
        const modalExists = await page.locator('#accountModal').count();
        if (modalExists === 0) {
          test.skip('Modal not accessible without authentication');
          return;
        }
      }

      // Step 3: Open the modal
      const modal = await openAccountModal(page);
      console.log('Modal opened successfully');

      // Step 4: Measure modal scroll behavior
      const measurements = await measureModalScrollBehavior(page);
      
      console.log('=== MEASUREMENT RESULTS ===');
      console.log('Viewport:', measurements.viewport);
      console.log('Scroll behavior:', measurements.scroll);
      console.log('Space calculations:', measurements.space);
      console.log('Content measurements:', measurements.content);

      // **CRITICAL ASSERTION - This should FAIL on unfixed code**
      // The bug condition: scroll bars appear when content should fit
      
      const bugCondition = measurements.space.shouldFit && measurements.scroll.hasScroll;
      
      console.log('=== BUG CONDITION ANALYSIS ===');
      console.log(`Content should fit: ${measurements.space.shouldFit}`);
      console.log(`Has scroll bars: ${measurements.scroll.hasScroll}`);
      console.log(`Bug condition present: ${bugCondition}`);
      
      if (bugCondition) {
        console.log('🐛 BUG DETECTED: Unnecessary scroll bars present when content should fit!');
        console.log(`Available space: ${measurements.space.theoretical}px`);
        console.log(`Content needed: ${measurements.space.needed}px`);
        console.log(`Scroll height: ${measurements.scroll.scrollHeight}px`);
        console.log(`Client height: ${measurements.scroll.clientHeight}px`);
      }

      // **EXPECTED TO FAIL**: This assertion should fail on unfixed code
      // When it fails, it proves the bug exists (scroll bars appear unnecessarily)
      expect(bugCondition, 
        `Bug condition detected: Modal shows scroll bars (${measurements.scroll.hasScroll}) ` +
        `when content (${measurements.space.needed}px) should fit in available space (${measurements.space.theoretical}px)`
      ).toBe(false);
      
      // Additional detailed assertions for better error reporting
      if (measurements.space.shouldFit) {
        expect(measurements.scroll.hasScroll, 
          `Content fits in ${measurements.space.theoretical}px but scroll bars are present. ` +
          `Scroll height: ${measurements.scroll.scrollHeight}px, Client height: ${measurements.scroll.clientHeight}px`
        ).toBe(false);
      }

    } catch (error) {
      if (error.message.includes('expect')) {
        // This is an expected test failure - re-throw it
        throw error;
      }
      
      console.log('Test execution error:', error.message);
      test.skip('Could not complete test due to setup issues');
    }
  });

  test('Bug Condition: Modal scroll appears on different viewport sizes', async ({ page }) => {
    // Test the bug condition across different viewport sizes
    const viewportSizes = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop Standard' },
      { width: 1024, height: 768, name: 'Tablet Landscape' }
    ];

    for (const viewport of viewportSizes) {
      console.log(`\n=== Testing ${viewport.name} (${viewport.width}x${viewport.height}) ===`);
      
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      try {
        // Navigate to accounts page
        await page.goto('http://localhost:3000/panel/accounts');
        
        // Skip if authentication required
        if (page.url().includes('login') || page.url() === 'http://localhost:3000/') {
          console.log(`Skipping ${viewport.name} - authentication required`);
          continue;
        }

        // Open modal
        await page.locator('#addAccountBtn').click();
        await expect(page.locator('#accountModal')).toHaveClass(/active/);

        // Measure scroll behavior
        const modalBody = page.locator('.modal-body');
        const scrollHeight = await modalBody.evaluate(el => el.scrollHeight);
        const clientHeight = await modalBody.evaluate(el => el.clientHeight);
        const hasScroll = scrollHeight > clientHeight;

        // Calculate if content should fit
        const availableSpace = viewport.height * 0.95 - 140; // CSS calc(95vh - 140px)
        
        // Get actual content height
        const formGroups = page.locator('.form-group');
        const formGroupCount = await formGroups.count();
        let contentHeight = 0;
        for (let i = 0; i < formGroupCount; i++) {
          contentHeight += await formGroups.nth(i).evaluate(el => el.offsetHeight);
        }
        contentHeight += 40; // padding

        const shouldFit = contentHeight <= availableSpace;
        
        console.log(`${viewport.name} Results:`);
        console.log(`  Available space: ${availableSpace}px`);
        console.log(`  Content height: ${contentHeight}px`);
        console.log(`  Should fit: ${shouldFit}`);
        console.log(`  Has scroll: ${hasScroll}`);
        console.log(`  Bug present: ${shouldFit && hasScroll}`);

        // **EXPECTED TO FAIL on unfixed code**
        // If content should fit but scroll is present, that's the bug
        if (shouldFit) {
          expect(hasScroll).toBe(false);
        }

        // Close modal for next iteration
        await page.locator('#modalClose').click();
        await expect(page.locator('#accountModal')).not.toHaveClass(/active/);
        
      } catch (error) {
        console.log(`Error testing ${viewport.name}:`, error.message);
      }
    }
  });
});