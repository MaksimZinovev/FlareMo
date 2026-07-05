# 04 — Migrate & deploy

**Goal:** push the database schema to your D1, then publish the Worker live on Cloudflare's edge.

## This file's flow
```
pnpm migrate:remote ─▶ pnpm deploy ─▶ register workers.dev subdomain (you)
                                    ─▶ wait for edge cert ─▶ site live
```

## What we're doing (plain words)
- **migrate:remote** runs the SQL files in `migrations/` against your **real** Cloudflare D1 (creates the notes/users/relations/shares tables).
- **deploy** uploads your Worker bundle + static assets and publishes it to Cloudflare's global edge.

## Agent does
```bash
pnpm migrate:remote   # applies migrations to your D1 (look for ✅ per file)
pnpm deploy           # uploads + publishes
```
On success, `deploy` prints your live URL: `https://flaremo.<your-subdomain>.workers.dev`.

## You do — register a workers.dev subdomain (one-time, account-level)
First deploy usually **fails** with *"You need to register a workers.dev subdomain."* Open the URL it gives you (looks like `…/workers/onboarding`) and pick a name — e.g. `my-notes` → your site becomes `flaremo.my-notes.workers.dev`. Then the agent re-runs `pnpm deploy`.

## You do — wait for the edge cert (1–5 min)
Right after publish, the URL may error with `SSL_VERSION_OR_CIPHER_MISMATCH`. That's normal — Cloudflare is issuing the wildcard cert for `*.<your-subdomain>.workers.dev`. Wait a few minutes and retry. (Old macOS `curl` may also show a LibreSSL handshake error — use a browser to confirm.)

## You do / Agent does
- **You do:** register the subdomain in the dashboard; wait out the cert.
- **Agent does:** `migrate:remote`, `deploy`, re-deploy after subdomain is set.

## Common gotchas
- **Subdomain button not clickable by the agent:** register it yourself in the dashboard (or via the onboarding link). See [Troubleshooting](./troubleshooting.md).
- **`HTTP 000` / TLS error right after deploy:** cert still provisioning — wait, don't redeploy.

## Next
→ [05a — Access: humans](./05a-access-humans.md)

📚 Docs: [Deploy a Worker](https://developers.cloudflare.com/workers/get-started/deploy-your-first-worker/) · [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/) · [workers.dev routing](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)