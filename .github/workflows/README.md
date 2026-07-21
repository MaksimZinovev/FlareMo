# Workflows

## deploy — build and deploy to Cloudflare Workers

Builds the web frontend and worker, applies remote D1 migrations, and deploys
to Cloudflare Workers on push to `main` (or manual dispatch). Generates
`wrangler.jsonc` from `wrangler.jsonc.example`, substituting the D1 database ID
and R2 bucket name from secrets.

### Owner gate

Same as weekly-post: `github.repository_owner == 'MaksimZinovev'`.

### Secrets (4)

Set on `MaksimZinovev/FlareMo` via `gh secret set … -R MaksimZinovev/FlareMo`:

| Secret | Value | Source |
| --- | --- | --- |
| `D1_DATABASE_ID` | D1 database UUID | Cloudflare dashboard → Workers & Pages → D1 → flaremo |
| `R2_BUCKET_NAME` | R2 bucket name (`flaremo-attachments`) | Cloudflare dashboard → R2 |
| `CLOUDFLARE_API_TOKEN` | API token with Workers/D1/R2 deploy perms | Cloudflare dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Cloudflare dashboard → any domain → Overview (right sidebar) |

### Concurrency

`group: deploy`, `cancel-in-progress: false` — a deploy is never cancelled by
a new push; they serialize.

---

## weekly-post — secrets, rotation, and runbook

Posts P01's starred-repo batch (`private-feed-source/data/queue.json`) to FlareMo
as PROTECTED memos every Sunday 14:00 UTC, and commits `data/posted.json` back
to this repo for dedupe/audit. See `plans/P02-private-feed-weekly-post.md`.

## Owner gate

The job runs only when `github.repository_owner == 'MaksimZinovev'`, so forks and
clones owned by other users stay dormant.

## Secrets (4)

Set on `MaksimZinovev/FlareMo` via `gh secret set … -R MaksimZinovev/FlareMo`:

| Secret | Value | Source | Rotation |
| --- | --- | --- | --- |
| `FLAREMO_URL` | `https://flaremo.mkznve.workers.dev` | your deployed Worker URL | only when the Worker URL changes |
| `FLAREMO_ACCESS_CLIENT_ID` | Service Token Client ID | Cloudflare Zero Trust → Access → Service Tokens | rotate with the secret (one Service Token) |
| `FLAREMO_ACCESS_CLIENT_SECRET` | Service Token Secret | same Service Token (shown once at creation) | rotate with the client id |
| `PRIVATE_FEED_SOURCE_PAT` | fine-grained PAT, `contents:read` on `MaksimZinovev/private-feed-source` | GitHub → Settings → Developer settings → PAT | independent rotation |

The three `FLAREMO_*` secrets come from a single Cloudflare Access Service Token
and must rotate together. `PRIVATE_FEED_SOURCE_PAT` is a separate GitHub PAT
with only `contents:read` on the harvest repo — the workflow never pushes to it
(`persist-credentials: false` on that checkout).

Local template: `.dev.vars.example` (copy to gitignored `.dev.vars` for the
gating curl). Setup steps: `docs/setup-guide/05b-access-service-token.md`.

## Concurrency

`group: feed-state`, `cancel-in-progress: false` — a run is never cancelled by
a new schedule; they serialize. This group is per-repo and independent of P01's
same-named group in `private-feed-source`.

## What the workflow writes

- `data/posted.json` in THIS repo (committed via the auto `GITHUB_TOKEN`,
  `contents: write`). Non-sensitive: memo names + public repo ids.
- It NEVER writes to `private-feed-source`. `queue.json` is read-only here; P01
  overwrites it weekly.

## Runbook

- Manual dispatch: `gh workflow run weekly-post.yml -R MaksimZinovev/FlareMo`
- Watch: `gh run watch -R MaksimZinovev/FlareMo`
- If a run fails mid-batch: already-posted entries are committed; unposted ones
  stay in `queue.json` for the next run (post.sh stops on the first non-2xx).

## Debugging auth failures

If the workflow's POST step fails with HTTP 302, the Service Token is not
attached to a Service Auth policy on the FlareMo Access app. See
`skills/flaremo-api/SKILL.md` → "Debugging auth failures", and the fix at
`docs/setup-guide/05b-access-service-token.md` step 5.
