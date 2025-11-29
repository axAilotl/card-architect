import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AutoSnapshotSettings {
  enabled: boolean;
  intervalMinutes: number; // 1, 5, 10, 15, 30
}

interface CreatorNotesSettings {
  htmlMode: boolean;
}

// Theme definitions
export type ThemeId =
  | 'default-dark'
  | 'bisexual'
  | 'necron'
  | 'dracula'
  | 'sakura'
  | 'solarized-light'
  | 'github-light'
  | 'nord-light';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  isDark: boolean;
  colors: {
    bg: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
    accent: string;
    accentHover: string;
  };
}

export const THEMES: ThemeDefinition[] = [
  // Dark Themes
  {
    id: 'default-dark',
    name: 'Default Dark',
    isDark: true,
    colors: {
      bg: '#0f172a',
      surface: '#1e293b',
      border: '#334155',
      text: '#e2e8f0',
      muted: '#94a3b8',
      accent: '#3b82f6',
      accentHover: '#2563eb',
    },
  },
  {
    id: 'bisexual',
    name: 'Bisexual',
    isDark: true,
    colors: {
      bg: '#1a1625',
      surface: '#2d2640',
      border: '#4a3d6a',
      text: '#e8e0f0',
      muted: '#a090c0',
      accent: '#d459ab',
      accentHover: '#9b4dca',
    },
  },
  {
    id: 'necron',
    name: 'Necron',
    isDark: true,
    colors: {
      bg: '#0a0f0a',
      surface: '#141a14',
      border: '#1e2e1e',
      text: '#00ff00',
      muted: '#4a7a4a',
      accent: '#00cc00',
      accentHover: '#00aa00',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    isDark: true,
    colors: {
      bg: '#282a36',
      surface: '#44475a',
      border: '#6272a4',
      text: '#f8f8f2',
      muted: '#6272a4',
      accent: '#bd93f9',
      accentHover: '#ff79c6',
    },
  },
  // Light Themes
  {
    id: 'sakura',
    name: 'Sakura',
    isDark: false,
    colors: {
      bg: '#fff5f7',
      surface: '#fff0f3',
      border: '#ffc0cb',
      text: '#4a2c3d',
      muted: '#8b6b7a',
      accent: '#e75480',
      accentHover: '#c94670',
    },
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    isDark: false,
    colors: {
      bg: '#fdf6e3',
      surface: '#eee8d5',
      border: '#93a1a1',
      text: '#657b83',
      muted: '#839496',
      accent: '#268bd2',
      accentHover: '#2aa198',
    },
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    isDark: false,
    colors: {
      bg: '#ffffff',
      surface: '#f6f8fa',
      border: '#d0d7de',
      text: '#24292f',
      muted: '#57606a',
      accent: '#0969da',
      accentHover: '#0550ae',
    },
  },
  {
    id: 'nord-light',
    name: 'Nord Light',
    isDark: false,
    colors: {
      bg: '#eceff4',
      surface: '#e5e9f0',
      border: '#d8dee9',
      text: '#2e3440',
      muted: '#4c566a',
      accent: '#5e81ac',
      accentHover: '#81a1c1',
    },
  },
];

interface ThemeSettings {
  themeId: ThemeId;
  customCss: string;
  backgroundImage: string;
  useCardAsBackground: boolean;
}

interface EditorSettings {
  showV3Fields: boolean;
  exportSpec: 'v2' | 'v3';
  showExtensionsTab: boolean;
  extendedFocusedFields: {
    personality: boolean;
    appearance: boolean;
    characterNote: boolean;
    exampleDialogue: boolean;
    systemPrompt: boolean;
    postHistory: boolean;
  };
}

interface SettingsStore {
  // Auto-snapshot settings
  autoSnapshot: AutoSnapshotSettings;

  // Creator Notes settings
  creatorNotes: CreatorNotesSettings;

  // Theme settings
  theme: ThemeSettings;

  // Editor settings
  editor: EditorSettings;

  // Actions
  setAutoSnapshotEnabled: (enabled: boolean) => void;
  setAutoSnapshotInterval: (minutes: number) => void;
  setCreatorNotesHtmlMode: (enabled: boolean) => void;

  // Theme actions
  setTheme: (themeId: ThemeId) => void;
  setCustomCss: (css: string) => void;
  setBackgroundImage: (url: string) => void;
  setUseCardAsBackground: (enabled: boolean) => void;

  // Editor actions
  setShowV3Fields: (show: boolean) => void;
  setExportSpec: (spec: 'v2' | 'v3') => void;
  setShowExtensionsTab: (show: boolean) => void;
  setExtendedFocusedField: (field: keyof EditorSettings['extendedFocusedFields'], enabled: boolean) => void;
}

const DEFAULT_AUTO_SNAPSHOT: AutoSnapshotSettings = {
  enabled: false,
  intervalMinutes: 5,
};

const DEFAULT_CREATOR_NOTES: CreatorNotesSettings = {
  htmlMode: false,
};

const DEFAULT_THEME: ThemeSettings = {
  themeId: 'default-dark',
  customCss: '',
  backgroundImage: '',
  useCardAsBackground: false,
};

const DEFAULT_EDITOR: EditorSettings = {
  showV3Fields: true,
  exportSpec: 'v3',
  showExtensionsTab: true,
  extendedFocusedFields: {
    personality: true,
    appearance: true,
    characterNote: true,
    exampleDialogue: true,
    systemPrompt: true,
    postHistory: true,
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      autoSnapshot: DEFAULT_AUTO_SNAPSHOT,
      creatorNotes: DEFAULT_CREATOR_NOTES,
      theme: DEFAULT_THEME,
      editor: DEFAULT_EDITOR,

      setAutoSnapshotEnabled: (enabled) =>
        set((state) => ({
          autoSnapshot: { ...state.autoSnapshot, enabled },
        })),

      setAutoSnapshotInterval: (intervalMinutes) =>
        set((state) => ({
          autoSnapshot: { ...state.autoSnapshot, intervalMinutes },
        })),

      setCreatorNotesHtmlMode: (htmlMode) =>
        set((state) => ({
          creatorNotes: { ...state.creatorNotes, htmlMode },
        })),

      setTheme: (themeId) =>
        set((state) => ({
          theme: { ...state.theme, themeId },
        })),

      setCustomCss: (customCss) =>
        set((state) => ({
          theme: { ...state.theme, customCss },
        })),

      setBackgroundImage: (backgroundImage) =>
        set((state) => ({
          theme: { ...state.theme, backgroundImage },
        })),

      setUseCardAsBackground: (useCardAsBackground) =>
        set((state) => ({
          theme: { ...state.theme, useCardAsBackground },
        })),

      setShowV3Fields: (showV3Fields) =>
        set((state) => ({
          editor: { ...state.editor, showV3Fields },
        })),

      setExportSpec: (exportSpec) =>
        set((state) => ({
          editor: { ...state.editor, exportSpec },
        })),

      setShowExtensionsTab: (showExtensionsTab) =>
        set((state) => ({
          editor: { ...state.editor, showExtensionsTab },
        })),

      setExtendedFocusedField: (field, enabled) =>
        set((state) => ({
          editor: {
            ...state.editor,
            extendedFocusedFields: {
              ...state.editor.extendedFocusedFields,
              [field]: enabled,
            },
          },
        })),
    }),
    {
      name: 'card-architect-settings',
    }
  )
);
