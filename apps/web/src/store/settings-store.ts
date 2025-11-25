import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AutoSnapshotSettings {
  enabled: boolean;
  intervalMinutes: number; // 1, 5, 10, 15, 30
}

interface SettingsStore {
  // Auto-snapshot settings
  autoSnapshot: AutoSnapshotSettings;

  // Actions
  setAutoSnapshotEnabled: (enabled: boolean) => void;
  setAutoSnapshotInterval: (minutes: number) => void;
}

const DEFAULT_SETTINGS: AutoSnapshotSettings = {
  enabled: false,
  intervalMinutes: 5,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      autoSnapshot: DEFAULT_SETTINGS,

      setAutoSnapshotEnabled: (enabled) =>
        set((state) => ({
          autoSnapshot: { ...state.autoSnapshot, enabled },
        })),

      setAutoSnapshotInterval: (intervalMinutes) =>
        set((state) => ({
          autoSnapshot: { ...state.autoSnapshot, intervalMinutes },
        })),
    }),
    {
      name: 'card-architect-settings',
    }
  )
);
