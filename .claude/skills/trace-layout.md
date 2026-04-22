---
name: trace-layout
description: Build a temporary Node.js trace script that imports computeLayout + parseExcelToFlow and prints connection routing for a user scenario (screenshots of problematic diagrams, expected behavior, specific task IDs). Use when the user reports a rendering / routing bug and you need to verify the algorithm's output before committing changes.
---

# /trace-layout — 流程圖路由 trace 驗證

針對使用者回報的特定流程圖問題，寫一個暫時的 node script 在 sandbox 跑，驗證 `computeLayout` 實際輸出的 `positions` / `connections` / `l4Numbers` 是否符合預期。

## 何時用

- 使用者截圖回報連線重疊、指向錯誤、編號錯誤
- 改完 layout.js / excelImport.js 的 routing 邏輯後，驗證不會 regression
- 想知道某個 edge 案例的 `exitSide` / `entrySide` / `laneTopCorridorY` 等值

## 樣板

```bash
cat > /tmp/trace.mjs <<'EOF'
import { parseExcelToFlow } from '/home/user/FlowSprite/src/utils/excelImport.js';
import * as XLSX from '/home/user/FlowSprite/node_modules/xlsx/xlsx.mjs';
import { computeLayout } from '/home/user/FlowSprite/src/diagram/layout.js';

const headers = ['L3編號','L3名稱','L4編號','L4名稱','描述','輸入','角色','輸出','任務關聯說明','參考'];
const rows = [
  headers,
  // 依使用者情境構造：
  //   開始事件 -0 → ...任務們 → 結束事件 -99
  //   閘道記得加 _g 尾碼
  //   角色欄對應 flow.roles 順序決定 row
  ['5-1-2','test','5-1-2-0','開始事件','','','PMC','','流程開始，序列流向 5-1-2-6',''],
  // ...填入需要的列
];
const ws = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
const flow = parseExcelToFlow(buf).flows[0];
const layout = computeLayout(flow);
const nameOf = {};
flow.tasks.forEach(t => { nameOf[t.id] = t.l4Number || t.name; });

console.log('Positions:');
Object.entries(layout.positions).forEach(([id, p]) => {
  console.log(`  ${String(nameOf[id]).padEnd(14)} row=${p.row} col=${p.col}`);
});

console.log('\nConnections:');
layout.connections.forEach(c => {
  const from = nameOf[c.fromId], to = nameOf[c.toId];
  const extra = c.laneTopCorridorY != null ? ` topY=${c.laneTopCorridorY}` : c.laneBottomY != null ? ` botY=${c.laneBottomY}` : '';
  console.log(`  ${String(from).padEnd(14)} → ${String(to).padEnd(14)} exit=${c.exitSide.padEnd(6)} entry=${c.entrySide.padEnd(6)}${extra} ${c.label || ''}`);
});
EOF
node /tmp/trace.mjs 2>&1
rm -f /tmp/trace.mjs
```

## 常見陷阱

- **Validator 會擋**：start 必 `-0`、end 必 `-99`、閘道必 `_g`。構造測資時記得符合這些規則，否則 `parseExcelToFlow` 會 throw
- **parseExcelToFlow 回傳 `{ flows, warnings }`**：不是單純 array，要解構
- **Role 順序決定 row**：flow.roles 第 0 個對應 row 0；excelImport 會按第一次出現的順序建立 roles
- **node 22 + xlsx.mjs**：一定用 `import * as XLSX from '/home/user/FlowSprite/node_modules/xlsx/xlsx.mjs'`（不是 default import）

## 驗證重點

`connections` 陣列每個元素：
- `fromId / toId`：對應的 L4 任務 ID
- `exitSide / entrySide`：`top` / `right` / `bottom` / `left`
- `label`：閘道條件標籤（若有）
- `laneBottomY / laneTopCorridorY`：slot 系統分配的 y-level（若用到 corridor）

核對：
- 同一來源的多條 outgoing 應該分散到不同 exitSide（或分散到不同 slot y）
- 同一目標的多條 incoming 應該分散到不同 entrySide（閘道專屬 Phase 2）
- 長 span / backward 應該拿到外側 slot（y 最小 for top、y 最大 for bottom）
