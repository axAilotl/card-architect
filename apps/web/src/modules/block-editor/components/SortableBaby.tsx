/**
 * SortableBaby Component
 *
 * Wrapper for sortable baby blocks with drag handle.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import type { Baby } from '../types';

interface SortableBabyProps {
  baby: Baby;
  headerContent: ReactNode;
  bodyContent: ReactNode;
}

export function SortableBaby({ baby, headerContent, bodyContent }: SortableBabyProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: baby.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const babyTypeClass =
    baby.type === 'text'
      ? 'border-green-500/40'
      : baby.type === 'flat' || baby.type === 'flat-nested'
        ? 'border-indigo-500/40'
        : 'border-purple-500/40';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-2 ${babyTypeClass} rounded-xl p-4 shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-indigo-500/20">
        <button
          className="px-2 py-1 bg-transparent border border-indigo-500/40 text-slate-400 rounded cursor-grab text-sm leading-none hover:bg-indigo-500/10 hover:border-indigo-500/60 hover:text-slate-200 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        {headerContent}
      </div>
      {bodyContent}
    </div>
  );
}
