# 03 — Configure & verify

**Goal:** point FlareMo at **your** D1 database, then run the safety checks before publishing.

## This file's flow
```
edit wrangler.jsonc (database_id) ─▶ pnpm verify ─▶ pnpm deploy:dry-run ─▶ ready to publish
```

## What we're doing (plain words)
`wrangler.jsonc` is FlareMo's config file. It ships with the **maintainer's** `database_id` — a placeholder pointing at *their* database. You must replace it with the id from step 02, or your Worker would try to talk to someone else's D1. Then we run two non-publishing checks.

## Agent does — the edit (one line)
```jsonc
// in wrangler.jsonc, d1_databases[0]:
"database_id": "<paste your database_id from step 02>"
```
Leave `binding: "DB"` and `database_name: "flaremo"` unchanged. R2 binding is already correct.

## Agent does — the checks
```bash
pnpm verify          # lint + typecheck + unit tests + build + Playwright e2e (~60s)
pnpm deploy:dry-run  # builds + validates bindings against YOUR D1/R2, does NOT publish
```

## What a clean dry-run prints
```
env.DB (flaremo)                              D1 Database
env.ATTACHMENTS (flaremo-attachments)        R2 Bucket
env.ASSETS                                    Assets
--dry-run: exiting now.
```

## You do / Agent does
- **You do:** nothing — agent only here.
- **Agent does:** the one-line edit, `verify`, `deploy:dry-run`.

## Common gotchas
- **Forgot the edit:** dry-run still passes (it validates shape, not ownership) — but `deploy` would fail later. Always swap the id.
- **Playwright downloads a browser** on first `verify` run (~30s one-time).

## Next
→ [04 — Migrate & deploy](./04-deploy.md)

📚 Docs: [wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)