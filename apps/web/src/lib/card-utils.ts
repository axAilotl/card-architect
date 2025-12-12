import type { Card, CCv2Data, CCv3Data } from './types';

/**
 * Extract actual card data fields from card.data, handling both wrapped and unwrapped formats
 * V2 can be: { spec, spec_version, data: {...} } or just {...}
 * V3 is always: { spec, spec_version, data: {...} }
 * Lorebook and Collection cards use V3 structure internally
 */
export function extractCardData(card: Card): CCv2Data | CCv3Data['data'] {
  const data = card.data as any;

  // Check if data has V3 wrapper structure (spec: 'chara_card_v3' with nested data)
  if (data?.spec === 'chara_card_v3' && data.data) {
    return data.data;
  }

  // Check if data has V2 wrapper structure
  if (data?.spec === 'chara_card_v2' && data.data) {
    return data.data as CCv2Data;
  }

  // Unwrapped/legacy format - return as-is with fallback
  return data || { name: 'Unknown' } as CCv2Data;
}
