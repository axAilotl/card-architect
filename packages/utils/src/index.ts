/**
 * @card-architect/utils
 *
 * Shared utilities for character card format handlers.
 * Works in both Node.js and browser environments.
 */

// Binary utilities
export {
  type BinaryData,
  readUInt32BE,
  writeUInt32BE,
  readUInt16BE,
  writeUInt16BE,
  indexOf,
  concat,
  slice,
  copy,
  fromString,
  toString,
  fromLatin1,
  toLatin1,
  equals,
  alloc,
  from,
  isBinaryData,
  toUint8Array,
} from './binary.js';

// Base64 utilities
export {
  encode as base64Encode,
  decode as base64Decode,
  isBase64,
  encodeUrlSafe as base64EncodeUrlSafe,
  decodeUrlSafe as base64DecodeUrlSafe,
} from './base64.js';

// ZIP utilities
export {
  ZIP_SIGNATURE,
  isZipBuffer,
  startsWithZipSignature,
  findZipStart,
  getZipOffset,
  isValidZip,
} from './zip.js';

// URI utilities
export {
  type URIScheme,
  type ParsedURI,
  type PNGChunkRef,
  parseURI,
  assetIdToURL,
  embedToInternal,
  internalToEmbed,
  isImageExt,
  isAudioExt,
  isVideoExt,
  isURISafe,
  getExtensionFromURI,
  getMimeTypeFromExt,
  getExtFromMimeType,
  buildDataURI,
  findPNGChunkByURI,
} from './uri.js';

// Macro utilities
export {
  voxtaToStandard,
  standardToVoxta,
  isVoxtaCard,
  convertCardMacros,
} from './macros.js';
