---
name: doc-audit
description: Verify that ChangelogPanel, HelpPanel, README, HANDOVER, and the four-view-sync invariant are aligned with the latest code changes. Use when the user asks to "check docs"/"sync docs"/"確認文件是最新" or before shipping a major refactor.
---

# /doc-audit — 文件同步檢查 + 四視圖一致性檢核

確認下列文件 + 一個關鍵 invariant 跟當前 main / branch 的程式碼狀態對齊。**逐項檢查，有不合才動手修。**

## 檢查清單

### 1. `src/components/ChangelogPanel.jsx`

- [ ] 最頂部條目的 `date` 是今天（使用者系統日期）
- [ ] 頂部條目的 `title` 對應當前 branch 的主要變更
- [ ] `items` 覆蓋所有本次 commit 的重點（爬 `git log <branch> --not origin/main`）
- [ ] 日期格式 `YYYY-MM-DD`，陣列 newest first

### 2. `src/components/HelpPanel.jsx`

對應資料常數：
- [ ] `NUMBERING`：涵蓋 L3 / L4 / 開始 / 結束 / 閘道 / 迴圈返回 / 子流程 7 種
- [ ] `ELEMENTS`：所有元件類型（start / end / task / interaction / l3activity / **3 種 gateway: XOR / AND / OR**）
- [ ] `VALIDATION`：**`FlowEditor.jsx validateFlow`** 裡的所有驗證規則都列到（注意：歷史上這段曾誤指 Wizard.jsx，validation 主邏輯實際在 FlowEditor）
- [ ] `CONNECTIONS`：所有 `connectionType` 值都有對應描述（包含 inclusive-branch / inclusive-merge）
- [ ] `EDITABLE_ACTIONS`：使用者可在畫面操作的編輯動作（拖曳 / ContextMenu / hover tooltip / 拖端點覆寫等）
- [ ] `FORBIDDEN_RULES`：不能違反的規則（IN+OUT 混用 / 線跨任務 / 開始結束必須有連線 / L4 編號）
- [ ] **不再含** ROUTING / CORRIDOR table（已從 2026-04-27 移到 `HANDOVER.md` §2.5 內部開發者文件）

Cross-check：
- 跑 `grep "if (ct ===" src/components/ConnectionSection.jsx` 確認 HelpPanel.CONNECTIONS 列到所有 ct 值
- 跑 `grep "applyConnectionType\|gwMap" src/utils/taskDefs.js` 確認 ELEMENTS 涵蓋所有 gateway 類型
- 對照 `src/components/ContextMenu.jsx` + `FlowEditor.jsx` 的 add-connection / add-gateway / add-before/after 動作 — 都有列在 EDITABLE_ACTIONS

### 3. `README.md`

- [ ] 「本地建置」區塊的 Node 版本跟 `.github/workflows/deploy.yml` 一致
- [ ] Runtime / dev deps 表格跟 `package.json` 一致
- [ ] 專案架構樹對應 `src/components/` + `.claude/skills/` 實際檔案清單（特別注意 `RightDrawer.jsx` / `ContextMenu.jsx` / `paste-bundle.md` / `preview-branch.md` / `wrap-pr.md`）
- [ ] 關鍵檔案區塊的描述跟實際功能一致（尤其 `layout.js` 行數 / 能力）

### 4. `HANDOVER.md`

- [ ] 程式碼結構樹跟 README 一致
- [ ] §2.5 layout.js 內部路由規則仍對應 `layout.js` 實際 phase（dr/dc 表 + corridor slot 表 + 規則 1/2）
- [ ] §3.1 編號格式跟 `taskDefs.js` regex 常數一致
- [ ] §3.2 / §3.3 閘道關鍵字 — fork（XOR / AND / OR）+ merge target + loop-return
- [ ] §5.1 提到的 skill 數量正確（截至 2026-04-27 為 8 個：ship-feature / sync-main / doc-audit / trace-layout / ui-rules / paste-bundle / preview-branch / wrap-pr）
- [ ] 「交接情境」沒有已過時的做法
- [ ] Backlog 項目反映最新狀態（`ChangelogPanel.jsx` 已涵蓋的移除）

### 5. **四視圖一致性 invariant**（每次新增 / 編輯 / 刪除任務後必檢）

> 這是 2026-04-27 加進來的硬性檢核點 — 使用者明確要求：「每次更新時檢查」。

當任何 task / connection 被新增 / 編輯 / 刪除時，**4 個視圖必須同步**：

| 視圖 | 來源 | 驗證 |
|---|---|---|
| 流程圖（DiagramRenderer）| `liveFlow.tasks` 直接 reactive | 直接看畫面 |
| 右側 drawer 編輯器（FlowEditor flow tab）| `liveFlow.tasks` 直接 reactive | 看 TaskCard list |
| 下方 Excel 表格（FlowTable）| `flow.tasks` via useEffect re-sync | ⚠️ **過去 bug**：`useEffect` 只 watch `flow.id` 不 watch `flow.tasks`，新增 task 不同步 |
| 下載資料（Excel / drawio）| `liveFlow.tasks` → `buildExcelRows` / drawio export | 下載一次驗證 |

**檢核方式**：
1. 操作（新增 / 編輯 / 刪除）後，**至少同時看流程圖 + Excel 表格**。兩邊任務數 / 編號 / 名稱要一致
2. 對照 L4 編號是否連續（用 `computeDisplayLabels` 單一 source）
3. 任務名稱含 `[XX閘道] ` prefix 的（閘道類元件），切換閘道種類後 prefix 自動更新
4. 下載 Excel → 第一欄 L3 編號 / 第三欄 L4 編號 / 第四欄任務名稱 三者跟畫面一致

**修法（如不同步）**：
- FlowTable 不同步 → 檢查 `useEffect` deps（`flow.tasks` 必須在裡面）
- L4 編號不一致 → 檢查 `excelExport.js buildTableL4Map` 是否正確 wrap `computeDisplayLabels`
- 任務關聯說明文字不一致 → 檢查 `excelExport.js buildExcelRows` 是否永遠重算（不再用 stale `task.flowAnnotation`）

## 審核後的動作

- **全部對齊**：跟使用者回報「文件已同步最新 + 四視圖 invariant 通過」
- **有不合**：只改需要改的段落（不要整個 rewrite），每個改動一次小 Edit 避免 timeout
- **涉及業務規則**：同步修 `CLAUDE.md` 規則 3（但這是規則來源，應該比文件更早被更新）

## 避免做的事

- 不要 regenerate 整份文件（每次一個小段落改）
- 不要自己加 feature description 以外的內容（例：行銷語、TODO 項目）
- 不要因為文件沒改就「假裝改了」然後 commit empty change
- **不要跳過四視圖檢核**——這是硬性要求，不是可選步驟
