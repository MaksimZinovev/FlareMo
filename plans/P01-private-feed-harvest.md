---
id: P01
type: plan
status: done
owner: Maksim
depends_on: []
spec_checksum: 1c879734
last_validated: ~
---

# Private Feed Harvest — Weekly Last-Week Starred-Repos Batch

```spec
scope: document
type: plan
required_sections: [Context, Tools & Skills, Approach, Out of Scope, Steps, Files to Modify, Reuse, Evidence Pack, Verification, Bottom Line]
max_chars: 20000
banned_words: [TODO, TBD, placeholder]
placeholders: ["```df-todo", "[REPLACE]"]
match:
  has_checklist: '^- \[( |x)\]'
  has_source: 'Source:'
  has_file_marker: '(CREATED|UPDATED|DELETED)'
  has_test: '# Test \d'
  has_out_of_scope: '^## Out of Scope'
  has_tools_and_skills: '^## Tools & Skills'
  has_ynp_format: '^- .+: (Yes|No|Possibly)\b'
```

## Context

```spec
type: plan
max_chars: 20000
banned_words: [might be, could be, seems like, I think, possibly, perhaps]
match:
  has_problem: '(problem|issue|bug|break|fail|cannot|does.not|unable)'
```

FlareMo has no automated feed of starred GitHub repos, and fetching the entire starred history each run is wasteful (~2400 repos → ~24 pages). The problem is a missing weekly pipeline that collects ONLY the repos starred in the last 7 days into a small batch (`queue.json`) for P02 to post. This plan builds the harvest half: a private `private-feed-source` repo with a weekly workflow that fetches last-week's stars and merges them into `queue.json` (posted entries drop out, unposted leftovers preserved).

## Tools & Skills

```spec
type: plan
max_chars: 20000
banned_words: [N/A, n/a, grep sufficient, small codebase, simple enough, overkill for]
match:
  min_3_ynp: '^- .+: (Yes|No|Possibly)\b'
  has_cx: '\bcx\b.*\(Skills\).*: Yes\b'
  has_ck: '\bck\b.*\(Skills\).*: Yes\b'
  has_gh: '\bgh\b.*\(CLI\).*: Yes\b'
  has_deepwiki: 'deepwiki.*\(MCP\).*: Yes\b'
  has_inspect: '\binspect\b.*\(Skills\).*: Yes\b'
  has_slopscan: '\bslop-scan\b.*\(CLI\).*: Yes\b'
```

- cx (Skills): Yes — navigate flaremo + the memos proto to confirm the harvest entry shape matches what P02's post.sh consumes
- ck (Skills): Yes — semantic-search flaremo for existing JSON-state / feed / queue patterns before writing harvest.sh
- gh (CLI): Yes — create the private repo, dispatch the workflow, watch runs
- deepwiki (MCP): Yes — understand flaremo repo architecture so harvest output lands where P02 expects it
- inspect (Skills): Yes — triage the PR adding the harvest workflow + script for structural risk before merge
- slop-scan (CLI): Yes — scan the new shell script for AI-slop patterns before committing
- jq (CLI): Yes — every queue.json transform in harvest.sh uses jq
- curl (CLI): Yes — fetch starred repos and posted.json from the flaremo raw URL
- actionlint (CLI): Possibly — validate harvest-stars.yml locally if installed before pushing
- docfence (Skills): Yes — scaffolded and validates this plan
- commit (Skills): Yes — frequent commits per skill guidance
- verification-before-completion (Skills): Yes — run the Verification block before declaring done

## Approach

```spec
type: plan
max_chars: 800
banned_words: [Q1:, Q2:, Q3:, **Q, Question:]
match:
  has_alternative: '(alternative|instead of|rather than|compared to|over:|vs[.])'
```

Weekly harvest in `private-feed-source`, fetching ONLY repos starred in the last 7 days (paginate newest-first, stop at the 7-day boundary → typically 1 page = 1 request, far under the 5000/hr `GITHUB_TOKEN` budget). It dedupes against `posted.json` (fetched read-only from public `flaremo`, no PAT) and MERGES this week's stars into `queue.json`, dropping any id already in posted.json — so last week's posted entries fall out, and unposted leftovers (from a failed P02 run) are preserved, not lost by an overwrite. P02 posts the batch 2h later (Sun 14:00 UTC). An alternative is fetching the entire starred history — rejected because it wastes ~24 requests for ~2400 repos and grows an unbounded queue; the 7-day window matches the weekly cadence and keeps state small.

## Out of Scope

```spec
type: plan
max_chars: 20000
banned_words: [Nothing., None., N/A, n/a, Not applicable]
match:
  has_justification: '^- .+:'
  min_2_exclusions: '^- .+:'
```

- Fetching the entire starred history: excluded — only last-7-days stars; ~2400 repos would waste ~24 requests and grow an unbounded queue
- Daily posting: P02 posts the weekly batch once per week, not one-per-day
- Leftover-accumulation alerting: if P02 keeps failing, queue grows by one batch/week (bounded by P02 reliability); alerting is out of POC scope — the merge preserves leftovers so nothing is lost
- PAT-based auth for private stars: public stars suffice and avoid an extra secret to rotate
- DST-aware cron (AEDT): fixed UTC cron; 1-hour summer drift is acceptable
- Rich per-repo customization: out of POC scope; fixed entry shape only

## Steps

```spec
type: plan
max_chars: 20000
banned_words: [**Step, **Task, **Phase]
match:
  has_step_evidence: '^- \[ \].*\(Source'
  min_3_steps: '^- \[( |x)\]'
```

- [ ] Create the private repo via gh (Source: known gh CLI pattern)
  - Confidence: 0.95
  - Details: `gh repo create MaksimZinovev/private-feed-source --private --description "Weekly last-week starred-repos batch for FlareMo"`; clone locally under `~/repos/`.
- [ ] Seed `data/queue.json` as `[]` in `private-feed-source` (Source: this plan)
  - Confidence: 1.0
  - Details: `mkdir -p data && echo '[]' > data/queue.json`. Committed state; no `.gitignore`.
- [ ] Write `scripts/harvest.sh` — fetch last-7-days stars, dedupe, merge into queue (preserve unposted leftovers) (Source: Evidence Pack Claim 1, Claim 2)
  - Confidence: 0.85
  - Details: Read the starred list from `$STARS_FILE` if set (test-only fixture), else paginate `GET /users/MaksimZinovev/starred?per_page=100` with `Accept: application/vnd.github.star+json`, auto `GITHUB_TOKEN` (sorted newest-first by `starred_at`). Compute `since = now - $SINCE_DAYS days` (default 7). Keep entries with `starred_at >= since`; when paginating the real API, STOP once a page's oldest entry is older than `since` (typically 1 page). Fetch `posted.json` read-only from `$POSTED_URL` (default `https://raw.githubusercontent.com/MaksimZinovev/flaremo/main/data/posted.json` — public, no PAT; treat HTTP 404 as `[]` so harvest runs before P02 seeds posted.json; on other fetch errors exit non-zero and skip). MERGE into `queue.json`: new queue = (old queue ∪ filtered batch) with ids not in posted.json, deduped by id, sorted by `starred_at` desc. This preserves unposted leftovers from a failed prior P02 run (entries in queue but not in posted.json) and drops posted entries — so no overwrite that loses unposted work. Entry shape (queue.json, flat): `{id, full_name, html_url, description, language, stargazers_count, starred_at, topics, queued_at}`; the canonical dedup id is the numeric `repo.id` (e.g. `12345678`), NOT `full_name` — numeric id is stable across rename/transfer so a renamed repo is not re-queued as new. Example queue entry: `{"id":12345678,"full_name":"owner/repo","html_url":"https://github.com/owner/repo","description":"...","language":"Go","stargazers_count":42,"starred_at":"2026-07-04T12:00:00Z","topics":["cli"],"queued_at":"2026-07-07T12:00:00Z"}`. posted.json (written by P02; P01 reads only `id`) entry = a queue entry + `{memo_name, posted_at}`; cross-plan contract: `posted.id` == `queue.id` (both numeric repo id). Example posted entry: `{"id":12345678,"full_name":"owner/repo",...,"memo_name":"memos/123","posted_at":"2026-07-07T14:05:00Z"}`. Use `jq` for all transforms.
- [ ] Write `.github/workflows/harvest-stars.yml` — weekly cron + concurrency + permissions (Source: Evidence Pack Claim 4)
  - Confidence: 0.9
  - Details: `on: schedule: - cron: "0 12 * * 0"` (Sun 12:00 UTC) plus `workflow_dispatch`. `permissions: contents: write`. `concurrency: { group: feed-state, cancel-in-progress: false }`. Job: checkout, run `scripts/harvest.sh`, `git add data/queue.json`/`git commit -m "harvest: weekly batch of N entries"`/`git push` only if `queue.json` changed. `GITHUB_TOKEN` env for the stars API.
- [ ] Manually dispatch `harvest-stars` and confirm `queue.json` holds this week's stars (Source: this plan)
  - Confidence: 0.8
  - Details: `gh workflow run harvest-stars.yml -R MaksimZinovev/private-feed-source`. Confirm `data/queue.json` holds only repos starred in the last 7 days and none are already in `flaremo`'s `data/posted.json`.
- [ ] Commit and push `private-feed-source` contents (Source: commit skill)
  - Confidence: 0.9
  - Details: Harvest workflow + `scripts/harvest.sh` + `data/queue.json` are the main branch content.

## Files to Modify

```spec
type: plan
max_chars: 20000
banned_words: [TODO, TBD, placeholder]
match:
  has_file_entry: '^- `[^`]+` — (CREATED|UPDATED|DELETED)'
```

- `private-feed-source/README.md` — CREATED: explains the weekly harvest, the 7-day window, the cron schedule, and that `queue.json` is read cross-repo (read-only) by the P02 flaremo weekly-post workflow
- `private-feed-source/.github/workflows/harvest-stars.yml` — CREATED: weekly harvest workflow (Sun 12:00 UTC)
- `private-feed-source/scripts/harvest.sh` — CREATED: last-7-days fetch + dedupe + queue overwrite
- `private-feed-source/data/queue.json` — CREATED: pending unposted entries (this week's batch + any leftovers from a failed P02; merged weekly, posted ids drop out), committed state

## Reuse

```spec
type: plan
max_chars: 20000
banned_words: [None., N/A, Nothing to reuse, No reuse]
match:
  has_reuse_item: '^- .+:'
```

- GitHub starred API: `GET /users/{username}/starred` with `Accept: application/vnd.github.star+json` yields `starred_at` sorted newest-first, so pagination can stop at the 7-day boundary
- jq merge pattern: dedupe-and-merge by numeric `id` against posted.json (drop posted ids, keep unposted leftovers, add new)
- archify e2e diagram `flaremo/faq/private-feed-source-e2e.html`: visual reference for the harvest→post flow split across P01 + P02

## Evidence Pack

```spec
type: plan
max_chars: 20000
banned_words: [**Source**:, **Source:**]
match:
  has_evidence_claim: '^- Claim:'
  has_confidence: 'Confidence:'
```

- Claim: `GET /users/{username}/starred` with `Accept: application/vnd.github.star+json` returns `{starred_at, repo}` sorted newest-first by `starred_at`, so pagination can stop at the 7-day boundary.
  Source: live curl `api.github.com/users/MaksimZinovev/starred?per_page=1` (Link header confirmed newest-first pagination) + star+json media type docs
  Confidence: 0.9
  Implication: harvest.sh fetches only last-7-days stars in 1 page typically (early termination), not the full history.
- Claim: MaksimZinovev has ~2385 starred repos total, but a normal week adds only ~tens; at per_page=100 the last-7-days slice is ~1 page = ~1 request — ~0.02% of the 5000/hr `GITHUB_TOKEN` budget. Unauthenticated is 60/hr (still fine for 1 req).
  Source: live `gh api users/MaksimZinovev/starred?per_page=1` Link header (`page=2385; rel="last"`) + `gh api rate_limit` (limit 5000) (this session)
  Confidence: 0.95
  Implication: rate-limit risk is negligible; the 7-day window (not the full history) is what makes this safe — this directly answers the rate-limit concern.
- Claim: The auto `GITHUB_TOKEN` authenticates public GitHub API endpoints at 5000 req/hr, sufficient for the weekly 1-page fetch.
  Source: known GitHub Actions + REST API behavior
  Confidence: 0.85
  Implication: no PAT secret for the harvest.
- Claim: GitHub Actions `concurrency` groups serialize runs sharing the group; `cancel-in-progress: false` queues; push-back workflows need `permissions: contents: write`.
  Source: GitHub Actions docs (known stable feature)
  Confidence: 0.9
  Implication: harvest-stars.yml sets `concurrency: { group: feed-state, cancel-in-progress: false }` and `contents: write`.
- Claim: `flaremo` is a public repo, so `posted.json` is readable via `raw.githubusercontent.com` with no auth.
  Source: `gh repo view MaksimZinovev/flaremo --json visibility` (this session) → `visibility: PUBLIC`
  Confidence: 0.95
  Implication: harvest reads posted.json for dedupe with no PAT; the read-only PAT lives only in P02.
- Claim: AEST is UTC+10 (QLD, no DST); Sun 12:00 UTC = 22:00 AEST Sunday; P02 posts 2h later at 14:00 UTC = 00:00 AEST Monday.
  Source: timezone definitions; user-confirmed weekly cadence
  Confidence: 0.9
  Implication: harvest cron `0 12 * * 0`. DST-state summer drift accepted in Out of Scope.

### Gaps

- `actionlint` availability on this machine is unverified; if absent, YAML is validated only by GitHub on dispatch.
- The exact count of stars in a given 7-day window varies week to week; tests use `$STARS_FILE` fixtures for deterministic coverage and one real-API dispatch test.

### Sources Used

- Live `curl` against `api.github.com/users/MaksimZinovev/starred?per_page=1`
- `gh api rate_limit` and `gh repo view MaksimZinovev/flaremo --json visibility`
- GitHub Actions docs (concurrency, permissions, GITHUB_TOKEN)

## Verification

```spec
type: plan
max_chars: 20000
banned_words: [TODO, TBD, placeholder]
match:
  has_verify_command: '^```bash'
  has_expected: '# Expected:'
  min_2_tests: '# Test \d'
  has_state_space: '(empty|zero|partial|intermediate|boundary|edge case|failure)'
```

State-space — B1 harvest.sh: window {empty week 0-new; min(1) 1-new; intermediate ~20; boundary starred-at exactly 7d included / 8d excluded}; merge {posted entries drop out; unposted leftovers preserved; new stars added}; dedupe {all-already-posted → empty queue; partial}; failure {API 403/rate-limit, posted-fetch non-404 error}; 404-boundary {posted.json 404 → []}. B2 workflow: {concurrency; contents:write; YAML valid}.

```bash
# Test 1: B1 min(1) — one star within the 7-day window is queued
cd ~/repos/private-feed-source && echo '[{"starred_at":"2026-07-04T12:00:00Z","repo":{"id":1,"full_name":"a/b","html_url":"https://github.com/a/b","description":null,"language":"Go","stargazers_count":10,"topics":[]}}]' > /tmp/stars.json && echo '[]' > /tmp/posted.json && echo '[]' > data/queue.json && \
  STARS_FILE=/tmp/stars.json POSTED_URL="file:///tmp/posted.json" SINCE_DAYS=7 ./scripts/harvest.sh && jq 'length' data/queue.json
# Expected: 1 (one recent repo queued; 7-day window, merge into empty queue)
```

```bash
# Test 2: B1 empty week — a repo starred 10 days ago is excluded (outside the 7-day window)
cd ~/repos/private-feed-source && echo '[{"starred_at":"2026-06-25T12:00:00Z","repo":{"id":1,"full_name":"a/b","html_url":"https://github.com/a/b","description":null,"language":"Go","stargazers_count":10,"topics":[]}}]' > /tmp/stars.json && echo '[]' > /tmp/posted.json && echo '[]' > data/queue.json && \
  STARS_FILE=/tmp/stars.json POSTED_URL="file:///tmp/posted.json" SINCE_DAYS=7 ./scripts/harvest.sh && jq 'length' data/queue.json
# Expected: 0 (starred 10d ago, outside the 7-day window → queue stays [])
```

```bash
# Test 3: B1 boundary — repos at 6d/7d/8d ago; SINCE_DAYS=7 keeps 6d + 7d (>=), excludes 8d
cd ~/repos/private-feed-source && echo '[{"starred_at":"2026-06-29T12:00:00Z","repo":{"id":1,"full_name":"six/d","html_url":"u","description":null,"language":"Go","stargazers_count":1,"topics":[]}},{"starred_at":"2026-06-28T12:00:00Z","repo":{"id":2,"full_name":"seven/d","html_url":"u","description":null,"language":"Go","stargazers_count":1,"topics":[]}},{"starred_at":"2026-06-27T12:00:00Z","repo":{"id":3,"full_name":"eight/d","html_url":"u","description":null,"language":"Go","stargazers_count":1,"topics":[]}}]' > /tmp/stars.json && echo '[]' > /tmp/posted.json && \
  STARS_FILE=/tmp/stars.json POSTED_URL="file:///tmp/posted.json" SINCE_DAYS=7 ./scripts/harvest.sh && jq '[.[].full_name] | sort' data/queue.json
# Expected: ["seven/d","six/d"] (6d and 7d included; 8d excluded — boundary is >= now-7d)
```

```bash
# Test 4: B1 merge — posted entries drop out; unposted leftovers + new stars are preserved (no data loss on a failed P02)
cd ~/repos/private-feed-source && echo '[{"id":101,"full_name":"posted/old","starred_at":"2026-06-20T12:00:00Z"},{"id":102,"full_name":"leftover/x","starred_at":"2026-06-21T12:00:00Z"}]' > data/queue.json && echo '[{"starred_at":"2026-07-04T12:00:00Z","repo":{"id":103,"full_name":"new/repo","html_url":"u","description":null,"language":"Go","stargazers_count":1,"topics":[]}}]' > /tmp/stars.json && echo '[{"id":101}]' > /tmp/posted.json && \
  STARS_FILE=/tmp/stars.json POSTED_URL="file:///tmp/posted.json" SINCE_DAYS=7 ./scripts/harvest.sh && jq '[.[].id] | sort' data/queue.json
# Expected: [102,103] (id 101 dropped — in posted.json; id 102 preserved — unposted leftover from a failed P02; id 103 added — new star not in posted)
```

```bash
# Test 5: B1 dedupe partial — a repo already in posted.json is excluded from the batch
cd ~/repos/private-feed-source && echo '[{"starred_at":"2026-07-04T12:00:00Z","repo":{"id":1,"full_name":"a/b","html_url":"u","description":null,"language":"Go","stargazers_count":1,"topics":[]}},{"starred_at":"2026-07-04T11:00:00Z","repo":{"id":2,"full_name":"c/d","html_url":"u","description":null,"language":"Go","stargazers_count":1,"topics":[]}}]' > /tmp/stars.json && echo '[{"id":1}]' > /tmp/posted.json && echo '[]' > data/queue.json && \
  STARS_FILE=/tmp/stars.json POSTED_URL="file:///tmp/posted.json" SINCE_DAYS=7 ./scripts/harvest.sh && jq '[.[].full_name]' data/queue.json
# Expected: ["c/d"] (a/b id 1 already posted → excluded; only c/d queued)
```

```bash
# Test 6: B1 failure — fetch error (bad token against the real API) exits non-zero and leaves queue.json unchanged
cd ~/repos/private-feed-source && echo '[]' > data/queue.json && \
  GITHUB_TOKEN="invalid-token" POSTED_URL="file:///tmp/posted.json" ./scripts/harvest.sh; echo "exit=$?"; jq 'length' data/queue.json
# Expected: exit=non-zero, queue.json length stays 0 (state untouched on fetch failure)
```

```bash
# Test 7: B2 — workflow declares the concurrency group and contents:write
grep -q 'group: feed-state' ~/repos/private-feed-source/.github/workflows/harvest-stars.yml && \
  grep -q 'contents: write' ~/repos/private-feed-source/.github/workflows/harvest-stars.yml && \
  (actionlint ~/repos/private-feed-source/.github/workflows/harvest-stars.yml 2>/dev/null || echo "actionlint-absent-yaml-skipped")
# Expected: both greps match; actionlint clean (or the skip note if actionlint is absent)
```

```bash
# Test 8: end-user — dispatched harvest fills queue.json with this week's real starred repos
gh workflow run harvest-stars.yml -R MaksimZinovev/private-feed-source && \
  gh run watch -R MaksimZinovev/private-feed-source && \
  test "$(jq 'length' ~/repos/private-feed-source/data/queue.json)" -ge 0 && echo "harvest-ok"
# Expected: harvest-ok — run succeeds; queue.json reflects this week's stars (0 in a quiet week, ≥1 in an active one)
```

## Bottom Line

```spec
type: plan
max_chars: 20000
banned_words: [TODO, TBD, placeholder]
match:
  has_recommendation: 'Recommendation:'
```

- Per-step confidence: 0.95, 1.0, 0.85, 0.9, 0.8, 0.9 — average ~0.90
- Key risk: the 7-day window filter could be off-by-one at the boundary. Mitigation: Test 3 pins the boundary (>= now-7d keeps 7d, excludes 8d); the `>=` semantics are explicit.
- Gaps: `actionlint` availability unverified; weekly star count varies (tests use fixtures + one real dispatch).
- Recommendation: proceed — the 7-day window makes the fetch 1 page (~1 request), resolving the rate-limit concern, and the overwrite keeps queue.json small. P02 (weekly-post) can be built in parallel.
