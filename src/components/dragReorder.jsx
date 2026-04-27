import { useState } from 'react';

/**
 * Generic HTML5 drag-and-drop reorder hook.
 *
 * Wizard (roles list) and FlowEditor (tasks list) share this identical
 * implementation. Parent passes `items` + an `onReorder(nextItems)` callback;
 * hook returns `{ dragIdx, overIdx, dropAfter, rowProps }`.
 *
 * Drop-position semantics (improved 2026-04-27):
 *   onDragOver compares mouse Y to the row's vertical midpoint and reports
 *   whether the drop will land *above* (dropAfter=false) or *below*
 *   (dropAfter=true) row `overIdx`. Renderers should draw a thin colored
 *   line on the corresponding edge — a top border when !dropAfter, a bottom
 *   border when dropAfter — so the user sees the exact future insertion
 *   slot ("between rows") rather than a whole-row highlight that's
 *   ambiguous about above-vs-below.
 *
 * Spread `rowProps(i)` onto the draggable row's root element.
 */
export function useDragReorder(items, onReorder) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [dropAfter, setDropAfter] = useState(false);

  function onDragStart(e, i) {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  }
  function onDragOver(e, i) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Bisect the row vertically: mouse above midpoint → drop "above" this
    // row; below midpoint → drop "below" (i.e. before row i+1).
    const rect = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    if (i !== overIdx) setOverIdx(i);
    if (after !== dropAfter) setDropAfter(after);
  }
  function onDrop(e, i) {
    e.preventDefault();
    if (dragIdx !== null) {
      // Compute target slot. dropAfter on row i means insert at (i+1).
      let target = dropAfter ? i + 1 : i;
      // After splicing out dragIdx, every index above it shifts down by 1.
      if (dragIdx < target) target -= 1;
      if (target !== dragIdx) {
        const next = [...items];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(target, 0, moved);
        onReorder(next);
      }
    }
    setDragIdx(null); setOverIdx(null); setDropAfter(false);
  }
  function onDragEnd() { setDragIdx(null); setOverIdx(null); setDropAfter(false); }
  function rowProps(i) {
    return { draggable: true, onDragStart: e => onDragStart(e, i),
      onDragOver: e => onDragOver(e, i), onDrop: e => onDrop(e, i), onDragEnd };
  }
  return { dragIdx, overIdx, dropAfter, rowProps };
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
