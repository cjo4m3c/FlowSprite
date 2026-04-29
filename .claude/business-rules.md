# Claude 協作慣例 / 工程 Insight

本檔留 Claude 工作流相關的慣例（routing trace 驗證、Excel I/O 相容、CJK wrap、文件同步、協作偏好）。

**業務規則本身（5 條核心規則 / 閘道分類 / 編號規則 / 儲存檢核兩層 / 元件類型 / 連線型態）已搬到 `docs/business-spec.md`**：
- 該文件是業務規則的單一來源（給人類協作者看）
- HelpPanel 從 `src/data/helpPanelData.js` 讀同一份規則摘要（給使用者看）
- **改業務規則 = `docs/business-spec.md` + `src/data/helpPanelData.js` + changelog 三者同步**

本檔不重複業務規則內容，避免雙源頭漂移。

## 1. 工程慣例（補充 CLAUDE.md §10.2）

### routing 細節在 `HANDOVER.md` §2.5

dr/dc 表 / 8 個 phase / corridor slot 規則 / port-mix 檢查方向都在那裡。改動 `src/diagram/layout/` 前先讀那份。

### 改 routing 必做 trace 驗證

寫 `/tmp/trace-*.mjs` mock flow 呼叫 `computeLayout`，印 `connections.exitSide / entrySide` diff。**別假設「build 過 = 邏輯對」**。

歷史教訓：Phase 3d 方向寫反 / corridor 降級漏檢查混用，都是沒 trace 就報「完成」造成來回。

### Excel I/O 向後相容

匯出只產新格式；匯入用放寬 regex 吃新舊格式（迴圈返回同時吃「迴圈返回，序列流向 X」、「迴圈返回至 X」、「迴圈返回 X」）。

### CJK / Latin 混合文字

任何 wrap / truncate 都要 token-aware（CJK 逐字、Latin 整字不切），權重用 CJK = 2 / Latin = 1。

### 文件同步三件組

程式邏輯改動 → `current.js` 加 changelog 條目 + 視情況更新 `HANDOVER.md`（phase 清單 / PR 範圍）。

業務規則改動 → 走「規則三件組」：`docs/business-spec.md`（章節 + 對應實作）+ `src/data/helpPanelData.js`（對應 array + 章節錨點註解）+ `current.js`（changelog）。**三者漏一都算沒做完**。

### 日期用 `date +%Y-%m-%d` 取

不要依賴記憶或 session context（04-22 被寫成 04-23 的教訓）。

## 2. 協作 / 使用者偏好

- **小改動 / 明確需求**：直接動手
- **大改動 / 多種解法 / 跨檔案影響**：先提**計畫 + 主要 tradeoff（2–3 句）**，使用者點頭再執行
- **PR 走 branch → squash merge**：Claude 開分支 push → 使用者在 GitHub 網頁建 PR + merge → Claude 合後 `git fetch origin main && git reset --hard origin/main` 清乾淨 + 刪本地分支
- **分支衝突**：分支基於前一個未合併的 PR → 等前面合併後 `git rebase origin/main`（git 會自動 skip 已 squash 的 commit）
- **使用者回報「還是有同樣問題」**：先 trace 原始 fix 是否真的生效，**90% 是條件寫反 / 漏檢查某情境 / 順序依賴**，不是要重新想辦法
- 回應**簡潔**，不要長篇大論複述思路
- Changelog 條目**引用使用者原話**當規則來源錨點（例：「使用者：「不能讓一個元件的端點同時有進入和出發」」）
