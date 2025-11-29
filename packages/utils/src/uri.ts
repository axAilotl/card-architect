/**
 * URI utilities for handling different asset URI schemes
 * Supports: embeded://, ccdefault:, https://, http://, data:, file://, __asset:, asset:
 */

export type URIScheme = 'embeded' | 'ccdefault' | 'https' | 'http' | 'data' | 'file' | 'internal' | 'pngchunk' | 'unknown';

export interface ParsedURI {
  scheme: URIScheme;
  originalUri: string;
  path?: string; // For embeded://, file://
  url?: string; // For http://, https://
  data?: string; // For data: URIs
  mimeType?: string; // For data: URIs
  encoding?: string; // For data: URIs (e.g., base64)
  chunkKey?: string; // For pngchunk (__asset:, asset:) - the key/index to look up
  chunkCandidates?: string[]; // For pngchunk - all possible chunk keys to search
}

/**
 * Parse a URI and determine its scheme and components
 */
export function parseURI(uri: string): ParsedURI {
  const trimmed = uri.trim();

  // __asset: or asset: - PNG chunk reference (CharX-in-PNG format)
  if (trimmed.startsWith('__asset:') || trimmed.startsWith('asset:')) {
    const assetId = trimmed.startsWith('__asset:')
      ? trimmed.substring('__asset:'.length)
      : trimmed.substring('asset:'.length);

    // Generate all possible chunk key variations for lookup
    const candidates = [
      assetId,                        // "0" or "filename.png"
      trimmed,                        // "__asset:0" or "asset:0"
      `asset:${assetId}`,             // "asset:0"
      `__asset:${assetId}`,           // "__asset:0"
      `__asset_${assetId}`,           // "__asset_0"
      `chara-ext-asset_${assetId}`,   // "chara-ext-asset_0"
      `chara-ext-asset_:${assetId}`,  // "chara-ext-asset_:0"
    ];

    return {
      scheme: 'pngchunk',
      originalUri: uri,
      chunkKey: assetId,
      chunkCandidates: candidates,
    };
  }

  // ccdefault: - use default asset
  if (trimmed === 'ccdefault:' || trimmed.startsWith('ccdefault:')) {
    return {
      scheme: 'ccdefault',
      originalUri: uri,
    };
  }

  // embeded:// - note the typo is intentional for CHARX compatibility
  if (trimmed.startsWith('embeded://')) {
    const path = trimmed.substring('embeded://'.length);
    return {
      scheme: 'embeded',
      originalUri: uri,
      path,
    };
  }

  // https://
  if (trimmed.startsWith('https://')) {
    return {
      scheme: 'https',
      originalUri: uri,
      url: trimmed,
    };
  }

  // http://
  if (trimmed.startsWith('http://')) {
    return {
      scheme: 'http',
      originalUri: uri,
      url: trimmed,
    };
  }

  // data: URIs
  if (trimmed.startsWith('data:')) {
    const parsed = parseDataURI(trimmed);
    return {
      scheme: 'data',
      originalUri: uri,
      ...parsed,
    };
  }

  // file://
  if (trimmed.startsWith('file://')) {
    const path = trimmed.substring('file://'.length);
    return {
      scheme: 'file',
      originalUri: uri,
      path,
    };
  }

  // Internal asset ID (UUID format)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      scheme: 'internal',
      originalUri: uri,
      path: trimmed,
    };
  }

  // Unknown scheme
  return {
    scheme: 'unknown',
    originalUri: uri,
  };
}

/**
 * Parse a data URI into its components
 * Format: data:[<mediatype>][;base64],<data>
 */
function parseDataURI(uri: string): { mimeType?: string; encoding?: string; data?: string } {
  const match = uri.match(/^data:([^;,]+)?(;base64)?,(.*)$/);

  if (!match) {
    return {};
  }

  return {
    mimeType: match[1] || 'text/plain',
    encoding: match[2] ? 'base64' : undefined,
    data: match[3],
  };
}

/**
 * Convert an internal asset ID to a public URL
 */
export function assetIdToURL(assetId: string, baseURL: string = ''): string {
  return `${baseURL}/assets/${assetId}`;
}

/**
 * Convert a CHARX embeded:// path to an internal reference
 */
export function embedToInternal(embedPath: string): string {
  // Remove embeded:// prefix if present
  const path = embedPath.startsWith('embeded://') ? embedPath.substring('embeded://'.length) : embedPath;

  // Extract filename or use the full path as reference
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

/**
 * Convert an internal asset ID to a CHARX embeded:// URI
 */
export function internalToEmbed(_assetId: string, type: string, ext: string, index: number): string {
  // Organize by type following CHARX conventions
  let subdir = 'other';

  if (type === 'icon') {
    subdir = 'icon';
  } else if (type === 'background') {
    subdir = 'background';
  } else if (type === 'emotion') {
    subdir = 'emotion';
  } else if (type === 'user_icon') {
    subdir = 'user_icon';
  }

  // Determine media subdirectory
  const mediaType = isImageExt(ext) ? 'image' : isAudioExt(ext) ? 'audio' : isVideoExt(ext) ? 'video' : 'other';

  return `embeded://assets/${subdir}/${mediaType}/${index}.${ext}`;
}

/**
 * Check if extension is an image format
 */
export function isImageExt(ext: string): boolean {
  const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp', 'svg'];
  return imageExts.includes(ext.toLowerCase());
}

/**
 * Check if extension is an audio format
 */
export function isAudioExt(ext: string): boolean {
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];
  return audioExts.includes(ext.toLowerCase());
}

/**
 * Check if extension is a video format
 */
export function isVideoExt(ext: string): boolean {
  const videoExts = ['mp4', 'webm', 'avi', 'mov', 'mkv'];
  return videoExts.includes(ext.toLowerCase());
}

/**
 * Validate if a URI is safe to use
 */
export function isURISafe(uri: string, options: { allowHttp?: boolean; allowFile?: boolean } = {}): boolean {
  const parsed = parseURI(uri);

  switch (parsed.scheme) {
    case 'embeded':
    case 'ccdefault':
    case 'internal':
    case 'data':
    case 'https':
    case 'pngchunk':
      return true;

    case 'http':
      return options.allowHttp === true;

    case 'file':
      return options.allowFile === true;

    case 'unknown':
    default:
      return false;
  }
}

/**
 * Extract file extension from URI
 */
export function getExtensionFromURI(uri: string): string {
  const parsed = parseURI(uri);

  if (parsed.path) {
    const parts = parsed.path.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
  }

  if (parsed.url) {
    const urlParts = parsed.url.split('?')[0].split('.');
    if (urlParts.length > 1) {
      return urlParts[urlParts.length - 1].toLowerCase();
    }
  }

  if (parsed.mimeType) {
    // Convert MIME type to extension
    return getExtFromMimeType(parsed.mimeType);
  }

  return 'unknown';
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExt(ext: string): string {
  const extToMime: Record<string, string> = {
    // Images
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'avif': 'image/avif',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',

    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',

    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'mkv': 'video/x-matroska',

    // Text
    'json': 'application/json',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
  };

  return extToMime[ext.toLowerCase()] || 'application/octet-stream';
}

/**
 * Get file extension from MIME type
 */
export function getExtFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/x-icon': 'ico',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/x-msvideo': 'avi',
    'video/quicktime': 'mov',
    'video/x-matroska': 'mkv',
    'application/json': 'json',
    'text/plain': 'txt',
    'text/html': 'html',
    'text/css': 'css',
    'application/javascript': 'js',
  };

  return mimeToExt[mimeType] || 'bin';
}

/**
 * Build a data URI from binary data and MIME type
 */
export function buildDataURI(data: string, mimeType: string, isBase64: boolean = true): string {
  if (isBase64) {
    return `data:${mimeType};base64,${data}`;
  }
  return `data:${mimeType},${encodeURIComponent(data)}`;
}

/**
 * PNG chunk reference for asset lookup
 */
export interface PNGChunkRef {
  keyword: string;
  text: string;
}

/**
 * Find a PNG chunk by trying multiple candidate keys
 * Used for __asset: and asset: URI resolution
 */
export function findPNGChunkByURI(
  uri: string,
  chunks: PNGChunkRef[]
): PNGChunkRef | undefined {
  const parsed = parseURI(uri);

  if (parsed.scheme !== 'pngchunk' || !parsed.chunkCandidates) {
    return undefined;
  }

  // Try exact matches first
  for (const candidate of parsed.chunkCandidates) {
    const found = chunks.find((c) => c.keyword === candidate);
    if (found) return found;
  }

  // Fallback: check for chara-ext-asset_ prefix matching
  const assetId = parsed.chunkKey;
  if (assetId) {
    const found = chunks.find((c) => {
      if (c.keyword.startsWith('chara-ext-asset_')) {
        const suffix = c.keyword.replace('chara-ext-asset_', '');
        return suffix === assetId || suffix === `:${assetId}` || suffix === uri;
      }
      return false;
    });
    if (found) return found;
  }

  return undefined;
}
