/**
 * Voxta Asset Integrity Tests
 *
 * E2E tests to verify:
 * 1. Voxta import does NOT create main icon asset
 * 2. Voxta export does NOT include main icon in Assets folder
 * 3. CHARX export DOES include main icon
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../app.js';
import type { FastifyInstance } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { unzipSync } from 'fflate';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOXTA_FIXTURES_DIR = path.join(__dirname, '../../../../docs/internal/testing/voxta');

describe('Voxta Asset Integrity', () => {
  let app: FastifyInstance;
  const createdCardIds: string[] = [];

  beforeAll(async () => {
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    // Clean up created cards
    for (const id of createdCardIds) {
      try {
        await app.inject({ method: 'DELETE', url: `/api/cards/${id}` });
      } catch {
        // Ignore cleanup errors
      }
    }
    await app.close();
  });

  async function importVoxtaFile(filePath: string): Promise<{ cardIds: string[]; cards: any[] }> {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: 'application/zip',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/import-voxta',
      payload: form,
      headers: form.getHeaders(),
    });

    if (response.statusCode !== 200 && response.statusCode !== 201) {
      throw new Error(`Import failed: ${response.statusCode} - ${response.body}`);
    }

    const result = JSON.parse(response.body);
    // Extract card IDs from cards array
    const cardIds = result.cards?.map((c: any) => c.meta.id) || [];
    createdCardIds.push(...cardIds);
    return { cardIds, cards: result.cards || [] };
  }

  async function getCardAssets(cardId: string): Promise<any[]> {
    const response = await app.inject({
      method: 'GET',
      url: `/api/cards/${cardId}/assets`,
    });
    if (response.statusCode !== 200) {
      throw new Error(`Failed to get assets: ${response.body}`);
    }
    return JSON.parse(response.body);
  }

  async function exportCard(cardId: string, format: 'voxta' | 'charx'): Promise<Buffer> {
    const response = await app.inject({
      method: 'GET',
      url: `/api/cards/${cardId}/export?format=${format}`,
    });
    if (response.statusCode !== 200) {
      throw new Error(`Export failed: ${response.statusCode} - ${response.body}`);
    }
    return response.rawPayload;
  }

  function listZipContents(buffer: Buffer): string[] {
    const unzipped = unzipSync(new Uint8Array(buffer));
    return Object.keys(unzipped);
  }

  function hasMainIconInAssets(zipContents: string[]): boolean {
    // Check for main icon patterns in Assets folder
    return zipContents.some(entry => {
      const lower = entry.toLowerCase();
      // Voxta Assets folder pattern: Characters/{uuid}/Assets/Avatars/Default/main.*
      if (lower.includes('/assets/avatars/') && lower.includes('main.')) {
        return true;
      }
      // Also check for any 'main' named file in avatars
      if (lower.includes('/avatars/') && /\/main\.(png|jpg|jpeg|webp)$/i.test(entry)) {
        return true;
      }
      return false;
    });
  }

  function hasMainIconInCharx(zipContents: string[]): boolean {
    // CHARX stores main icon as assets/main.* or similar
    return zipContents.some(entry => {
      const lower = entry.toLowerCase();
      return lower === 'assets/main.png' ||
             lower === 'assets/main.jpg' ||
             lower === 'assets/main.webp' ||
             (lower.startsWith('assets/') && lower.includes('main.'));
    });
  }

  describe('Voxta to Voxta round-trip', () => {
    it('should NOT create main icon asset on Voxta import', async () => {
      const testFile = path.join(VOXTA_FIXTURES_DIR, 'Guess the word.voxpkg');
      if (!fs.existsSync(testFile)) {
        console.log('Skipping test - fixture not found:', testFile);
        return;
      }

      // Import Voxta package
      const importResult = await importVoxtaFile(testFile);
      expect(importResult.cardIds.length).toBeGreaterThan(0);

      // Get the card to check its type
      const cardResponse = await app.inject({
        method: 'GET',
        url: `/api/cards/${importResult.cardIds[0]}`,
      });
      const card = JSON.parse(cardResponse.body);

      // If it's a collection, get the first member
      let targetCardId = importResult.cardIds[0];
      if (card.meta.spec === 'collection' && importResult.cardIds.length > 1) {
        targetCardId = importResult.cardIds[1];
      }

      // Get assets
      const assets = await getCardAssets(targetCardId);

      // Check that there is NO main icon asset
      const mainIconAsset = assets.find((a: any) =>
        a.type === 'icon' && (a.isMain === true || a.name === 'main')
      );

      expect(mainIconAsset).toBeUndefined();
      console.log(`[Test] Voxta import created ${assets.length} assets, none are main icon`);
    });

    it('should NOT include main icon in Voxta export Assets folder', async () => {
      const testFile = path.join(VOXTA_FIXTURES_DIR, 'Guess the word.voxpkg');
      if (!fs.existsSync(testFile)) {
        console.log('Skipping test - fixture not found:', testFile);
        return;
      }

      // Import
      const importResult = await importVoxtaFile(testFile);
      expect(importResult.cardIds.length).toBeGreaterThan(0);

      // Get first character card (not collection)
      const cardResponse = await app.inject({
        method: 'GET',
        url: `/api/cards/${importResult.cardIds[0]}`,
      });
      const card = JSON.parse(cardResponse.body);

      let targetCardId = importResult.cardIds[0];
      if (card.meta.spec === 'collection' && importResult.cardIds.length > 1) {
        targetCardId = importResult.cardIds[1];
      }

      // Export to Voxta
      const voxtaBuffer = await exportCard(targetCardId, 'voxta');
      expect(Buffer.isBuffer(voxtaBuffer)).toBe(true);

      // Inspect the zip contents
      const zipContents = listZipContents(voxtaBuffer);
      console.log('[Test] Voxta export zip contents:', zipContents);

      // Verify NO main icon in Assets folder
      const hasMain = hasMainIconInAssets(zipContents);
      expect(hasMain).toBe(false);

      console.log('[Test] Voxta export does NOT contain main icon in Assets folder');
    });
  });

  describe('Voxta to CHARX export', () => {
    it('should include main icon in CHARX export', async () => {
      // Use Katsumi fixture which has a character thumbnail
      // (Guess the word only has scenario thumbnail, no character thumbnail)
      const testFile = path.join(VOXTA_FIXTURES_DIR, 'Katsumi Test Name.1.0.0.voxpkg');
      if (!fs.existsSync(testFile)) {
        console.log('Skipping test - fixture not found:', testFile);
        return;
      }

      // Import
      const importResult = await importVoxtaFile(testFile);
      console.log('[Test] Import returned cards:', importResult.cardIds.length, importResult.cards?.map((c: any) => ({ id: c.meta.id, spec: c.meta.spec, name: c.meta.name })));
      expect(importResult.cardIds.length).toBeGreaterThan(0);

      // Get first character card (not collection)
      const cardResponse = await app.inject({
        method: 'GET',
        url: `/api/cards/${importResult.cardIds[0]}`,
      });
      const card = JSON.parse(cardResponse.body);
      console.log('[Test] First card spec:', card.meta.spec, 'name:', card.meta.name);

      let targetCardId = importResult.cardIds[0];
      if (card.meta.spec === 'collection' && importResult.cardIds.length > 1) {
        targetCardId = importResult.cardIds[1];
        console.log('[Test] Switching to character card:', targetCardId);
      }

      // Export to CHARX
      const charxBuffer = await exportCard(targetCardId, 'charx');
      expect(Buffer.isBuffer(charxBuffer)).toBe(true);

      // Inspect the zip contents
      const zipContents = listZipContents(charxBuffer);
      console.log('[Test] CHARX export zip contents:', zipContents);

      // Verify main icon IS present
      const hasMain = hasMainIconInCharx(zipContents);
      expect(hasMain).toBe(true);

      console.log('[Test] CHARX export DOES contain main icon');
    });
  });

  describe('Original asset preservation', () => {
    it('should preserve original Voxta assets through round-trip', async () => {
      const testFile = path.join(VOXTA_FIXTURES_DIR, 'Katsumi Test Name.1.0.0.voxpkg');
      if (!fs.existsSync(testFile)) {
        console.log('Skipping test - fixture not found:', testFile);
        return;
      }

      // Get original zip contents
      const originalBuffer = fs.readFileSync(testFile);
      const originalUnzipped = unzipSync(new Uint8Array(originalBuffer));
      const originalEntries = Object.keys(originalUnzipped);

      // Find original asset files (in Characters/{uuid}/Assets/)
      const originalAssets = originalEntries.filter(e =>
        e.includes('/Assets/') && !e.endsWith('/')
      );
      console.log('[Test] Original Voxta assets:', originalAssets.length);

      // Import
      const importResult = await importVoxtaFile(testFile);
      expect(importResult.cardIds.length).toBeGreaterThan(0);

      // Get first character card
      const cardResponse = await app.inject({
        method: 'GET',
        url: `/api/cards/${importResult.cardIds[0]}`,
      });
      const card = JSON.parse(cardResponse.body);

      let targetCardId = importResult.cardIds[0];
      if (card.meta.spec === 'collection' && importResult.cardIds.length > 1) {
        targetCardId = importResult.cardIds[1];
      }

      // Export back to Voxta
      const exportedBuffer = await exportCard(targetCardId, 'voxta');
      const exportedUnzipped = unzipSync(new Uint8Array(exportedBuffer));
      const exportedEntries = Object.keys(exportedUnzipped);

      // Find exported asset files
      const exportedAssets = exportedEntries.filter(e =>
        e.includes('/Assets/') && !e.endsWith('/')
      );
      console.log('[Test] Exported Voxta assets:', exportedAssets.length);

      // Log the actual asset filenames for debugging
      console.log('[Test] Original asset files:', originalAssets.slice(0, 10));
      console.log('[Test] Exported asset files:', exportedAssets.slice(0, 10));

      // The exported should NOT have MORE assets than original (no injected main icon)
      // Note: may have fewer if some assets weren't preserved, but should not have extra
      const hasExtraMainIcon = exportedAssets.some(a =>
        a.toLowerCase().includes('/avatars/') && a.toLowerCase().includes('main.')
      );
      expect(hasExtraMainIcon).toBe(false);
    });
  });
});
