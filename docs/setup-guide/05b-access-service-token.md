# 05b — Access: let scripts in with a Service Token

**Goal:** allow API/MCP/Memos-compatible clients to call FlareMo automatically, using a secret token.

## This file's flow
```
create Service Token (save creds ONCE) ─▶ Service Auth policy ─▶ attach to FlareMo
```

## What we're doing (plain words)
Scripts can't do an email login. So we create a **Service Token** — a pair of headers (`CF-Access-Client-Id` + `CF-Access-Client-Secret`) the script sends on every request. A **Service Auth** policy says "if those headers match this token, let it through."

## Agent does — create the token + policy
1. Zero Trust → Access → Service Auth → Service Tokens → **Add a service token**.
2. **Name** `FlareMo API clients`; TTL = no expiry / longest. **Create**.
3. The next screen shows **Client ID** and **Client Secret ONCE** — see below.
4. Reusable Policies → **Add a policy**: **Name** `Service auth API clients`; **Action** `Service Auth`; **Include** = `Service Token` = pick `FlareMo API clients`. Save.
5. FlareMo app → Policies → **Add current policies** → attach `Service auth API clients`.

## You do — save the credentials (shown once)
```
CF-Access-Client-Id:     <your-client-id>
CF-Access-Client-Secret: <your-client-secret>     ← never shared, never committed
```
Store them in a password manager or env vars. The secret is only displayed this one time. You can rotate it later in the dashboard.

## ASCII
```
   script / MCP ──(CF-Access-Client-Id + Secret)──▶ Service Auth policy ──▶ FlareMo API
```

## Next
→ [05c — Access: public bypass](./05c-access-public-bypass.md)

📚 Docs: [Service Tokens](https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/)