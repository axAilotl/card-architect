/**
 * BlockComponent
 *
 * Main block component (equivalent to BeastBox).
 * Supports nested hierarchies, drag-drop, and content babies.
 */

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { SortableBaby } from './SortableBaby';
import { SortableListItem } from './SortableListItem';
import type { Block, Baby } from '../types';
import { V2_FIELDS, V3_FIELDS } from '../types';

interface BlockComponentProps {
  block: Block;
}

export function BlockComponent({ block }: BlockComponentProps) {
  const store = useBlockEditorStore();
  const specVersion = useBlockEditorStore((s) => s.specVersion);
  const CURRENT_FIELDS = specVersion === 'v3' ? V3_FIELDS : V2_FIELDS;

  const [isEditing, setIsEditing] = useState(!block.label);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleBabyDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = block.babies.findIndex((b) => b.id === active.id);
    const newIndex = block.babies.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      store.reorderBabies(block.id, oldIndex, newIndex);
    }
  };

  const handleListItemDragEnd = (babyId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = parseInt((active.id as string).split('-')[1]);
    const newIndex = parseInt((over.id as string).split('-')[1]);

    store.moveListItem(block.id, babyId, oldIndex, newIndex);
  };

  const levelColors: Record<number, string> = {
    1: 'border-l-indigo-500',
    2: 'border-l-purple-500',
    3: 'border-l-pink-500',
    4: 'border-l-amber-500',
  };

  const levelColor = levelColors[block.level] || 'border-l-slate-500';
  const marginLeft = `${(block.level - 1) * 30}px`;

  const renderBabyContent = (baby: Baby) => {
    if (baby.type === 'text') {
      return (
        <div className="flex flex-col gap-2">
          <textarea
            value={baby.content || ''}
            onChange={(e) => store.updateBaby(block.id, baby.id, { content: e.target.value })}
            placeholder="Enter text content..."
            className="w-full min-h-20 p-3 bg-slate-800 text-slate-200 border border-slate-600 rounded-lg text-sm font-sans resize-y focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            rows={3}
          />
        </div>
      );
    }

    if (baby.type === 'flat' || baby.type === 'flat-nested') {
      return (
        <div className="flex flex-col gap-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleListItemDragEnd(baby.id)}
          >
            <SortableContext
              items={baby.items.map((_, idx) => `item-${idx}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {baby.items.map((item, index) => (
                  <SortableListItem
                    key={index}
                    id={`item-${index}`}
                    item={item}
                    index={index}
                    babyType={baby.type as 'flat' | 'flat-nested'}
                    onToggleBold={() => store.toggleListItemBold(block.id, baby.id, index)}
                    onUpdateHeader={(value) => store.updateListItemHeader(block.id, baby.id, index, value)}
                    onUpdateBody={(value) => store.updateListItemBody(block.id, baby.id, index, value)}
                    onChange={(value) => store.updateListItem(block.id, baby.id, index, value)}
                    onSplit={() => store.splitListItem(block.id, baby.id, index)}
                    onUnsplit={() => store.unsplitListItem(block.id, baby.id, index)}
                    onPromote={
                      baby.type === 'flat-nested'
                        ? () => store.promoteToNested(block.id, baby.id, index)
                        : undefined
                    }
                    onRemove={() => store.removeListItem(block.id, baby.id, index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            className="p-2 bg-slate-700 border border-dashed border-slate-600 text-slate-400 rounded-lg text-sm font-medium transition-colors hover:bg-indigo-500 hover:border-indigo-500 hover:border-solid hover:text-white mt-1"
            onClick={() => store.addListItem(block.id, baby.id)}
          >
            + Add Item
          </button>

          {baby.type === 'flat-nested' && baby.groups && baby.groups.length > 0 && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent my-4" />
              <div className="flex flex-col gap-2">
                {baby.groups.map((group, groupIndex) => (
                  <div
                    key={groupIndex}
                    className="ml-6 p-3 bg-slate-800 border-l-4 border-indigo-500 rounded"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-400 rounded text-sm transition-colors hover:bg-indigo-500 hover:border-indigo-500 hover:text-white"
                        onClick={() => store.addNestedItem(block.id, baby.id, groupIndex)}
                        title="Add item to this list"
                      >
                        +
                      </button>
                      <button
                        className="px-2 py-1 bg-purple-500/10 border border-purple-500/40 text-slate-200 rounded text-sm font-semibold transition-colors hover:bg-purple-500/30 hover:border-purple-500/60"
                        onClick={() => store.addNestedGroup(block.id, baby.id)}
                        title="Add another list"
                      >
                        +
                      </button>
                      <button
                        className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-400 rounded text-sm transition-colors hover:bg-indigo-500 hover:border-indigo-500 hover:text-white"
                        onClick={() => store.removeNestedGroup(block.id, baby.id, groupIndex)}
                        title="Remove this list"
                      >
                        ✕
                      </button>
                    </div>
                    {group.map((item, itemIndex) => {
                      const isSplit = typeof item === 'object' && 'split' in item;
                      return (
                        <div
                          key={itemIndex}
                          className={`flex items-start gap-2 ml-2 ${isSplit ? 'split-item' : ''}`}
                        >
                          <span className="text-indigo-400 font-bold flex-shrink-0">-</span>
                          {isSplit ? (
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="flex items-start gap-2">
                                <button
                                  className={`px-2 py-1 text-sm border rounded flex-shrink-0 transition-colors ${
                                    item.bold
                                      ? 'bg-indigo-500 text-black border-indigo-500'
                                      : 'bg-slate-700 text-slate-200 border-slate-600 hover:border-indigo-500'
                                  }`}
                                  onClick={() =>
                                    store.toggleNestedItemBold(block.id, baby.id, groupIndex, itemIndex)
                                  }
                                  title={item.bold ? 'Remove bold' : 'Make header bold'}
                                >
                                  <strong>B</strong>
                                </button>
                                <textarea
                                  value={item.header || ''}
                                  onChange={(e) =>
                                    store.updateNestedItemHeader(
                                      block.id,
                                      baby.id,
                                      groupIndex,
                                      itemIndex,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Header..."
                                  className="flex-none w-48 min-w-32 px-2 py-1 bg-slate-800 text-slate-200 border border-slate-600 rounded text-sm font-sans resize-none overflow-y-hidden leading-relaxed focus:outline-none focus:border-indigo-500"
                                  rows={1}
                                />
                                <textarea
                                  value={item.body || ''}
                                  onChange={(e) =>
                                    store.updateNestedItemBody(
                                      block.id,
                                      baby.id,
                                      groupIndex,
                                      itemIndex,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Content..."
                                  className="flex-1 min-w-52 px-2 py-1 bg-slate-800 text-slate-200 border border-slate-600 rounded text-sm font-sans resize-none overflow-y-hidden leading-relaxed focus:outline-none focus:border-indigo-500"
                                  rows={1}
                                />
                              </div>
                            </div>
                          ) : (
                            <textarea
                              value={typeof item === 'string' ? item : ''}
                              onChange={(e) =>
                                store.updateNestedItem(
                                  block.id,
                                  baby.id,
                                  groupIndex,
                                  itemIndex,
                                  e.target.value
                                )
                              }
                              placeholder="Nested item..."
                              className="flex-1 min-h-8 px-2 py-1 bg-slate-800 text-slate-200 border border-slate-600 rounded text-sm font-sans resize-y overflow-y-hidden leading-relaxed focus:outline-none focus:border-indigo-500"
                              rows={1}
                            />
                          )}
                          <button
                            className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-400 rounded text-lg font-bold transition-colors hover:bg-indigo-500 hover:border-indigo-500 hover:text-white"
                            onClick={() =>
                              store.demoteToFlat(block.id, baby.id, groupIndex, itemIndex)
                            }
                            title="Move to flat list"
                          >
                            ↑
                          </button>
                          <button
                            className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-400 rounded text-base transition-colors hover:bg-indigo-500 hover:border-indigo-500 hover:text-white"
                            onClick={() =>
                              isSplit
                                ? store.unsplitNestedItem(block.id, baby.id, groupIndex, itemIndex)
                                : store.splitNestedItem(block.id, baby.id, groupIndex, itemIndex)
                            }
                            title={isSplit ? 'Merge header and body' : 'Split into header and body'}
                          >
                            {isSplit ? '⇄' : '⇌'}
                          </button>
                          <button
                            className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-400 rounded text-sm transition-colors hover:bg-indigo-500 hover:border-indigo-500 hover:text-white"
                            onClick={() =>
                              store.removeNestedItem(block.id, baby.id, groupIndex, itemIndex)
                            }
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, marginLeft }}
      className={`bg-slate-800 border-2 border-slate-600 border-l-4 ${levelColor} rounded-lg overflow-hidden transition-all hover:shadow-lg ${
        block.collapsed ? 'collapsed' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-slate-700/50 border-b border-slate-600">
        {/* Baby controls */}
        <div className="flex gap-1 mr-2">
          <button
            className="p-2 bg-slate-700 border border-slate-600 rounded cursor-pointer text-slate-200 transition-all hover:bg-green-500 hover:border-green-500 hover:scale-110 hover:text-black"
            onClick={() => store.addBaby(block.id, 'text')}
            title="Add Text Baby"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h8v2H2v-2z" />
            </svg>
          </button>
          <button
            className="p-2 bg-slate-700 border border-slate-600 rounded cursor-pointer text-slate-200 transition-all hover:bg-blue-500 hover:border-blue-500 hover:scale-110 hover:text-black"
            onClick={() => store.addBaby(block.id, 'flat')}
            title="Add List Baby"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="3" cy="3" r="1.5" />
              <rect x="5" y="2" width="9" height="2" rx="0.5" />
              <circle cx="3" cy="8" r="1.5" />
              <rect x="5" y="7" width="9" height="2" rx="0.5" />
              <circle cx="3" cy="13" r="1.5" />
              <rect x="5" y="12" width="9" height="2" rx="0.5" />
            </svg>
          </button>
        </div>

        {/* Drag handle */}
        <button
          className="px-2 py-1 bg-transparent border border-slate-600 rounded cursor-grab text-slate-400 text-base leading-none transition-all hover:bg-slate-600 hover:text-slate-200 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>

        {/* Collapse toggle */}
        <button
          className="bg-transparent border-none cursor-pointer text-sm text-slate-400 px-2 py-1 transition-colors hover:text-indigo-400"
          onClick={() => store.updateBlock(block.id, { collapsed: !block.collapsed })}
        >
          {block.collapsed ? '▶' : '▼'}
        </button>

        {/* Label */}
        {isEditing ? (
          <input
            type="text"
            value={block.label}
            onChange={(e) => store.updateBlock(block.id, { label: e.target.value })}
            onBlur={() => block.label && setIsEditing(false)}
            placeholder={`Level ${block.level} heading...`}
            className="flex-1 px-2 py-1 border-2 border-indigo-500 rounded text-base font-semibold outline-none bg-slate-800 text-slate-200"
            autoFocus
          />
        ) : (
          <h3
            className="flex-1 text-base font-semibold text-slate-200 cursor-pointer px-2 py-1 rounded transition-colors hover:bg-slate-600"
            onClick={() => setIsEditing(true)}
          >
            {block.label || 'Untitled Block'}
          </h3>
        )}

        {/* Field selector */}
        <select
          value={block.targetField}
          onChange={(e) =>
            store.updateBlock(block.id, { targetField: e.target.value as Block['targetField'] })
          }
          className="px-2 py-1 border border-slate-600 rounded text-sm bg-slate-800 text-slate-200 cursor-pointer transition-colors hover:border-indigo-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
        >
          {CURRENT_FIELDS.map((field) => (
            <option key={field.value} value={field.value}>
              {field.label}
            </option>
          ))}
        </select>

        {/* Actions */}
        <div className="flex gap-1">
          <button
            className="p-2 bg-transparent border border-slate-600 rounded cursor-pointer text-base transition-all hover:bg-slate-600 hover:scale-115"
            onClick={() => store.addBlock(block.id, block.level + 1)}
            title="Add child block"
          >
            ➕
          </button>
          <button
            className="p-2 bg-transparent border border-red-500 rounded cursor-pointer text-base text-red-500 transition-all hover:bg-red-500 hover:text-white hover:scale-115"
            onClick={() => {
              if (confirm('Delete this block and all its children?')) {
                store.deleteBlock(block.id);
              }
            }}
            title="Delete block"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Content (collapsible) */}
      {!block.collapsed && (
        <>
          {/* Babies */}
          {block.babies.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBabyDragEnd}>
              <SortableContext
                items={block.babies.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-4 flex flex-col gap-4">
                  {block.babies.map((baby) => (
                    <SortableBaby
                      key={baby.id}
                      baby={baby}
                      headerContent={
                        <>
                          <span className="text-xl">
                            {baby.type === 'text'
                              ? '📝'
                              : baby.type === 'flat' || baby.type === 'flat-nested'
                                ? '📋'
                                : '📑'}
                          </span>
                          <span className="flex-1 font-semibold text-slate-200 text-sm">
                            {baby.type === 'text'
                              ? 'Text Field'
                              : baby.type === 'flat'
                                ? 'List'
                                : baby.type === 'flat-nested'
                                  ? 'List with Nesting'
                                  : 'Nested List'}
                          </span>
                          {baby.type === 'flat' && (
                            <button
                              className="px-2 py-1 bg-slate-700 border border-purple-500/40 text-slate-200 rounded text-sm transition-colors hover:bg-purple-500/20 hover:border-purple-500/60"
                              onClick={() => store.convertBabyToNested(block.id, baby.id)}
                              title="Add nested list"
                            >
                              📑
                            </button>
                          )}
                          <button
                            className="px-2 py-1 bg-transparent border border-red-500 text-red-500 rounded text-sm font-bold transition-colors hover:bg-red-500 hover:text-white"
                            onClick={() => store.removeBaby(block.id, baby.id)}
                            title="Remove baby"
                          >
                            ✕
                          </button>
                        </>
                      }
                      bodyContent={renderBabyContent(baby)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Children blocks */}
          {block.children.length > 0 && (
            <div className="p-4 pt-0 flex flex-col gap-3">
              {block.children.map((child) => (
                <BlockComponent key={child.id} block={child} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
