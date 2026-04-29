/**
 * Changelog "current tip" — new entries since last freeze land here.
 * When this file grows beyond ~7KB, freeze: rename to c{next}.js + reset to [].
 * Entries are newest-first within file.
 */
export default [
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
