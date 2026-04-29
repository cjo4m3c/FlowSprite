import { taskOptionLabel } from '../../utils/taskDefs.js';

/**
 * Add-action sub-forms for the ContextMenu — one block per add type.
 * All forms share a common shape: title row + body fields + action row
 * (取消 / 確認). Visibility is controlled by the parent's `subForm` state.
 */

function renderTargetOption(t, displayLabels) {
  return (
    <option key={t.id} value={t.id}>
      {taskOptionLabel(t, displayLabels || {})}
    </option>
  );
}

export function L3ActivitySubForm({
  l3Number, setL3Number, l3Name, setL3Name,
  onCancel, onSubmit,
}) {
  return (
    <div className="px-3 py-2 bg-gray-50 border-t border-b border-gray-100 flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">L3 編號 *</span>
        <input type="text" value={l3Number} onChange={(e) => setL3Number(e.target.value)}
          placeholder="例：5-3-2"
          className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">L3 活動名稱（選填）</span>
        <input type="text" value={l3Name} onChange={(e) => setL3Name(e.target.value)}
          placeholder="例：客戶資料審核"
          className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
      </label>
      <p className="text-xs text-gray-400 pl-1">
        ℹ L3 活動會插入在當前元件之後，並自動接續原本的下一步
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900">取消</button>
        <button onClick={onSubmit} disabled={!l3Number.trim()}
          className="px-3 py-1 text-xs rounded text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: l3Number.trim() ? '#2A5598' : '#9CA3AF' }}>
          確認
        </button>
      </div>
    </div>
  );
}

export function ConnectionSubForm({
  connTarget, setConnTarget, targetOptions, displayLabels,
  onCancel, onSubmit,
}) {
  return (
    <div className="px-3 py-2 bg-gray-50 border-t border-b border-gray-100 flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">連線目標</span>
        <select value={connTarget} onChange={(e) => setConnTarget(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option value="">選擇目標任務</option>
          {targetOptions.map(t => renderTargetOption(t, displayLabels))}
        </select>
      </label>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900">取消</button>
        <button onClick={onSubmit} disabled={!connTarget}
          className="px-3 py-1 text-xs rounded text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: connTarget ? '#2A5598' : '#9CA3AF' }}>
          確認
        </button>
      </div>
    </div>
  );
}

export function GatewaySubForm({
  gwType, setGwType,
  gwLabel1, setGwLabel1, gwTarget1, setGwTarget1,
  gwLabel2, setGwLabel2, gwTarget2, setGwTarget2,
  targetOptions, displayLabels,
  onCancel, onSubmit,
}) {
  const canSubmit = !!(gwTarget1 && gwTarget2);
  return (
    <div className="px-3 py-2 bg-gray-50 border-t border-b border-gray-100 flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">閘道類型</span>
        <div className="flex gap-3 text-xs">
          {[
            { v: 'xor', label: '條件 ◇×' },
            { v: 'and', label: '並行 ◇+' },
            { v: 'or',  label: '包容 ◇⊙' },
          ].map(opt => (
            <label key={opt.v} className="flex items-center gap-1 cursor-pointer">
              <input type="radio" value={opt.v} checked={gwType === opt.v}
                onChange={() => setGwType(opt.v)} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">分支 1</span>
        <input type="text" value={gwLabel1} onChange={(e) => setGwLabel1(e.target.value)}
          placeholder={gwType === 'and' ? '條件標籤（選填）' : '條件標籤（如「已核准」）'}
          className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
        <select value={gwTarget1} onChange={(e) => setGwTarget1(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option value="">選擇目標任務</option>
          {targetOptions.map(t => renderTargetOption(t, displayLabels))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">分支 2</span>
        <input type="text" value={gwLabel2} onChange={(e) => setGwLabel2(e.target.value)}
          placeholder={gwType === 'and' ? '條件標籤（選填）' : '條件標籤（如「未通過」）'}
          className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
        <select value={gwTarget2} onChange={(e) => setGwTarget2(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option value="">選擇目標任務</option>
          {targetOptions.map(t => renderTargetOption(t, displayLabels))}
        </select>
      </div>
      <p className="text-xs text-gray-400 pl-1">
        ℹ 閘道會插入在當前元件之後，原本「序列流向」會被覆寫為「→ 閘道」
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900">取消</button>
        <button onClick={onSubmit} disabled={!canSubmit}
          className="px-3 py-1 text-xs rounded text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: canSubmit ? '#2A5598' : '#9CA3AF' }}>
          確認
        </button>
      </div>
    </div>
  );
}

export function GatewaySwitchSubForm({
  gwSwitchType, setGwSwitchType, currentType,
  onCancel, onSubmit,
}) {
  const disabled = gwSwitchType === currentType;
  return (
    <div className="px-3 py-2 bg-gray-50 border-t border-b border-gray-100 flex flex-col gap-2">
      <span className="text-xs text-gray-500">新閘道類型</span>
      <div className="flex gap-3 text-xs">
        {[
          { v: 'xor', label: '排他 ◇×' },
          { v: 'and', label: '並行 ◇+' },
          { v: 'or',  label: '包容 ◇⊙' },
        ].map(opt => (
          <label key={opt.v} className="flex items-center gap-1 cursor-pointer">
            <input type="radio" value={opt.v} checked={gwSwitchType === opt.v}
              onChange={() => setGwSwitchType(opt.v)} />
            {opt.label}
          </label>
        ))}
      </div>
      <p className="text-xs text-gray-400 pl-1">
        ℹ 名稱前綴 `[OO閘道]` 自動換成新類型；現有 conditions / 連線目標保留
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900">取消</button>
        <button onClick={onSubmit} disabled={disabled}
          className="px-3 py-1 text-xs rounded text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: disabled ? '#9CA3AF' : '#2A5598' }}>
          確認
        </button>
      </div>
    </div>
  );
}
