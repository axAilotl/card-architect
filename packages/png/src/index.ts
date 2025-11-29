/**
 * @card-architect/png
 *
 * PNG text chunk extraction and embedding for character cards.
 * Works in both Node.js and browser environments.
 */

// Parser exports
export {
  PNG_SIGNATURE,
  TEXT_CHUNK_KEYS,
  type TextChunk,
  type PNGExtractionResult,
  isPNG,
  parseTextChunks,
  extractFromPNG,
} from './parser.js';

// Builder exports
export {
  type EmbedOptions,
  removeAllTextChunks,
  injectTextChunk,
  embedIntoPNG,
  createCardPNG,
  validatePNGSize,
} from './builder.js';

// CRC32 exports (for advanced use)
export {
  crc32,
  crc32Bytes,
} from './crc32.js';
