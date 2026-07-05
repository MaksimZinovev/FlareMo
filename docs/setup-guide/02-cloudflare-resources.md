# 02 — Cloudflare resources (D1 + R2)

**Goal:** log into Cloudflare from the terminal, then create the two storage bins FlareMo needs.

## This file's flow
```
wrangler login (you, OAuth)
      │
      ▼
wrangler d1 create flaremo  ──▶ save database_id
      │
      ▼
wrangler r2 bucket create  ──▶ (activate R2 in dashboard if it errors)
```

## What we're doing (plain words)
- **wrangler** = Cloudflare's official CLI. We use it to log in and create resources without clicking around the dashboard.
- **D1** = Cloudflare's hosted SQLite database. FlareMo stores notes, users, relations, shares here.
- **R2** = Cloudflare's file storage (like S3). FlareMo stores uploaded attachments + export bundles here.

## You do — `wrangler login` (OAuth, only you can do this)
```bash
cd ~/repos/flaremo && pnpm exec wrangler login
```
A browser opens → click **Allow** → terminal prints `Successfully logged in.` The session is cached; no re-login next time.

## Agent does — create the bins
```bash
pnpm exec wrangler d1 create flaremo                      # → prints a database_id
pnpm exec wrangler r2 bucket create flaremo-attachments
```
**Save the `database_id` printed by the D1 command** — we paste it into `wrangler.jsonc` in step 03.

## You do — activate R2 (if the R2 command errors)
R2 needs a one-time activation in the dashboard: **https://dash.cloudflare.com → R2 Object Storage → Enable/Activate R2** (accept terms; a card on file is required but the free tier won't charge). Then retry the R2 create.

## ASCII — your account now has
```
   Cloudflare account  (<your-email>)
        ├── D1  : flaremo            ── database_id: <save this>
        └── R2  : flaremo-attachments
```

## You do / Agent does
- **You do:** `wrangler login` (OAuth); activate R2 in dashboard if asked. **Agent does:** `d1 create`, `r2 bucket create`, captures `database_id`.

## Next
→ [03 — Configure & verify](./03-configure-verify.md)

📚 Docs: [wrangler](https://developers.cloudflare.com/workers/wrangler/) · [D1](https://developers.cloudflare.com/d1/) · [R2](https://developers.cloudflare.com/r2/)