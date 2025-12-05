/**
 * Chub.ai Site Handler
 *
 * Imports character cards from chub.ai, venus.chub.ai, and www.chub.ai
 *
 * ## How It Works (Client-Side Fetch)
 * The userscript running on the Chub page fetches all data client-side:
 * 1. Metadata from gateway.chub.ai/api/characters/{creator}/{slug}?full=true
 * 2. card.json from gateway.chub.ai/api/v4/projects/{id}/repository/files/card.json/raw
 * 3. Avatar as base64
 * 4. Expression sprites as base64
 * 5. Gallery images as base64
 * 6. Related lorebooks
 *
 * The server receives all data pre-fetched - no server-side API calls needed.
 *
 * ## clientData Structure (from userscript)
 * {
 *   cardData: {...},           // The card.json contents
 *   avatarBase64: "data:...",  // Full-res avatar as base64
 *   expressions: [{emotion, base64}],
 *   galleryImages: [{name, base64}],
 *   relatedLorebooks: [{id, name, entries}],
 *   meta: {creator, slug, projectId}
 * }
 */

import type { SiteHandler, FetchedCard, AssetToImport, RelatedLorebook } from '../types.js';

export const chubHandler: SiteHandler = {
  id: 'chub',
  name: 'Chub.ai',
  patterns: [
    /^https?:\/\/(www\.)?chub\.ai\/characters\/([^\/]+)\/([^\/\?#]+)/,
    /^https?:\/\/venus\.chub\.ai\/characters\/([^\/]+)\/([^\/\?#]+)/,
  ],

  fetchCard: async (
    _url: string,
    match: RegExpMatchArray,
    _clientPngData?: string,
    clientData?: unknown
  ): Promise<FetchedCard> => {
    // Handle both patterns - venus.chub.ai has different capture groups
    const creator = match[2] || match[1];
    const slug = match[3] || match[2];
    const warnings: string[] = [];
    const assets: AssetToImport[] = [];

    // Client must provide all data (fetched via userscript on Chub's domain)
    const chubClientData = clientData as
      | {
          cardData?: Record<string, unknown>;
          avatarBase64?: string;
          expressions?: Array<{ emotion: string; base64: string }>;
          galleryImages?: Array<{ name: string; base64: string }>;
          relatedLorebooks?: Array<{
            id: number | string;
            path?: string;
            name?: string;
            entries?: Array<Record<string, unknown>>;
            data?: Record<string, unknown>;
          }>;
          meta?: { creator: string; slug: string; projectId?: string };
        }
      | undefined;

    if (!chubClientData?.cardData) {
      throw new Error('CHUB_NEEDS_CLIENT_DATA');
    }

    const cardData = chubClientData.cardData as Record<string, unknown>;
    console.log(
      `[Chub] Received client-fetched data for ${creator}/${slug}`
    );

    // Handle avatar from client
    let pngBuffer: Buffer | undefined;
    if (chubClientData.avatarBase64) {
      const base64Part = chubClientData.avatarBase64.includes(',')
        ? chubClientData.avatarBase64.split(',')[1]
        : chubClientData.avatarBase64;
      pngBuffer = Buffer.from(base64Part, 'base64');
      console.log(`[Chub] Avatar: ${pngBuffer.length} bytes from client`);

      // Add as main icon asset
      assets.push({
        type: 'icon',
        name: 'main',
        url: '',
        base64Data: chubClientData.avatarBase64,
        isMain: true,
      });
    } else {
      warnings.push('No avatar provided by client');
    }

    // Handle expressions from client
    if (chubClientData.expressions && Array.isArray(chubClientData.expressions)) {
      for (const expr of chubClientData.expressions) {
        if (!expr.base64 || !expr.emotion) continue;

        assets.push({
          type: 'emotion',
          name: expr.emotion,
          url: '',
          base64Data: expr.base64,
        });
      }
      console.log(`[Chub] Expressions: ${chubClientData.expressions.length} received from client`);
    }

    // Handle gallery images from client
    if (chubClientData.galleryImages && Array.isArray(chubClientData.galleryImages)) {
      for (const img of chubClientData.galleryImages) {
        if (!img.base64) continue;

        assets.push({
          type: 'custom',
          name: img.name || `gallery_${assets.length}`,
          url: '',
          base64Data: img.base64,
          isChubGallery: true,
        });
      }
      console.log(`[Chub] Gallery: ${chubClientData.galleryImages.length} images received from client`);
    }

    // Handle related lorebooks from client
    const relatedLorebooks: RelatedLorebook[] = [];
    if (chubClientData.relatedLorebooks && Array.isArray(chubClientData.relatedLorebooks)) {
      for (const lb of chubClientData.relatedLorebooks) {
        relatedLorebooks.push({
          id: lb.id,
          path: lb.path,
          name: lb.name,
          entries: lb.entries,
          data: lb.data,
          fetched: true, // Client already fetched
        });
      }
      console.log(`[Chub] Related lorebooks: ${relatedLorebooks.length} received from client`);
    }

    return {
      cardData,
      spec: 'v2',
      pngBuffer,
      assets,
      relatedLorebooks: relatedLorebooks.length > 0 ? relatedLorebooks : undefined,
      warnings,
      meta: { creator, slug, source: 'chub.ai' },
    };
  },
};
