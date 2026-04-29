/**
 * Changelog "current tip" — new entries since last freeze land here.
 * When this file grows beyond ~7KB, freeze: rename to c{next}.js + reset to [].
 * Entries are newest-first within file.
 */
export default [
  {
    date: '2026-04-29',
    title: 'PR-A：ContextMenu 操作整合 — 順序重排 / 新增其他 / 轉換為 / 閘道 inline 編輯 / 拖端點到閘道自動加 condition',
    items: [
      '**緣由**：使用者 epic「整合所有的操作 — 流程圖上可以做的操作 = 編輯器可以做的操作」需求 1-5 + 補充說明（連線拖到閘道時自動加 condition + 順序按元件類型不同）。',
      '**Step A — roleId 補漏**：`useFlowActions.js` 的 `addTaskAfter` (line 60) 跟 `addTaskBefore` (line 29) 原本用 `makeTask()` default `roleId: \'\'`，跟 `addL3ActivityAfter` / `insertGatewayAfter` 不一致 — 修正為 `makeTask({ roleId: anchor.roleId || \'\' })`。使用者描述「新增任務帶入未選擇但放第一泳道」對應這條。',
      '**Step B — ContextMenu 順序重排**：actions list 改成「常用程度由上往下」。非閘道：1.新增任務 / 2.新增閘道 / 3.新增連線 / 4.新增 L3 流程 / 5.新增其他 / 6b.轉換為 / 7.刪除。閘道：1-4 同 / 6.編輯閘道（種類 + 條件） / 5.新增其他 / 7.刪除（不顯示「轉換為」因為「編輯閘道」已涵蓋）。原「換閘道種類」獨立 sub-form 升級成「編輯閘道」整合 conditions 編輯。',
      '**Step C — 新增其他 sub-menu**：`subforms.jsx` 加 `OtherSubForm`，4 個按鈕（開始事件 / 結束事件 / 流程斷點 / 外部互動）。`useFlowActions` 加 `addOtherAfter(anchorId, kind)`：start/interaction 繼承 anchor 的 downstream（anchor → new → 原 next）；end/breakpoint 不要 outgoing（anchor 的 downstream 被丟棄，使用者要自行確認）。所有 kind 都繼承 anchor.roleId 自動進對應泳道。',
      '**Step D — 轉換為 sub-menu**：`subforms.jsx` 加 `ConvertSubForm`，9 個目標選項（task / l3activity / interaction / start / end / breakpoint / gateway-xor / gateway-and / gateway-or）。`useFlowActions` 加 `convertTaskType(taskId, kind)`：保留 id / name / role / description；連線結構盡力保留（gateway↔非 gateway 互轉時 conditions↔nextTaskIds[0] 對應，多餘的使用者要手動補）；轉換時 stored l4Number 跟 connectionOverrides 都清掉（type 變動讓舊值失效）。',
      '**Step E — 既有閘道 inline 編輯**：`subforms.jsx` 加 `GatewayEditorSubForm` 取代原 `GatewaySwitchSubForm`。內含閘道類型 radio（XOR/AND/OR） + conditions 列表（每行：分支標籤 input + 目標任務下拉 + ✕ 刪除按鈕） + 「+ 新增分支」按鈕。auto-save（每次 change 即 `onUpdate` 不需確認），跟主編輯區的 name/role/description 一致風格。**修了使用者反饋的「閘道條件只能新增不能編輯」**。',
      '**Step F — 拖連線到閘道自動加 condition**：`useDragEndpoint.js` 的 endDrag 加判斷：拖 target endpoint 落在 gateway 上時，呼叫新 callback `onWireThroughGateway(fromTaskId, oldKey, gatewayId, originalTargetId, snapSide)` 取代普通的 `onChangeTarget`。`useFlowActions` 加 `wireConnectionThroughGateway`：A→B 變 A→gateway 之餘，**閘道也加一條 condition 指向原 target B**，label 為空。等於 A→C→B 的拓撲一次完成。使用者再點閘道 ContextMenu 編輯閘道 condition 補 label 即可。',
      '**檔案大小管理**：useFlowActions.js 加 3 個新 actions 後 20.4KB 超 20KB 硬上限。把 3 個新 actions 抽到 `src/components/FlowEditor/useFlowActions/converters.js`（factory pattern，回傳 `makeConverterActions({ liveFlow, patch })`），主檔 import 後 spread 到 return。主檔降回 13.3KB；新檔 7.3KB。`CLAUDE.md` §6 拆檔表更新。',
      '**動到的檔案**：`src/components/FlowEditor/useFlowActions.js`（roleId 補漏 + 移除 3 fns + 新檔 import）/ `src/components/FlowEditor/useFlowActions/converters.js`（**新檔** addOtherAfter / convertTaskType / wireConnectionThroughGateway）/ `src/components/ContextMenu/index.jsx`（actions 重排 + 接 6 個 sub-form + 新 props onAddOther / onConvertType）/ `src/components/ContextMenu/subforms.jsx`（+OtherSubForm + ConvertSubForm + GatewayEditorSubForm 取代 GatewaySwitchSubForm）/ `src/components/DiagramRenderer/useDragEndpoint.js`（gateway 拖落判斷）/ `src/components/DiagramRenderer/index.jsx`（onWireThroughGateway prop 透傳）/ `src/components/FlowEditor/index.jsx`（onAddOther / onConvertType / onWireThroughGateway 傳給 ContextMenu / DiagramRenderer）/ `CLAUDE.md`（拆檔表）。`build` 通過（809→815 KB, +0.7%）。',
      '**接下來 PR-B**：合併型移除（移除 CONNECTION_TYPES 的 parallel-merge / conditional-merge / inclusive-merge）+ formatConnection 加 task-merge 自動偵測（一般任務收 ≥2 incoming → 列出 source 編號的合併文字）+ flowAnnotation 為空時自動填、非空時跳 modal 詢問插入到前面 + spec doc / HelpPanel 同步。',
    ],
  },
  {
    date: '2026-04-29',
    title: 'PR-0：拆 ContextMenu.jsx 19KB → 2 檔（純 refactor，PR-A 鋪路）',
    items: [
      '**緣由**：使用者規劃「整合所有操作」epic，PR-A（ContextMenu 操作大改）動到 ContextMenu.jsx 19KB 即將破 20KB 硬上限。先做拆檔讓 PR-A 改動安全。本 PR 是純 refactor，user-visible 無變化。',
      '**拆法**：`src/components/ContextMenu.jsx` 19KB → `src/components/ContextMenu/index.jsx` 13KB（主框架 + state hub + edit fields + actions list）+ `src/components/ContextMenu/subforms.jsx` 8KB（4 個 sub-form：L3 / Connection / Gateway / GatewaySwitch）。原 `ContextMenu.jsx` 改成 shim re-export，外部 import 路徑 `from \'../components/ContextMenu.jsx\'` 不變。',
      '**子檔切分原則**：state 跟 actions list 留在 index.jsx（因 sub-form 觸發按鈕跟列表整合在 actions block）；4 個 sub-form 元件抽到 subforms.jsx，prop 介面化（sub-form 收 state + setter + onCancel/onSubmit）。',
      '**動到的檔案**：`src/components/ContextMenu.jsx`（原 19KB → 213B shim）/ `src/components/ContextMenu/index.jsx`（新檔 13KB）/ `src/components/ContextMenu/subforms.jsx`（新檔 8KB）/ `CLAUDE.md` §6 拆檔表加 ContextMenu / `src/data/changelog/current.js`（本條）。`build` 通過。',
      '**下一步**：PR-A（操作整合 — 順序重排 / 新增其他 sub-menu / 抽換轉換 / 既有閘道 inline 編輯 / roleId 補漏 / 連線拖端點到 gateway 自動加 condition）。',
    ],
  },
];
