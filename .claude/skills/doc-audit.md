---
name: doc-audit
description: Verify that ChangelogPanel, HelpPanel, README, and HANDOVER are aligned with the latest code changes. Use when the user asks to "check docs"/"sync docs"/"確認文件是最新" or before shipping a major refactor.
---

# /doc-audit — 四份文件同步檢查

確認下列四份文件跟當前 main / branch 的程式碼狀態對齊。**逐項檢查，有不合才動手修。**

## 檢查清單

### 1. `src/components/ChangelogPanel.jsx`

- [ ] 最頂部條目的 `date` 是今天（使用者系統日期）
- [ ] 頂部條目的 `title` 對應當前 branch 的主要變更
- [ ] `items` 覆蓋所有本次 commit 的重點（爬 `git log <branch> --not origin/main`）
- [ ] 日期格式 `YYYY-MM-DD`，陣列 newest first

### 2. `src/components/HelpPanel.jsx`

對應資料常數：
- [ ] `NUMBERING`：涵蓋 L3 / L4 / 開始 / 結束 / 閘道 / 迴圈返回 / 子流程 7 種
- [ ] `ELEMENTS`：所有元件類型（start / end / task / interaction / l3activity / 3 種 gateway）
- [ ] `VALIDATION`：Wizard.jsx 裡的所有驗證規則都列到
- [ ] `CONNECTIONS`：所有 `connectionType` 值都有對應描述
- [ ] `ROUTING`：跟 `layout.js` 的 `getExitPriority` / `inferEntrySide` / Phase 1/2/3/3b/3c 對齊
- [ ] `CORRIDOR`：top / bottom corridor slot 系統描述

Cross-check：跑 `grep "ct ===" src/components/ConnectionSection.jsx` 確保 HelpPanel.CONNECTIONS 列到所有類型。

### 3. `README.md`

- [ ] 「本地建置」區塊的 Node 版本跟 `.github/workflows/deploy.yml` 一致
- [ ] Runtime / dev deps 表格跟 `package.json` 一致
- [ ] 專案架構樹對應 `src/` 實際檔案清單
- [ ] 關鍵檔案區塊的描述跟實際功能一致（尤其 `layout.js` 行數 / 能力）

### 4. `HANDOVER.md`

- [ ] 程式碼結構樹跟 README 一致
- [ ] 「核心業務規則」章節跟 `CLAUDE.md` 規則 3 一致
- [ ] 「交接情境」沒有已過時的做法（例：提到已淘汰的 MCP tool）
- [ ] Backlog 項目反映最新狀態（已完成的移除 / 新增的加入）
- [ ] 風險與限制章節的 PR 編號範圍涵蓋到最新 merged PR

## 審核後的動作

- **全部對齊**：跟使用者回報「四份文件已同步最新」
- **有不合**：只改需要改的段落（不要整個 rewrite），每個改動一次小 Edit 避免 timeout
- **涉及業務規則**：同步修 `CLAUDE.md` 規則 3（但這是規則來源，應該比文件更早被更新）

## 避免做的事

- 不要 regenerate 整份文件（每次一個小段落改）
- 不要自己加 feature description 以外的內容（例：行銷語、TODO 項目）
- 不要因為文件沒改就「假裝改了」然後 commit empty change
