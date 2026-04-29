# 已清理的孤兒檔案（勿再建立）

以下檔案已於 **2026-04-20** 從 repo 移除（commits 61f5ca0 → 2b27af6），功能已由其他檔案取代。**不得再以這些名稱建立新檔**。

| 已刪檔案 | 取代者 / 原因 |
|---|---|
| `src/components/FlowViewer.jsx` | 功能併入 `FlowEditor.jsx` |
| `src/components/InputPanel.jsx` | 舊版 YAML 輸入面板，已棄用 |
| `src/components/DiagramPanel.jsx` | 被 `DiagramRenderer.jsx` 取代 |
| `src/utils/parser.js` | 舊版 YAML parser，棄用 |
| `src/utils/layout.js` | 與 `src/diagram/layout.js` 無關，舊版孤兒 |
| `src/utils/vsdxExport.js` | 未使用；`drawioExport.js` 為唯一匯出 |
| `src/constants/colors.js` | 被 `src/diagram/constants.js` 取代 |
| `src/constants/defaultInput.js` | 只給已刪的 InputPanel 用 |
| `swimlane.html` | 舊版獨立 HTML，已遷移至 React + Vite |
| `src/components/DiagramRenderer/Toolbar.jsx` | 2026-04-29 移除：下載按鈕移到 `FlowEditor/Header.jsx` 的「↓ 下載 ▾」dropdown；editable 操作提示移除（重複使用者不需要）；選中連線反饋移除（使用者再點一次即可取消）。L3 標籤已在 Header input 顯示，不再需要重複。 |

相關可移除 deps：`js-yaml`、`jszip` 已於 2026-04-21 移除（伴隨孤兒檔案清理）。

## 後續孤兒清理規則

新增的「孤兒判定 / 清理」紀錄都加到此檔；CLAUDE.md 只留 1 行 pointer 避免膨脹。
