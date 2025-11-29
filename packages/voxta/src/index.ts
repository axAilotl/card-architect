/**
 * @card-architect/voxta
 *
 * Voxta package format reading and writing for character cards.
 * Works in both Node.js and browser environments.
 */

// Reader exports
export {
  type VoxtaExtractionOptions,
  type ExtractedVoxtaAsset,
  type ExtractedVoxtaCharacter,
  type ExtractedVoxtaScenario,
  type ExtractedVoxtaBook,
  type VoxtaData,
  extractVoxtaPackage,
  extractVoxtaPackageAsync,
} from './reader.js';

// Writer exports
export {
  type VoxtaWriteAsset,
  type VoxtaBuildOptions,
  type VoxtaBuildResult,
  buildVoxtaPackage,
  buildVoxtaPackageAsync,
} from './writer.js';

// Mapper exports
export {
  voxtaToCCv3,
  ccv3ToVoxta,
  ccv3LorebookToVoxtaBook,
} from './mapper.js';

// Type exports
export type { CompressionLevel } from './types.js';

// Re-export types from schemas for convenience
export type {
  VoxtaPackage,
  VoxtaCharacter,
  VoxtaScenario,
  VoxtaBook,
  VoxtaExtensionData,
} from '@card-architect/schemas';
