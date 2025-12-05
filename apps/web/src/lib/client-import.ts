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
 * Convert Uint8Array to data URL
 */
function uint8ArrayToDataURL(buffer: Uint8Array, mimeType: string): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return `data:${mimeType};base64,${base64}`;
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
        imageDataUrl = uint8ArrayToDataURL(iconAsset.buffer, mimeType);
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
    // Convert PNG buffer to data URL for storage
    const imageDataUrl = uint8ArrayToDataURL(buffer, 'image/png');
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
