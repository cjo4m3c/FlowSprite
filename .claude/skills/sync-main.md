---
name: sync-main
description: Sync local main to origin after the user merges a PR, then clean up the merged feature branch. Use when the user says "merged"/"合併了"/"好了"/"完成" after a push, or any signal that a PR has been merged on GitHub.
---

# /sync-main — 合併後同步本地

使用者在 GitHub 上 squash-merge 一個 feature PR 後，本地要：

1. 切回 `main`
2. `git fetch origin main`
3. `git reset --hard origin/main`（取到 squash merge 產生的新 commit）
4. 嘗試刪除 local feature branch（用 `-D` 強制，因為 squash merge 不是 fast-forward，git 會以為沒 merge）
5. 嘗試刪除 remote feature branch（proxy 常會擋，403 是預期的，忽略即可）
6. 列最新 3 個 commit，回報 main head SHA + 該 PR 編號

## 一鍵指令

```bash
git checkout main && git fetch origin main && git reset --hard origin/main && \
git branch -D <feature-branch> 2>&1 | tail -2 && \
git log --oneline -3
```

`<feature-branch>` 從使用者剛 push 的最後一個 branch 推測（通常是你當前所在的 branch 或 git 最近的 log 裡）。

## 回報格式

```
同步完成，main 在 `<SHA>`（PR #XX）。
```

若有 TodoWrite 項目進行中，同步後清空或標註完成；無進行中 todo 就不 mention。

## 不要做的事

- **不要**自己嘗試建 PR 或 merge（使用者在網頁上做）
- **不要** force push（這是 main，規則明確禁止）
- **不要**因為遠端刪除失敗而 retry 或報錯（proxy 403 是預期）
