# FlareMo Setup Guide (with an agent)

FlareMo is a free, open-source notes app that runs on Cloudflare's free tier. You write, it saves — and the data is yours. This guide deploys it end-to-end with help from an AI coding agent (pi, Claude Code, Cursor, etc.).

## The whole journey at a glance
```
clone ─▶ install ─▶ wrangler login ─▶ create D1+R2 ─▶ edit config
      ─▶ verify ─▶ deploy ─▶ wait for cert ─▶ lock down w/ Access ─▶ verify
```

## Why FlareMo
- Lives on Cloudflare's free tier ($0, runs all day on a personal site).
- Markdown-native notes, self-hosted, no telemetry.
- Ships a **Memos-compatible API** + an **MCP server**, so other tools can talk to it.

## Who this is for
You're comfortable in a terminal (run `git`, `pnpm`, `curl`, edit a file) but **new to Cloudflare**. We explain D1, R2, Workers, and Access as we go.

## The big picture (request flow)
```
   You (browser) ──┐                          ┌── D1  (notes text)
                  ├─▶ Cloudflare Access ──▶ FlareMo Worker ──┤
   Script / MCP ───┘   (the bouncer)         (the app)       └── R2  (attachments)
                                                │
   Public share ───▶ bypass /share/* /assets/* ─▶ Worker (share token still checked)
```
Full visual: [`flaremo-architecture.html`](../flaremo-architecture.html) (open in a browser).

## What you'll end up with
A private notes site at `https://flaremo.<your-subdomain>.workers.dev`, locked behind Cloudflare Access: only your email can log in; scripts use a secret token; public share links work for anyone you share them with.

## How to use this guide with an agent
Each phase has a **You do / Agent does** split:
- **You do** = dashboard clicks + logins only you can complete (OAuth, captchas, payment auth).
- **Agent does** = terminal commands + file edits + verification.

Work one phase at a time; approve each before the next. One agent is enough — you don't need a multi-agent setup.

## Contents
- [00 — Prerequisites](./00-prerequisites.md)
- [01 — Clone & install](./01-clone-install.md)
- [02 — Cloudflare resources (D1 + R2)](./02-cloudflare-resources.md)
- [03 — Configure & verify](./03-configure-verify.md)
- [04 — Migrate & deploy](./04-deploy.md)
- [05a — Access: humans](./05a-access-humans.md)
- [05b — Access: service token](./05b-access-service-token.md)
- [05c — Access: public bypass](./05c-access-public-bypass.md)
- [06 — Verify](./06-verify.md)
- [07 — Use it](./07-use-it.md)
- [Troubleshooting](./troubleshooting.md) · [Glossary](./glossary.md) · [References](./references.md)