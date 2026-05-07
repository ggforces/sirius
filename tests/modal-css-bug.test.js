/**
 * Modal CSS Bug Condition Test (No Authentication Required)
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * This test directly examines the CSS rules that cause the modal scroll bug
 * by creating a test modal with the same structure and CSS as the real modal.
 * 
 * **EXPECTED OUTCOME**: Test FAILS (this proves the bug exists)
 */

const { test, expect } = require('@playwright/test');

test.describe('Modal CSS Bug Condition (Direct CSS Testing)', () => {
  
  test('Bug Condition: CSS calc(95vh - 140px) creates unnecessary scroll for modal content', async ({ page }) => {
    // **Property 1: Bug Condition** - CSS Height Calculation Bug
    // **Validates: Requirements 1.1, 1.2, 1.3**
    
    console.log('=== STARTING CSS BUG CONDITION TEST ===');
    
    // Create a test page with the modal HTML and CSS
    const testHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        /* Copy the exact CSS from dashboard.css that causes the bug */
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .modal-content {
          position: relative;
          background: rgba(23, 26, 34, 0.98);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 12px;
          width: 95%;
          max-width: 450px;
          margin: 2vh auto;
          max-height: 95vh;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .modal-body {
          padding: 1.25rem 1.5rem;
          max-height: calc(95vh - 140px);
          overflow-y: auto;
        }
        
        .modal-actions {
          display: flex;
          gap: 1rem;
          padding: 1rem 1.5rem 1.25rem 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #ccd6f6;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.375rem;
        }
        
        .form-group input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #ffffff;
          font-size: 1rem;
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          background: #0a0e1a;
          color: white;
          font-family: Arial, sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="modal" id="testModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Hesap Ekle</h3>
          </div>
          <div class="modal-body" id="modalBody">
            <form>
              <div class="form-group">
                <label for="username">Kullanıcı Adı</label>
                <input type="text" id="username" required>
              </div>
              
              <div class="form-group">
                <label for="password">Şifre</label>
                <input type="password" id="password" required>
              </div>
              
              <div class="form-group">
                <label for="sharedSecret">Shared Secret</label>
                <input type="password" id="sharedSecret" required>
              </div>
              
              <div class="form-group">
                <label for="identitySecret">Identity Secret</label>
                <input type="password" id="identitySecret" required>
              </div>
            </form>
          </div>
          <div class="modal-actions">
            <button type="button">İptal</button>
            <button type="submit">Kaydet</button>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Set the test HTML content
    await page.setContent(testHTML);
    
    // Test different viewport sizes to reproduce the bug
    const viewportSizes = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop Standard' },
      { width: 1024, height: 768, name: 'Tablet Landscape' }
    ];
    
    let bugDetected = false;
    const bugResults = [];
    
    for (const viewport of viewportSizes) {
      console.log(`\\n=== Testing ${viewport.name} (${viewport.width}x${viewport.height}) ===`);
      
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Wait for layout to settle
      await page.waitForTimeout(100);
      
      // Measure the modal body
      const modalBody = page.locator('#modalBody');
      
      const measurements = await modalBody.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          offsetHeight: el.offsetHeight,
          maxHeight: style.maxHeight,
          overflowY: style.overflowY,
          paddingTop: parseFloat(style.paddingTop),
          paddingBottom: parseFloat(style.paddingBottom)
        };
      });
      
      // Calculate the theoretical available space from CSS
      const theoreticalSpace = viewport.height * 0.95 - 140; // calc(95vh - 140px)
      
      // Measure actual content height
      const formGroups = page.locator('.form-group');
      const formGroupCount = await formGroups.count();
      let totalContentHeight = 0;
      
      for (let i = 0; i < formGroupCount; i++) {
        const height = await formGroups.nth(i).evaluate(el => el.offsetHeight);
        totalContentHeight += height;
      }
      
      const totalNeededHeight = totalContentHeight + measurements.paddingTop + measurements.paddingBottom;
      
      // Check for bug condition
      const contentShouldFit = totalNeededHeight <= theoreticalSpace;
      const hasScroll = measurements.scrollHeight > measurements.clientHeight;
      const bugPresent = contentShouldFit && hasScroll;
      
      const result = {
        viewport: viewport.name,
        dimensions: `${viewport.width}x${viewport.height}`,
        theoreticalSpace: Math.round(theoreticalSpace),
        contentNeeded: Math.round(totalNeededHeight),
        shouldFit: contentShouldFit,
        hasScroll: hasScroll,
        bugPresent: bugPresent,
        scrollHeight: measurements.scrollHeight,
        clientHeight: measurements.clientHeight,
        maxHeight: measurements.maxHeight,
        overflowY: measurements.overflowY
      };
      
      bugResults.push(result);
      
      console.log(`${viewport.name} Results:`);
      console.log(`  Theoretical space: ${result.theoreticalSpace}px`);
      console.log(`  Content needed: ${result.contentNeeded}px`);
      console.log(`  Should fit: ${result.shouldFit}`);
      console.log(`  Has scroll: ${result.hasScroll}`);
      console.log(`  Bug present: ${result.bugPresent}`);
      console.log(`  Max height CSS: ${result.maxHeight}`);
      console.log(`  Overflow-Y: ${result.overflowY}`);
      
      if (bugPresent) {
        bugDetected = true;
        console.log(`🐛 BUG DETECTED on ${viewport.name}!`);
      }
    }
    
    // **CRITICAL ASSERTION - This should FAIL on unfixed code**
    console.log('\\n=== FINAL BUG CONDITION ANALYSIS ===');
    console.log('Bug detection results:', bugResults);
    
    // The test should fail if ANY viewport shows the bug
    expect(bugDetected, 
      `Modal scroll bug detected! Results: ${JSON.stringify(bugResults, null, 2)}`
    ).toBe(false);
    
    // Additional specific assertions for each viewport
    for (const result of bugResults) {
      if (result.shouldFit) {
        expect(result.hasScroll, 
          `${result.viewport}: Content (${result.contentNeeded}px) fits in space (${result.theoreticalSpace}px) but scroll is present. ` +
          `ScrollHeight: ${result.scrollHeight}px, ClientHeight: ${result.clientHeight}px`
        ).toBe(false);
      }
    }
  });
  
  test('Bug Condition: CSS overflow-y auto creates premature scrolling', async ({ page }) => {
    // Test that overflow-y: auto is the culprit by comparing with overflow-y: visible
    
    const testHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .test-container {
          width: 400px;
          height: 300px;
          border: 1px solid red;
          margin: 20px;
          padding: 20px;
        }
        
        .buggy-overflow {
          max-height: calc(95vh - 140px);
          overflow-y: auto;
          background: rgba(255, 0, 0, 0.1);
        }
        
        .fixed-overflow {
          max-height: calc(95vh - 140px);
          overflow-y: visible;
          background: rgba(0, 255, 0, 0.1);
        }
        
        .content {
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 16px;
          height: 60px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid white;
        }
      </style>
    </head>
    <body>
      <div class="test-container buggy-overflow" id="buggyContainer">
        <div class="content">
          <div class="form-group">Form Group 1</div>
          <div class="form-group">Form Group 2</div>
          <div class="form-group">Form Group 3</div>
          <div class="form-group">Form Group 4</div>
        </div>
      </div>
      
      <div class="test-container fixed-overflow" id="fixedContainer">
        <div class="content">
          <div class="form-group">Form Group 1</div>
          <div class="form-group">Form Group 2</div>
          <div class="form-group">Form Group 3</div>
          <div class="form-group">Form Group 4</div>
        </div>
      </div>
    </body>
    </html>
    `;
    
    await page.setContent(testHTML);
    await page.setViewportSize({ width: 1366, height: 768 });
    
    // Measure both containers
    const buggyMeasurements = await page.locator('#buggyContainer').evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      hasScroll: el.scrollHeight > el.clientHeight,
      overflowY: getComputedStyle(el).overflowY
    }));
    
    const fixedMeasurements = await page.locator('#fixedContainer').evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      hasScroll: el.scrollHeight > el.clientHeight,
      overflowY: getComputedStyle(el).overflowY
    }));
    
    console.log('Buggy container (overflow-y: auto):', buggyMeasurements);
    console.log('Fixed container (overflow-y: visible):', fixedMeasurements);
    
    // **EXPECTED TO FAIL**: The buggy container should show scroll when fixed doesn't
    const bugCondition = buggyMeasurements.hasScroll && !fixedMeasurements.hasScroll;
    
    console.log(`Bug condition (auto has scroll, visible doesn't): ${bugCondition}`);
    
    expect(bugCondition, 
      `overflow-y: auto creates unnecessary scroll. ` +
      `Auto: ${buggyMeasurements.scrollHeight}/${buggyMeasurements.clientHeight} (scroll: ${buggyMeasurements.hasScroll}), ` +
      `Visible: ${fixedMeasurements.scrollHeight}/${fixedMeasurements.clientHeight} (scroll: ${fixedMeasurements.hasScroll})`
    ).toBe(false);
  });
});