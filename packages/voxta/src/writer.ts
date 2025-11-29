/**
 * Voxta Package Writer
 *
 * Creates .voxpkg files from character card data.
 * Uses fflate for browser/Node.js compatibility.
 */

import { zipSync, type Zippable } from 'fflate';
import type {
  CCv3Data,
  VoxtaCharacter,
  KnownExtensions,
} from '@card-architect/schemas';
import { type BinaryData, fromString } from '@card-architect/utils';
import type { CompressionLevel } from './types.js';

/**
 * Asset to include in Voxta package
 */
export interface VoxtaWriteAsset {
  /** Asset type (icon, emotion, sound, etc.) */
  type: string;
  /** Asset name (without extension) */
  name: string;
  /** File extension */
  ext: string;
  /** Binary data of the asset */
  data: BinaryData;
  /** Tags for the asset */
  tags?: string[];
  /** Whether this is the main asset of its type */
  isMain?: boolean;
}

/**
 * Options for building Voxta package
 */
export interface VoxtaBuildOptions {
  /** Compression level (0-9, default: 6) */
  compressionLevel?: CompressionLevel;
  /** Generate package.json (some Voxta imports don't want it) */
  includePackageJson?: boolean;
  /** Character ID (generated if not provided) */
  characterId?: string;
  /** Package ID (generated if not provided) */
  packageId?: string;
}

/**
 * Result of building a Voxta package
 */
export interface VoxtaBuildResult {
  /** The Voxta package ZIP buffer */
  buffer: BinaryData;
  /** Number of assets included */
  assetCount: number;
  /** Total size of the package */
  totalSize: number;
  /** Character ID used */
  characterId: string;
}

/**
 * Generate a simple UUID v4
 */
function generateUUID(): string {
  // Simple UUID v4 generation without external dependency
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sanitize a name for use in file paths
 */
function sanitizeName(name: string, ext: string): string {
  let safeName = name;

  // Strip extension if present
  if (safeName.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
    safeName = safeName.substring(0, safeName.length - (ext.length + 1));
  }

  // Replace dots and underscores with hyphens, remove special chars, collapse dashes
  safeName = safeName
    .replace(/[._]/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!safeName) safeName = 'asset';

  return safeName;
}

/**
 * Build a Voxta Package from card data and assets
 */
export function buildVoxtaPackage(
  card: CCv3Data,
  assets: VoxtaWriteAsset[],
  options: VoxtaBuildOptions = {}
): VoxtaBuildResult {
  const { compressionLevel = 6, includePackageJson = false } = options;
  const cardData = card.data;

  // Get or generate IDs
  const extensions = cardData.extensions as KnownExtensions | undefined;
  const voxtaExt = extensions?.voxta;
  const characterId = options.characterId || voxtaExt?.id || generateUUID();
  const packageId = options.packageId || voxtaExt?.packageId || generateUUID();
  const dateNow = new Date().toISOString();

  // Get appearance from voxta extension, or fall back to visual_description (Wyvern AI)
  const appearance = voxtaExt?.appearance || extensions?.visual_description || '';

  // Create ZIP entries
  const zipEntries: Zippable = {};

  // 1. Optionally include package.json
  if (includePackageJson) {
    const packageMeta = {
      $type: 'package',
      Id: packageId,
      Name: cardData.name,
      Version: cardData.character_version || '1.0.0',
      Description: cardData.description,
      Creator: cardData.creator,
      ExplicitContent: true,
      EntryResource: { Kind: 1, Id: characterId },
      ThumbnailResource: { Kind: 1, Id: characterId },
      DateCreated: voxtaExt?.original?.DateCreated || dateNow,
      DateModified: dateNow,
    };
    zipEntries['package.json'] = [fromString(JSON.stringify(packageMeta, null, 2)), { level: compressionLevel }];
  }

  // 2. Build character.json
  const character: VoxtaCharacter = {
    $type: 'character',
    Id: characterId,
    PackageId: packageId,
    Name: cardData.name,
    Version: cardData.character_version,

    // Core Info
    Description: appearance,
    Personality: cardData.personality,
    Profile: cardData.description,
    Scenario: cardData.scenario,
    FirstMessage: cardData.first_mes,
    MessageExamples: cardData.mes_example,

    // Metadata
    Creator: cardData.creator,
    CreatorNotes: cardData.creator_notes,
    Tags: cardData.tags,

    // Voxta specifics from extension
    TextToSpeech: voxtaExt?.textToSpeech,
    ChatStyle: voxtaExt?.chatSettings?.chatStyle,
    EnableThinkingSpeech: voxtaExt?.chatSettings?.enableThinkingSpeech,
    NotifyUserAwayReturn: voxtaExt?.chatSettings?.notifyUserAwayReturn,
    TimeAware: voxtaExt?.chatSettings?.timeAware,
    UseMemory: voxtaExt?.chatSettings?.useMemory,
    MaxTokens: voxtaExt?.chatSettings?.maxTokens,
    MaxSentences: voxtaExt?.chatSettings?.maxSentences,
    Scripts: voxtaExt?.scripts,

    DateCreated: voxtaExt?.original?.DateCreated || dateNow,
    DateModified: dateNow,
  };

  zipEntries[`Characters/${characterId}/character.json`] = [
    fromString(JSON.stringify(character, null, 2)),
    { level: compressionLevel },
  ];

  // 3. Add assets
  let assetCount = 0;
  let mainThumbnail: VoxtaWriteAsset | undefined;

  for (const asset of assets) {
    const safeName = sanitizeName(asset.name, asset.ext);
    const finalFilename = `${safeName}.${asset.ext}`;
    let voxtaPath = '';

    const tags = asset.tags || [];

    if (asset.type === 'sound' || tags.includes('voice')) {
      // Voice Sample
      voxtaPath = `Characters/${characterId}/Assets/VoiceSamples/${finalFilename}`;
    } else if (asset.type === 'icon' || asset.type === 'emotion') {
      // Avatar
      voxtaPath = `Characters/${characterId}/Assets/Avatars/Default/${finalFilename}`;

      // Track thumbnail candidate
      if (asset.type === 'icon') {
        if (tags.includes('portrait-override')) {
          mainThumbnail = asset;
        } else if (!mainThumbnail && (asset.name === 'main' || asset.isMain)) {
          mainThumbnail = asset;
        }
      }
    } else {
      // Misc
      voxtaPath = `Characters/${characterId}/Assets/Misc/${finalFilename}`;
    }

    zipEntries[voxtaPath] = [asset.data, { level: compressionLevel }];
    assetCount++;
  }

  // 4. Add thumbnail
  if (!mainThumbnail && assets.length > 0) {
    mainThumbnail = assets.find((a) => a.type === 'icon');
  }

  if (mainThumbnail) {
    zipEntries[`Characters/${characterId}/thumbnail.png`] = [
      mainThumbnail.data,
      { level: compressionLevel },
    ];
  }

  // Create ZIP
  const buffer = zipSync(zipEntries);

  return {
    buffer,
    assetCount,
    totalSize: buffer.length,
    characterId,
  };
}

/**
 * Async version of buildVoxtaPackage
 */
export async function buildVoxtaPackageAsync(
  card: CCv3Data,
  assets: VoxtaWriteAsset[],
  options: VoxtaBuildOptions = {}
): Promise<VoxtaBuildResult> {
  return buildVoxtaPackage(card, assets, options);
}
