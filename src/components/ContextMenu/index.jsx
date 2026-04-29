import { useEffect, useRef, useState } from 'react';
import { applyGatewayPrefix } from '../../utils/taskDefs.js';
import {
  L3ActivitySubForm,
  ConnectionSubForm,
  GatewaySubForm,
  GatewaySwitchSubForm,
} from './subforms.jsx';

/**
 * ContextMenu — pop-up shown when the user clicks a task shape on the diagram.
 *
 * Inline-edits name/role/description; buttons trigger add-after / delete /
 * add-connection / add-gateway / add-l3-activity. Gateway-only: switch type.
 * Sub-forms expand inline (not separate popups) so the user stays in one place.
 *
 * Layout split (PR-0):
 *   - this file: state hub, action list, edit fields, glue
 *   - subforms.jsx: 4 sub-form components (L3 / connection / gateway / gw-switch)
 *
 * Props:
 *   - task          the clicked task object (or null when closed)
 *   - x, y          viewport coordinates where the click happened
 *   - roles         flow.roles array
 *   - allTasks      flow.tasks array (for sub-form target dropdowns)
 *   - displayLabels { taskId → "5-1-1-3" } for dropdown option labels
 *   - onUpdate(updatedTask)
 *   - onAddAfter(taskId)
 *   - onAddConnection(fromTaskId, toTaskId)
 *   - onAddGateway(anchorId, gatewayType, target1, target2, label1, label2)
 *   - onAddL3Activity(anchorId, l3Number, l3Name)
 *   - onDelete(taskId)
 *   - onClose()
 *
 * Hidden options:
 *   - start event   → no "add before"
 *   - end / breakpoint → no "add after" / no "add connection" / no "add gateway"
 */
export default function ContextMenu({
  task, x, y, roles, allTasks, displayLabels,
  onUpdate, onAddAfter, onAddConnection, onAddGateway, onAddL3Activity, onDelete, onClose,
}) {
  const ref = useRef(null);
  const [adjusted, setAdjusted] = useState({ left: x, top: y });
  // 'connection' | 'gateway' | 'l3activity' | 'gw-switch' | null — which sub-form is expanded.
  const [subForm, setSubForm] = useState(null);
  const [connTarget, setConnTarget] = useState('');
  const [gwType, setGwType] = useState('xor');
  const [gwTarget1, setGwTarget1] = useState('');
  const [gwTarget2, setGwTarget2] = useState('');
  const [gwLabel1, setGwLabel1] = useState('');
  const [gwLabel2, setGwLabel2] = useState('');
  const [l3Number, setL3Number] = useState('');
  const [l3Name, setL3Name] = useState('');
  // Gateway-type switch sub-form (only relevant when task.type === 'gateway').
  // Defaults to the task's current type so the radio shows the current selection.
  const [gwSwitchType, setGwSwitchType] = useState(task?.gatewayType || 'xor');

  // Reset sub-form state when the menu opens for a different task.
  useEffect(() => {
    setSubForm(null);
    setConnTarget('');
    setGwType('xor');
    setGwTarget1('');
    setGwTarget2('');
    setGwLabel1('');
    setGwLabel2('');
    setL3Number('');
    setL3Name('');
    setGwSwitchType(task?.gatewayType || 'xor');
  }, [task?.id]);

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
  }, [x, y, subForm]);

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
  // end / breakpoint have no outgoing → connection / gateway disabled.
  const canAddOutgoing = !isEnd;
  const isGateway = task.type === 'gateway';

  // Dropdown candidate tasks for sub-forms (exclude self).
  const targetOptions = (allTasks || []).filter(t => t.id !== task.id);

  function submitConnection() {
    if (!connTarget) return;
    onAddConnection?.(task.id, connTarget);
    onClose?.();
  }

  function submitGateway() {
    if (!gwTarget1 || !gwTarget2) return;
    onAddGateway?.(task.id, gwType, gwTarget1, gwTarget2, gwLabel1, gwLabel2);
    onClose?.();
  }

  function submitL3Activity() {
    if (!l3Number.trim()) return;
    onAddL3Activity?.(task.id, l3Number.trim(), l3Name.trim());
    onClose?.();
  }

  // Switch this gateway from one type to another (XOR ↔ AND ↔ OR).
  // Preserves conditions / connection targets — only flips gatewayType,
  // adjusts connectionType (fork↔fork or merge↔merge), and refreshes the
  // "[XX閘道] " name prefix.
  function submitGwSwitch() {
    if (!gwSwitchType || gwSwitchType === task.gatewayType) return;
    const isMerge = task.connectionType?.endsWith('-merge');
    const typeRoot = { xor: 'conditional', and: 'parallel', or: 'inclusive' }[gwSwitchType];
    const newCT = `${typeRoot}-${isMerge ? 'merge' : 'branch'}`;
    onUpdate?.({
      ...task,
      gatewayType: gwSwitchType,
      connectionType: newCT,
      name: applyGatewayPrefix(task.name, gwSwitchType),
    });
    onClose?.();
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200"
      style={{ left: adjusted.left, top: adjusted.top, width: 300 }}
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
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">任務重點說明</span>
          <textarea value={task.description || ''}
            onChange={(e) => onUpdate({ ...task, description: e.target.value })}
            placeholder="說明這個任務的重點（會在流程圖 hover 時顯示）"
            rows={3}
            className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y leading-relaxed"
          />
        </label>
        {task.type === 'l3activity' && (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">L3 編號（被調用的子流程）</span>
            <input type="text" value={task.subprocessName || ''}
              onChange={(e) => onUpdate({ ...task, subprocessName: e.target.value })}
              placeholder="例：5-3-2"
              className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </label>
        )}
      </div>

      {/* Action buttons */}
      <div className="border-t border-gray-100 py-1">
        {!isEnd && (
          <button onClick={() => { onAddAfter?.(task.id); onClose?.(); }}
            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
            <span className="text-blue-500">⬇️</span> 在後面新增任務
          </button>
        )}

        {/* Add L3 activity (subprocess call) — expands sub-form below */}
        {!isEnd && (
          <button
            onClick={() => setSubForm(subForm === 'l3activity' ? null : 'l3activity')}
            className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${
              subForm === 'l3activity' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}>
            <span className="text-blue-500">📚</span> 新增 L3 活動（子流程調用）
            <span className="ml-auto text-gray-400">{subForm === 'l3activity' ? '▴' : '▾'}</span>
          </button>
        )}
        {subForm === 'l3activity' && (
          <L3ActivitySubForm
            l3Number={l3Number} setL3Number={setL3Number}
            l3Name={l3Name} setL3Name={setL3Name}
            onCancel={() => setSubForm(null)} onSubmit={submitL3Activity} />
        )}

        {/* Add connection — expands sub-form below */}
        {canAddOutgoing && (
          <button
            onClick={() => setSubForm(subForm === 'connection' ? null : 'connection')}
            className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${
              subForm === 'connection' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}>
            <span className="text-blue-500">➕</span> 新增一條連線
            <span className="ml-auto text-gray-400">{subForm === 'connection' ? '▴' : '▾'}</span>
          </button>
        )}
        {subForm === 'connection' && (
          <ConnectionSubForm
            connTarget={connTarget} setConnTarget={setConnTarget}
            targetOptions={targetOptions} displayLabels={displayLabels}
            onCancel={() => setSubForm(null)} onSubmit={submitConnection} />
        )}

        {/* Add gateway — expands sub-form below */}
        {canAddOutgoing && (
          <button
            onClick={() => setSubForm(subForm === 'gateway' ? null : 'gateway')}
            className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${
              subForm === 'gateway' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}>
            <span className="text-blue-500">◇</span> 新增閘道(兩條連線)
            <span className="ml-auto text-gray-400">{subForm === 'gateway' ? '▴' : '▾'}</span>
          </button>
        )}
        {subForm === 'gateway' && (
          <GatewaySubForm
            gwType={gwType} setGwType={setGwType}
            gwLabel1={gwLabel1} setGwLabel1={setGwLabel1}
            gwTarget1={gwTarget1} setGwTarget1={setGwTarget1}
            gwLabel2={gwLabel2} setGwLabel2={setGwLabel2}
            gwTarget2={gwTarget2} setGwTarget2={setGwTarget2}
            targetOptions={targetOptions} displayLabels={displayLabels}
            onCancel={() => setSubForm(null)} onSubmit={submitGateway} />
        )}

        {/* Gateway-only: switch the gateway's type (XOR ↔ AND ↔ OR) */}
        {isGateway && (
          <button
            onClick={() => setSubForm(subForm === 'gw-switch' ? null : 'gw-switch')}
            className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 ${
              subForm === 'gw-switch' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}>
            <span className="text-blue-500">🔁</span> 換閘道種類
            <span className="ml-auto text-gray-400">{subForm === 'gw-switch' ? '▴' : '▾'}</span>
          </button>
        )}
        {subForm === 'gw-switch' && (
          <GatewaySwitchSubForm
            gwSwitchType={gwSwitchType} setGwSwitchType={setGwSwitchType}
            currentType={task.gatewayType}
            onCancel={() => setSubForm(null)} onSubmit={submitGwSwitch} />
        )}

        <button onClick={() => { onDelete?.(task.id); onClose?.(); }}
          className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
          <span>🗑️</span> 刪除此元件
        </button>
      </div>
    </div>
  );
}
