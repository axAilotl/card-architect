/**
 * CHARX Format Reader
 *
 * Extracts and parses .charx (ZIP-based character card) files.
 * Uses fflate for browser/Node.js compatibility.
 */

import { unzipSync, type Unzipped } from 'fflate';
import type { CharxData, CharxAssetInfo, CharxMetadata, CCv3Data, AssetDescriptor } from '@card-architect/schemas';
import { type BinaryData, toString, base64Decode, findZipStart, parseURI } from '@card-architect/utils';

/**
 * Function to fetch remote assets
 * Returns the binary data or undefined if fetch fails
 */
export type AssetFetcher = (url: string) => Promise<BinaryData | undefined>;

/**
 * Options for CHARX extraction
 */
export interface CharxExtractionOptions {
  maxFileSize?: number; // Max size for card.json in bytes (default: 10MB)
  maxAssetSize?: number; // Max size for individual assets (default: 50MB)
  maxTotalSize?: number; // Max total size of all content (default: 200MB)
  allowedAssetTypes?: string[]; // Allowed asset MIME types
  fetchRemoteAssets?: boolean; // Whether to download remote (http/https) assets
  assetFetcher?: AssetFetcher; // Custom fetch function for remote assets
}

const DEFAULT_OPTIONS: Required<Omit<CharxExtractionOptions, 'assetFetcher'>> & { assetFetcher?: AssetFetcher } = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxAssetSize: 50 * 1024 * 1024, // 50MB
  maxTotalSize: 200 * 1024 * 1024, // 200MB
  allowedAssetTypes: [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/avif',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'video/mp4',
    'video/webm',
  ],
  fetchRemoteAssets: false,
  assetFetcher: undefined,
};

/**
 * Extract and parse a CHARX buffer
 */
export function extractCharx(
  data: BinaryData,
  options: CharxExtractionOptions = {}
): CharxData {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Handle SFX archives
  const zipData = findZipStart(data);

  // Unzip synchronously
  let unzipped: Unzipped;
  try {
    unzipped = unzipSync(zipData);
  } catch (err) {
    throw new Error(`Failed to unzip CHARX: ${err instanceof Error ? err.message : String(err)}`);
  }

  let cardJson: CCv3Data | null = null;
  const assets: CharxAssetInfo[] = [];
  const metadata = new Map<number, CharxMetadata>();
  let moduleRisum: BinaryData | undefined;
  let totalSize = 0;

  // Process entries
  for (const [fileName, fileData] of Object.entries(unzipped)) {
    // Skip directories (empty or ends with /)
    if (fileName.endsWith('/') || fileData.length === 0) continue;

    // Check file size
    if (fileData.length > opts.maxAssetSize) {
      throw new Error(`File ${fileName} exceeds maximum asset size (${opts.maxAssetSize} bytes)`);
    }

    totalSize += fileData.length;
    if (totalSize > opts.maxTotalSize) {
      throw new Error(`Total CHARX size exceeds maximum (${opts.maxTotalSize} bytes)`);
    }

    // Handle card.json
    if (fileName === 'card.json') {
      if (fileData.length > opts.maxFileSize) {
        throw new Error(`card.json exceeds maximum size (${opts.maxFileSize} bytes)`);
      }
      try {
        const content = toString(fileData);
        cardJson = JSON.parse(content);
      } catch (err) {
        throw new Error(`Failed to parse card.json: ${err instanceof Error ? err.message : String(err)}`);
      }
      continue;
    }

    // Handle x_meta/*.json
    const metaMatch = fileName.match(/^x_meta\/(\d+)\.json$/);
    if (metaMatch) {
      const index = parseInt(metaMatch[1], 10);
      try {
        const content = toString(fileData);
        const meta = JSON.parse(content);
        metadata.set(index, meta);
      } catch {
        // Ignore invalid metadata
      }
      continue;
    }

    // Handle module.risum
    if (fileName === 'module.risum') {
      moduleRisum = fileData;
      continue;
    }

    // Handle assets/** files
    if (fileName.startsWith('assets/')) {
      assets.push({
        path: fileName,
        descriptor: {
          type: 'custom',
          name: fileName.split('/').pop() || 'unknown',
          uri: `embeded://${fileName}`,
          ext: fileName.split('.').pop() || 'bin',
        },
        buffer: fileData,
      });
      continue;
    }

    // Unknown files are ignored
  }

  if (!cardJson) {
    throw new Error('CHARX file does not contain card.json');
  }

  // Validate that it's a CCv3 card
  if (cardJson.spec !== 'chara_card_v3') {
    throw new Error(`Invalid card spec: expected "chara_card_v3", got "${cardJson.spec}"`);
  }

  // Match assets to their descriptors from card.json
  const matchedAssets = matchAssetsToDescriptors(assets, cardJson.data.assets || []);

  return {
    card: cardJson,
    assets: matchedAssets,
    metadata: metadata.size > 0 ? metadata : undefined,
    moduleRisum,
  };
}

/**
 * Match extracted asset files to their descriptors from card.json
 */
function matchAssetsToDescriptors(
  extractedAssets: CharxAssetInfo[],
  descriptors: AssetDescriptor[]
): CharxAssetInfo[] {
  const matched: CharxAssetInfo[] = [];

  for (const descriptor of descriptors) {
    const parsed = parseURI(descriptor.uri);

    if (parsed.scheme === 'embeded' && parsed.path) {
      // Find the matching asset file
      const asset = extractedAssets.find((a) => a.path === parsed.path);

      if (asset) {
        matched.push({
          ...asset,
          descriptor,
        });
      } else {
        // Asset referenced but not found in ZIP
        matched.push({
          path: parsed.path,
          descriptor,
          buffer: undefined,
        });
      }
    } else if (parsed.scheme === 'ccdefault') {
      // Default asset, no file needed
      matched.push({
        path: 'ccdefault:',
        descriptor,
        buffer: undefined,
      });
    } else if (parsed.scheme === 'https' || parsed.scheme === 'http') {
      // Remote asset, no file needed
      matched.push({
        path: descriptor.uri,
        descriptor,
        buffer: undefined,
      });
    } else if (parsed.scheme === 'data') {
      // Data URI, extract the data
      if (parsed.data && parsed.encoding === 'base64') {
        const buffer = base64Decode(parsed.data);
        matched.push({
          path: 'data:',
          descriptor,
          buffer,
        });
      } else {
        matched.push({
          path: 'data:',
          descriptor,
          buffer: undefined,
        });
      }
    }
  }

  return matched;
}

/**
 * Extract just the card.json from a CHARX buffer (quick validation)
 */
export function extractCardJsonOnly(data: BinaryData): CCv3Data {
  const zipData = findZipStart(data);

  let unzipped: Unzipped;
  try {
    unzipped = unzipSync(zipData, {
      filter: (file) => file.name === 'card.json',
    });
  } catch (err) {
    throw new Error(`Failed to unzip CHARX: ${err instanceof Error ? err.message : String(err)}`);
  }

  const cardData = unzipped['card.json'];
  if (!cardData) {
    throw new Error('card.json not found in CHARX file');
  }

  try {
    const content = toString(cardData);
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to parse card.json: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Async version of extractCharx with optional remote asset fetching
 */
export async function extractCharxAsync(
  data: BinaryData,
  options: CharxExtractionOptions = {}
): Promise<CharxData> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // First do the sync extraction
  const result = extractCharx(data, options);

  // If remote fetching is disabled or no fetcher provided, return as-is
  if (!opts.fetchRemoteAssets || !opts.assetFetcher) {
    return result;
  }

  // Fetch remote assets
  const fetchedAssets = await Promise.all(
    result.assets.map(async (asset) => {
      // Only fetch assets that don't have buffers and have remote URLs
      if (asset.buffer) {
        return asset;
      }

      const parsed = parseURI(asset.descriptor.uri);

      if (parsed.scheme === 'https' || parsed.scheme === 'http') {
        try {
          const buffer = await opts.assetFetcher!(parsed.url!);
          if (buffer) {
            return {
              ...asset,
              buffer,
            };
          }
        } catch (err) {
          // Failed to fetch, leave buffer undefined
          console.warn(`Failed to fetch remote asset ${asset.descriptor.uri}: ${err}`);
        }
      }

      return asset;
    })
  );

  return {
    ...result,
    assets: fetchedAssets,
  };
}
