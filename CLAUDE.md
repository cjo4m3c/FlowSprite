# CLAUDE.md — FlowSprite 專案長期規則

本檔案由 Claude 自動維護，記錄所有跨對話的長期規則與慣例。
每次調整規則後須同步更新此檔並 push 到 remote。

---

## 1. 儲存庫與分支

- **GitHub repo**：`cjo4m3c/FlowSprite`
- **開發分支**：`claude/push-swimlane-files-Jd8k1`（所有修改都推到此分支）
- **MCP scope**：GitHub MCP tools 僅允許 `cjo4m3c/flowsprite`；不得操作其他 repo

## 2. Git 推送規則

- `git push` 會被 local proxy 擋下（HTTP 503），**不可使用**
- 推送只能透過 `mcp__github__push_files`
- **一次只推 1 個檔案**，避免 stream idle timeout；每推完一個回報一次
- commit message 用英文為主，描述變更原因而非細節
- 絕不 push 到其他分支，也不建 PR（除非使用者明確要求）

## 3. L3 / L4 編號格式（核心業務規則）

- **L3 編號**：`1-1-1`（三層橫線分隔）
- **L4 編號**：`1-1-1-1`（L3 編號 + `-` + 序號）
- 格式驗證 regex 同時相容點與橫線：`/^\d+([.-]\d+)*$/`
- Excel 匯入：若原始資料用點分隔，系統自動正規化為橫線
- 所有新範例、placeholder、錯誤訊息都必須使用橫線格式
- 已套用此規則的位置：
  - `src/utils/excelImport.js`：`normalizeL3Number` (commit 4ef7d66)
  - `src/utils/taskDefs.js`：`computeDisplayLabels` (commit 4ef7d66)
  - `src/components/Wizard.jsx`：regex、placeholder、preview、錯誤訊息
  - `src/components/HelpPanel.jsx`：文件範例
  - `src/components/ChangelogPanel.jsx`：2026-04-17 條目

## 4. Changelog 維護（`src/components/ChangelogPanel.jsx`）

- `CHANGELOG` 陣列採 **newest first**（最新的放最前面）
- 條目格式：
  ```js
  {
    date: 'YYYY-MM-DD',
    title: '簡短標題',
    items: ['...', '...'],
  },
  ```
- 每次功能更新後必須新增一筆

## 5. 編碼與語言

- 所有中文內容使用 **raw UTF-8**，不得用 `\uXXXX` 跳脫
- 註解與文件以使用者的語言（繁體中文）為主

## 6. 編輯原則

- 優先使用 `Edit` 改既有檔案，避免新增多餘檔案
- 除非使用者明確要求，不新增文件檔 (*.md)
- 不添加無意義註解（只在 WHY 非顯而易見時才加）
- 任務若太大會造成 timeout，**先用 TodoWrite 拆成多個小步驟**再執行

## 7. 對話狀態維護

- 每次更新後同步維護此 CLAUDE.md
- 定期輸出進度摘要，保留關鍵 commit SHA 與待辦狀態
- 若切換環境（如 sandbox 重置），以 remote 分支為真實來源

---

## 當前待辦狀態

（由 TodoWrite 即時管理，此處僅記錄跨 session 需要保留的項目）

_無_
