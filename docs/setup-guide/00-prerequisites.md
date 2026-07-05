# 00 — Prerequisites

**Goal:** make sure you have everything before touching FlareMo.

## This file's flow
```
  Cloudflare account ──┐
  terminal + node 20+ ──┼─▶ ready to start the guide
  pnpm (via corepack) ──┤
  an AI agent ──────────┘
```

## You need
- A **Cloudflare account** (free tier is enough — sign up at https://dash.cloudflare.com/sign-up). No card needed to start; you'll add one later only to activate R2 (free limits cover a personal site).
- A **terminal** with `git` and `node` v20+. Check: `node --version`.
- **pnpm** (or let `corepack` install the right version — we do this in step 01).
- A **browser** for the Cloudflare dashboard.
- An **AI coding agent** (optional but this guide assumes one): pi, Claude Code, Cursor, etc.

## What you'll end up with
A live notes app at `https://flaremo.<your-subdomain>.workers.dev`, protected by Cloudflare Access.

## Worked example (fake values — yours will differ)
| Thing | Example | Yours |
| --- | --- | --- |
| Cloudflare email | `you@example.com` | `<your-email>` |
| workers.dev subdomain | `my-notes` | `<your-subdomain>` |
| D1 database name | `flaremo` | `flaremo` |
| R2 bucket name | `flaremo-attachments` | `flaremo-attachments` |
| Service Token secret | (never share) | `<your-client-secret>` |

## The journey at a glance (all 9 steps)
```
clone ─▶ install ─▶ wrangler login ─▶ create D1+R2 ─▶ edit config
      ─▶ verify ─▶ deploy ─▶ wait for cert ─▶ lock down w/ Access ─▶ verify
```

## You do / Agent does
- **You do:** create the Cloudflare account; be near the keyboard for OAuth + dashboard steps.
- **Agent does:** everything in the terminal (clone, install, wrangler commands, edits, curl checks).

## Next
→ [01 — Clone & install](./01-clone-install.md)

📚 Docs: [Cloudflare sign-up](https://dash.cloudflare.com/sign-up) · [Cloudflare Docs](https://developers.cloudflare.com/)