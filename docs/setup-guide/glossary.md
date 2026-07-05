# Glossary

Plain-words terms used in this guide. (Layer 2 reference.)

## This file's map
```
   edge (Workers)        storage (D1, R2)        auth (Access / Zero Trust)
        │                     │                          │
        └── wrangler (CLI) ───┴── Service Token ─────────┘
```

| Term | Means |
| --- | --- |
| **Cloudflare Workers** | Cloudflare's serverless runtime; runs your app on the edge. FlareMo is one Worker. |
| **D1** | Cloudflare's hosted SQLite database. FlareMo stores notes/users/shares here. |
| **R2** | Cloudflare's file storage (S3-like). FlareMo stores attachments + export bundles here. |
| **wrangler** | Cloudflare's official CLI — login, create D1/R2, deploy Workers. |
| **workers.dev subdomain** | One-time account-level name (`<name>.workers.dev`); every Worker lives at `<worker>.<name>.workers.dev`. |
| **Cloudflare Access** | A bouncer in front of your site — checks who you are before letting requests through. |
| **Zero Trust** | The product name for Access (and more). Same thing for our purposes. |
| **Application (Access)** | A rule-set covering one hostname/path. We create 4. |
| **Policy** | A rule on an app: Allow / Service Auth / Bypass. Reusable policies can attach to many apps. |
| **Service Token** | A pair of headers (`CF-Access-Client-Id` + `CF-Access-Client-Secret`) scripts use to authenticate. |
| **Service Auth** | Policy action that accepts a Service Token (for machine clients). |
| **Bypass** | Policy action that lets everyone in (used for public share paths). |
| **OTP** | One-time password — the email code Cloudflare sends at login. |
| **OAuth** | The "log in via Cloudflare" browser flow used by `wrangler login`. |
| **corepack** | Node's built-in tool that installs the right pnpm version per project. |
| **monorepo** | One repo with several sub-projects; FlareMo is one (web + worker + packages). |

📚 Docs: [Cloudflare fundamentals](https://developers.cloudflare.com/)