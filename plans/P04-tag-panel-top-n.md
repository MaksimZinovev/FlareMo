---
id: P04
type: plan
status: draft
owner: human
depends_on: [P03]
spec_checksum: 8fadeb61
last_validated: 2026-07-21T21:17:34+00:00
---

# Tag Panel Top-N + Show All Expansion

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

The tag panel in `flaremo-explorer.tsx` renders all tags at once in a wrapping button list. After canonicalization (P03, merged) the dataset has 428 unique canonical tags, of which 350 have count=1. The full list dominates the sidebar, pushing the footer (export/import buttons) far down and making the panel hard to scan. Ideas 1A (alias map) and 2A (frequency sort) are already merged — `getAllTags` in `memo.ts` returns frequency-sorted canonical tags. Idea 3A is the final step: show only the top-N tags by default, with a "Show all" button to expand the rest.

The issue is that 428 tags rendered simultaneously cannot be scanned effectively. The sidebar does scroll (`overflow-y-auto` on the parent), but the tag section alone spans several screens, and the footer is unreachable without scrolling past it all.

## Tools & Skills

```spec
type: plan
max_chars: 150000
banned_words: [N/A, n/a, grep sufficient, small codebase, simple enough, overkill for]
match:
  min_3_ynp: '^- .+: (Yes|No|Possibly)\b'
  has_gh: '\bgh\b.*\(CLI\).*: Yes\b'
  has_deepwiki: 'deepwiki.*\(MCP\).*: Yes\b'
  has_slopscan: '\bslop-scan\b.*\(CLI\).*: Yes\b'
```

- grilling (Skills): Yes — used to stress-test every decision via interview before implementation
- ponytail (Skills): Yes — deferred decisions marked with `ponytail:` comments per project convention
- gh (CLI): Yes — used to create the PR at the end of implementation
- deepwiki (MCP): Yes — can research Playwright testing patterns if e2e test issues arise
- slop-scan (CLI): Yes — can scan modified files for code quality issues before PR submission
- docfence (CLI): Yes — validates this plan document and ensures structural compliance before stamping

## Approach

```spec
type: plan
max_chars: 800
banned_words: [Q1:, Q2:, Q3:, **Q, Question:]
match:
  has_alternative: '(alternative|instead of|rather than|compared to|over:|vs[.])'
```

Add `useState(showAllTags)` local to `flaremo-explorer.tsx`. Render top 25 tags when collapsed with a toggle button to expand/collapse. Active tag stays visible at its natural sorted position when collapsed. Button uses `aria-expanded` + `aria-controls`, styled as subtle inline text in the existing `flex-wrap`.

Local state over lifted state: no sibling needs expansion awareness. Instead of a max-height with nested scroll, the sidebar's existing `overflow-y-auto` handles scrolling — avoids nested scroll on mobile. Rather than extracting a pure function for unit testing, a Playwright e2e test verifies expand/collapse count-agnostically (skip if <25 tags). Subtle text vs. chip style: visually distinct from tag buttons.

## Out of Scope

```spec
type: plan
max_chars: 150000
banned_words: [Nothing., None., N/A, n/a, Not applicable]
match:
  has_justification: '^- .+:'
  min_2_exclusions: '^- .+:'
```

- Tag search/filter input (Idea 3B): deferred as a `ponytail:` comment — only worth it if tags grow beyond a few hundred or canonicalization cannot keep up
- Canonical vocabulary at source (Idea 1B): deferred — heavier import-pipeline change, belongs in the weekly-post pipeline not the UI
- Two-tier sort / A-Z toggle (Idea 2B): deferred — more UI code, only worth it if users bounce between scan-most-used and find-by-name modes
- Height constraint on expanded tag section: not adding max-height with nested scroll — the sidebar's existing overflow-y-auto is sufficient

## Steps

```spec
type: plan
max_chars: 150000
banned_words: [**Step, **Task, **Phase]
match:
  has_step_evidence: '^- \[ \].*\(Source'
  min_3_steps: '^- \[( |x)\]'
```

- [ ] Add `TOP_N` constant and `showAllTags` state to `flaremo-explorer.tsx` (Source: apps/web/src/components/flaremo-explorer.tsx)
- [ ] Compute `visibleTags` via filter keeping top-N plus active tag at natural position (Source: apps/web/src/components/flaremo-explorer.tsx — tags prop is already frequency-sorted from getAllTags)
- [ ] Replace `tags.map(...)` with `visibleTags.map(...)` in the tag section JSX (Source: apps/web/src/components/flaremo-explorer.tsx:134)
- [ ] Add `id="tag-list"` to the tag container div and the toggle button with `aria-expanded` + `aria-controls` (Source: apps/web/src/i18n.tsx — explorer.showMoreTags and explorer.showLess keys already exist)
- [ ] Create Playwright e2e test for expand/collapse behavior (Source: tests/e2e/memo-flow.spec.ts — existing e2e pattern uses getByRole("complementary") for sidebar)
- [ ] Validate plan document with `docfence validate` and stamp (Source: docfence CLI)
- [ ] Run `pnpm -r test` and `pnpm playwright test` to confirm no regressions (Source: package.json — test script is `pnpm -r test`)

## Files to Modify

```spec
type: plan
max_chars: 150000
banned_words: [TODO, TBD, placeholder]
match:
  has_file_entry: '^- `[^`]+` — (CREATED|UPDATED|DELETED)'
```

- `apps/web/src/components/flaremo-explorer.tsx` — UPDATED: add TOP_N constant, showAllTags state, visibleTags filter, toggle button with aria-expanded/aria-controls, id on tag container
- `tests/e2e/tag-panel.spec.ts` — CREATED: Playwright e2e test for expand/collapse behavior, count-agnostic
- `apps/web/src/lib/memo.ts` — UPDATED: no functional changes (getAllTags already frequency-sorted); add `ponytail:` comment referencing Idea 3B

## Reuse

```spec
type: plan
max_chars: 150000
banned_words: [None., N/A, Nothing to reuse, No reuse]
match:
  has_reuse_item: '^- .+:'
```

- getAllTags frequency sort: the tags prop is already sorted by count desc with alpha tiebreak, so `tags.filter((_, i) => i < TOP_N)` gives the correct top-N without any additional sorting logic
- i18n keys explorer.showMoreTags + explorer.showLess: already present in i18n.tsx from earlier groundwork, no new translations needed
- existing e2e test pattern: memo-flow.spec.ts uses `page.getByRole("complementary")` to target the sidebar — the new test reuses this same locator strategy
- existing tag button styling: the subtle text toggle button reuses `text-xs text-muted-foreground` classes already used elsewhere in the explorer for non-interactive labels

## Evidence Pack

```spec
type: plan
max_chars: 150000
banned_words: [**Source**:, **Source:**]
match:
  has_evidence_claim: '^- Claim:'
  has_confidence: 'Confidence:'
```

- Claim: After canonicalization (P03) there are 428 unique canonical tags, 350 with count=1
  Source: data/posted.json (computed via node script with TAG_ALIASES applied)
  Confidence: 0.95
  Implication: top-25 covers all tags with count >= 3; the long tail is 350 single-use tags that add no scanning value

- Claim: tags prop passed to FlareMoExplorer is already frequency-sorted by getAllTags
  Source: apps/web/src/lib/memo.ts — getAllTags sorts by `(counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b)`
  Confidence: 0.99
  Implication: `tags.filter((_, i) => i < TOP_N)` yields the correct top-N without additional sorting

- Claim: i18n keys explorer.showMoreTags and explorer.showLess already exist in both zh-CN and en-US locales
  Source: apps/web/src/i18n.tsx
  Confidence: 1.0
  Implication: no new translation work needed; the toggle button labels are ready to use

- Claim: No component tests (.test.tsx) exist in the project; only Vitest unit tests (memo.test.ts) and Playwright e2e tests (tests/e2e/)
  Source: filesystem search — `find . -name "*.test.tsx"` returns no results
  Confidence: 1.0
  Implication: the e2e approach is consistent with existing test infrastructure; no new test dependencies needed

- Claim: The sidebar parent in App.tsx has `overflow-y-auto` so expanded tags scroll naturally
  Source: apps/web/src/App.tsx — `no-scrollbar hidden h-full w-[312px] shrink-0 overflow-y-auto border-r bg-background lg:block`
  Confidence: 1.0
  Implication: no height constraint or nested scroll needed on the tag section

### Gaps

- Claim: The tags prop comes from getAllTags(normalMemos) but tag count badges use getStats(visibleMemos) where visibleMemos = normalMemos + archivedMemos
  Source: apps/web/src/App.tsx — `allTags = getAllTags(normalMemos)`, `memos={visibleMemos}`
  Confidence: 0.9
  Implication: ordering is based on normal-memo counts but badges show normal+archived counts; this is a pre-existing inconsistency unrelated to 3A and does not affect the top-N cutoff

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
# Test 1: Collapsed state shows top-N tags, expand button present
# State: intermediate (428 tags, collapsed)
cd C:/Users/maksi/repos/FlareMo && pnpm playwright test --grep "tag panel"
# Expected: test passes — tag buttons count <= 26 (25 + possible active tag), expand button visible, clicking it increases count, clicking collapse returns to original count
```

```bash
# Test 2: Empty/zero state — fewer than TOP_N tags, no expand button
# State: empty/zero (fresh DB with <25 tags)
# This is covered by the count-agnostic skip: if expand button is not visible, test skips gracefully
# Expected: test skips (no failures) when <25 tags exist
```

```bash
# Test 3: Boundary — exactly TOP_N tags, no expand button shown
# State: boundary (exactly 25 tags)
# The condition is `tags.length > TOP_N` so exactly 25 does not show the button
# Expected: no expand button, all 25 tags visible, test passes
```

```bash
# Test 4: Active tag force-show when collapsed (edge case)
# State: edge case (active tag below rank N, collapsed)
# Manual verification: select a low-ranked tag after expanding, then collapse
# Expected: active tag remains visible at its natural sorted position; toggle button still shows +N more
```

```bash
# Test 5: Unit tests still pass (regression)
cd C:/Users/maksi/repos/FlareMo && pnpm -r test
# Expected: all existing memo.test.ts tests pass — no changes to memo.ts logic
```

```bash
# Test 6: docfence validation
cd C:/Users/maksi/repos/FlareMo && docfence validate plans/P04-tag-panel-top-n.md
# Expected: no errors, no warnings — plan document is structurally valid
```

## Bottom Line

```spec
type: plan
max_chars: 150000
banned_words: [TODO, TBD, placeholder]
match:
  has_recommendation: 'Recommendation:'
```

Per-step confidence:
- Add TOP_N constant + state: 1.0 (trivial React useState)
- visibleTags filter logic: 0.95 (filter on pre-sorted array; edge case with activeTag verified by design)
- Toggle button JSX + aria: 0.95 (i18n keys already exist; aria pattern is standard)
- Playwright e2e test: 0.85 (count-agnostic approach may skip in CI if DB has <25 tags, but that is acceptable)
- No regressions to memo.ts: 1.0 (no changes to memo.ts logic)

Average: 0.93. Key risk: the e2e test skips gracefully when <25 tags exist, which means it provides no coverage in a fresh environment. Mitigation: the test still runs against the development DB which has 428 tags.

Recommendation: proceed — all decisions are resolved, the change is ~10 lines in one component file plus one e2e test file, and it completes the 1A → 2A → 3A path from the shaping doc.