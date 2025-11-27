/**
 * ZIP Utility Functions
 * Handles ZIP format detection and SFX (self-extracting) archive support
 */

// ZIP local file header signature: PK\x03\x04
export const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/**
 * Check if a buffer contains ZIP data (anywhere in the buffer).
 * This handles both regular ZIPs and SFX (self-extracting) archives.
 * @param buffer - Buffer to check
 * @returns true if ZIP signature found
 */
export function isZipBuffer(buffer: Buffer): boolean {
  return buffer.indexOf(ZIP_SIGNATURE) >= 0;
}

/**
 * Check if a buffer starts with ZIP signature (standard ZIP detection).
 * @param buffer - Buffer to check
 * @returns true if buffer starts with PK\x03\x04
 */
export function startsWithZipSignature(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  );
}

/**
 * Find ZIP data start in buffer (handles SFX/self-extracting archives).
 * SFX archives have an executable stub prepended to the ZIP data.
 * This function finds the actual ZIP data start position.
 *
 * @param buffer - Buffer that may contain ZIP data (possibly with SFX prefix)
 * @returns Buffer starting at ZIP signature, or original buffer if not found/already at start
 */
export function findZipStart(buffer: Buffer): Buffer {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const index = buf.indexOf(ZIP_SIGNATURE);

  if (index > 0) {
    // SFX archive detected - return buffer starting at ZIP signature
    console.log(`ZIP: Found ZIP signature at offset ${index} (SFX archive)`);
    return buf.subarray(index);
  }

  // Either ZIP starts at 0, or no ZIP signature found - return original
  return buf;
}

/**
 * Get the offset of ZIP data within a buffer.
 * @param buffer - Buffer to search
 * @returns Offset of ZIP signature, or -1 if not found
 */
export function getZipOffset(buffer: Buffer): number {
  return buffer.indexOf(ZIP_SIGNATURE);
}
