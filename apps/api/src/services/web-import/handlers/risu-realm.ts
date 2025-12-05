/**
 * Risu Realm Site Handler
 *
 * Imports character cards from realm.risuai.net
 *
 * ## How It Works (Client-Side Fetch)
 * The userscript running on Risu's domain fetches the card file directly:
 * 1. Try CHARX first (more data, includes assets)
 * 2. Fall back to PNG if CHARX unavailable
 *
 * The server receives the file as base64 - no server-side API calls needed.
 *
 * ## clientData Structure (from userscript)
 * {
 *   charxBase64?: "data:...",  // CHARX file as base64 (preferred)
 *   pngBase64?: "data:...",    // PNG file as base64 (fallback)
 *   format: 'charx' | 'png'    // Which format was fetched
 * }
 */

import type { SiteHandler, FetchedCard } from '../types.js';
import { extractFromPNG } from '../../../utils/file-handlers.js';

export const risuRealmHandler: SiteHandler = {
  id: 'risu',
  name: 'Risu Realm',
  patterns: [/^https?:\/\/(www\.)?realm\.risuai\.net\/character\/([^\/\?#]+)/],

  fetchCard: async (
    _url: string,
    match: RegExpMatchArray,
    _clientPngData?: string,
    clientData?: unknown
  ): Promise<FetchedCard> => {
    const uuid = match[2];
    const warnings: string[] = [];

    // Client must provide the file data (fetched via userscript on Risu's domain)
    const risuClientData = clientData as
      | {
          charxBase64?: string;
          pngBase64?: string;
          format?: 'charx' | 'png';
        }
      | undefined;

    if (!risuClientData?.charxBase64 && !risuClientData?.pngBase64) {
      throw new Error('RISU_NEEDS_CLIENT_DATA');
    }

    // Handle CHARX format (preferred)
    if (risuClientData.charxBase64) {
      const base64Part = risuClientData.charxBase64.includes(',')
        ? risuClientData.charxBase64.split(',')[1]
        : risuClientData.charxBase64;
      const charxBuffer = Buffer.from(base64Part, 'base64');
      console.log(`[Risu] CHARX: ${charxBuffer.length} bytes from client`);

      return {
        charxBuffer,
        assets: [], // Assets are embedded in CHARX
        warnings,
        meta: { uuid, source: 'risu-realm', format: 'charx' },
      };
    }

    // Handle PNG format (fallback)
    if (risuClientData.pngBase64) {
      const base64Part = risuClientData.pngBase64.includes(',')
        ? risuClientData.pngBase64.split(',')[1]
        : risuClientData.pngBase64;
      const pngBuffer = Buffer.from(base64Part, 'base64');
      console.log(`[Risu] PNG: ${pngBuffer.length} bytes from client`);

      // Extract card from PNG (may have embedded base64 assets)
      const extracted = await extractFromPNG(pngBuffer);
      if (!extracted) {
        throw new Error('No card data found in PNG');
      }

      return {
        cardData: extracted.data,
        spec: extracted.spec,
        pngBuffer,
        assets: [],
        warnings,
        meta: { uuid, source: 'risu-realm', format: 'png' },
      };
    }

    throw new Error('No valid file data provided by client');
  },
};
