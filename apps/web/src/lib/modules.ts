/**
 * Module Loader
 *
 * Handles loading of core features and optional modules based on feature flags.
 * This module should be called during application bootstrap.
 */

import { useSettingsStore } from '../store/settings-store';

/**
 * Module definition for dynamic loading
 */
interface ModuleDefinition {
  id: string;
  featureFlag?: keyof ReturnType<typeof useSettingsStore.getState>['features'];
  loader: () => Promise<void>;
}

/**
 * Available optional modules
 */
const OPTIONAL_MODULES: ModuleDefinition[] = [
  {
    id: 'block-editor',
    featureFlag: 'blockEditorEnabled',
    loader: async () => {
      const { registerBlockEditorModule } = await import('../modules/block-editor');
      registerBlockEditorModule();
    },
  },
  {
    id: 'wwwyzzerdd',
    featureFlag: 'wwwyzzerddEnabled',
    loader: async () => {
      const { registerWwwyzzerddModule } = await import('../modules/wwwyzzerdd');
      registerWwwyzzerddModule();
    },
  },
  {
    id: 'comfyui',
    featureFlag: 'comfyUIEnabled',
    loader: async () => {
      const { registerComfyUIModule } = await import('../modules/comfyui');
      registerComfyUIModule();
    },
  },
];

/**
 * Load core features (always loaded)
 */
async function loadCoreFeatures(): Promise<void> {
  const { registerCoreTabs } = await import('../features/editor/tabs');
  registerCoreTabs();
}

/**
 * Load optional modules based on feature flags
 */
async function loadOptionalModules(): Promise<void> {
  const { features } = useSettingsStore.getState();

  const enabledModules = OPTIONAL_MODULES.filter((module) => {
    if (!module.featureFlag) return true;
    return features[module.featureFlag] === true;
  });

  // Load enabled modules in parallel
  await Promise.all(
    enabledModules.map(async (module) => {
      try {
        await module.loader();
        console.log(`[Modules] Loaded module: ${module.id}`);
      } catch (err) {
        console.error(`[Modules] Failed to load module ${module.id}:`, err);
      }
    })
  );
}

/**
 * Initialize all modules
 *
 * Call this during application bootstrap, before rendering.
 */
export async function initializeModules(): Promise<void> {
  console.log('[Modules] Initializing...');

  // Load core features first
  await loadCoreFeatures();

  // Then load optional modules
  await loadOptionalModules();

  console.log('[Modules] Initialization complete');
}

/**
 * Re-check and load any newly enabled modules
 *
 * Call this when feature flags change to dynamically load new modules.
 * Note: This does not unload disabled modules (requires page refresh).
 */
export async function reloadModules(): Promise<void> {
  await loadOptionalModules();
}
