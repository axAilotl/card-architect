/**
 * Block Editor Module Registration
 *
 * Block-based character card editor.
 * Registers the block-editor tab when enabled.
 */

import { lazy } from 'react';
import { registry } from '../../lib/registry';
import { useSettingsStore } from '../../store/settings-store';

// Lazy-load the component
const BlockEditorPanel = lazy(() =>
  import('./components/BlockEditorPanel').then((m) => ({
    default: m.BlockEditorPanel,
  }))
);

/**
 * Register the block editor module
 */
export function registerBlockEditorModule(): void {
  registry.registerTab({
    id: 'block-editor',
    label: 'Blocks',
    component: BlockEditorPanel,
    color: 'orange',
    order: 25, // After Edit (0), Assets (10), Focused (20), before wwwyzzerdd (30)
    contexts: ['card'],
    condition: () => useSettingsStore.getState().features?.blockEditorEnabled ?? true, // Enabled by default for now
  });

  console.log('[block-editor] Module registered');
}

/**
 * Unregister the block editor module
 */
export function unregisterBlockEditorModule(): void {
  registry.unregisterTab('block-editor');
  console.log('[block-editor] Module unregistered');
}
