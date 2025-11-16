import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Template, Snippet, UUID } from '@card-architect/schemas';
import { defaultTemplates, defaultSnippets } from '../lib/default-templates';

interface TemplateStore {
  templates: Template[];
  snippets: Snippet[];

  // Template operations
  getTemplate: (id: UUID) => Template | undefined;
  createTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => Template;
  updateTemplate: (id: UUID, updates: Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteTemplate: (id: UUID) => void;

  // Snippet operations
  getSnippet: (id: UUID) => Snippet | undefined;
  createSnippet: (snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => Snippet;
  updateSnippet: (id: UUID, updates: Partial<Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteSnippet: (id: UUID) => void;

  // Import/Export
  exportTemplates: () => string;
  exportSnippets: () => string;
  importTemplates: (json: string) => void;
  importSnippets: (json: string) => void;

  // Reset to defaults
  resetToDefaults: () => void;
}

function generateId(): UUID {
  // Fallback for browsers that don't support crypto.randomUUID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Polyfill UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getISOString(): string {
  return new Date().toISOString();
}

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      templates: defaultTemplates,
      snippets: defaultSnippets,

      // Template operations
      getTemplate: (id) => {
        return get().templates.find((t) => t.id === id);
      },

      createTemplate: (template) => {
        const newTemplate: Template = {
          ...template,
          id: generateId(),
          createdAt: getISOString(),
          updatedAt: getISOString(),
        };
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
        return newTemplate;
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: getISOString() }
              : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      // Snippet operations
      getSnippet: (id) => {
        return get().snippets.find((s) => s.id === id);
      },

      createSnippet: (snippet) => {
        const newSnippet: Snippet = {
          ...snippet,
          id: generateId(),
          createdAt: getISOString(),
          updatedAt: getISOString(),
        };
        set((state) => ({
          snippets: [...state.snippets, newSnippet],
        }));
        return newSnippet;
      },

      updateSnippet: (id, updates) => {
        set((state) => ({
          snippets: state.snippets.map((s) =>
            s.id === id
              ? { ...s, ...updates, updatedAt: getISOString() }
              : s
          ),
        }));
      },

      deleteSnippet: (id) => {
        set((state) => ({
          snippets: state.snippets.filter((s) => s.id !== id),
        }));
      },

      // Import/Export
      exportTemplates: () => {
        return JSON.stringify(get().templates, null, 2);
      },

      exportSnippets: () => {
        return JSON.stringify(get().snippets, null, 2);
      },

      importTemplates: (json) => {
        try {
          const imported = JSON.parse(json) as Template[];
          set((state) => ({
            templates: [...state.templates, ...imported],
          }));
        } catch (error) {
          console.error('Failed to import templates:', error);
          throw new Error('Invalid JSON format');
        }
      },

      importSnippets: (json) => {
        try {
          const imported = JSON.parse(json) as Snippet[];
          set((state) => ({
            snippets: [...state.snippets, ...imported],
          }));
        } catch (error) {
          console.error('Failed to import snippets:', error);
          throw new Error('Invalid JSON format');
        }
      },

      // Reset to defaults
      resetToDefaults: () => {
        set({
          templates: defaultTemplates,
          snippets: defaultSnippets,
        });
      },
    }),
    {
      name: 'template-storage',
    }
  )
);
