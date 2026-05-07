/**
 * Test Setup Utilities
 * Provides helper functions for test authentication and setup
 */

const { expect } = require('@playwright/test');

/**
 * Creates a test user and logs in for testing purposes
 * @param {import('@playwright/test').Page} page 
 */
async function loginTestUser(page) {
  try {
    // Go to the main page
    await page.goto('/');
    
    // Check if we're already logged in by trying to go to dashboard
    await page.goto('/panel/accounts');
    
    // If we're redirected to login, handle authentication
    if (page.url().includes('login') || page.url() === 'http://localhost:3000/') {
      // For now, we'll skip tests that require authentication
      // In a real scenario, you'd set up test users in the database
      throw new Error('Authentication required - test user setup needed');
    }
    
    return true;
  } catch (error) {
    console.log('Login failed:', error.message);
    return false;
  }
}

/**
 * Opens the "Hesap Ekle" modal and waits for it to be ready
 * @param {import('@playwright/test').Page} page 
 */
async function openAccountModal(page) {
  // Ensure we're on the accounts page
  await page.goto('/panel/accounts');
  
  // Click the add account button
  const addAccountBtn = page.locator('#addAccountBtn');
  await expect(addAccountBtn).toBeVisible();
  await addAccountBtn.click();
  
  // Wait for modal to be active
  const modal = page.locator('#accountModal');
  await expect(modal).toHaveClass(/active/);
  
  // Verify all 4 form fields are present
  await expect(page.locator('#username')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.locator('#sharedSecret')).toBeVisible();
  await expect(page.locator('#identitySecret')).toBeVisible();
  
  return modal;
}

/**
 * Measures modal dimensions and scroll behavior
 * @param {import('@playwright/test').Page} page 
 */
async function measureModalScrollBehavior(page) {
  const modalBody = page.locator('.modal-body');
  
  // Get scroll measurements
  const scrollHeight = await modalBody.evaluate(el => el.scrollHeight);
  const clientHeight = await modalBody.evaluate(el => el.clientHeight);
  const offsetHeight = await modalBody.evaluate(el => el.offsetHeight);
  const overflowY = await modalBody.evaluate(el => getComputedStyle(el).overflowY);
  
  // Get viewport size
  const viewportSize = page.viewportSize();
  
  // Calculate theoretical available space based on CSS
  const theoreticalSpace = viewportSize.height * 0.95 - 140; // calc(95vh - 140px)
  
  // Measure actual content height
  const formGroups = page.locator('.form-group');
  const formGroupCount = await formGroups.count();
  let totalContentHeight = 0;
  
  for (let i = 0; i < formGroupCount; i++) {
    const height = await formGroups.nth(i).evaluate(el => el.offsetHeight);
    totalContentHeight += height;
  }
  
  // Add modal body padding (approximately 40px total vertical)
  const paddingEstimate = 40;
  const totalNeededHeight = totalContentHeight + paddingEstimate;
  
  return {
    viewport: viewportSize,
    scroll: {
      scrollHeight,
      clientHeight,
      offsetHeight,
      overflowY,
      hasScroll: scrollHeight > clientHeight
    },
    space: {
      theoretical: theoreticalSpace,
      needed: totalNeededHeight,
      shouldFit: totalNeededHeight <= theoreticalSpace
    },
    content: {
      formGroups: formGroupCount,
      totalHeight: totalContentHeight,
      withPadding: totalNeededHeight
    }
  };
}

module.exports = {
  loginTestUser,
  openAccountModal,
  measureModalScrollBehavior
};