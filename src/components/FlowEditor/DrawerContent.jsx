import { Fragment } from 'react';
import TaskCard from './TaskCard.jsx';
import { DragHandle } from '../dragReorder.jsx';
import { makeRole } from '../../utils/taskDefs.js';

/**
 * Drawer body — switches between "設定流程" (task cards) and
 * "設定泳道角色" (role rows). Drag-reorder handlers come from the parent's
 * useDragReorder hook instances (one per list).
 */
export function DrawerContent({ activeTab, liveFlow, displayLabels,
  taskDrag, roleDrag, onPatch, onUpdateTask, onRemoveTask, onAddTask }) {
  if (activeTab === 'flow') {
    const { dragIdx, overIdx, dropAfter, rowProps } = taskDrag;
    // Compute the future insertion slot (0..tasks.length) so we can
    // light up BOTH adjacent rows AND draw a dedicated drop-line
    // between them — far less ambiguous than highlighting just one.
    const dropTargetSlot = (dragIdx === null || overIdx === null) ? null
      : (dropAfter ? overIdx + 1 : overIdx);
    const adjacentTopIdx    = dropTargetSlot !== null ? dropTargetSlot - 1 : null;
    const adjacentBottomIdx = dropTargetSlot;
    const getDropEdge = (i) => {
      if (dragIdx === null || dragIdx === i) return null;
      if (i === adjacentTopIdx)    return 'bottom';
      if (i === adjacentBottomIdx) return 'top';
      return null;
    };
    // Don't draw the line if it would land at the dragged row's own
    // index (a no-op drop) — feedback should reflect a real change.
    const showLineAt = (slot) => dropTargetSlot === slot
      && dragIdx !== null
      && slot !== dragIdx
      && slot !== dragIdx + 1;
    const DropLine = () => (
      <div className="relative h-0 my-[-4px]" aria-hidden="true">
        <div className="absolute inset-x-2 -translate-y-1/2 h-1.5 bg-blue-500 rounded-full shadow-md shadow-blue-300" />
      </div>
    );
    return (
      <div>
        <p className="text-sm text-gray-400 mb-3">▼ 點任務右側箭頭可展開說明、輸入、產出欄位</p>
        <div className="flex flex-col gap-2">
          {liveFlow.tasks.map((task, i) => (
            <Fragment key={task.id}>
              {showLineAt(i) && <DropLine />}
              <TaskCard
                task={task}
                roles={liveFlow.roles || []}
                allTasks={liveFlow.tasks}
                displayLabels={displayLabels}
                onUpdate={updated => onUpdateTask(task.id, updated)}
                onRemove={() => onRemoveTask(task.id)}
                canRemove={liveFlow.tasks.length > 1}
                dragHandlers={rowProps(i)}
                isDragging={dragIdx === i}
                dropEdge={getDropEdge(i)}
              />
            </Fragment>
          ))}
          {showLineAt(liveFlow.tasks.length) && <DropLine />}
        </div>
        <button onClick={onAddTask}
          className="mt-3 w-full py-2 text-base border border-dashed border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
          + 新增任務
        </button>
      </div>
    );
  }

  // 'roles' tab
  const { dragIdx: roleDragIdx, overIdx: roleOverIdx, dropAfter: roleDropAfter, rowProps: roleRowProps } = roleDrag;
  return (
    <div>
      <p className="text-base text-gray-500 mb-1">設定流程中的參與角色，變更後請點右上角「儲存」</p>
      <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
        <span className="text-gray-400">⠨</span> 可拖曳左側圓點改變泳道順序（由上到下）
      </p>
      <div className="flex flex-col gap-2">
        {(liveFlow.roles || []).map((role, i) => {
          const isOver = roleOverIdx === i && roleDragIdx !== i;
          const dropEdgeClass = isOver
            ? (roleDropAfter ? 'border-b-2 border-blue-500' : 'border-t-2 border-blue-500')
            : 'border-gray-200';
          return (
            <div
              key={role.id}
              {...roleRowProps(i)}
              className={`flex items-center gap-2 p-2 bg-gray-50 border rounded-lg transition-all select-none
                ${roleDragIdx === i ? 'opacity-40 scale-95' : ''}
                ${dropEdgeClass}`}>
              <DragHandle />
              <span className="text-sm text-gray-400 w-5 flex-shrink-0">#{i + 1}</span>
              <input type="text" placeholder="角色名稱" value={role.name}
                onChange={e => onPatch({ roles: liveFlow.roles.map(r => r.id === role.id ? { ...r, name: e.target.value } : r) })}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-base focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <select value={role.type}
                onChange={e => onPatch({ roles: liveFlow.roles.map(r => r.id === role.id ? { ...r, type: e.target.value } : r) })}
                className="px-2 py-1.5 border border-gray-300 rounded text-base focus:outline-none"
                style={{ background: role.type === 'external' ? '#009900' : '#0066CC', color: 'white' }}>
                <option value="internal">內部角色</option>
                <option value="external">外部角色</option>
              </select>
              <button
                onClick={() => { if (liveFlow.roles.length > 1) onPatch({ roles: liveFlow.roles.filter(r => r.id !== role.id) }); }}
                disabled={liveFlow.roles.length <= 1}
                className="text-red-400 hover:text-red-600 disabled:opacity-20 text-xl leading-none">✕</button>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => onPatch({ roles: [...(liveFlow.roles || []), makeRole()] })}
        className="mt-3 w-full py-2 text-base border border-dashed border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
        + 新增角色
      </button>
    </div>
  );
}
