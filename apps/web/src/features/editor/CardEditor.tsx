import { Suspense } from 'react';
import { useUIStore } from '../../store/ui-store';
import { useEditorTabs, useAvailableTabIds } from '../../lib/registry/hooks';
import { EditorTabs } from './components/EditorTabs';
import { useAutoSnapshot } from '../../hooks/useAutoSnapshot';
import type { TabContext } from '../../lib/registry/types';

interface CardEditorProps {
  context?: TabContext;
}

/**
 * Loading spinner for lazy-loaded tab components
 */
function TabLoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  );
}

export function CardEditor({ context = 'card' }: CardEditorProps) {
  const activeTab = useUIStore((state) => state.activeTab);
  const tabs = useEditorTabs(context);
  const availableTabIds = useAvailableTabIds(context);

  // Enable auto-snapshot functionality
  useAutoSnapshot();

  // Find the effective active tab (fallback to first if current is not available)
  const effectiveActiveTab = availableTabIds.includes(activeTab)
    ? activeTab
    : availableTabIds[0] ?? 'edit';

  // Find the current tab definition
  const currentTabDef = tabs.find((tab) => tab.id === effectiveActiveTab);

  return (
    <div className="h-full flex flex-col">
      <EditorTabs context={context} />

      <div className="flex-1 overflow-auto relative">
        <Suspense fallback={<TabLoadingSpinner />}>
          {currentTabDef && <currentTabDef.component />}
        </Suspense>
      </div>
    </div>
  );
}
