/**
 * ComfyUI Module Registration
 *
 * Image generation via ComfyUI integration.
 * Registers the ComfyUI tab when enabled.
 */

import { lazy } from 'react';
import { registry } from '../../lib/registry';
import { useSettingsStore } from '../../store/settings-store';

// Lazy-load the component
const ComfyUITab = lazy(() =>
  import('../../features/comfyui/ComfyUITab').then((m) => ({
    default: m.ComfyUITab,
  }))
);

/**
 * Register the ComfyUI module
 */
export function registerComfyUIModule(): void {
  registry.registerTab({
    id: 'comfyui',
    label: 'ComfyUI',
    component: ComfyUITab,
    color: 'green',
    order: 40, // After wwwyzzerdd (30)
    contexts: ['card'],
    condition: () => useSettingsStore.getState().features?.comfyUIEnabled ?? false,
  });

  console.log('[ComfyUI] Module registered');
}

/**
 * Unregister the ComfyUI module
 */
export function unregisterComfyUIModule(): void {
  registry.unregisterTab('comfyui');
  console.log('[ComfyUI] Module unregistered');
}
