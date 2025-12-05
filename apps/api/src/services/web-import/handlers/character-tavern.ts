/**
 * Character Tavern Site Handler
 *
 * Imports character cards from character-tavern.com
 *
 * ## How It Works (Client-Side Fetch)
 * The userscript running on Character Tavern's domain fetches the PNG directly.
 * The PNG contains embedded card data in tEXt chunks.
 *
 * The server receives the PNG as base64 - no server-side API calls needed.
 *
 * ## clientData Structure (from userscript)
 * {
 *   pngBase64: "data:..."  // PNG file as base64
 * }
 *
 * ## Format
 * Character Tavern exports CCv3 format with both 'chara' and 'ccv3' tEXt chunks.
 *
 * ## Known Quirks
 * - Timestamps are in milliseconds (fixed in normalizeCardData)
 */

import type { SiteHandler, FetchedCard } from '../types.js';
import { extractFromPNG } from '../../../utils/file-handlers.js';

export const characterTavernHandler: SiteHandler = {
  id: 'character-tavern',
  name: 'Character Tavern',
  patterns: [
    /^https?:\/\/(www\.)?character-tavern\.com\/character\/([^\/]+)\/([^\/\?#]+)/,
  ],

  fetchCard: async (
    _url: string,
    match: RegExpMatchArray,
    _clientPngData?: string,
    clientData?: unknown
  ): Promise<FetchedCard> => {
    const creator = match[2];
    const slug = match[3];
    const warnings: string[] = [];

    // Client must provide the PNG data (fetched via userscript on CT's domain)
    const ctClientData = clientData as
      | {
          pngBase64?: string;
        }
      | undefined;

    if (!ctClientData?.pngBase64) {
      throw new Error('CHARACTER_TAVERN_NEEDS_CLIENT_DATA');
    }

    // Decode base64 PNG
    const base64Part = ctClientData.pngBase64.includes(',')
      ? ctClientData.pngBase64.split(',')[1]
      : ctClientData.pngBase64;
    const pngBuffer = Buffer.from(base64Part, 'base64');
    console.log(`[CharacterTavern] PNG: ${pngBuffer.length} bytes from client`);

    // Extract card from PNG tEXt chunk
    const extracted = await extractFromPNG(pngBuffer);
    if (!extracted) {
      throw new Error('No card data found in PNG');
    }

    return {
      cardData: extracted.data,
      spec: extracted.spec,
      pngBuffer,
      assets: [], // Character Tavern doesn't provide separate assets
      warnings,
      meta: { creator, slug, source: 'character-tavern' },
    };
  },
};
