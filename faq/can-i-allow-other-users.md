# FAQ

Context: FlareMo is your self-hosted notes app at `https://flaremo.yoursubdomainname.workers.dev`, protected by Cloudflare Access (login `youremail@gmail.com`). It's single-user by design.

## Can I let another person access it?

Yes, but they'll share your notes — there are no separate accounts.

- Login: add their email to the `Allow owner` policy (Zero Trust → Access → FlareMo → Policies → Include Emails → Save). They sign in with their own email (OTP).
- App: every request is treated as the one owner (`ensureSingleUser`, `apps/worker/src/context.ts`) — no per-user privacy, no roles.

Works for a shared notebook with a partner. Does NOT work if you each want private notes (use the original Memos app for multi-tenant).

The D1 owner record uses the default `owner@flaremo.local` (cosmetic); change via `FLAREMO_SINGLE_USER_*` in `wrangler.jsonc` + redeploy.