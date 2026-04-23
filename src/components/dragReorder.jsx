import { useState } from 'react';

/**
 * Generic HTML5 drag-and-drop reorder hook.
 *
 * Wizard (roles list) and FlowEditor (tasks list) share this identical
 * implementation. Parent passes `items` + an `onReorder(nextItems)` callback;
 * hook returns `{ dragIdx, overIdx, rowProps }`. Spread `rowProps(i)` onto the
 * draggable row's root element. Use `dragIdx === i` / `overIdx === i` for
 * visual feedback (opacity / border highlight).
 */
export function useDragReorder(items, onReorder) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  function onDragStart(e, i) {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  }
  function onDragOver(e, i) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (i !== overIdx) setOverIdx(i);
  }
  function onDrop(e, i) {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== i) {
      const next = [...items];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(i, 0, moved);
      onReorder(next);
    }
    setDragIdx(null); setOverIdx(null);
  }
  function onDragEnd() { setDragIdx(null); setOverIdx(null); }
  function rowProps(i) {
    return { draggable: true, onDragStart: e => onDragStart(e, i),
      onDragOver: e => onDragOver(e, i), onDrop: e => onDrop(e, i), onDragEnd };
  }
  return { dragIdx, overIdx, rowProps };
}

/** Six-dot drag affordance icon used by every draggable row. */
export function DragHandle() {
  return (
    <div className="flex items-center justify-center w-5 flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 select-none">
      <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
        <circle cx="3" cy="3"  r="1.4"/><circle cx="7" cy="3"  r="1.4"/>
        <circle cx="3" cy="8"  r="1.4"/><circle cx="7" cy="8"  r="1.4"/>
        <circle cx="3" cy="13" r="1.4"/><circle cx="7" cy="13" r="1.4"/>
      </svg>
    </div>
  );
}
