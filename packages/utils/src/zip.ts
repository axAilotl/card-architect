/**
 * ZIP Utility Functions
 *
 * Handles ZIP format detection and SFX (self-extracting) archive support.
 * Uses Uint8Array for universal browser/Node.js compatibility.
 */

import { indexOf, type BinaryData } from './binary.js';

// ZIP local file header signature: PK\x03\x04
export const ZIP_SIGNATURE = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

/**
 * Check if a buffer contains ZIP data (anywhere in the buffer).
 * This handles both regular ZIPs and SFX (self-extracting) archives.
 * @param data - Binary data to check
 * @returns true if ZIP signature found
 */
export function isZipBuffer(data: BinaryData): boolean {
  return indexOf(data, ZIP_SIGNATURE) >= 0;
}

/**
 * Check if a buffer starts with ZIP signature (standard ZIP detection).
 * @param data - Binary data to check
 * @returns true if data starts with PK\x03\x04
 */
export function startsWithZipSignature(data: BinaryData): boolean {
  return (
    data.length >= 4 &&
    data[0] === 0x50 &&
    data[1] === 0x4b &&
    data[2] === 0x03 &&
    data[3] === 0x04
  );
}

/**
 * Find ZIP data start in buffer (handles SFX/self-extracting archives).
 * SFX archives have an executable stub prepended to the ZIP data.
 * This function finds the actual ZIP data start position.
 *
 * @param data - Binary data that may contain ZIP data (possibly with SFX prefix)
 * @returns Binary data starting at ZIP signature, or original data if not found/already at start
 */
export function findZipStart(data: BinaryData): BinaryData {
  const index = indexOf(data, ZIP_SIGNATURE);

  if (index > 0) {
    // SFX archive detected - return data starting at ZIP signature
    return data.subarray(index);
  }

  // Either ZIP starts at 0, or no ZIP signature found - return original
  return data;
}

/**
 * Get the offset of ZIP data within a buffer.
 * @param data - Binary data to search
 * @returns Offset of ZIP signature, or -1 if not found
 */
export function getZipOffset(data: BinaryData): number {
  return indexOf(data, ZIP_SIGNATURE);
}

/**
 * Check if data is a valid ZIP archive (has signature at start or is SFX)
 * @param data - Binary data to check
 * @returns true if data contains valid ZIP structure
 */
export function isValidZip(data: BinaryData): boolean {
  const offset = getZipOffset(data);
  if (offset < 0) return false;

  // Check if there's enough data after the signature for a minimal ZIP
  // Minimum ZIP: local file header (30 bytes) + central directory (46 bytes) + end of central dir (22 bytes)
  return data.length - offset >= 98;
}
