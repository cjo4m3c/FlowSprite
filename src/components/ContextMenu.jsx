import { useEffect, useRef, useState } from 'react';

/**
 * ContextMenu — pop-up shown when the user clicks a task shape on the diagram.
 *
 * Inline-edits name/role; buttons trigger add-before / add-after / delete.
 * The "edit name + role" UI inside the menu is intentional (per user request),
 * so the menu can stand alone if the right-side drawer is removed later.
 *
 * Props:
 *   - task         the clicked task object (or null when closed)
 *   - x, y         viewport coordinates where the click happened
 *   - roles        flow.roles array
 *   - onUpdate(updatedTask)  called when name / role changes
 *   - onAddBefore(taskId)
 *   - onAddAfter(taskId)
 *   - onDelete(taskId)
 *   - onClose()
 *
 * Hidden options:
 *   - start event   → no "add before"
 *   - end / breakpoint → no "add after"
 */
export default function ContextMenu({
  task, x, y, roles,
  onUpdate, onAddBefore, onAddAfter, onDelete, onClose,
}) {
  const ref = useRef(null);
  const [adjusted, setAdjusted] = useState({ left: x, top: y });

  // Reposition if menu would overflow the viewport.
  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x;
    let top = y;
    if (left + rect.width > vw - 8)  left = vw - rect.width - 8;
    if (top  + rect.height > vh - 8) top  = vh - rect.height - 8;
    if (left < 8) left = 8;
    if (top  < 8) top  = 8;
    setAdjusted({ left, top });
  }, [x, y]);

  // Click outside / Esc closes.
  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    // Defer to next tick so the click that opened us doesn't immediately close.
    const id = setTimeout(() => {
      document.addEventListener('mousedown', onDocClick);
    }, 0);
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!task) return null;

  const isStart = task.type === 'start' || task.connectionType === 'start';
  const isEnd   = task.type === 'end'   || task.connectionType === 'end' || task.connectionType === 'breakpoint';

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200"
      style={{ left: adjusted.left, top: adjusted.top, width: 260 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">編輯元件</span>
        <button onClick={onClose} title="關閉（Esc）"
          className="text-gray-400 hover:text-gray-700 text-sm leading-none">✕</button>
      </div>

      {/* Inline edit fields */}
      <div className="px-3 py-2.5 flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">名稱</span>
          <input type="text" value={task.name || ''}
            onChange={(e) => onUpdate({ ...task, name: e.target.value })}
            placeholder={isStart || isEnd ? '名稱（選填）' : '任務名稱'}
            className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">角色</span>
          <select value={task.roleId || ''}
            onChange={(e) => onUpdate({ ...task, roleId: e.target.value })}
            className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="">（未指定）</option>
            {(roles || []).filter(r => r.name).map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Action buttons */}
      <div className="border-t border-gray-100 py-1">
        {!isStart && (
          <button onClick={() => { onAddBefore?.(task.id); onClose?.(); }}
            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
            <span className="text-blue-500">⬆️</span> 在前面新增任務
          </button>
        )}
        {!isEnd && (
          <button onClick={() => { onAddAfter?.(task.id); onClose?.(); }}
            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
            <span className="text-blue-500">⬇️</span> 在後面新增任務
          </button>
        )}
        <button onClick={() => { onDelete?.(task.id); onClose?.(); }}
          className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
          <span>🗑️</span> 刪除此元件
        </button>
      </div>
    </div>
  );
}
