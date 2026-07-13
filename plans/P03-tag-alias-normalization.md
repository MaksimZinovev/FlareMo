---
id: P03
type: plan
status: draft
owner: human
depends_on: []
spec_checksum: 6f35563c
last_validated: ~
---

# Collapse near-duplicate tags with an alias map (issue #8)

```spec
scope: document
type: plan
required_sections: [Context, Tools & Skills, Approach, Out of Scope, Steps, Files to Modify, Reuse, Evidence Pack, Verification, Bottom Line]
max_chars: 150000
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
max_chars: 150000
banned_words: [might be, could be, seems like, I think, possibly, perhaps]
match:
  has_problem: '(problem|issue|bug|break|fail|cannot|does.not|unable)'
```

The left tag panel renders 348 tags, but many are the same concept spelled different ways (`date-picker` and `datepicker`, `menu-bar` and `menubar`, `typescirpt` is a typo of `typescript`). Root issue: tags come from GitHub repo `topics` imported verbatim by the weekly-post pipeline, and FlareMo never normalizes them. The sidebar list, count badges, active-tag filter, and per-note card tags each read raw `payload.tags`/`extractTags` in separate places, so patching only one leaves the others inconsistent or broken (clicking a canonical tag fails to match notes stored with the variant). Tracked as issue #8.

## Tools & Skills

```spec
type: plan
max_chars: 150000
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

- cx (Skills): Yes — traced all 6 tag-consumption call sites and the repeated `payload.tags ?? extractTags` pattern.
- ck (Skills): Yes — semantic search available for any follow-up concept queries during implementation.
- gh (CLI): Yes — will open the PR and reference issue #8 per the FlareMo branch→PR flow.
- deepwiki (MCP): Yes — available to query repo architecture if a cross-module tag-flow question arises.
- inspect (Skills): Yes — will triage the PR's structural risk before merge.
- slop-scan (CLI): Yes — will scan the changed TS for AI-slop patterns before finalizing.
- ponytail (Skills): Yes — enforces the single-helper root-cause fix over per-caller patches.
- vitest (CLI): Yes — runs the unit self-check for the pure `normalizeTag`/`normalizeTags` functions.

## Approach

```spec
type: plan
max_chars: 800
banned_words: [Q1:, Q2:, Q3:, **Q, Question:]
match:
  has_alternative: '(alternative|instead of|rather than|compared to|over:|vs[.])'
```

Add one `getMemoTags(memo)` helper in `memo.ts` returning normalized tags, backed by a static `TAG_ALIASES` map and a `TAG_DENYLIST` (`from`). Swap the 4 inline `payload.tags ?? extractTags(...)` sites for it so normalization lives in one place — list, counts, filter, cards all consistent. `extractTags` stays pure. Alternative: the issue's literal scope (patch only `getAllTags`+`extractTags`) is fewer files, but breaks the active-tag filter (`App.tsx:229`): clicking `datepicker` won't match notes stored as `date-picker`, and leaves card chips raw — a symptom patch rather than a fix. Canonical form per cluster: most-frequent → no-hyphen-on-tie (hyphen duplicates only) → shortest base form when counts absent; ties pinned in tests.

## Out of Scope

```spec
type: plan
max_chars: 150000
banned_words: [Nothing., None., N/A, n/a, Not applicable]
match:
  has_justification: '^- .+:'
  min_2_exclusions: '^- .+:'
```

- Canonical vocabulary at import time (issue #9): the read-time alias map covers ~80% now; the source fix is deferred to its own good-to-have issue.
- Server-side `?tag=` LIKE filter (`packages/domain/src/memos.ts:77`): unused by the web app (it filters client-side at `App.tsx:229`); Memos-API clients are out of scope for this UI issue.
- Composer tag chips (`apps/web/src/components/memo-composer.tsx:37`): showing the raw `#tag` the user just typed is correct input feedback; auto-correcting typed tags is a separate concern.
- Merging semantic near-synonyms (`memo`/`memos`/`notes`/`note-taking`, `x`→`twitter`): too generic or lossy; deferred to avoid over-merging.

## Steps

```spec
type: plan
max_chars: 150000
banned_words: [**Step, **Task, **Phase]
match:
  has_step_evidence: '^- \[ \].*\(Source'
  min_3_steps: '^- \[( |x)\]'
```

- [ ] Branch off latest main as `fix/tag-alias-normalization` (Source: FlareMo AGENTS.md issue→branch→PR flow).
  - Confidence: 0.95
  - Details: `git switch main && git pull --ff-only && git switch -c fix/tag-alias-normalization`.
- [ ] Add the alias map, denylist, and helpers in `apps/web/src/lib/memo.ts` (Source: Evidence Pack Claim 1, Claim 5).
  - Confidence: 0.9
  - Details: add `TAG_ALIASES` record (~14 entries), `TAG_DENYLIST` set (`from`), `normalizeTag`, `normalizeTags` (map + dedup via Set), and `getMemoTags`; rewrite the `getAllTags` loop to use `getMemoTags`. Keep `extractTags` pure.
- [ ] Swap the 4 inline call sites to `getMemoTags` (Source: Evidence Pack Claim 1, Claim 3, Claim 4).
  - Confidence: 0.9
  - Details: `App.tsx:229` (filter), `App.tsx:484` (share view), `flaremo-explorer.tsx:188` (getStats counts), `memo-card.tsx:71` (card chips); add the `getMemoTags` import in each file.
- [ ] Add a unit self-check `apps/web/src/lib/memo.test.ts` (Source: ponytail SKILL — one runnable check for non-trivial logic; Evidence Pack Claim 6).
  - Confidence: 0.9
  - Details: assert typo fix, merge+dedup, denylist drops `from`, empty input, partial passthrough.
- [ ] Run `pnpm verify` and `slop-scan scan apps/web/src/lib/memo.ts` (Source: FlareMo AGENTS.md 验收口径).
  - Confidence: 0.95
  - Details: format, lint, unit, build, e2e green; 0 slop findings in changed files.
- [ ] Open PR closing #8 and verify live in the browser (Source: FlareMo AGENTS.md PR flow).
  - Confidence: 0.9
  - Details: hard-reload `flaremo.mkznve.workers.dev`, confirm `datepicker`/`menubar`/`typescript` appear once with merged counts, `from` is gone, and clicking a merged tag filters notes.

## Files to Modify

```spec
type: plan
max_chars: 150000
banned_words: [TODO, TBD, placeholder]
match:
  has_file_entry: '^- `[^`]+` — (CREATED|UPDATED|DELETED)'
```

- `apps/web/src/lib/memo.ts` — UPDATED: add `TAG_ALIASES`, `TAG_DENYLIST`, `normalizeTag`, `normalizeTags`, `getMemoTags`; rewrite `getAllTags` to use `getMemoTags`; `extractTags` unchanged.
- `apps/web/src/App.tsx` — UPDATED: import `getMemoTags`; use it at the filter (line 229) and the share view (line 484).
- `apps/web/src/components/flaremo-explorer.tsx` — UPDATED: import `getMemoTags`; use it in `getStats` (line 188) so count badges reflect merged totals.
- `apps/web/src/components/memo-card.tsx` — UPDATED: import `getMemoTags`; use it at line 71 so card chips match the sidebar's canonical tags.
- `apps/web/src/lib/memo.test.ts` — CREATED: one focused vitest file asserting `normalizeTag`/`normalizeTags`/denylist/empty behavior.

## Reuse

```spec
type: plan
max_chars: 150000
banned_words: [None., N/A, Nothing to reuse, No reuse]
match:
  has_reuse_item: '^- .+:'
```

- repeated pattern `memo.payload.tags ?? extractTags(memo.content)`: already appears 4x inline; the new `getMemoTags` wraps it once and adds normalization, DRY-ing the codebase.
- `extractTags` regex `/(^|\s)#([\p{L}\p{N}_-]+)/gu`: reused unchanged as the lossless extraction step; normalization layers on top.
- existing vitest config (`vitest.config.ts`, `apps/web` `test` script): reused for the unit self-check, no new test harness.

## Evidence Pack

```spec
type: plan
max_chars: 150000
banned_words: [**Source**:, **Source:**]
match:
  has_evidence_claim: '^- Claim:'
  has_confidence: 'Confidence:'
```

- Claim: Tags are read raw in 6 places; 4 use the identical inline `memo.payload.tags ?? extractTags(memo.content)` pattern (`App.tsx:229`, `App.tsx:484`, `flaremo-explorer.tsx:188`, `memo-card.tsx:71`), plus `getAllTags` (`memo.ts:29`) and the composer (`memo-composer.tsx:37`).
  Source: apps/web/src — search of `payload.tags`/`extractTags`/`getAllTags`
  Confidence: 0.95
  Implication: one `getMemoTags` helper covering the 4 inline sites + `getAllTags` fixes list, counts, filter, and cards in a single root-cause change.
- Claim: The web app filters tags 100% client-side — `listMemos({ state })` sends no `tag` param; the active-tag filter is `App.tsx:229` in a `useMemo`. The server-side `?tag=` LIKE filter is unused by the web app.
  Source: apps/web/src/App.tsx:64,229 ; apps/web/src/api.ts:107-123 ; packages/domain/src/memos.ts:77
  Confidence: 0.9
  Implication: a client-side normalization fix is sufficient for issue #8; no backend change needed.
- Claim: Fixing only `getAllTags`+`extractTags` (the issue's literal scope) leaves the filter reading raw `payload.tags`, so clicking canonical `datepicker` does not match notes stored as `date-picker` → broken filter.
  Source: apps/web/src/App.tsx:229 (`.includes(activeTag)` on raw tags)
  Confidence: 0.85
  Implication: the fix must normalize at the filter too; hence `getMemoTags`-everywhere over the literal 2-function scope.
- Claim: `getStats` (`flaremo-explorer.tsx:188`) builds `tagCounts` from raw tags; if not normalized, the merged sidebar tag shows only one variant's count, not the combined total.
  Source: apps/web/src/components/flaremo-explorer.tsx:184-201
  Confidence: 0.85
  Implication: explorer must use `getMemoTags` so count badges reflect merged totals.
- Claim: The live panel confirms the alias clusters and a typo: `date-picker`/`datepicker`, `menu-bar`/`menubar`, `status-bar`/`statusbar`, `open-graph`(2)/`opengraph`(2), `ai-agent`(7)/`ai-agents`(5), `typescript`(10)/`typescirpt`, `mcp`(8)/`model-context-protocol`(2), `self-hosted`(4)/`self-hosting`, `shadcn`/`shadcn-ui`/`shadcnui`, `vanilla-javascript`/`vanilla-js`, `transfer-data`/`transferring-data`, plus noise `from`(3).
  Source: Chrome DevTools snapshot of flaremo.mkznve.workers.dev tag panel
  Confidence: 0.9
  Implication: a ~14-entry alias map + `from` denylist captures the confirmed duplicates; conservative — excludes generic `x`→`twitter` and semantic synonym merges.
- Claim: `apps/web` runs unit tests via `vitest run --config ../../vitest.config.ts --passWithNoTests` (script `test`), picked up by root `pnpm test` (`pnpm -r test`).
  Source: apps/web/package.json scripts ; package.json:17
  Confidence: 0.9
  Implication: a `memo.test.ts` self-check runs under the existing `pnpm verify` flow, no new harness.

### Gaps

- Canonical-form selection is deterministic: most-frequent variant wins (live panel counts) → on a frequency tie the no-hyphen form wins, but only for hyphen-vs-no-hyphen duplicates of the same token (e.g. `open-graph`→`opengraph`), never for collapsing distinct multi-word tags (`model-context-protocol`→`mcp` is a most-used acronym merge, not hyphen-stripping) → when no live count exists, the shortest shared base form wins (`shadcn-ui`/`shadcnui`→`shadcn`, `vanilla-javascript`/`vanilla-js`→`vanilla-js`, `transfer-data`/`transferring-data`→`transfer-data`). Ties are pinned in `memo.test.ts`.
- `x`→`twitter` is excluded as too generic; if the dataset's `x` is always Twitter, it can be added later.

## Verification

```spec
type: plan
max_chars: 150000
banned_words: [TODO, TBD, placeholder]
match:
  has_verify_command: '^```bash'
  has_expected: '# Expected:'
  min_2_tests: '# Test \d'
  has_state_space: '(empty|zero|partial|intermediate|boundary|edge case|failure)'
```

```bash
# Test 1: unit self-check — covers happy/typo, merge+dedup (intermediate), empty/boundary, denylist (failure/noise), partial passthrough
# apps/web/src/lib/memo.test.ts asserts:
#   normalizeTag("typescirpt") === "typescript"                     (happy/typo)
#   normalizeTags(["ai-agents","ai-agent"]) === ["ai-agent"]        (merge+dedup, intermediate)
#   normalizeTags([]) === []  AND  normalizeTags(["from"]) === []   (empty + boundary; "from" denylist = failure/noise)
#   normalizeTags(["react","date-picker"]) === ["react","datepicker"]  (partial passthrough)
pnpm test
# Expected: memo.test.ts passes, 0 failures
```

```bash
# Test 2: full project verification gate (failure state — any lint/type/build break stops here)
pnpm verify
# Expected: format, lint, unit, build, e2e all green
```

```bash
# Test 3: live end-user check (full state) — deploy then hard-reload
# Cmd+Shift+R https://flaremo.mkznve.workers.dev, inspect left tag panel
# Expected: "datepicker" once (merged count), "menubar" once, "typescript" absorbs ex-"typescirpt", "from" absent; clicking "datepicker" shows notes previously tagged #date-picker
```

## Bottom Line

```spec
type: plan
max_chars: 150000
banned_words: [TODO, TBD, placeholder]
match:
  has_recommendation: 'Recommendation:'
```

- Per-step confidence: branch 0.95, helpers 0.9, call-site swaps 0.9, test 0.9, verify 0.95, PR/live 0.9. Average ~0.92.
- Key risk: an alias canonical-form choice disagrees with reviewer preference (e.g. `datepicker` vs `date-picker`); mitigation — the map is one const, trivially adjustable in review.
- Gaps: `x`→`twitter` excluded (too generic); semantic-synonym merges (`memo`/`notes`) deferred to avoid over-merging.
- Recommendation: proceed — low uncertainty, root-cause fix, small diff, fully verifiable.
