---
name: wrap-pr
description: Wrap up a feature branch that has accumulated multiple commits — scan for redundant code, sync docs, bundle small tech debt, write a single consolidated changelog entry, then ship. Use when the user says "整理一下"/"先做整理"/"統包"/"做完一起發" or before merging a long-running branch with 5+ commits.
---

# /wrap-pr — 累積多 commits 的整理 + ship

長分支累積了一堆 commits 後，merge 前要整理一輪。這個 skill 把「掃 redundant / 同步文件 / 順手清小技術債 / 寫一筆 consolidated changelog」串起來，避免遺漏。

## 何時用

- 一個 branch 累積 5+ commits 還沒 PR
- 過去多個小 PR 沒寫 changelog（要補登）
- 使用者說「先暫停做這些，做完一起發」
- 要 merge 之前最後一輪總體檢

## 何時 **不** 用

- 1-2 commits 的小 PR — 直接 `/ship-feature` 即可
- 緊急 hotfix — 不要多事

## 步驟

### 1. 掃 redundant code

派 Explore subagent 掃：
- Unused imports / files / exports
- Dead workflows（trigger branch 已不存在）
- Unused env vars
- 累積的 cosmetic 黏行（手工貼上的副作用）
- 註解過時 / 描述跟實作不符的常數

要求 agent 回 300 字內，focus 在「能不能刪」，不要列細節。

### 2. 文件同步檢查（呼叫 `/doc-audit`）

跑 `/doc-audit` 確認 4 份文件 + 四視圖一致性 invariant 都 OK：
- `ChangelogPanel.jsx` — 等下統包補登
- `HelpPanel.jsx` — ELEMENTS / VALIDATION / CONNECTIONS / EDITABLE_ACTIONS / FORBIDDEN_RULES 對齊
- `README.md` — 元件 / skill / deps 清單最新
- `HANDOVER.md` — §2 結構樹 / §2.5 路由規則 / §3 業務規則 / §5 skill 數量
- 四視圖 invariant — 流程圖 / drawer / FlowTable / 下載資料

### 3. 評估順帶處理的小技術債

跟使用者列「現有 backlog 的技術債」+ 評估每個的工時 / 風險，建議哪些「順手做進這個 PR」。

判斷標準：
- ✅ 加進來：< 30 min、零風險、跟 PR 主題不衝突的（例：cosmetic 黏行清理、一行 fix）
- ❌ 不加：動 `layout.js` / 跨多檔重構 / 風險中等以上的，獨立 PR 處理

範例：
- A 黏行（5 min / 零風險）→ 加
- D flowAnnotation 一致性（10 min / 低風險，1 行改動）→ 加
- B layout 同欄對齊（4-8 hr / 高風險）→ 不加，獨立 PR
- C 閘道避障（3-5 hr / 中風險，獨立 phase）→ 不加，獨立 PR

### 4. 跟使用者確認最終 PR 範圍

列出「本 PR 會包含的所有改動」+「不在這個 PR 但已記錄的」，等使用者點頭。

### 5. 補一筆 consolidated changelog

把累積在 branch 上的所有 commits + 順帶處理的技術債，**統包成一筆 entry**：

```js
{
  date: 'YYYY-MM-DD',
  title: '<主題>：<改動 1> + <改動 2> + 文件整理',
  items: [
    '**<主題 A>**：<情境>。<root cause>。<修法>',
    '**<主題 B>**：...',
    '**技術債清理**：...',
    '**文件同步**：README / HANDOVER / HelpPanel 加 / 改 ...',
    '本 PR 涵蓋 N 個 merged PR（#XX → #YY）的 changelog 補登 + 本次「<主題>」一次發。下次按 §4 規則一 PR 一筆',
  ],
},
```

如果 branch 涵蓋多個過去 merged PR（例如那些 PR 沒寫 changelog），明確標註「本 PR 涵蓋 #XX/#YY/#ZZ 的 changelog 補登」。

### 6. 走 `/ship-feature`

最後一步：跑 `/ship-feature` 標準流程（PR + squash merge + 同步 main）。

## 反模式

- ❌ 整理時順手「重構」（不在 PR 主題的程式碼改動會讓 reviewer 困惑）
- ❌ 把太大的技術債（>1 hr 或動 layout）塞進來
- ❌ Changelog 只寫一兩句（要寫情境 / root cause / 修法 / 驗證）
- ❌ 跳過 doc-audit 直接 ship
- ❌ 整理時沒先跟使用者確認範圍

## 輸出格式

整理完問使用者：

```
本 PR 整理完，涵蓋：
- 主題改動：<X 件>
- 順帶技術債：<A / D / ...>
- 文件同步：<README / HANDOVER / HelpPanel / ...>
- Changelog：一筆統包 N 件

要 ship 嗎？
```

等他點頭再走 `/ship-feature`。
