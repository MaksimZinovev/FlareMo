# 06 — Verify

**Goal:** confirm the lock-down works — Access blocks strangers, the Service Token reaches the API, and public paths bypass.

## This file's flow
```
curl root (no auth) ─▶ 302 to Access login
curl /api/v1/memos (no token) ─▶ 302 (blocked)
curl /api/v1/memos (with token) ─▶ 200 JSON
curl /share/fake + /assets/* ─▶ bypass (reaches FlareMo)
browser open ─▶ Access login ─▶ FlareMo timeline
```

## Agent does — curl checks
```bash
B="https://flaremo.<your-subdomain>.workers.dev"
CID="<your-client-id>"; CSEC="<your-client-secret>"   # from step 05b

curl -s -o /dev/null -w "%{http_code}\n" "$B"                       # expect 302
curl -s -o /dev/null -w "%{http_code}\n" "$B/api/v1/memos"           # expect 302
curl -s -H "CF-Access-Client-Id: $CID" -H "CF-Access-Client-Secret: $CSEC" \
     "$B/api/v1/memos"                                              # expect 200 {"memos":[]}
curl -s -o /dev/null -w "%{http_code}\n" "$B/share/fake"            # expect 200 (bypass)
curl -s -o /dev/null -w "%{http_code}\n" "$B/api/public/shares/fake"# expect 404 (FlareMo rejects)
```

## Expected results
| Test | Expected | Means |
| --- | --- | --- |
| Root, no auth | `302` → Access login | protected ✅ |
| API, no token | `302` | protected ✅ |
| API, with token | `200 {"memos":[]}` | token works + app live ✅ |
| `/share/fake` | `200` (HTML) | bypass works ✅ |
| `/api/public/shares/fake` | `404` JSON | bypass + FlareMo still validates ✅ |

## You do — browser login
Open `https://flaremo.<your-subdomain>.workers.dev`. You'll see the **Cloudflare Access login page** (not FlareMo). Enter `<your-email>` → Cloudflare emails a one-time **OTP code** → paste it → redirected to the FlareMo timeline. Session lasts 1 week.

## If a check fails
Root returns `200` (not `302`)? Access isn't enforcing — recheck `Allow owner` is attached. API with token returns `302`? Service Auth not attached, or wrong token → see [Troubleshooting](./troubleshooting.md).

## References
- 📚 Cloudflare Access docs: https://developers.cloudflare.com/cloudflare-one/
- 📚 FlareMo deploy doc (verification): [`docs/en/deploy.md`](../../en/deploy.md)

## Next
→ [07 — Use it](./07-use-it.md)