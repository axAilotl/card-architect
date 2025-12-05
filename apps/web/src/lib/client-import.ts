/**
 * Client-side card import
 *
 * Used in light/static deployment modes where there's no server.
 * Parses PNG and CHARX files directly in the browser.
 */

import { extractFromPNG, isPNG } from '@card-architect/png';
import { extractCharx } from '@card-architect/charx';
import type { Card, CCv2Data, CCv3Data } from '@card-architect/schemas';

export interface ClientImportResult {
  card: Card;
  imageDataUrl?: string; // PNG image as data URL for storage
  warnings?: string[];
}

/**
 * Read a File as ArrayBuffer
 */
async function readFileAsArrayBuffer(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert Uint8Array to data URL (chunk-safe for large buffers)
 */
function uint8ArrayToDataURL(buffer: Uint8Array, mimeType: string): string {
  // Process in chunks to avoid stack overflow
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.subarray(i, Math.min(i + chunkSize, buffer.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Create a thumbnail from image data URL
 * Resizes to max 400px and converts to WebP for smaller storage
 */
async function createThumbnail(imageDataUrl: string, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP (with fallback to JPEG for older browsers)
      let dataUrl = canvas.toDataURL('image/webp', 0.8);
      if (dataUrl.startsWith('data:image/webp')) {
        resolve(dataUrl);
      } else {
        // Fallback to JPEG if WebP not supported
        dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
    img.src = imageDataUrl;
  });
}

/**
 * Create a Card from parsed data
 */
function createCard(
  data: CCv2Data | CCv3Data,
  spec: 'v2' | 'v3'
): Card {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Extract name from data
  let name = 'Unknown Character';
  if (spec === 'v3') {
    const v3Data = data as CCv3Data;
    name = v3Data.data?.name || 'Unknown Character';
  } else {
    const v2Data = data as CCv2Data;
    // V2 can be wrapped or unwrapped
    if ('data' in v2Data && v2Data.data) {
      name = (v2Data.data as any).name || 'Unknown Character';
    } else {
      name = (v2Data as any).name || 'Unknown Character';
    }
  }

  return {
    meta: {
      id,
      name,
      spec,
      tags: [],
      createdAt: now,
      updatedAt: now,
    },
    data,
  };
}

/**
 * Import a card file (PNG, CHARX, or JSON) client-side
 */
export async function importCardClientSide(file: File): Promise<ClientImportResult> {
  const warnings: string[] = [];
  const buffer = await readFileAsArrayBuffer(file);
  const fileName = file.name.toLowerCase();

  // Detect file type and parse
  if (fileName.endsWith('.charx')) {
    // CHARX file
    try {
      const charxData = extractCharx(buffer);
      const card = createCard(charxData.card, 'v3');

      // Try to extract icon/thumbnail from assets
      let imageDataUrl: string | undefined;
      const iconAsset = charxData.assets.find(
        (a) => a.descriptor.type === 'icon' || a.path.includes('icon') || a.path.includes('avatar')
      );
      if (iconAsset?.buffer) {
        const ext = iconAsset.descriptor.ext || 'png';
        const mimeType = ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
        const fullImageUrl = uint8ArrayToDataURL(iconAsset.buffer, mimeType);
        // Create smaller WebP thumbnail
        try {
          imageDataUrl = await createThumbnail(fullImageUrl);
        } catch {
          imageDataUrl = fullImageUrl; // Fallback to full image if thumbnail fails
        }
      }

      // Note about other assets
      if (charxData.assets.length > 1) {
        warnings.push(`${charxData.assets.length - (iconAsset ? 1 : 0)} additional assets not imported (client-side mode)`);
      }

      return { card, imageDataUrl, warnings: warnings.length > 0 ? warnings : undefined };
    } catch (err) {
      throw new Error(`Failed to parse CHARX: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (isPNG(buffer)) {
    // PNG file with embedded character data
    const result = extractFromPNG(buffer);
    if (!result) {
      throw new Error('PNG does not contain character card data');
    }

    const card = createCard(result.data, result.spec);
    // Convert PNG buffer to data URL, then create smaller WebP thumbnail
    const fullImageUrl = uint8ArrayToDataURL(buffer, 'image/png');
    let imageDataUrl: string;
    try {
      imageDataUrl = await createThumbnail(fullImageUrl);
    } catch {
      imageDataUrl = fullImageUrl; // Fallback to full image if thumbnail fails
    }
    return { card, imageDataUrl, warnings: warnings.length > 0 ? warnings : undefined };
  }

  if (fileName.endsWith('.json')) {
    // JSON file
    try {
      const text = new TextDecoder().decode(buffer);
      const json = JSON.parse(text);

      // Detect spec version
      if (json.spec === 'chara_card_v3') {
        const card = createCard(json as CCv3Data, 'v3');
        return { card };
      } else if (json.spec === 'chara_card_v2' || json.name) {
        // V2 or legacy format
        const card = createCard(json as CCv2Data, 'v2');
        return { card };
      } else {
        throw new Error('JSON does not appear to be a character card');
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error('Invalid JSON file');
      }
      throw err;
    }
  }

  throw new Error(`Unsupported file type: ${file.name}`);
}

/**
 * Import multiple card files
 */
export async function importCardsClientSide(files: File[]): Promise<{
  cards: Card[];
  errors: Array<{ file: string; error: string }>;
}> {
  const cards: Card[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (const file of files) {
    try {
      const result = await importCardClientSide(file);
      cards.push(result.card);
    } catch (err) {
      errors.push({
        file: file.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { cards, errors };
}
