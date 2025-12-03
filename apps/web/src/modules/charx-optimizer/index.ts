/**
 * CHARX Optimizer Module Registration
 *
 * Image optimization for CHARX and Voxta exports.
 * This module is always enabled as it applies to all exports.
 */

import { lazy } from 'react';
import { registry } from '../../lib/registry';
import { useSettingsStore } from '../../store/settings-store';
import type { ModuleDefinition } from '../../lib/registry/types';

/**
 * Module metadata for auto-discovery
 */
export const MODULE_METADATA: ModuleDefinition = {
  id: 'charx-optimizer',
  name: 'CHARX Optimizer',
  description: 'Optimize images during CHARX/Voxta export with WebP conversion.',
  defaultEnabled: true,
  badge: 'Export',
  color: 'purple',
  order: 45,
};

// Lazy-load the settings component
const CharxOptimizerSettings = lazy(() =>
  import('./settings/CharxOptimizerSettings').then((m) => ({
    default: m.CharxOptimizerSettings,
  }))
);

/**
 * Register the CHARX Optimizer module
 */
export function registerCharxOptimizerModule(): void {
  // Register settings panel
  registry.registerSettingsPanel({
    id: 'charx-optimizer',
    label: 'CHARX Optimizer',
    component: CharxOptimizerSettings,
    row: 'modules',
    color: 'purple',
    order: 65, // After Web Import (60), before SillyTavern (70)
    condition: () => useSettingsStore.getState().features?.charxOptimizerEnabled ?? true,
  });

  console.log('[charx-optimizer] Module registered (settings panel)');
}

/**
 * Unregister the CHARX Optimizer module
 */
export function unregisterCharxOptimizerModule(): void {
  registry.unregisterSettingsPanel('charx-optimizer');
  console.log('[charx-optimizer] Module unregistered');
}
