# P01 — Future Improvements (deferred from POC)

Deferred items captured during planning of `plans/P01-private-feed-source.md`. Not in POC scope by explicit decision; revisit after the POC is live and proven.

## 1. State-write durability gap (the real correctness issue)

- **Problem:** Daily workflow order is `POST to FlareMo → on 200 → commit posted.json`. If the FlareMo POST succeeds but the git commit/push fails (transient git error, push quota, concurrency race), state is not updated → the next daily run re-posts the **same** repo → duplicate memo in FlareMo.
- **Why deferred:** User chose "no per-run idempotency guard" for the POC. This gap is the one that produces a user-visible duplicate, and it stems from commit-order, not from manual re-runs.
- **Candidate fixes (revisit when POC is stable):**
  - Tag-based idempotency: post with a `#daily-YYYY-MM-DD` tag (or `#star-<repo-id>`); before posting, `GET /api/v1/memos?filter=...` and skip if a memo with that tag exists. Makes the post side idempotent independent of state.
  - Commit-first-then-POST is worse (a commit without a successful POST means a starred repo is marked posted but never shared — silent data loss). Current order is the lesser evil; the tag guard removes the dilemma.
  - Retry the git push with backoff before exiting non-zero, so transient push failures don't leave state uncommitted.

## 2. Per-run idempotency guard (manual re-run duplicates)

- **Problem:** A manual `workflow_dispatch` of `daily-post` re-runs the workflow; if `queue.json`/`posted.json` already advanced, behavior depends on commit timing. The POC accepts potential duplicates from manual re-runs.
- **Why deferred:** POC simplicity; the `concurrency: feed-state` group (in scope) already prevents overlapping runs from racing.
- **Candidate fix:** same tag-based guard as #1 — a dated tag makes both manual re-runs and crash-recovery safe.

## 3. DST-aware cron

- **Problem:** Fixed UTC cron (`0 20 * * *`) means 06:00 AEST in winter but 07:00 AEDT in summer for DST-observing AU states (NSW/Vic). QLD (AEST, no DST) is unaffected.
- **Why deferred:** 1-hour drift is acceptable for a personal daily-star memo.
- **Candidate fix:** none needed unless the drift becomes annoying; could switch to a timezone-aware dispatcher (small worker or `workflow_dispatch` from an external scheduler) if precision matters.

## 4. posted.json pruning

- **Problem:** `posted.json` grows by one entry per posting day, unbounded.
- **Why deferred:** Trivial at personal scale (365 entries/year ≈ small).
- **Candidate fix:** prune entries older than N days once the dedupe window is satisfied (e.g., keep last 90 days; older reposts are acceptable).

## 5. actionlint in CI

- **Problem:** Workflow YAML is only validated by GitHub on dispatch; `actionlint` availability on the dev machine is unverified.
- **Why deferred:** POC; GitHub validates on dispatch.
- **Candidate fix:** add `actionlint` to a pre-push hook or a CI check on the `private-feed-source` repo.