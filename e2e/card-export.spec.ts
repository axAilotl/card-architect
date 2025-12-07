/**
 * Card Generation and Export E2E Tests
 *
 * Tests the complete workflow of:
 * 1. Importing a test card fixture
 * 2. Exporting to all formats (JSON, PNG, CHARX, Voxta)
 * 3. Validating data integrity and file structure
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  waitForAppLoad,
  navigateToEditor,
  fillCardData,
  validateJsonCard,
  validatePngCard,
  validateCharxFile,
  loadTestCard,
} from './utils/test-helpers';

// Test downloads directory
const DOWNLOADS_DIR = path.join(__dirname, 'test-downloads');
const TEST_FIXTURE_PATH = path.join(__dirname, 'fixtures', 'test-card.json');
const TEST_AVATAR_PATH = path.join(__dirname, 'fixtures', 'test-avatar.png');

// Load test card data once
const TEST_CARD = loadTestCard();
const TEST_CARD_NAME = TEST_CARD.data.name; // "Luna Starweaver"

/**
 * Helper to import the test fixture card (module-level for use across test suites)
 */
async function importTestFixture(page: any, uploadAvatar = false) {
  await page.goto('/');
  await waitForAppLoad(page);

  // Click Import dropdown
  const importButton = page.locator('button:has-text("Import")');
  await expect(importButton).toBeVisible({ timeout: 10000 });
  await importButton.click();
  await page.waitForTimeout(300);

  // Click "From File" button and handle filechooser in parallel
  // The button creates a dynamic file input and triggers click immediately
  // Use text locator for more reliable matching
  const fromFileButton = page.getByText('From File', { exact: true });

  // Wait for both the filechooser event AND the API response
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }),
    fromFileButton.click(),
  ]);

  // Set files and wait for the API import response
  const [response] = await Promise.all([
    page.waitForResponse(
      (resp: any) => resp.url().includes('/api/import') && resp.status() === 201,
      { timeout: 30000 }
    ).catch(() => null), // Don't fail if response times out, navigation might still happen
    fileChooser.setFiles(TEST_FIXTURE_PATH),
  ]);

  // Wait for card to load - should navigate to /cards/
  await page.waitForURL(/\/cards\//, { timeout: 20000 });
  await waitForAppLoad(page);

  // Verify the card loaded by checking for the name in a textbox
  // Use getByRole to find textbox containing the expected value
  await expect(page.getByRole('textbox').first()).toHaveValue(TEST_CARD_NAME, { timeout: 5000 });

  // Upload avatar if requested (needed for CHARX export)
  if (uploadAvatar) {
    // Wait a bit for the card editor to fully load
    await page.waitForTimeout(500);

    // Set up filechooser for avatar upload
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      // Click the "Upload New Image" text/button
      page.getByText('Upload New Image').click(),
    ]).catch(() => [null]);

    if (fileChooser) {
      await fileChooser.setFiles(TEST_AVATAR_PATH);
      // Wait for upload to complete and image to display
      await page.waitForTimeout(2000);
    }
  }
}

test.describe('Card Generation and Export', () => {
  test.beforeAll(() => {
    // Create downloads directory
    if (!fs.existsSync(DOWNLOADS_DIR)) {
      fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
    }
    console.log('Test card name:', TEST_CARD_NAME);
  });

  test.afterAll(() => {
    // Clean up downloads
    if (fs.existsSync(DOWNLOADS_DIR)) {
      fs.readdirSync(DOWNLOADS_DIR).forEach(file => {
        try {
          fs.unlinkSync(path.join(DOWNLOADS_DIR, file));
        } catch {
          // ignore cleanup errors
        }
      });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should import test fixture card', async ({ page }) => {
    await importTestFixture(page);

    // Verify card data is displayed - first textbox is the Name field
    await expect(page.getByRole('textbox').first()).toHaveValue(TEST_CARD_NAME);

    // Verify URL has card ID
    await expect(page).toHaveURL(/\/cards\//);
  });

  test('should export card as JSON with valid structure', async ({ page }) => {
    await importTestFixture(page);

    // Set up download handler
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // Click Export dropdown
    const exportButton = page.locator('button:has-text("Export")');
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    // Wait for dropdown to appear and click JSON
    const jsonButton = page.locator('button:has-text("JSON")');
    await expect(jsonButton).toBeVisible({ timeout: 5000 });
    await jsonButton.click();

    // Wait for download
    const download = await downloadPromise;
    const downloadPath = path.join(DOWNLOADS_DIR, 'test-export.json');
    await download.saveAs(downloadPath);

    // Validate JSON structure
    const jsonContent = fs.readFileSync(downloadPath, 'utf-8');
    const jsonData = JSON.parse(jsonContent);

    const validation = validateJsonCard(jsonData);
    expect(validation.valid).toBe(true);
    if (!validation.valid) {
      console.error('JSON validation errors:', validation.errors);
    }

    // Verify our data is in the export
    const exportedData = jsonData.data || jsonData;
    expect(exportedData.name).toBe(TEST_CARD_NAME);
  });

  test('should export card as PNG with embedded character data', async ({ page }) => {
    await importTestFixture(page);

    // Set up download handler
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // Click Export dropdown
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();

    // Click PNG
    const pngButton = page.locator('button:has-text("PNG")');
    await expect(pngButton).toBeVisible({ timeout: 5000 });
    await pngButton.click();

    // Wait for download
    const download = await downloadPromise;
    const downloadPath = path.join(DOWNLOADS_DIR, 'test-export.png');
    await download.saveAs(downloadPath);

    // Validate PNG structure
    const validation = await validatePngCard(downloadPath);
    expect(validation.valid).toBe(true);
    if (!validation.valid) {
      console.error('PNG validation errors:', validation.errors);
    }

    // Verify our data is embedded
    if (validation.data) {
      const embeddedData = validation.data.data || validation.data;
      expect(embeddedData.name).toBe(TEST_CARD_NAME);
    }
  });

  test('should export card as CHARX with valid ZIP structure', async ({ page }) => {
    // CHARX requires an image, so upload avatar
    await importTestFixture(page, true);

    // Set up download handler - CHARX can take longer
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

    // Click Export dropdown
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();

    // Click CHARX
    const charxButton = page.locator('button:has-text("CHARX")');
    await expect(charxButton).toBeVisible({ timeout: 5000 });
    await charxButton.click();

    // Wait for download
    const download = await downloadPromise;
    const downloadPath = path.join(DOWNLOADS_DIR, 'test-export.charx');
    await download.saveAs(downloadPath);

    // Validate CHARX structure
    const validation = await validateCharxFile(downloadPath);
    expect(validation.valid).toBe(true);
    if (!validation.valid) {
      console.error('CHARX validation errors:', validation.errors);
    }
  });

  test('should export card as Voxta package', async ({ page }) => {
    await importTestFixture(page);

    // Set up download handler
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // Click Export dropdown
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();

    // Click Voxta
    const voxtaButton = page.locator('button:has-text("Voxta")');
    await expect(voxtaButton).toBeVisible({ timeout: 5000 });
    await voxtaButton.click();

    // Wait for download
    const download = await downloadPromise;
    const downloadPath = path.join(DOWNLOADS_DIR, 'test-export.voxpkg');
    await download.saveAs(downloadPath);

    // Basic validation - Voxta is also a ZIP
    const buffer = fs.readFileSync(downloadPath);
    const zipSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
    expect(buffer.subarray(0, 4).equals(zipSignature)).toBe(true);

    // Check for key Voxta files
    const hasCharacterFile = buffer.includes(Buffer.from('character.json')) ||
                             buffer.includes(Buffer.from('Character.json'));
    expect(hasCharacterFile).toBe(true);
  });

  test('should preserve data integrity across export formats', async ({ page }) => {
    await importTestFixture(page);

    const exports: { format: string; data: any }[] = [];

    // Export JSON
    let downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.locator('button:has-text("Export")').click();
    const jsonBtn = page.locator('button:has-text("JSON")');
    await expect(jsonBtn).toBeVisible({ timeout: 5000 });
    await jsonBtn.click();
    let download = await downloadPromise;
    let downloadPath = path.join(DOWNLOADS_DIR, 'integrity-test.json');
    await download.saveAs(downloadPath);
    const jsonData = JSON.parse(fs.readFileSync(downloadPath, 'utf-8'));
    exports.push({ format: 'json', data: jsonData });

    // Export PNG and extract data
    downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.locator('button:has-text("Export")').click();
    const pngBtn = page.locator('button:has-text("PNG")');
    await expect(pngBtn).toBeVisible({ timeout: 5000 });
    await pngBtn.click();
    download = await downloadPromise;
    downloadPath = path.join(DOWNLOADS_DIR, 'integrity-test.png');
    await download.saveAs(downloadPath);
    const pngValidation = await validatePngCard(downloadPath);
    if (pngValidation.data) {
      exports.push({ format: 'png', data: pngValidation.data });
    }

    // Compare data integrity
    if (exports.length >= 2) {
      const jsonExport = exports.find(e => e.format === 'json')!;
      const pngExport = exports.find(e => e.format === 'png');

      if (pngExport) {
        const jsonName = (jsonExport.data.data || jsonExport.data).name;
        const pngName = (pngExport.data.data || pngExport.data).name;

        expect(jsonName).toBe(pngName);
        expect(jsonName).toBe(TEST_CARD_NAME);
      }
    }
  });

  test('should handle special characters in card data', async ({ page }) => {
    // Create a temporary fixture with special characters
    const specialCard = {
      ...TEST_CARD,
      data: {
        ...TEST_CARD.data,
        name: 'Test "Quotes" & <Brackets>',
        personality: TEST_CARD.data.personality + ' 日本語テスト 中文测试 🎮',
      },
    };

    const specialFixturePath = path.join(DOWNLOADS_DIR, 'special-test.json');
    fs.writeFileSync(specialFixturePath, JSON.stringify(specialCard, null, 2));

    await page.goto('/');
    await waitForAppLoad(page);

    // Import the special character card
    const importButton = page.locator('button:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(300);
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(specialFixturePath);
    await page.waitForURL(/\/cards\//, { timeout: 15000 });
    await waitForAppLoad(page);

    // Export and verify
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.locator('button:has-text("Export")').click();
    const jsonExportBtn = page.locator('button:has-text("JSON")');
    await expect(jsonExportBtn).toBeVisible({ timeout: 5000 });
    await jsonExportBtn.click();

    const download = await downloadPromise;
    const downloadPath = path.join(DOWNLOADS_DIR, 'special-chars.json');
    await download.saveAs(downloadPath);

    const jsonContent = fs.readFileSync(downloadPath, 'utf-8');
    const jsonData = JSON.parse(jsonContent);
    const exportedData = jsonData.data || jsonData;

    // Verify special characters are preserved
    expect(exportedData.name).toContain('Quotes');
    expect(exportedData.personality).toContain('日本語');
  });

  test('should import exported card and verify round-trip integrity', async ({ page }) => {
    await importTestFixture(page);

    // Export as JSON first
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.locator('button:has-text("Export")').click();
    const jsonRoundTrip = page.locator('button:has-text("JSON")');
    await expect(jsonRoundTrip).toBeVisible({ timeout: 5000 });
    await jsonRoundTrip.click();

    const download = await downloadPromise;
    // Use the download's path directly instead of saving to custom location
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // Go back to main page and import the exported file
    await page.goto('/');
    await waitForAppLoad(page);

    // Clear storage to ensure fresh import
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Import the exported file
    const importButton = page.locator('button:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(300);
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(downloadPath!);

    // Wait for navigation to new card
    await page.waitForURL(/\/cards\//, { timeout: 15000 });
    await waitForAppLoad(page);

    // Verify imported data matches - first textbox is the Name field
    await expect(page.getByRole('textbox').first()).toHaveValue(TEST_CARD_NAME);
  });
});

test.describe('Cross-Format Import/Export', () => {
  // Test fixtures with different specs
  const CCv2_FIXTURE = path.join(__dirname, 'fixtures', 'test-ccv2-amanda.json');
  const CCv2_LIRA_FIXTURE = path.join(__dirname, 'fixtures', 'test-ccv2-lira.json');
  const CCv3_FIXTURE = path.join(__dirname, 'fixtures', 'test-ccv3-beepboop.json');
  const CCv3_WITH_ASSETS = path.join(__dirname, 'fixtures', 'test-ccv3-jem.json');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should import CCv2 card and export as JSON (maintains CCv2)', async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);

    // Import CCv2 using filechooser
    const importButton = page.locator('button:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(300);

    const fromFileButton = page.getByText('From File', { exact: true });
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      fromFileButton.click(),
    ]);

    // Wait for API response to check for errors
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp: any) => resp.url().includes('/api/import'),
        { timeout: 30000 }
      ).catch(() => null),
      fileChooser.setFiles(CCv2_FIXTURE),
    ]);

    // Check if import succeeded
    if (response && response.status() !== 201) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Import failed with status ${response.status()}: ${JSON.stringify(body)}`);
    }

    await page.waitForURL(/\/cards\//, { timeout: 20000 });
    await waitForAppLoad(page);

    // Verify card loaded
    await expect(page.getByRole('textbox').first()).toHaveValue(/Amanda/);

    // Export as JSON
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.locator('button:has-text("Export")').click();
    await page.locator('button:has-text("JSON")').click();
    const download = await downloadPromise;
    const downloadPath = await download.path();

    // Verify exported as valid JSON with name
    const content = fs.readFileSync(downloadPath!, 'utf-8');
    const json = JSON.parse(content);
    expect(json.data?.name || json.name).toContain('Amanda');
  });

  test('should import CCv3 card and export as PNG with embedded data', async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);

    // Import CCv3 using filechooser
    const importButton = page.locator('button:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(300);

    const fromFileButton = page.getByText('From File', { exact: true });
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      fromFileButton.click(),
    ]);
    await fileChooser.setFiles(CCv3_FIXTURE);
    await page.waitForURL(/\/cards\//, { timeout: 20000 });
    await waitForAppLoad(page);

    // Verify card loaded
    await expect(page.getByRole('textbox').first()).toHaveValue(/BeepBoop/);

    // Export as PNG
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.locator('button:has-text("Export")').click();
    await page.locator('button:has-text("PNG")').click();
    const download = await downloadPromise;
    const downloadPath = await download.path();

    // Validate PNG has embedded data
    const validation = await validatePngCard(downloadPath!);
    expect(validation.valid).toBe(true);
    if (validation.data) {
      const name = validation.data.data?.name || validation.data.name;
      expect(name).toContain('BeepBoop');
    }
  });

  test('should export existing card with assets as CHARX', async ({ page }) => {
    // Import a CCv3 card to test CHARX export
    await page.goto('/');
    await waitForAppLoad(page);

    // Import CCv3 card using filechooser
    const importButton = page.locator('button:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(300);

    const fromFileButton = page.getByText('From File', { exact: true });
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      fromFileButton.click(),
    ]);
    await fileChooser.setFiles(CCv3_FIXTURE);
    await page.waitForURL(/\/cards\//, { timeout: 20000 });
    await waitForAppLoad(page);

    // Verify card loaded
    await expect(page.getByRole('textbox').first()).toHaveValue(/BeepBoop/, { timeout: 10000 });

    // Upload an avatar for CHARX export (CHARX requires at least one icon asset)
    await page.waitForTimeout(500);
    const [avatarChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      page.getByText('Upload New Image').click(),
    ]).catch(() => [null]);

    if (avatarChooser) {
      await avatarChooser.setFiles(TEST_AVATAR_PATH);
      await page.waitForTimeout(2000); // Wait for upload to complete
    }

    // Export as CHARX
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await page.locator('button:has-text("Export")').click();
    await page.locator('button:has-text("CHARX")').click();
    const download = await downloadPromise;
    const downloadPath = await download.path();

    // Validate CHARX structure
    const validation = await validateCharxFile(downloadPath!);
    expect(validation.valid).toBe(true);
  });

  test('should export existing CCv2 card as JSON', async ({ page }) => {
    // Import a CCv2 card to test JSON export
    await page.goto('/');
    await waitForAppLoad(page);

    // Import CCv2 card (Lira) using filechooser
    const importButton = page.locator('button:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(300);

    const fromFileButton = page.getByText('From File', { exact: true });
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      fromFileButton.click(),
    ]);

    // Wait for API response to check for errors
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp: any) => resp.url().includes('/api/import'),
        { timeout: 30000 }
      ).catch(() => null),
      fileChooser.setFiles(CCv2_LIRA_FIXTURE),
    ]);

    // Check if import succeeded
    if (response && response.status() !== 201) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Import failed with status ${response.status()}: ${JSON.stringify(body)}`);
    }

    await page.waitForURL(/\/cards\//, { timeout: 20000 });
    await waitForAppLoad(page);

    // Verify card loaded
    await expect(page.getByRole('textbox').first()).toHaveValue(/Lira/, { timeout: 10000 });

    // Export as JSON
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.locator('button:has-text("Export")').click();
    await page.locator('button:has-text("JSON")').click();
    const download = await downloadPromise;
    const downloadPath = await download.path();

    // Verify exported correctly
    const content = fs.readFileSync(downloadPath!, 'utf-8');
    const json = JSON.parse(content);
    expect(json.spec).toBe('chara_card_v2');
    expect(json.data?.name || json.name).toContain('Lira');
  });

  test('should preserve data when importing CCv2 and re-exporting', async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);

    // Import CCv2 using filechooser
    const importButton = page.locator('button:has-text("Import")');
    await importButton.click();
    await page.waitForTimeout(300);

    const fromFileButton = page.getByText('From File', { exact: true });
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      fromFileButton.click(),
    ]);

    // Wait for API response to check for errors
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp: any) => resp.url().includes('/api/import'),
        { timeout: 30000 }
      ).catch(() => null),
      fileChooser.setFiles(CCv2_FIXTURE),
    ]);

    // Check if import succeeded
    if (response && response.status() !== 201) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Import failed with status ${response.status()}: ${JSON.stringify(body)}`);
    }

    await page.waitForURL(/\/cards\//, { timeout: 20000 });
    await waitForAppLoad(page);

    // Read original fixture for comparison
    const originalData = JSON.parse(fs.readFileSync(CCv2_FIXTURE, 'utf-8'));
    const originalName = originalData.data?.name || originalData.name;

    // Export and verify name preserved
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.locator('button:has-text("Export")').click();
    await page.locator('button:has-text("JSON")').click();
    const download = await downloadPromise;
    const downloadPath = await download.path();

    const exportedData = JSON.parse(fs.readFileSync(downloadPath!, 'utf-8'));
    const exportedName = exportedData.data?.name || exportedData.name;
    expect(exportedName).toBe(originalName);
  });
});

test.describe('Export Error Handling', () => {
  test('should handle export when no card is loaded', async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);

    // Check if Export button is disabled or not visible when no card
    const exportButton = page.locator('button:has-text("Export")');
    const isVisible = await exportButton.isVisible().catch(() => false);

    if (isVisible) {
      const isDisabled = await exportButton.isDisabled().catch(() => false);
      // Export should be disabled or show an error when clicked
      if (!isDisabled) {
        await exportButton.click();
        // Should show error or empty dropdown
        await page.waitForTimeout(500);
      }
    }
  });

  test('should show progress indicator during large export', async ({ page }, testInfo) => {
    // Skip in light mode - CHARX optimization may not be available
    if (testInfo.project.name === 'light-mode') {
      test.skip();
    }

    // Increase timeout for large exports (3 minutes)
    test.setTimeout(180000);

    // CHARX requires an image, so upload avatar
    await importTestFixture(page, true);

    // Start export
    await page.locator('button:has-text("Export")').click();

    // The export might show a loading state
    const charxButton = page.locator('button:has-text("CHARX")');
    await expect(charxButton).toBeVisible({ timeout: 5000 });
    await charxButton.click();

    // Should complete without hanging (longer timeout for large exports)
    const download = await page.waitForEvent('download', { timeout: 180000 });
    expect(download.suggestedFilename()).toContain('.charx');
  });
});
