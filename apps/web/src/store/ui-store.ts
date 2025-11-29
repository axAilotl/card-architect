import { create } from 'zustand';

interface UIStore {
  // Editor UI State
  activeTab: 'edit' | 'preview' | 'diff' | 'simulator' | 'redundancy' | 'lore-trigger' | 'focused' | 'assets';
  showAdvanced: boolean;

  // Actions
  setActiveTab: (
    tab: 'edit' | 'preview' | 'diff' | 'simulator' | 'redundancy' | 'lore-trigger' | 'focused' | 'assets'
  ) => void;
  setShowAdvanced: (show: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'edit',
  showAdvanced: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowAdvanced: (show) => set({ showAdvanced: show }),
}));
