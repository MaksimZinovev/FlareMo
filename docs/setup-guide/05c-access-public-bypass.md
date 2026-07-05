# 05c — Access: let public share links in

**Goal:** share links (`/share/<token>`) and static assets (`/assets/*`) work for anyone, no login.

## This file's flow
```
reusable Bypass policy (Everyone) ─▶ 3 self-hosted apps, one per public path ─▶ attach Bypass to each
```

## Why separate apps (the key idea)
In Cloudflare Access, **path** is a property of an *application*, not a policy. There's no per-attachment path field. So to make `/share/*` behave differently from the rest of the site, you create a **second** self-hosted app scoped to that path. More-specific path apps win, so they override the main FlareMo app for just those paths.

## Agent does — one policy, three apps
1. Reusable Policies → **Add a policy**: **Name** `Bypass public`; **Action** `Bypass`; **Include** = `Everyone`. Save.
2. Create three self-hosted apps (Subdomain `flaremo`, Domain `<your-subdomain>.workers.dev`), each attaching `Bypass public`:
   | App name | Path |
   | --- | --- |
   | `FlareMo public shares page` | `/share/*` |
   | `FlareMo public share API` | `/api/public/shares/*` |
   | `FlareMo public assets` | `/assets/*` |

## The clever safety bit
Bypass only skips **Cloudflare Access**. FlareMo itself still validates the share token — so a made-up `/share/fake` link returns `404`, not your notes.

## ASCII — final app layout
```
   FlareMo                   flaremo.<sub>.workers.dev     Allow owner + Service auth
   FlareMo public shares     /share/*                      Bypass public
   FlareMo public share API  /api/public/shares/*          Bypass public
   FlareMo public assets     /assets/*                      Bypass public
```

## Next
→ [06 — Verify](./06-verify.md)

📚 Docs: [Access policies](https://developers.cloudflare.com/cloudflare-one/policies/)