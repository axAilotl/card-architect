import type {
  EditorTabDefinition,
  SettingsPanelDefinition,
  SidebarSectionDefinition,
  HeaderActionDefinition,
  PluginManifest,
  TabContext,
} from './types';

/**
 * UI Registry - Central registry for plugin contributions
 *
 * Manages editor tabs, settings panels, sidebar sections, and header actions.
 * Supports dynamic registration/unregistration and change notifications.
 */
class UIRegistry {
  private tabs = new Map<string, EditorTabDefinition>();
  private settingsPanels = new Map<string, SettingsPanelDefinition>();
  private sidebarSections = new Map<string, SidebarSectionDefinition>();
  private headerActions = new Map<string, HeaderActionDefinition>();
  private plugins = new Map<string, PluginManifest>();
  private listeners = new Set<() => void>();

  // Cache for memoization - invalidated on any change
  private tabsCache: Map<string, EditorTabDefinition[]> = new Map();
  private settingsPanelsCache: SettingsPanelDefinition[] | null = null;

  // ==================== Tabs ====================

  registerTab(definition: EditorTabDefinition): void {
    if (this.tabs.has(definition.id)) {
      console.warn(`[Registry] Tab "${definition.id}" already registered, overwriting`);
    }
    this.tabs.set(definition.id, definition);
    this.invalidateCache();
    this.notifyListeners();
  }

  unregisterTab(id: string): void {
    if (this.tabs.delete(id)) {
      this.invalidateCache();
      this.notifyListeners();
    }
  }

  getTabs(context: TabContext = 'card'): EditorTabDefinition[] {
    // Check cache first
    const cacheKey = context;
    if (this.tabsCache.has(cacheKey)) {
      return this.tabsCache.get(cacheKey)!;
    }

    const result = Array.from(this.tabs.values())
      .filter((tab) => {
        // Check condition
        if (tab.condition && !tab.condition()) return false;
        // Check context
        if (tab.contexts && tab.contexts.length > 0) {
          if (!tab.contexts.includes(context) && !tab.contexts.includes('all')) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

    this.tabsCache.set(cacheKey, result);
    return result;
  }

  getTab(id: string): EditorTabDefinition | undefined {
    return this.tabs.get(id);
  }

  // ==================== Settings Panels ====================

  registerSettingsPanel(definition: SettingsPanelDefinition): void {
    if (this.settingsPanels.has(definition.id)) {
      console.warn(`[Registry] Settings panel "${definition.id}" already registered, overwriting`);
    }
    this.settingsPanels.set(definition.id, definition);
    this.invalidateCache();
    this.notifyListeners();
  }

  unregisterSettingsPanel(id: string): void {
    if (this.settingsPanels.delete(id)) {
      this.invalidateCache();
      this.notifyListeners();
    }
  }

  getSettingsPanels(): SettingsPanelDefinition[] {
    if (this.settingsPanelsCache) {
      return this.settingsPanelsCache;
    }

    const result = Array.from(this.settingsPanels.values())
      .filter((panel) => !panel.condition || panel.condition())
      .sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

    this.settingsPanelsCache = result;
    return result;
  }

  getSettingsPanel(id: string): SettingsPanelDefinition | undefined {
    return this.settingsPanels.get(id);
  }

  // ==================== Sidebar Sections ====================

  registerSidebarSection(definition: SidebarSectionDefinition): void {
    this.sidebarSections.set(definition.id, definition);
    this.invalidateCache();
    this.notifyListeners();
  }

  unregisterSidebarSection(id: string): void {
    if (this.sidebarSections.delete(id)) {
      this.invalidateCache();
      this.notifyListeners();
    }
  }

  getSidebarSections(position?: 'top' | 'bottom'): SidebarSectionDefinition[] {
    return Array.from(this.sidebarSections.values())
      .filter((section) => {
        if (section.condition && !section.condition()) return false;
        if (position && section.position !== position) return false;
        return true;
      })
      .sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
  }

  // ==================== Header Actions ====================

  registerHeaderAction(definition: HeaderActionDefinition): void {
    this.headerActions.set(definition.id, definition);
    this.invalidateCache();
    this.notifyListeners();
  }

  unregisterHeaderAction(id: string): void {
    if (this.headerActions.delete(id)) {
      this.invalidateCache();
      this.notifyListeners();
    }
  }

  getHeaderActions(): HeaderActionDefinition[] {
    return Array.from(this.headerActions.values())
      .filter((action) => !action.condition || action.condition())
      .sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
  }

  // ==================== Plugin Management ====================

  async registerPlugin(manifest: PluginManifest): Promise<void> {
    if (this.plugins.has(manifest.id)) {
      console.warn(`[Registry] Plugin "${manifest.id}" already registered`);
      return;
    }

    // Register all contributions
    manifest.tabs?.forEach((tab) => this.registerTab(tab));
    manifest.settingsPanels?.forEach((panel) => this.registerSettingsPanel(panel));
    manifest.sidebarSections?.forEach((section) => this.registerSidebarSection(section));
    manifest.headerActions?.forEach((action) => this.registerHeaderAction(action));

    // Call activation hook
    if (manifest.onActivate) {
      await manifest.onActivate();
    }

    this.plugins.set(manifest.id, manifest);
    console.log(`[Registry] Plugin "${manifest.name}" v${manifest.version} registered`);
  }

  async unregisterPlugin(pluginId: string): Promise<void> {
    const manifest = this.plugins.get(pluginId);
    if (!manifest) return;

    // Call deactivation hook
    if (manifest.onDeactivate) {
      await manifest.onDeactivate();
    }

    // Remove all contributions
    manifest.tabs?.forEach((tab) => this.unregisterTab(tab.id));
    manifest.settingsPanels?.forEach((panel) => this.unregisterSettingsPanel(panel.id));
    manifest.sidebarSections?.forEach((section) => this.unregisterSidebarSection(section.id));
    manifest.headerActions?.forEach((action) => this.unregisterHeaderAction(action.id));

    this.plugins.delete(pluginId);
    console.log(`[Registry] Plugin "${manifest.name}" unregistered`);
  }

  getPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(id: string): PluginManifest | undefined {
    return this.plugins.get(id);
  }

  // ==================== Change Notification ====================

  /**
   * Subscribe to registry changes
   * @returns Unsubscribe function
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Force re-evaluation of all conditions and notify listeners
   * Call this when feature flags or other external state changes
   */
  invalidateAndNotify(): void {
    this.invalidateCache();
    this.notifyListeners();
  }

  private invalidateCache(): void {
    this.tabsCache.clear();
    this.settingsPanelsCache = null;
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[Registry] Listener error:', err);
      }
    });
  }

  // ==================== Debug ====================

  getStats(): { tabs: number; settingsPanels: number; sidebarSections: number; headerActions: number; plugins: number } {
    return {
      tabs: this.tabs.size,
      settingsPanels: this.settingsPanels.size,
      sidebarSections: this.sidebarSections.size,
      headerActions: this.headerActions.size,
      plugins: this.plugins.size,
    };
  }
}

// Singleton instance
export const registry = new UIRegistry();

// Re-export types
export * from './types';
