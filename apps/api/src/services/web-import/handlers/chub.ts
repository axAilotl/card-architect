/**
 * Chub.ai Site Handler
 *
 * Imports character cards from chub.ai, venus.chub.ai, and www.chub.ai
 *
 * ## API Flow
 * 1. Fetch metadata from gateway.chub.ai/api/characters/{creator}/{slug}?full=true
 * 2. Extract project ID from response
 * 3. Fetch actual card.json from gateway.chub.ai/api/v4/projects/{id}/repository/files/card.json/raw
 *
 * ## Why Two Requests
 * The PNG on Chub pages can be stale (cached). The v4 API always returns the latest data.
 *
 * ## Avatar URL
 * Use node.max_res_url from metadata (full resolution chara_card_v2.png)
 * Fallback to node.avatar_url (webp thumbnail)
 *
 * ## Features
 * - Card JSON import
 * - Full-res avatar import
 * - Expression/emotion sprites
 * - Voice samples (with caching for default voices)
 * - Gallery images (when hasGallery is true)
 */

import type { SiteHandler, FetchedCard, AssetToImport, RelatedLorebook } from '../types.js';
import { BROWSER_USER_AGENT, DEFAULT_CHUB_VOICE_UUIDS } from '../constants.js';

/**
 * Fetch a related lorebook from Chub by project ID
 */
async function fetchRelatedLorebook(lorebookId: number | string, path?: string): Promise<RelatedLorebook> {
  const result: RelatedLorebook = {
    id: lorebookId,
    path,
    fetched: false,
  };

  try {
    // Fetch the SillyTavern raw format which has the lorebook entries
    const lorebookUrl = `https://gateway.chub.ai/api/v4/projects/${lorebookId}/repository/files/raw%252Fsillytavern_raw.json/raw?ref=main&response_type=blob`;
    const response = await fetch(lorebookUrl, {
      headers: { 'User-Agent': BROWSER_USER_AGENT },
    });

    if (!response.ok) {
      result.error = `Failed to fetch lorebook: ${response.status}`;
      return result;
    }

    const data = await response.json() as Record<string, unknown>;
    result.data = data;
    result.fetched = true;

    // Extract name and entries
    if (data.name && typeof data.name === 'string') {
      result.name = data.name;
    }
    if (Array.isArray(data.entries)) {
      result.entries = data.entries;
    }

    console.log(`[Chub] Fetched related lorebook ${lorebookId}: ${result.name || 'unnamed'} (${result.entries?.length || 0} entries)`);
  } catch (err) {
    result.error = `Error fetching lorebook: ${err}`;
    console.warn(`[Chub] ${result.error}`);
  }

  return result;
}

export const chubHandler: SiteHandler = {
  id: 'chub',
  name: 'Chub.ai',
  patterns: [
    /^https?:\/\/(www\.)?chub\.ai\/characters\/([^\/]+)\/([^\/\?#]+)/,
    /^https?:\/\/venus\.chub\.ai\/characters\/([^\/]+)\/([^\/\?#]+)/,
  ],

  fetchCard: async (
    _url: string,
    match: RegExpMatchArray
  ): Promise<FetchedCard> => {
    // Handle both patterns - venus.chub.ai has different capture groups
    const creator = match[2] || match[1];
    const slug = match[3] || match[2];
    const warnings: string[] = [];
    const assets: AssetToImport[] = [];

    // 1. Fetch metadata to get project ID and avatar URLs
    const metaUrl = `https://gateway.chub.ai/api/characters/${creator}/${slug}?full=true`;
    const metaResponse = await fetch(metaUrl, {
      headers: { 'User-Agent': BROWSER_USER_AGENT },
    });

    if (!metaResponse.ok) {
      throw new Error(`Chub metadata API returned ${metaResponse.status}`);
    }

    const metaData = (await metaResponse.json()) as Record<string, any>;
    const projectId = metaData.node?.id || metaData.node?.definition?.id;
    if (!projectId) {
      throw new Error('Could not find project ID in Chub API response');
    }

    // 2. Fetch actual card.json (authoritative - fixes stale PNG bug)
    const cardUrl = `https://gateway.chub.ai/api/v4/projects/${projectId}/repository/files/card.json/raw?ref=main&response_type=blob`;
    const cardResponse = await fetch(cardUrl, {
      headers: { 'User-Agent': BROWSER_USER_AGENT },
    });

    if (!cardResponse.ok) {
      throw new Error(`Chub card API returned ${cardResponse.status}`);
    }

    const cardData = (await cardResponse.json()) as Record<string, any>;

    // 3. Get full-resolution avatar URL from metadata
    // max_res_url is the full chara_card_v2.png, avatar_url is the webp thumbnail
    const avatarUrl = metaData.node?.max_res_url || metaData.node?.avatar_url;

    let pngBuffer: Buffer | undefined;
    if (avatarUrl) {
      try {
        const pngResponse = await fetch(avatarUrl, {
          headers: { 'User-Agent': BROWSER_USER_AGENT },
        });
        if (pngResponse.ok) {
          pngBuffer = Buffer.from(await pngResponse.arrayBuffer());
        } else {
          warnings.push(`Failed to download avatar: ${pngResponse.status}`);
        }
      } catch (err) {
        warnings.push(`Failed to download avatar: ${err}`);
      }

      // Add as main icon asset
      assets.push({
        type: 'icon',
        name: 'main',
        url: avatarUrl,
        isMain: true,
      });
    } else {
      warnings.push('No avatar URL found in Chub metadata');
    }

    // 4. Extract expressions from chub extensions
    // Path: node.definition.extensions.chub.expressions.expressions (object, not array)
    const chubExpressions =
      metaData.node?.definition?.extensions?.chub?.expressions?.expressions;
    if (chubExpressions && typeof chubExpressions === 'object') {
      for (const [emotion, emotionUrl] of Object.entries(chubExpressions)) {
        if (typeof emotionUrl !== 'string') continue;

        // Skip the default placeholder (lfs/88 is the 120x120 default)
        if (emotionUrl.includes('lfs.charhub.io/lfs/88')) {
          continue;
        }

        // Include avatars.charhub.io uploads and non-default lfs.charhub.io
        if (
          emotionUrl.includes('avatars.charhub.io') ||
          emotionUrl.includes('lfs.charhub.io')
        ) {
          assets.push({
            type: 'emotion',
            name: emotion,
            url: emotionUrl,
          });
        }
      }
    }

    // 5. Extract voice data if present
    const voiceId = metaData.node?.definition?.voice_id;
    const voiceData = metaData.node?.definition?.voice;
    if (voiceId && voiceData && typeof voiceData === 'object') {
      const voiceName = voiceData.name || 'voice';
      const isDefaultVoice = DEFAULT_CHUB_VOICE_UUIDS.has(voiceId);

      // Add voice assets for each TTS model
      const voiceFields: Array<{ field: string; model: string }> = [
        { field: 'example', model: 'example' },
        { field: 'e2_example', model: 'e2_example' },
        { field: 'f5_example', model: 'f5_example' },
        { field: 'z_example', model: 'z_example' },
        { field: 'sample', model: 'sample' },
      ];

      for (const { field, model } of voiceFields) {
        const url = voiceData[field];
        if (url && typeof url === 'string') {
          assets.push({
            type: 'sound',
            name: `${voiceName}_${model}`,
            url,
            voiceId,
            isDefaultVoice,
          });
        }
      }
    }

    // 6. Fetch gallery images if hasGallery is true
    const hasGallery = metaData.node?.hasGallery;
    if (hasGallery && projectId) {
      try {
        const galleryUrl = `https://gateway.chub.ai/api/gallery/project/${projectId}?limit=48&count=false&time=${Math.random()}`;
        const galleryResponse = await fetch(galleryUrl, {
          headers: { 'User-Agent': BROWSER_USER_AGENT },
        });

        if (galleryResponse.ok) {
          const galleryData = (await galleryResponse.json()) as {
            nodes?: Array<{
              primary_image_path?: string;
              uuid?: string;
              name?: string;
              description?: string;
            }>;
          };
          const galleryNodes = galleryData.nodes || [];

          console.log(
            `[Chub] Found ${galleryNodes.length} gallery images for ${creator}/${slug}`
          );

          for (const node of galleryNodes) {
            if (node.primary_image_path) {
              const imageName =
                node.name || node.uuid || `gallery_${assets.length}`;
              assets.push({
                type: 'custom',
                name: imageName,
                url: node.primary_image_path,
                isChubGallery: true,
              });
            }
          }
        } else {
          warnings.push(`Failed to fetch gallery: ${galleryResponse.status}`);
        }
      } catch (err) {
        warnings.push(`Failed to fetch gallery: ${err}`);
      }
    }

    // 7. Extract and fetch related lorebooks
    // Can be in two places:
    // - metaData.node.definition.extensions.chub.related_lorebooks (array of objects)
    // - cardData.extensions.chub.related_lorebooks (same structure)
    const relatedLorebooks: RelatedLorebook[] = [];
    const chubExtensions = metaData.node?.definition?.extensions?.chub;
    const relatedLorebooksData = chubExtensions?.related_lorebooks;

    if (Array.isArray(relatedLorebooksData) && relatedLorebooksData.length > 0) {
      console.log(`[Chub] Found ${relatedLorebooksData.length} related lorebook(s) for ${creator}/${slug}`);

      // Fetch each related lorebook in parallel
      const lorebookPromises = relatedLorebooksData.map(async (lb: { id?: number; path?: string }) => {
        if (lb.id) {
          return fetchRelatedLorebook(lb.id, lb.path);
        }
        return null;
      });

      const fetchedLorebooks = await Promise.all(lorebookPromises);
      for (const lb of fetchedLorebooks) {
        if (lb) {
          relatedLorebooks.push(lb);
          if (!lb.fetched && lb.error) {
            warnings.push(`Related lorebook ${lb.id}: ${lb.error}`);
          }
        }
      }
    }

    return {
      cardData,
      spec: 'v2',
      pngBuffer,
      avatarUrl,
      assets,
      relatedLorebooks: relatedLorebooks.length > 0 ? relatedLorebooks : undefined,
      warnings,
      meta: { creator, slug, source: 'chub.ai' },
    };
  },
};
