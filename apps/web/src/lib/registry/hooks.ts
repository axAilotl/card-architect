import { useSyncExternalStore, useCallback, useMemo } from 'react';
import { registry } from './index';
import type { EditorTabDefinition, SettingsPanelDefinition, TabContext } from './types';

/**
 * Hook to get registered editor tabs with automatic re-render on changes
 */
export function useEditorTabs(context: TabContext = 'card'): EditorTabDefinition[] {
  const subscribe = useCallback(
    (callback: () => void) => registry.subscribe(callback),
    []
  );

  const getSnapshot = useCallback(
    () => registry.getTabs(context),
    [context]
  );

  // useSyncExternalStore requires stable references, so we memoize
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook to get registered settings panels
 */
export function useSettingsPanels(): SettingsPanelDefinition[] {
  const subscribe = useCallback(
    (callback: () => void) => registry.subscribe(callback),
    []
  );

  const getSnapshot = useCallback(
    () => registry.getSettingsPanels(),
    []
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook to get a specific tab by ID
 */
export function useEditorTab(id: string): EditorTabDefinition | undefined {
  const subscribe = useCallback(
    (callback: () => void) => registry.subscribe(callback),
    []
  );

  const getSnapshot = useCallback(
    () => registry.getTab(id),
    [id]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook to check if a tab is available (exists and passes condition)
 */
export function useIsTabAvailable(id: string, context: TabContext = 'card'): boolean {
  const tabs = useEditorTabs(context);
  return useMemo(() => tabs.some((tab) => tab.id === id), [tabs, id]);
}

/**
 * Hook to get available tab IDs for validation
 */
export function useAvailableTabIds(context: TabContext = 'card'): string[] {
  const tabs = useEditorTabs(context);
  return useMemo(() => tabs.map((tab) => tab.id), [tabs]);
}
