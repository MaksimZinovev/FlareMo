# 05a — Access: lock it to your email

**Goal:** turn on Cloudflare Access so only you (browser, your email) can open FlareMo.

## This file's flow
```
enable Zero Trust Free (you) ─▶ create FlareMo Access app ─▶ Allow policy (your email) ─▶ attach
```

## What we're doing (plain words)
**Cloudflare Access** is a bouncer in front of your site. Without it, anyone with the URL can read/write your notes. **Zero Trust** is just the product name for Access. We create an "application" covering your hostname, then a rule: "only my email may enter."

## You do — activate Zero Trust (one-time)
Open `https://one.dash.cloudflare.com/` → **Choose a plan** → **Zero Trust Free** ($0, 50 users) → **Select plan** → an "Activate Zero Trust Free" checkout appears with a checkbox authorizing charges *only if you exceed free limits* (you won't) → check it → **Activate**. A team-name wizard may or may not appear; if it does, pick any name (e.g. `my-notes`).

## Agent does — create the app + policy (in the dashboard)
1. Zero Trust → Access → Applications → **Add application** → **Self-hosted**.
2. App details: **Name** `FlareMo`; **Subdomain** `flaremo`; **Domain** `<your-subdomain>.workers.dev`; **Path** empty; **Session duration** `1 week`. Save.
3. Reusable Policies → **Add a policy**: **Name** `Allow owner`; **Action** `Allow`; **Include** = `Emails` = `<your-email>`. Save.
4. Back on the FlareMo app → Policies → **Add current policies** → select `Allow owner`. Save.

> Dashboard buttons can be click-resistant under automation — see [Troubleshooting](./troubleshooting.md). Workaround: reusable policies + the "Add current policies" combobox.

## ASCII
```
   FlareMo app  (flaremo.<your-subdomain>.workers.dev)
        │  policy: Allow owner  (Include: Emails = <your-email>)
        ▼
   only your browser gets in (1-week session)
```

## Next
→ [05b — Access: service token](./05b-access-service-token.md)

📚 Docs: [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/) · [self-hosted app](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-public-app/)