/**
 * SortableListItem Component
 *
 * Individual sortable list item with split/unsplit functionality.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ListItem } from '../types';

interface SortableListItemProps {
  id: string;
  item: ListItem;
  index: number;
  babyType: 'flat' | 'flat-nested';
  onToggleBold: () => void;
  onUpdateHeader: (value: string) => void;
  onUpdateBody: (value: string) => void;
  onChange: (value: string) => void;
  onSplit: () => void;
  onUnsplit: () => void;
  onPromote?: () => void;
  onRemove: () => void;
}

export function SortableListItem({
  id,
  item,
  babyType,
  onToggleBold,
  onUpdateHeader,
  onUpdateBody,
  onChange,
  onSplit,
  onUnsplit,
  onPromote,
  onRemove,
}: SortableListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSplit = typeof item === 'object' && 'split' in item;

  const handleTextareaResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-start gap-2 ${isSplit ? 'split-item' : ''}`}>
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
              onClick={onToggleBold}
              title={item.bold ? 'Remove bold' : 'Make header bold'}
            >
              <strong>B</strong>
            </button>
            <textarea
              value={item.header || ''}
              onChange={(e) => onUpdateHeader(e.target.value)}
              onInput={handleTextareaResize}
              placeholder="Header..."
              className="flex-none w-48 min-w-32 px-2 py-1 bg-slate-800 text-slate-200 border border-slate-600 rounded text-sm font-sans resize-none overflow-y-hidden leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              rows={1}
            />
            <textarea
              value={item.body || ''}
              onChange={(e) => onUpdateBody(e.target.value)}
              onInput={handleTextareaResize}
              placeholder="Content..."
              className="flex-1 min-w-52 px-2 py-1 bg-slate-800 text-slate-200 border border-slate-600 rounded text-sm font-sans resize-none overflow-y-hidden leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              rows={1}
            />
          </div>
        </div>
      ) : (
        <textarea
          value={typeof item === 'string' ? item : ''}
          onChange={(e) => onChange(e.target.value)}
          onInput={handleTextareaResize}
          placeholder="List item..."
          className="flex-1 min-h-8 px-2 py-1 bg-slate-800 text-slate-200 border border-slate-600 rounded text-sm font-sans resize-y overflow-y-hidden leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
          rows={1}
        />
      )}

      <span
        className="cursor-grab py-1 text-slate-400 flex-shrink-0 select-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        ⋮
      </span>

      {babyType === 'flat-nested' && onPromote && (
        <button
          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-400 rounded text-lg font-bold transition-colors hover:bg-indigo-500 hover:border-indigo-500 hover:text-white"
          onClick={onPromote}
          title="Move to nested list"
        >
          ↓
        </button>
      )}

      <button
        className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-400 rounded text-base transition-colors hover:bg-indigo-500 hover:border-indigo-500 hover:text-white"
        onClick={isSplit ? onUnsplit : onSplit}
        title={isSplit ? 'Merge header and body' : 'Split into header and body'}
      >
        {isSplit ? '⇄' : '⇌'}
      </button>

      <button
        className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-400 rounded text-sm transition-colors hover:bg-indigo-500 hover:border-indigo-500 hover:text-white"
        onClick={onRemove}
        title="Remove item"
      >
        ✕
      </button>
    </div>
  );
}
