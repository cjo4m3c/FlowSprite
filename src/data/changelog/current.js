/**
 * Changelog "current tip" — new entries since last freeze land here.
 * When this file grows beyond ~7KB, freeze: rename to c{next}.js + reset to [].
 * Entries are newest-first within file.
 */
export default [
  {
    date: '2026-04-29',
    title: '下載按鈕集中到 Header dropdown + 修表格 thead sticky bug + 取消重複資訊',
    items: [
      '**緣由**：使用者：「(1) 下載按鈕都移到置頂標題列，跟儲存按鈕同排 (2) 取消白色區塊的標題與說明文字（重複了），所以原本捲動後白色區塊置頂功能可移除 (3) 目前捲動到表格時表頭沒固定，反而多了一列空白資料列在原本表頭上方」。',
      '**bug 根因（PR #91 sticky 設計錯誤）**：CSS sticky 規範找最近的 scrolling box 當 sticky boundary，**任一軸** `overflow: auto/scroll/hidden/clip` 都算，**不分軸向**。Chromium 嚴格依規範。所以表格在 `overflow-x-auto` 容器內時，垂直 sticky 也被那個容器卡住，邊界錯誤導致 thead 跟著表格捲走。我之前在 PR #91 寫的「`overflow-x` 不擋垂直 sticky」是誤判。',
      '**正解：表格容器自捲動**：`FlowTable.jsx` 表格容器改 `overflow: auto` + `style={{ maxHeight: \'calc(100vh - 80px)\' }}`（80 = Header 56 + main py-6 上半 24）。thead `<th>` 改 `sticky top: 0`（相對容器頂端）。當頁面捲到表格區，整個容器進入 viewport 後內部開始自捲動，thead 永遠在容器頂端 ≈ viewport 56px。',
      '**FlowTable 取消標題說明**：移除「任務表格 (N 筆)」h3 + 「白色欄位可直接編輯…」p（重複資訊，使用者重複用不需要操作指引）。L3 toggle 按鈕保留（actionable，不是說明），改放在新的小條右側。',
      '**下載按鈕集中到 Header dropdown**：`FlowEditor/Header.jsx` 在「打開編輯器」與「儲存」之間加「↓ 下載 ▾」dropdown 按鈕，展開三個選項（匯出 PNG / 匯出 .drawio / 下載 Excel 表格）。每個選項串 `saveAndValidate(callback)`：blocking 錯誤直接擋（無法存也無法下載），warning 跳 modal 由使用者選「仍然儲存」決定，通過則存 + 下載。Click outside / ESC 收起 dropdown。',
      '**DiagramRenderer 改 forwardRef + useImperativeHandle**：暴露 `{ exportPng, exportDrawio, exportExcel }` 三個 imperative handler 給 FlowEditor。FlowEditor 用 `diagramRef = useRef(null)` 拿到，組成 `downloadHandlers = { png, drawio, excel }` 傳給 Header。內部不再依賴 `onBeforeExport` prop（callback 主導權移到 Header 那邊）。',
      '**移除 Toolbar.jsx 整個元件**：原本含「下載按鈕 ×3 / L3 編號標籤 / editable 提示文字 / 選中連線反饋」四塊功能。下載按鈕移到 Header；L3 標籤跟 Header input 重複；editable 提示文字使用者不需要；**選中連線反饋也移除**（使用者：「會自行點選連線、再點一次取消」）。整個 `src/components/DiagramRenderer/Toolbar.jsx` 刪檔，登錄到 `.claude/orphans.md`。`DiagramRenderer/index.jsx` 移除 sticky wrapper（不再有 toolbar 要黏）。',
      '**Dashboard PNG hidden renderer 同步**：兩處 `<DiagramRenderer showExport={false} ...>` 移除 `showExport` prop（DiagramRenderer 不再接受此 prop，永遠不渲染 toolbar）。',
      '**業務規格 §13.8 sticky 改寫**：移除原本的「Toolbar wrapper sticky 互斥」設計說明，改記載新的「FlowTable 自捲動」方案。加上 PR #91 失敗教訓「為什麼不用整頁 thead sticky」（CSS sticky boundary 規則），避免下次重蹈覆轍。Header 高度漂移防護改成 `calc(100vh - 80px)` 的 80 同步檢查。',
      '**動到的檔案（8 個）**：`src/components/FlowTable.jsx`（移 h3+p / 容器 maxHeight+overflow / thead top:0）/ `src/components/DiagramRenderer/index.jsx`（forwardRef + useImperativeHandle / 移 Toolbar wrapper / 移 onBeforeExport / 移 showExport）/ `src/components/DiagramRenderer/Toolbar.jsx`（**刪檔**）/ `src/components/FlowEditor/Header.jsx`（+download dropdown + click-outside hook）/ `src/components/FlowEditor/index.jsx`（diagramRef + downloadHandlers + 串 saveAndValidate）/ `src/components/Dashboard.jsx`（移 showExport prop 兩處）/ `docs/business-spec.md`（§13.8 改寫）/ `.claude/orphans.md`（紀錄 Toolbar.jsx 已刪）。`build` 通過。',
      '**Changelog freeze**：上次 PR 後 current.js 累積 10.3KB（超 7KB 軟上限），凍結 PR #90 編號 `_s` + PR #91 sticky 設計（含失敗的 Toolbar wrapper）+ PR #92 表格欄寬統一三條到 `c18.js`；`index.js` 加 c18 import；current.js 重置只留本 PR 條目。',
    ],
  },
];
