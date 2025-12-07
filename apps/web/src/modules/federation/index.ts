/**
 * Federation Module Registration
 *
 * Enables bi-directional sync between Character Architect and other platforms:
 * - SillyTavern (via CForge plugin)
 * - CardsHub
 * - Character Archive
 *
 * This module is only available in full/light modes (not static).
 */

import { lazy } from 'react';
import { registry } from '../../lib/registry';
import { useSettingsStore } from '../../store/settings-store';
import { getModuleDefault } from '../../config/deployment';
import type { ModuleDefinition } from '../../lib/registry/types';

/**
 * Module metadata for auto-discovery
 */
export const MODULE_METADATA: ModuleDefinition = {
  id: 'federation',
  name: 'Federation',
  description: 'Sync character cards across SillyTavern, CardsHub, and Character Archive.',
  defaultEnabled: false,
  badge: 'Sync',
  color: 'cyan',
  order: 60,
};

// Lazy-load the settings component
const FederationSettings = lazy(() =>
  import('./settings/FederationSettings').then((m) => ({
    default: m.FederationSettings,
  }))
);

/**
 * Register the Federation module
 */
export function registerFederationModule(): void {
  // Register settings panel
  registry.registerSettingsPanel({
    id: 'federation',
    label: 'Federation',
    component: FederationSettings,
    row: 'modules',
    color: 'cyan',
    order: 80,
    condition: () => {
      const featureFlag = useSettingsStore.getState().features?.federationEnabled;
      // If user has explicitly set the flag, use that; otherwise use deployment default
      return featureFlag !== undefined ? featureFlag : getModuleDefault('federation');
    },
  });

  console.log('[federation] Module registered (settings panel)');
}

/**
 * Unregister the Federation module
 */
export function unregisterFederationModule(): void {
  registry.unregisterSettingsPanel('federation');
  console.log('[federation] Module unregistered');
}

// Re-export the store for use in other components
export { useFederationStore } from './lib/federation-store';
export type { PlatformId, CardSyncState, SyncResult } from './lib/types';
