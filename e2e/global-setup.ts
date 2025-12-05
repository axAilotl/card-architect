/**
 * Global Setup for Playwright Tests
 *
 * Runs once before all tests to set up the test environment.
 */

import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🎭 Playwright Global Setup');
  console.log('  Test directory:', config.rootDir);

  // Verify the app is accessible
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:5173';
    console.log('  Checking app at:', baseURL);

    await page.goto(baseURL, { timeout: 30000 });
    console.log('  ✓ App is accessible');

    // Clear any existing data for clean tests
    await page.evaluate(() => {
      // Clear IndexedDB
      indexedDB.deleteDatabase('card-architect');
      // Clear localStorage
      localStorage.clear();
      // Clear sessionStorage
      sessionStorage.clear();
    });
    console.log('  ✓ Cleared browser storage');
  } catch (error) {
    console.error('  ✗ Failed to access app:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('  ✓ Global setup complete\n');
}

export default globalSetup;
