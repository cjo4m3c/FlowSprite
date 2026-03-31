import { useState, useMemo } from 'react';
import { generateId } from '../utils/storage.js';
import DiagramRenderer from './DiagramRenderer.jsx';

const TASK_TYPES = [
  { value: 'task', label: '任務' },
  { value: 'start', label: '開始事件' },
  { value: 'end', label: '結束事件' },
  { value: 'interaction', label: '互動（外部）' },
  { value: 'gateway', label: '網關（決策點）' },
];

function makeRole() {
  return { id: generateId(), name: '', type: 'internal' };
}

function makeTask() {
  return { id: generateId(), roleId: '', name: '', type: 'task', conditions: [] };
}

function makeCondition() {
  return { id: generateId(), label: '', nextTaskId: '' };
}

function initFormData(flow) {
  if (flow) return { ...flow };
  return {
    id: generateId(),
    l3Number: '',
    l3Name: '',
    roles: [makeRole(), makeRole()],
    tasks: Array.from({ length: 8 }, makeTask),
  };
}

// ── Step indicator ──────────────────────────────────────────────
function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-colors ${
            i < current ? 'bg-blue-600 border-blue-600 text-white' :
            i === current ? 'bg-blue-100 border-blue-600 text-blue-700' :
            'bg-gray-100 border-gray-300 text-gray-400'
          }`}>{i + 1}</div>
          <span className={`ml-2 text-sm font-medium whitespace-nowrap ${
            i === current ? 'text-blue-700' : i < current ? 'text-blue-500' : 'text-gray-400'
          }`}>{label}</span>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 ${i < current ? 'bg-blue-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: L3 Info ──────────────────────────────────────────────
function Step1({ data, onChange }) {
  const [numError, setNumError] = useState('');

  function handleNumberChange(val) {
    onChange({ l3Number: val });
    if (val && !/^\d+(\.\d+)*$/.test(val)) {
      setNumError('編號格式錯誤，範例：1.1.1');
    } else {
      setNumError('');
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-1">L3 流程基本資訊</h2>
      <p className="text-sm text-gray-500 mb-6">輸入此工作流的名稱與層級編號</p>

      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            L3 流程編號 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="例：1.1.1"
            value={data.l3Number}
            onChange={e => handleNumberChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${numError ? 'border-red-400' : 'border-gray-300'}`}
          />
          {numError && <p className="text-xs text-red-500 mt-1">{numError}</p>}
          <p className="text-xs text-gray-400 mt-1">三層編碼，例：1.1.1、2.3.4</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            L3 流程名稱 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="例：建立商機報價"
            value={data.l3Name}
            onChange={e => onChange({ l3Name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {data.l3Number && data.l3Name && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            預覽：<strong>{data.l3Number}</strong>　{data.l3Name}
            <br />
            <span className="text-xs opacity-70">L4 任務將從 {data.l3Number}.1 開始編號</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 2: Roles ────────────────────────────────────────────────
function Step2({ data, onChange }) {
  function addRole() {
    onChange({ roles: [...data.roles, makeRole()] });
  }

  function removeRole(id) {
    if (data.roles.length <= 2) return;
    onChange({ roles: data.roles.filter(r => r.id !== id) });
  }

  function updateRole(id, field, value) {
    onChange({ roles: data.roles.map(r => r.id === id ? { ...r, [field]: value } : r) });
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-1">泳道角色設定</h2>
      <p className="text-sm text-gray-500 mb-6">設定流程中的參與角色（至少 2 個），角色順序即為泳道由上到下的順序</p>

      <div className="flex flex-col gap-3">
        {data.roles.map((role, i) => (
          <div key={role.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-xs text-gray-400 w-5 flex-shrink-0">#{i + 1}</span>

            <input
              type="text"
              placeholder="角色名稱"
              value={role.name}
              onChange={e => updateRole(role.id, 'name', e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <select
              value={role.type}
              onChange={e => updateRole(role.id, 'type', e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                background: role.type === 'external' ? '#16982B' : '#2A52BE',
                color: 'white',
              }}>
              <option value="internal">內部角色</option>
              <option value="external">外部角色</option>
            </select>

            <button
              onClick={() => removeRole(role.id)}
              disabled={data.roles.length <= 2}
              title="移除此角色"
              className="text-red-400 hover:text-red-600 disabled:opacity-20 disabled:cursor-not-allowed text-lg leading-none">
              ✕
            </button>
          </div>
        ))}
      </div>

      <button onClick={addRole}
        className="mt-4 px-4 py-2 text-sm border border-dashed border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors w-full">
        + 新增角色
      </button>

      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-xs font-semibold text-gray-600 mb-2">預覽泳道：</div>
        <div className="flex flex-col gap-1">
          {data.roles.filter(r => r.name).map(r => (
            <div key={r.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: r.type === 'external' ? '#16982B' : '#2A52BE' }} />
              <span className="text-xs text-gray-700">{r.name}</span>
              <span className="text-xs text-gray-400">（{r.type === 'external' ? '外部' : '內部'}）</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Tasks ────────────────────────────────────────────────
function ConditionRow({ cond, taskIndex, activeTasks, l3Number, onUpdate, onRemove }) {
  return (
    <div className="flex items-center gap-2 mt-1.5 pl-2">
      <span className="text-xs text-gray-400">→</span>
      <input
        type="text"
        placeholder="條件標籤（如：是、否）"
        value={cond.label}
        onChange={e => onUpdate({ ...cond, label: e.target.value })}
        className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <span className="text-xs text-gray-400">前往</span>
      <select
        value={cond.nextTaskId}
        onChange={e => onUpdate({ ...cond, nextTaskId: e.target.value })}
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400">
        <option value="">選擇目標任務</option>
        {activeTasks.map((t, ti) => (
          <option key={t.id} value={t.id} disabled={ti === taskIndex}>
            {l3Number}.{ti + 1} — {t.name || '（未命名）'}
          </option>
        ))}
      </select>
      <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-sm">✕</button>
    </div>
  );
}

function TaskRow({ task, index, roles, activeTasks, l3Number, onUpdate, onRemove, canRemove }) {
  const isGateway = task.type === 'gateway';
  const typeLabel = TASK_TYPES.find(t => t.value === task.type)?.label ?? '';
  const typeBg = {
    gateway: '#FFF3CD', start: '#D1FAE5', end: '#FEE2E2', interaction: '#E5E7EB', task: ''
  }[task.type] || '';

  function addCondition() {
    onUpdate({ ...task, conditions: [...(task.conditions || []), makeCondition()] });
  }

  function updateCondition(condId, updated) {
    onUpdate({ ...task, conditions: task.conditions.map(c => c.id === condId ? updated : c) });
  }

  function removeCondition(condId) {
    onUpdate({ ...task, conditions: task.conditions.filter(c => c.id !== condId) });
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden" style={{ background: typeBg || '#FAFAFA' }}>
      <div className="flex items-start gap-2 p-2.5">
        {/* Row number */}
        <span className="text-xs font-mono text-gray-400 w-14 flex-shrink-0 pt-1.5">
          {l3Number}.{index + 1}
        </span>

        {/* Role dropdown */}
        <select
          value={task.roleId}
          onChange={e => onUpdate({ ...task, roleId: e.target.value })}
          className="w-28 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 flex-shrink-0">
          <option value="">選擇角色</option>
          {roles.filter(r => r.name).map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        {/* Task name */}
        <input
          type="text"
          placeholder="任務名稱"
          value={task.name}
          onChange={e => onUpdate({ ...task, name: e.target.value })}
          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
        />

        {/* Type dropdown */}
        <select
          value={task.type}
          onChange={e => onUpdate({ ...task, type: e.target.value, conditions: e.target.value === 'gateway' ? (task.conditions || []) : [] })}
          className="w-28 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 flex-shrink-0">
          {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {/* Remove button */}
        <button onClick={onRemove} disabled={!canRemove} title="移除此任務"
          className="text-red-400 hover:text-red-600 disabled:opacity-20 disabled:cursor-not-allowed text-sm flex-shrink-0 pt-1">
          ✕
        </button>
      </div>

      {/* Gateway conditions */}
      {isGateway && (
        <div className="px-3 pb-3 bg-yellow-50 border-t border-yellow-100">
          <div className="text-xs font-semibold text-yellow-700 mt-2 mb-1">網關條件：</div>
          {(task.conditions || []).map(cond => (
            <ConditionRow
              key={cond.id}
              cond={cond}
              taskIndex={index}
              activeTasks={activeTasks}
              l3Number={l3Number}
              onUpdate={updated => updateCondition(cond.id, updated)}
              onRemove={() => removeCondition(cond.id)}
            />
          ))}
          <button onClick={addCondition}
            className="mt-2 px-3 py-1 text-xs border border-dashed border-yellow-400 text-yellow-700 rounded hover:bg-yellow-100 transition-colors">
            + 新增條件
          </button>
          {(task.conditions || []).length === 0 && (
            <p className="text-xs text-yellow-600 mt-1 opacity-70">請新增至少一個條件，否則流程無法繼續</p>
          )}
        </div>
      )}
    </div>
  );
}

function Step3({ data, onChange }) {
  const activeTasks = useMemo(
    () => data.tasks.filter(t => t.name.trim() || t.roleId),
    [data.tasks]
  );

  function addTask() {
    onChange({ tasks: [...data.tasks, makeTask()] });
  }

  function updateTask(id, updated) {
    onChange({ tasks: data.tasks.map(t => t.id === id ? updated : t) });
  }

  function removeTask(id) {
    if (data.tasks.length <= 1) return;
    onChange({ tasks: data.tasks.filter(t => t.id !== id) });
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-1">L4 任務輸入</h2>
      <p className="text-sm text-gray-500 mb-4">
        依序填入每個步驟，任務按填寫順序排列。標示「網關」的步驟需設定條件分支。
      </p>

      {/* Column headers */}
      <div className="flex items-center gap-2 px-2.5 mb-2 text-xs font-semibold text-gray-500">
        <span className="w-14 flex-shrink-0">編號</span>
        <span className="w-28 flex-shrink-0">角色</span>
        <span className="flex-1">任務名稱</span>
        <span className="w-28 flex-shrink-0">類型</span>
        <span className="w-6 flex-shrink-0" />
      </div>

      <div className="flex flex-col gap-2">
        {data.tasks.map((task, i) => {
          const activeIdx = activeTasks.indexOf(task);
          const displayIdx = activeIdx >= 0 ? activeIdx : i;
          return (
            <TaskRow
              key={task.id}
              task={task}
              index={displayIdx}
              roles={data.roles}
              activeTasks={activeTasks}
              l3Number={data.l3Number || '?'}
              onUpdate={updated => updateTask(task.id, updated)}
              onRemove={() => removeTask(task.id)}
              canRemove={data.tasks.length > 1}
            />
          );
        })}
      </div>

      <button onClick={addTask}
        className="mt-4 px-4 py-2 text-sm border border-dashed border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors w-full">
        + 新增任務欄位
      </button>

      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
        <strong>提示：</strong>
        任務按上到下的填寫順序連接。如需讓流程跳回某個步驟（如重新報價），請在「網關」條件中選擇該目標任務。
        空白的任務欄位在產生圖表時會自動忽略。
      </div>
    </div>
  );
}

// ── Step 4: Preview ──────────────────────────────────────────────
function Step4({ data }) {
  const cleanedFlow = useMemo(() => {
    const validRoles = data.roles.filter(r => r.name.trim());
    const validRoleIds = new Set(validRoles.map(r => r.id));
    const validTasks = data.tasks.filter(t => t.name.trim() && t.roleId && validRoleIds.has(t.roleId));
    const validTaskIds = new Set(validTasks.map(t => t.id));
    const tasks = validTasks.map(t => ({
      ...t,
      conditions: (t.conditions || []).filter(c => c.label.trim() && c.nextTaskId && validTaskIds.has(c.nextTaskId)),
    }));
    return { ...data, roles: validRoles, tasks };
  }, [data]);

  if (!cleanedFlow.roles.length || !cleanedFlow.tasks.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">資料不完整，請返回確認每個任務都有角色與名稱</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">流程圖預覽</h2>
      <p className="text-sm text-gray-500 mb-4">確認圖表後點選「儲存」完成建立</p>
      <DiagramRenderer flow={cleanedFlow} showExport={true} />
    </div>
  );
}

// ── Validation per step ──────────────────────────────────────────
function validate(step, data) {
  if (step === 0) {
    if (!data.l3Number.trim()) return 'L3 流程編號為必填';
    if (!/^\d+(\.\d+)*$/.test(data.l3Number.trim())) return 'L3 編號格式錯誤（範例：1.1.1）';
    if (!data.l3Name.trim()) return 'L3 流程名稱為必填';
    return null;
  }
  if (step === 1) {
    const named = data.roles.filter(r => r.name.trim());
    if (named.length < 2) return '至少需要 2 個有名稱的角色';
    return null;
  }
  if (step === 2) {
    const validRoleIds = new Set(data.roles.filter(r => r.name.trim()).map(r => r.id));
    const active = data.tasks.filter(t => t.name.trim() && t.roleId && validRoleIds.has(t.roleId));
    if (active.length === 0) return '至少需要 1 個有角色和名稱的任務';
    for (const t of active) {
      if (t.type === 'gateway' && (!t.conditions || t.conditions.length === 0)) {
        return `任務「${t.name}」是網關，請至少加入一個條件`;
      }
      if (t.type === 'gateway') {
        for (const c of t.conditions) {
          if (!c.label.trim()) return `任務「${t.name}」有一個條件缺少標籤`;
          if (!c.nextTaskId) return `任務「${t.name}」有一個條件未選擇目標任務`;
        }
      }
    }
    return null;
  }
  return null;
}

// ── Main Wizard ──────────────────────────────────────────────────
const STEPS = ['L3 基本資訊', '泳道角色', 'L4 任務', '圖表預覽'];

export default function Wizard({ flow, onSave, onCancel }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => initFormData(flow));
  const [error, setError] = useState('');

  function update(fields) {
    setData(prev => ({ ...prev, ...fields }));
    setError('');
  }

  function next() {
    const err = validate(step, data);
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  }

  function back() {
    setError('');
    setStep(s => s - 1);
  }

  function handleSave() {
    const err = validate(step, data);
    if (err) { setError(err); return; }
    onSave(data);
  }

  return (
    <div className="min-h-screen" style={{ background: '#F3F4F6' }}>
      {/* Top bar */}
      <header className="px-6 py-3 shadow-md flex items-center gap-4" style={{ background: '#4A5240', color: 'white' }}>
        <button onClick={onCancel} className="text-white opacity-70 hover:opacity-100 text-sm">← 返回</button>
        <span className="text-lg font-bold tracking-wide">
          {flow ? '編輯 L3 流程' : '新增 L3 流程'}
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <StepIndicator current={step} steps={STEPS} />

        {/* Step content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-64">
          {step === 0 && <Step1 data={data} onChange={update} />}
          {step === 1 && <Step2 data={data} onChange={update} />}
          {step === 2 && <Step3 data={data} onChange={update} />}
          {step === 3 && <Step4 data={data} />}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            ⚠ {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <button onClick={back} disabled={step === 0}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            ← 上一步
          </button>

          <div className="flex gap-3">
            <button onClick={onCancel}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-500 text-sm hover:bg-gray-50 transition-colors">
              取消
            </button>

            {step < STEPS.length - 1 ? (
              <button onClick={next}
                className="px-6 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ background: '#2A52BE' }}
                onMouseEnter={e => e.target.style.background = '#1a3a9e'}
                onMouseLeave={e => e.target.style.background = '#2A52BE'}>
                下一步 →
              </button>
            ) : (
              <button onClick={handleSave}
                className="px-6 py-2 rounded-lg text-white text-sm font-bold transition-colors"
                style={{ background: '#16982B' }}
                onMouseEnter={e => e.target.style.background = '#0f7222'}
                onMouseLeave={e => e.target.style.background = '#16982B'}>
                ✓ 儲存流程
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
