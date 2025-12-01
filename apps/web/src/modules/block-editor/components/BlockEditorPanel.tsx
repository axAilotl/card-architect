/**
 * BlockEditorPanel
 *
 * Main panel component for the block-based character card editor.
 * Provides a toolbar and hosts the block hierarchy.
 */

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useBlockEditorStore } from '../store';
import { BlockComponent } from './BlockComponent';
import { useCardStore } from '../../../store/card-store';

export function BlockEditorPanel() {
  const store = useBlockEditorStore();
  const blocks = store.blocks;
  const templates = store.templates;

  const currentCard = useCardStore((s) => s.currentCard);
  const updateCardData = useCardStore((s) => s.updateCardData);

  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      store.reorderBlocks(null, oldIndex, newIndex);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    store.saveTemplate(templateName.trim());
    setTemplateName('');
    setShowTemplates(false);
  };

  const handleApplyToCard = () => {
    if (!currentCard) return;

    // Group blocks by target field
    const fieldContent: Record<string, string[]> = {};

    const processBlock = (block: typeof blocks[0], depth = 0) => {
      const field = block.targetField;
      if (!fieldContent[field]) {
        fieldContent[field] = [];
      }

      // Add heading if block has a label
      if (block.label) {
        const heading = '#'.repeat(Math.min(depth + 1, 6)) + ' ' + block.label;
        fieldContent[field].push(heading);
      }

      // Process babies
      for (const baby of block.babies) {
        if (baby.type === 'text') {
          fieldContent[field].push(baby.content);
        } else if (baby.type === 'flat' || baby.type === 'flat-nested') {
          // Flat list items
          for (const item of baby.items) {
            if (typeof item === 'string') {
              fieldContent[field].push(`- ${item}`);
            } else if ('split' in item) {
              const header = item.bold ? `**${item.header}**` : item.header;
              fieldContent[field].push(`- ${header}: ${item.body}`);
            }
          }

          // Nested groups
          if (baby.type === 'flat-nested' && baby.groups) {
            for (const group of baby.groups) {
              for (const item of group) {
                if (typeof item === 'string') {
                  fieldContent[field].push(`  - ${item}`);
                } else if ('split' in item) {
                  const header = item.bold ? `**${item.header}**` : item.header;
                  fieldContent[field].push(`  - ${header}: ${item.body}`);
                }
              }
            }
          }
        }
      }

      // Process children
      for (const child of block.children) {
        processBlock(child, depth + 1);
      }

      // Add empty line after block
      fieldContent[field].push('');
    };

    for (const block of blocks) {
      processBlock(block);
    }

    // Build updates object
    const fieldUpdates: Record<string, string> = {};
    for (const [field, lines] of Object.entries(fieldContent)) {
      fieldUpdates[field] = lines.join('\n').trim();
    }

    if (Object.keys(fieldUpdates).length > 0) {
      // Wrap in data for proper card structure
      // The updateCardData function will deep merge this with existing data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateCardData({ data: fieldUpdates } as any);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 bg-slate-800 border-b border-slate-700">
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium transition-colors hover:bg-indigo-500"
          onClick={() => store.addBlock(null, 1)}
        >
          + Add Block
        </button>

        <div className="flex-1" />

        <button
          className="px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg font-medium transition-colors hover:bg-slate-600 hover:border-slate-500"
          onClick={() => setShowTemplates(!showTemplates)}
        >
          Templates
        </button>

        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium transition-colors hover:bg-green-500"
          onClick={handleApplyToCard}
          disabled={blocks.length === 0}
          title="Apply block content to character card"
        >
          Apply to Card
        </button>

        <button
          className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/40 rounded-lg font-medium transition-colors hover:bg-red-600 hover:text-white"
          onClick={() => {
            if (confirm('Clear all blocks?')) {
              store.clearBlocks();
            }
          }}
        >
          Clear All
        </button>
      </div>

      {/* Template panel */}
      {showTemplates && (
        <div className="p-4 bg-slate-800/50 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              className="flex-1 px-3 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:outline-none focus:border-indigo-500"
            />
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium transition-colors hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || blocks.length === 0}
            >
              Save Template
            </button>
          </div>

          {templates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg"
                >
                  <span className="text-slate-200 text-sm">{template.name}</span>
                  <button
                    className="px-2 py-1 bg-indigo-600 text-white text-xs rounded transition-colors hover:bg-indigo-500"
                    onClick={() => store.loadTemplate(template.id)}
                  >
                    Load
                  </button>
                  <button
                    className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded transition-colors hover:bg-red-600 hover:text-white"
                    onClick={() => store.deleteTemplate(template.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {templates.length === 0 && (
            <p className="text-slate-400 text-sm">No saved templates yet.</p>
          )}
        </div>
      )}

      {/* Block list */}
      <div className="flex-1 overflow-auto p-4">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">No blocks yet</h3>
            <p className="text-sm mb-4">Click "Add Block" to start building your character card</p>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium transition-colors hover:bg-indigo-500"
              onClick={() => store.addBlock(null, 1)}
            >
              + Add Your First Block
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-4">
                {blocks.map((block) => (
                  <BlockComponent key={block.id} block={block} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-t border-slate-700 text-sm text-slate-400">
        <span>
          {blocks.length} block{blocks.length !== 1 ? 's' : ''}
        </span>
        <span>Drag blocks and items to reorder</span>
      </div>
    </div>
  );
}
