# Troubleshooting

Symptoms you may hit, with fixes. (Layer 2 reference — read when something goes wrong.)

## This file's flow (decide where you're stuck)
```
stuck? ─▶ dashboard / OAuth / captcha ─▶ "Dashboard & auth"
      ─▶ deploy / TLS / HTTP 000    ─▶ "Deploy & TLS"
      ─▶ install / pnpm             ─▶ "Install"
      ─▶ lost secret                ─▶ "Service Token"
```

## Dashboard & auth
| Symptom | Fix |
| --- | --- |
| R2 create: `Please enable R2…` (code 10042) | Dashboard → R2 → Enable/Activate R2 (card on file required, free tier won't charge), then retry |
| First deploy: `register a workers.dev subdomain` | Open the onboarding URL it prints → pick a subdomain → re-run `pnpm deploy` |
| Zero Trust: "Activate Zero Trust Free" checkout | Check the authorize-charges box → Activate ($0; only charges if you exceed free limits) |
| Dashboard buttons not clickable by the agent | Use deep-link URLs; or create **reusable** policies + attach via "Add current policies" combobox |
| `wrangler login` captcha you can't pass | Complete it yourself in the browser; the session caches |

## Deploy & TLS
| Symptom | Fix |
| --- | --- |
| `SSL_VERSION_OR_CIPHER_MISMATCH` right after deploy | Edge cert still provisioning — wait 1–5 min, then retry. Don't redeploy |
| `curl`: `sslv3 alert handshake failure`, browser works | Old macOS LibreSSL — use a browser or newer curl to verify |
| `HTTP 000` from curl | DNS/cert not ready — wait, or check `dig <host>` |

## Install
| Symptom | Fix |
| --- | --- |
| `pnpm install` complains about `packageManager` | `corepack prepare pnpm@11.7.0 --activate` |
| First `pnpm verify` is slow | One-time: Playwright downloads a browser (~30s) |

## Service Token
| Symptom | Fix |
| --- | --- |
| Client Secret lost | Dashboard → Access → Service Auth → Service Tokens → rotate (new one issued; old stops working) |

📚 Docs: [wrangler](https://developers.cloudflare.com/workers/wrangler/) · [Access](https://developers.cloudflare.com/cloudflare-one/)