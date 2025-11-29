/**
 * CHARX Validation
 *
 * Validates CHARX structure and content.
 * Does not require filesystem access - works with in-memory data.
 */

import type { CharxData, CharxValidationResult, CCv3Data } from '@card-architect/schemas';
import type { CharxWriteAsset } from './writer.js';

/**
 * Validate an extracted CHARX structure
 */
export function validateCharx(data: CharxData): CharxValidationResult {
  const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];

  // Check for main icon
  const hasMainIcon = data.card.data.assets?.some(
    (a) => a.type === 'icon' && a.name === 'main'
  ) ?? false;

  if (!hasMainIcon) {
    errors.push({
      field: 'assets',
      message: 'No main icon asset found. At least one asset with type="icon" and name="main" is recommended.',
      severity: 'warning',
    });
  }

  // Count assets
  const assetCount = data.card.data.assets?.length ?? 0;

  // Calculate total size
  const totalSize = data.assets.reduce((sum, asset) => {
    return sum + (asset.buffer?.length ?? 0);
  }, 0);

  // Find missing assets
  const missingAssets = data.assets
    .filter((a) => a.descriptor.uri.startsWith('embeded://') && !a.buffer)
    .map((a) => a.path);

  if (missingAssets.length > 0) {
    errors.push({
      field: 'assets',
      message: `Missing ${missingAssets.length} asset(s): ${missingAssets.join(', ')}`,
      severity: 'error',
    });
  }

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
    hasMainIcon,
    assetCount,
    totalSize,
    missingAssets,
  };
}

/**
 * Validate assets before building CHARX
 */
export function validateCharxBuild(
  card: CCv3Data,
  assets: CharxWriteAsset[]
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for CCv3 spec
  if (card.spec !== 'chara_card_v3') {
    errors.push('Card must be CCv3 format for CHARX export');
  }

  // Check for at least one asset
  if (assets.length === 0) {
    warnings.push('CHARX files should contain at least one asset');
  }

  // Check for main icon
  const hasMainIcon = assets.some((a) => a.type === 'icon' && a.isMain);
  if (!hasMainIcon && assets.length > 0) {
    warnings.push('CHARX files should have a main icon asset');
  }

  // Check for duplicate names within same type
  const namesByType = new Map<string, Set<string>>();
  for (const asset of assets) {
    const typeNames = namesByType.get(asset.type) || new Set();
    if (typeNames.has(asset.name)) {
      warnings.push(`Duplicate asset name "${asset.name}" in type "${asset.type}"`);
    }
    typeNames.add(asset.name);
    namesByType.set(asset.type, typeNames);
  }

  // Check for empty buffers
  const emptyAssets = assets.filter((a) => a.data.length === 0);
  if (emptyAssets.length > 0) {
    errors.push(`${emptyAssets.length} asset(s) have empty data: ${emptyAssets.map(a => a.name).join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Normalize asset order for deterministic export
 * Returns assets sorted by type, then name
 */
export function normalizeAssetOrder<T extends { type: string; name: string }>(assets: T[]): T[] {
  return [...assets].sort((a, b) => {
    // Sort by type first
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    // Then by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Deduplicate asset names by appending index
 */
export function deduplicateAssetNames<T extends { name: string }>(assets: T[]): T[] {
  const nameCount = new Map<string, number>();

  return assets.map((asset) => {
    const baseName = asset.name;
    const count = nameCount.get(baseName) || 0;
    nameCount.set(baseName, count + 1);

    if (count > 0) {
      return {
        ...asset,
        name: `${baseName}_${count}`,
      };
    }
    return asset;
  });
}
