/**
 * wwwyzzerdd Module Registration
 *
 * AI-assisted character creation wizard.
 * Registers the wwwyzzerdd tab when enabled.
 */

import { lazy } from 'react';
import { registry } from '../../lib/registry';
import { useSettingsStore } from '../../store/settings-store';

// Lazy-load the component
const WwwyzzerddTab = lazy(() =>
  import('../../features/wwwyzzerdd/WwwyzzerddTab').then((m) => ({
    default: m.WwwyzzerddTab,
  }))
);

/**
 * Register the wwwyzzerdd module
 */
export function registerWwwyzzerddModule(): void {
  registry.registerTab({
    id: 'wwwyzzerdd',
    label: 'wwwyzzerdd',
    component: WwwyzzerddTab,
    color: 'purple',
    order: 30, // After Edit (0), Assets (10), Focused (20)
    contexts: ['card'],
    condition: () => useSettingsStore.getState().features?.wwwyzzerddEnabled ?? false,
  });

  console.log('[wwwyzzerdd] Module registered');
}

/**
 * Unregister the wwwyzzerdd module
 */
export function unregisterWwwyzzerddModule(): void {
  registry.unregisterTab('wwwyzzerdd');
  console.log('[wwwyzzerdd] Module unregistered');
}
