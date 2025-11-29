/**
 * @card-architect/charx
 *
 * CHARX format reading and writing for character cards.
 * Works in both Node.js and browser environments.
 */

// Reader exports
export {
  type CharxExtractionOptions,
  type AssetFetcher,
  extractCharx,
  extractCardJsonOnly,
  extractCharxAsync,
} from './reader.js';

// Writer exports
export {
  type CharxWriteAsset,
  type CharxBuildOptions,
  type CharxBuildResult,
  buildCharx,
  buildCharxAsync,
} from './writer.js';

// Validator exports
export {
  validateCharx,
  validateCharxBuild,
  normalizeAssetOrder,
  deduplicateAssetNames,
} from './validator.js';

// Re-export types from schemas for convenience
export type {
  CharxData,
  CharxAssetInfo,
  CharxMetadata,
  CharxValidationResult,
} from '@card-architect/schemas';
