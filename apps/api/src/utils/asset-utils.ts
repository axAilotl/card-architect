/**
 * Asset Utilities
 *
 * Utilities for asset detection and processing.
 */

/**
 * Detect if an asset is animated (GIF, animated WebP, video)
 */
export function detectAnimatedAsset(buffer: Buffer | Uint8Array, mimetype: string): boolean {
  // Video formats are always considered animated
  if (mimetype.startsWith('video/')) {
    return true;
  }

  // Check for GIF animation
  if (mimetype === 'image/gif') {
    return isAnimatedGif(buffer);
  }

  // Check for animated WebP
  if (mimetype === 'image/webp') {
    return isAnimatedWebP(buffer);
  }

  return false;
}

/**
 * Check if a GIF buffer contains animation (multiple frames)
 */
function isAnimatedGif(buffer: Buffer | Uint8Array): boolean {
  // GIF animation detection: look for multiple image separators (0x2C)
  // or the NETSCAPE2.0 application extension for looping
  let frameCount = 0;

  for (let i = 0; i < buffer.length - 1; i++) {
    // Image separator
    if (buffer[i] === 0x2C) {
      frameCount++;
      if (frameCount > 1) {
        return true;
      }
    }
    // Application extension block (for NETSCAPE loop)
    if (buffer[i] === 0x21 && buffer[i + 1] === 0xFF) {
      // Check for NETSCAPE2.0
      if (i + 14 < buffer.length) {
        const ext = String.fromCharCode(
          buffer[i + 3],
          buffer[i + 4],
          buffer[i + 5],
          buffer[i + 6],
          buffer[i + 7],
          buffer[i + 8],
          buffer[i + 9],
          buffer[i + 10],
          buffer[i + 11]
        );
        if (ext === 'NETSCAPE2') {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if a WebP buffer contains animation
 */
function isAnimatedWebP(buffer: Buffer | Uint8Array): boolean {
  // WebP animation detection: look for VP8X chunk with animation flag
  // or ANIM chunk
  if (buffer.length < 20) {
    return false;
  }

  // Check RIFF header
  const riff = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
  const webp = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11]);

  if (riff !== 'RIFF' || webp !== 'WEBP') {
    return false;
  }

  // Look for VP8X chunk with animation flag or ANIM chunk
  for (let i = 12; i < buffer.length - 8; i++) {
    const chunk = String.fromCharCode(buffer[i], buffer[i + 1], buffer[i + 2], buffer[i + 3]);

    if (chunk === 'VP8X') {
      // VP8X flags are at offset +8 from chunk start
      if (i + 8 < buffer.length) {
        const flags = buffer[i + 8];
        // Animation flag is bit 1 (0x02)
        if (flags & 0x02) {
          return true;
        }
      }
    }

    if (chunk === 'ANIM') {
      return true;
    }
  }

  return false;
}
