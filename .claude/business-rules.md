# 業務 / 設計規則 — Insight 累積

從歷次協作歸納的核心規則與工程慣例。**CLAUDE.md 只列「規則編號 + 一行摘要」；本檔保留完整描述**，避免 CLAUDE.md 持續膨脹。

## 1. 五條核心業務規則（按重要性）

### 規則 1：端點不混用（最強）

任一元件的 port 不可同時 IN + OUT。**違反規則 1 比線段交叉更嚴重**。

- **檢查方向**：新增 OUT 時檢查 `hasIn`（source 同 port 是否已有 IN）；新增 IN 時檢查 `hasOut`（target 同 port 是否已有 OUT）
- **同方向多條並不算混用**：兩條 IN 共用同一端點 OK（2026-04-23 回退 `expectedBackwardTopEntry` pre-scan 的原因）

### 規則 2：避免視覺重疊

線段不可跨過任務矩形。**重疊時優先改端點（source 上下、target 上下），其次改路徑**。

### 規則 3：依 target 順序排列 slot

多條連線並存時，按 target 欄位由左到右決定 slot 內外順序：

- Top corridor：slot 0 最內（緊鄰 lane 上緣）
- Bottom corridor：slot 0 最外（lane 底部往上堆）
- Tiebreaker：相同 target 時短 span 走內側

### 規則 4：編號顯示分層

- **流程圖只顯示 L3 / L4 的「正式編號」**
- start (`-0`) / end (`-99`) / 閘道 (`_g*`) 編號僅作辨識用，**不顯示在流程圖上**
- 編輯介面（task card、下拉選單）仍顯示全部編號

### 規則 5：流程儲存檢核兩層（FlowEditor `validateFlow`）

**Blocking（擋儲存）**：
- 必須有開始事件
- 必須有結束事件
- 開始事件必須有 outgoing
- 結束事件必須有 incoming

**Warning（跳 modal 由使用者決定）**：
- 非結束節點必須設定下一步
- 並行 / 條件 / 包容合併 ≥2 來源
- 每個節點必須被連接（除開始外）
- 迴圈返回必須指定目標
- 閘道未指定泳道角色

新增其他規則時照此分層，**blocking 寧缺勿濫**（只放「結構不合法、儲存了也不能用」的規則）。

## 2. 業務規則：閘道分類

### 哪些算獨立閘道（需要 `_g` 尾碼）

| 關鍵字 | 類型 |
|---|---|
| `條件分支至 A、B、C` | XOR fork |
| `並行分支至 A、B、C` | AND fork |
| `包容分支至 A、B、C` 或 `可能分支至 A、B、C` | OR fork |

### 哪些**不是**獨立閘道（一般任務，不用 `_g`）

| 關鍵字 | 語意 |
|---|---|
| `條件合併來自多個分支、序列流向 Z` | XOR merge target，收到 ≥2 條分支匯入 |
| `並行合併來自 X、Y、序列流向 Z` | AND join target |
| `包容合併來自多個分支，序列流向 Z` | OR join target |
| `迴圈返回至 X`（新）/ `若未通過則返回 X、若通過則序列流向 Y`（舊）| back-edge 合併進 `nextTaskIds` |

## 3. 工程慣例（補充 CLAUDE.md §10.2）

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

程式邏輯改動 → `ChangelogPanel.jsx` 加條目 + `HelpPanel.jsx` 改規則表 + `HANDOVER.md` 改 phase 清單 / PR 範圍。**三者漏一都算沒做完**。

### 日期用 `date +%Y-%m-%d` 取

不要依賴記憶或 session context（04-22 被寫成 04-23 的教訓）。

## 4. 協作 / 使用者偏好

- **小改動 / 明確需求**：直接動手
- **大改動 / 多種解法 / 跨檔案影響**：先提**計畫 + 主要 tradeoff（2–3 句）**，使用者點頭再執行
- **PR 走 branch → squash merge**：Claude 開分支 push → 使用者在 GitHub 網頁建 PR + merge → Claude 合後 `git fetch origin main && git reset --hard origin/main` 清乾淨 + 刪本地分支
- **分支衝突**：分支基於前一個未合併的 PR → 等前面合併後 `git rebase origin/main`（git 會自動 skip 已 squash 的 commit）
- **使用者回報「還是有同樣問題」**：先 trace 原始 fix 是否真的生效，**90% 是條件寫反 / 漏檢查某情境 / 順序依賴**，不是要重新想辦法
- 回應**簡潔**，不要長篇大論複述思路
- Changelog 條目**引用使用者原話**當規則來源錨點（例：「使用者：「不能讓一個元件的端點同時有進入和出發」」）
