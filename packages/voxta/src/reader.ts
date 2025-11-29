/**
 * Voxta Package Reader
 *
 * Extracts and parses .voxpkg (ZIP-based) files.
 * Uses fflate for browser/Node.js compatibility.
 */

import { unzipSync, type Unzipped } from 'fflate';
import type {
  VoxtaPackage,
  VoxtaCharacter,
  VoxtaScenario,
  VoxtaBook,
} from '@card-architect/schemas';
import { type BinaryData, toString, findZipStart } from '@card-architect/utils';

/**
 * Options for Voxta extraction
 */
export interface VoxtaExtractionOptions {
  maxFileSize?: number; // Max size for JSON files (default: 50MB)
  maxAssetSize?: number; // Max size for individual assets (default: 50MB)
  maxTotalSize?: number; // Max total size (default: 500MB)
}

const DEFAULT_OPTIONS: Required<VoxtaExtractionOptions> = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxAssetSize: 50 * 1024 * 1024, // 50MB
  maxTotalSize: 500 * 1024 * 1024, // 500MB - Voxta packages can be large
};

/**
 * Extracted asset from Voxta package
 */
export interface ExtractedVoxtaAsset {
  path: string; // Full path in zip (e.g. Characters/uuid/Assets/Avatars/...)
  buffer: BinaryData;
  characterId?: string; // If asset belongs to a character
}

/**
 * Extracted character from Voxta package
 */
export interface ExtractedVoxtaCharacter {
  id: string;
  data: VoxtaCharacter;
  thumbnail?: BinaryData;
  assets: ExtractedVoxtaAsset[];
}

/**
 * Extracted scenario from Voxta package
 */
export interface ExtractedVoxtaScenario {
  id: string;
  data: VoxtaScenario;
  thumbnail?: BinaryData;
}

/**
 * Extracted book from Voxta package
 */
export interface ExtractedVoxtaBook {
  id: string;
  data: VoxtaBook;
}

/**
 * Complete extracted Voxta data
 */
export interface VoxtaData {
  package?: VoxtaPackage;
  characters: ExtractedVoxtaCharacter[];
  scenarios: ExtractedVoxtaScenario[];
  books: ExtractedVoxtaBook[];
}

/**
 * Extract and parse a Voxta Package (.voxpkg) buffer
 */
export function extractVoxtaPackage(
  data: BinaryData,
  options: VoxtaExtractionOptions = {}
): VoxtaData {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Handle SFX archives
  const zipData = findZipStart(data);

  // Unzip
  let unzipped: Unzipped;
  try {
    unzipped = unzipSync(zipData);
  } catch (err) {
    throw new Error(`Failed to unzip Voxta package: ${err instanceof Error ? err.message : String(err)}`);
  }

  const result: VoxtaData = {
    characters: [],
    scenarios: [],
    books: [],
  };

  // Temporary maps to aggregate data parts
  const charMap = new Map<string, Partial<ExtractedVoxtaCharacter>>();
  const scenarioMap = new Map<string, Partial<ExtractedVoxtaScenario>>();
  const bookMap = new Map<string, Partial<ExtractedVoxtaBook>>();

  let totalSize = 0;

  // Process entries
  for (const [fileName, fileData] of Object.entries(unzipped)) {
    // Skip directories
    if (fileName.endsWith('/') || fileData.length === 0) continue;

    // Size check
    totalSize += fileData.length;
    if (totalSize > opts.maxTotalSize) {
      throw new Error(`Total Voxta package size exceeds maximum (${opts.maxTotalSize} bytes)`);
    }

    // 1. Package Metadata
    if (fileName === 'package.json') {
      if (fileData.length > opts.maxFileSize) {
        throw new Error(`package.json exceeds maximum size (${opts.maxFileSize} bytes)`);
      }
      try {
        result.package = JSON.parse(toString(fileData));
      } catch (err) {
        throw new Error(`Failed to parse package.json: ${err instanceof Error ? err.message : String(err)}`);
      }
      continue;
    }

    // 2. Characters - Path: Characters/{uuid}/...
    const charMatch = fileName.match(/^Characters\/([^\/]+)\/(.+)$/);
    if (charMatch) {
      const [, charId, subPath] = charMatch;

      // Ensure map entry exists
      if (!charMap.has(charId)) {
        charMap.set(charId, { id: charId, assets: [] });
      }
      const charEntry = charMap.get(charId)!;

      if (subPath === 'character.json') {
        try {
          charEntry.data = JSON.parse(toString(fileData));
        } catch (err) {
          throw new Error(`Failed to parse character.json for ${charId}: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else if (subPath.startsWith('thumbnail.')) {
        charEntry.thumbnail = fileData;
      } else if (subPath.startsWith('Assets/')) {
        charEntry.assets!.push({
          path: subPath,
          buffer: fileData,
          characterId: charId,
        });
      }
      continue;
    }

    // 3. Scenarios - Path: Scenarios/{uuid}/...
    const scenarioMatch = fileName.match(/^Scenarios\/([^\/]+)\/(.+)$/);
    if (scenarioMatch) {
      const [, scenarioId, subPath] = scenarioMatch;

      if (!scenarioMap.has(scenarioId)) {
        scenarioMap.set(scenarioId, { id: scenarioId });
      }
      const scenarioEntry = scenarioMap.get(scenarioId)!;

      if (subPath === 'scenario.json') {
        try {
          scenarioEntry.data = JSON.parse(toString(fileData));
        } catch (err) {
          throw new Error(`Failed to parse scenario.json for ${scenarioId}: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else if (subPath.startsWith('thumbnail.')) {
        scenarioEntry.thumbnail = fileData;
      }
      continue;
    }

    // 4. Books - Path: Books/{uuid}/...
    const bookMatch = fileName.match(/^Books\/([^\/]+)\/(.+)$/);
    if (bookMatch) {
      const [, bookId, subPath] = bookMatch;

      if (!bookMap.has(bookId)) {
        bookMap.set(bookId, { id: bookId });
      }
      const bookEntry = bookMap.get(bookId)!;

      if (subPath === 'book.json') {
        try {
          bookEntry.data = JSON.parse(toString(fileData));
        } catch (err) {
          throw new Error(`Failed to parse book.json for ${bookId}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      continue;
    }

    // Unknown files are ignored
  }

  // Assemble final results - filter incomplete entries
  for (const [, char] of charMap) {
    if (char.data) {
      result.characters.push(char as ExtractedVoxtaCharacter);
    }
  }

  for (const [, scenario] of scenarioMap) {
    if (scenario.data) {
      result.scenarios.push(scenario as ExtractedVoxtaScenario);
    }
  }

  for (const [, book] of bookMap) {
    if (book.data) {
      result.books.push(book as ExtractedVoxtaBook);
    }
  }

  return result;
}

/**
 * Async version of extractVoxtaPackage
 */
export async function extractVoxtaPackageAsync(
  data: BinaryData,
  options: VoxtaExtractionOptions = {}
): Promise<VoxtaData> {
  // For now, just wrap sync version
  return extractVoxtaPackage(data, options);
}
