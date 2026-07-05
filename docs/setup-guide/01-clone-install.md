# 01 — Clone & install

**Goal:** get FlareMo's code on your machine and install its dependencies.

## This file's flow
```
git clone ─▶ corepack pin pnpm 11.7.0 ─▶ pnpm install ─▶ deps ready
```

## What we're doing (plain words)
FlareMo is a **pnpm monorepo** — one folder containing several sub-projects (the web UI, the Worker API, shared packages). `pnpm install` downloads all the libraries they need. We use **corepack** (ships with Node) to get the exact pnpm version FlareMo wants, so you don't have to install pnpm yourself.

## Agent does
```bash
git clone https://github.com/realchendahuang/FlareMo.git ~/repos/flaremo
cd ~/repos/flaremo
corepack prepare pnpm@11.7.0 --activate   # pins the right pnpm version
pnpm --version                            # should print 11.7.0
pnpm install                              # downloads ~580 packages (~45s)
```
You'll see `wrangler 4.x` in the devDependencies list — that's Cloudflare's CLI, included automatically (no global install needed).

## Worked example
```
~/repos/flaremo/
├── apps/            web (React) + worker (Hono API)
├── packages/        shared contracts, db, domain, memos-compat
├── wrangler.jsonc   ← we'll edit this in step 03
└── migrations/      SQL files applied to D1 in step 04
```

## You do / Agent does
- **You do:** nothing — all terminal here.
- **Agent does:** clone, corepack, install, sanity-check versions.

## Common gotchas
- **pnpm version mismatch:** if `pnpm install` complains about `packageManager`, re-run `corepack prepare pnpm@11.7.0 --activate`.
- **Slow first install:** the first run builds a lockfile (supply-chain check ~30s). Normal.

## Next
→ [02 — Cloudflare resources (D1 + R2)](./02-cloudflare-resources.md)

📚 Docs: [pnpm](https://pnpm.io/) · [corepack](https://nodejs.org/api/corepack.html)