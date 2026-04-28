---
name: preview-branch
description: Set up an experimental branch with auto-deploy to a GitHub Pages sub-path so the user can review live before merging to main. Use when the user asks for "test environment"/"preview"/"在測試環境做"/「先在測試連結看效果」 for a high-risk or visual-critical change.
---

# /preview-branch — 實驗分支 + Preview 部署

讓高風險或視覺敏感的功能（例：layout 重構、UI 大改）在 `https://cjo4m3c.github.io/FlowSprite/preview-<slug>/` 上預覽，**完全不影響 main**。等使用者確認效果再 PR + merge。

## 何時用

- layout / routing 大改（例如 fork 多 next 同欄對齊、閘道避障）
- 整頁 UI 重構（drawer / context menu / 新元件視覺）
- 任何需要使用者長時間互動評估的視覺改動
- 多人協作時，需要 share 連結讓其他人看

## 何時 **不** 用

- 文件 / changelog / 註解類純文字改動
- 一行 bug fix（直接 PR 即可）
- 已經完全確定要做、不需 review 的 chore（例如刪 dead code）

## 設定步驟

### 1. 開 branch

命名約定：`claude/preview-<slug>` 或 `claude/<feature>-experiment`（從歷史 commit 看 `claude/drawer-experiment` 是先例）。

```bash
git checkout -b claude/preview-<slug>
```

或用 `mcp__github__create_branch` 直接在 remote 建。

### 2. 加 deploy-preview workflow（branch 內，不影響 main）

新增 `.github/workflows/deploy-preview.yml`：

```yaml
name: Deploy Preview to GitHub Pages

on:
  push:
    branches:
      - claude/preview-<slug>      # ← 換成實際 branch 名
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout main (baseline)
        uses: actions/checkout@v4
        with:
          ref: main
          path: main-source

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: main-source/package-lock.json

      - name: Install + build main
        working-directory: main-source
        run: npm install && npm run build

      - name: Checkout preview branch
        uses: actions/checkout@v4
        with:
          ref: ${{ github.ref }}
          path: preview-source

      - name: Install + build preview at sub-path
        working-directory: preview-source
        env:
          VITE_BASE_PATH: /FlowSprite/preview-<slug>/    # ← 換成實際 slug
        run: npm install && npm run build

      - name: Combine into single dist
        run: |
          mkdir -p combined-dist
          cp -r main-source/dist/. combined-dist/
          mkdir -p combined-dist/preview-<slug>           # ← 換成實際 slug
          cp -r preview-source/dist/. combined-dist/preview-<slug>/

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: combined-dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 3. 確認 GitHub Pages environment 允許這個 branch 部署（**第一次設定**，後續可重用）

去 https://github.com/cjo4m3c/FlowSprite/settings/environments → `github-pages` → **Deployment branches and tags** → 加 rule：
- Ref type: `Branch`
- Name pattern: `claude/preview-*`（一次性，未來所有 `claude/preview-*` branch 都通過）

如果之前已經加過 `claude/*` 規則，這步可省略。

### 4. 推 branch + 改動

```bash
git push -u origin claude/preview-<slug>
```

GitHub Action 會自動跑（~1-2 分鐘），完成後 preview URL 可訪問：
- 主版（main）：`https://cjo4m3c.github.io/FlowSprite/`（不變）
- Preview：`https://cjo4m3c.github.io/FlowSprite/preview-<slug>/`

### 5. 改完滿意 → 走 `/ship-feature` PR + squash merge

merge 之後，記得**刪掉 deploy-preview.yml**（避免 dead workflow 累積）：
- 在 same PR 包含刪除（merge 進 main）→ main 上不會有 preview workflow ✓
- 或 merge 後另開 cleanup PR

⚠️ `vite.config.js` 的 `VITE_BASE_PATH` env override **保留**（給未來其他 preview 重用）。

## 注意

- `VITE_BASE_PATH` 必須**結尾帶斜線**（`/FlowSprite/preview-foo/`），否則 asset 路徑會錯
- preview branch push 期間，main 自己的 deploy.yml 也可能跑（如果同時有 main push）→ race condition：誰晚跑誰贏。實務上 preview 期間使用者通常不推 main，可接受
- preview URL 可分享給其他人，但 GitHub Pages 是 public — 機敏資料不要進這個流程
- preview 部署的 dist **包含 main 完整內容** + `/preview-<slug>/` 子目錄。所以 main URL 也會更新（但內容跟 main branch 一致）

## 反模式

- ❌ 在 main 直接做高風險改動再 hotfix
- ❌ preview workflow trigger 設成 main（會跟 main deploy.yml 重複跑）
- ❌ 多個同時 active 的 preview workflow 用同一個 sub-path（後跑的會蓋前面的）
- ❌ 忘記刪掉 merged branch 的 deploy-preview.yml → repo 累積 dead workflow
