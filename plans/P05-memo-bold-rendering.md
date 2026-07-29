---
id: PLAN-005
type: plan
status: done
owner: human
depends_on: []
spec_checksum: 05a3dcf5
last_validated: 2026-07-29T18:35:16+00:00
---

# Memo Bold Rendering (Issue #16)

```spec
scope: document
type: plan
required_sections: [Context, Tools & Skills, Approach, Out of Scope, Steps, Files to Modify, Reuse, Evidence Pack, Verification, Bottom Line]
max_chars: 100000
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
max_chars: 100000
banned_words: [might be, could be, seems like, I think, possibly, perhaps]
match:
  has_problem: '(problem|issue|bug|break|fail|cannot|does.not|unable)'
```

Memo content is rendered as raw text, so markdown the user writes (observed: `**bold**`) displays literally as asterisks instead of styled text. Issue: the app cannot communicate emphasis — `memo-card.tsx` and the public share view in `App.tsx` both dump `content` into a `whitespace-pre-wrap` div. Full requirement locked via grilling interview: `specs/P05-memo-bold-rendering-spec.md`, GH issue #16.

## Tools & Skills

```spec
type: plan
max_chars: 100000
banned_words: [N/A, n/a, grep sufficient, small codebase, simple enough, overkill for]
match:
  min_3_ynp: '^- .+: (Yes|No|Possibly)\b'
  has_gh: '\bgh\b.*\(CLI\).*: Yes\b'
  has_deepwiki: 'deepwiki.*\(MCP\).*: Yes\b'
  has_inspect: '\binspect\b.*\(Skills\).*: Yes\b'
  has_slopscan: '\bslop-scan\b.*\(CLI\).*: Yes\b'
```

Enumerated: `ls ~/.pi/agent/skills` → ponytail, grilling, grill-with-docs, agent-browser-core, cloudflare, wrangler, workers-best-practices, durable-objects, domain-modeling, web-perf, turnstile-spin, sandbox-sdk, agents-sdk, cloudflare-email-service, cloudflare-one*, research-docs-grounding, pi-config (+ ponytail-* variants). MCP tools available: deepwiki, inspect, chrome-devtools. CLI on PATH: gh, slop-scan, docfence. `mcporter` and `~/.pi/agent/skills/cli-tool-discovery` do not exist in this environment; cx and ck are not on PATH and not in the skills dirs.

- cx (Skills): No — not installed (not in skills dirs, not on PATH); cannot mark Yes honestly.
- ck (Skills): No — not installed (not in skills dirs, not on PATH); cannot mark Yes honestly.
- gh (CLI): Yes — issue/branch already created via gh; will push/PR with it.
- deepwiki (MCP): Yes — used already for this task (browser-use + stars research); reuse for any lib question.
- inspect (Skills): Yes — use inspect_triage on the diff to blast-radius check the change before PR.
- slop-scan (CLI): Yes — run against the diff before PR to catch over-engineering (aligns with ponytail).
- ponytail (Skills): Yes — governing skill for this whole task; ladder: no dependency, smallest diff.
- agent-browser-core (Skills): Possibly — for end-user visual verification of bold rendering via the running app if manual check is skipped.
- vitest (repo devDep): Yes — the one-runnable-check requirement is a small vitest file, per shaping decision 4.

## Approach

```spec
type: plan
max_chars: 800
banned_words: [Q1:, Q2:, Q3:, **Q, Question:]
match:
  has_alternative: '(alternative|instead of|rather than|compared to|over:|vs[.])'
```

Zero-dependency inline renderer: split text on `\*\*([^*\n]+)\*\*` and wrap matches in `<strong>` elements, inside one shared component consumed by both render sites. Chosen over: react-markdown (~90KB, YAGNI for bold-only, upgrade path instead), and over marked/markdown-it/snarkdown (output HTML strings, would force dangerouslySetInnerHTML + sanitization on user content). [verify] `<strong>` inherits surrounding typography and still reads as visually bold in both `text-base` (share view) and `text-[15px]` (card) contexts. Locked: conservative matcher, bold only, conservative = no newlines/asterisks inside markers.

## Out of Scope

```spec
type: plan
max_chars: 100000
banned_words: [Nothing., None., N/A, n/a, Not applicable]
match:
  has_justification: '^- .+:'
  min_2_exclusions: '^- .+:'
```

- Italic / links / code spans / lists / headers: YAGNI locked in grilling; extending regexes beyond bold is the declared react-markdown switch point.
- Composer live preview (`memo-composer.tsx`): unrequested UI change; textarea stays plain text.
- Server-side rendering or stored-HTML: content stays raw markdown in D1; rendering is client-only.
- Multiline bold: conservative regex excludes `\n` inside markers by design.

## Steps

```spec
type: plan
max_chars: 100000
banned_words: [**Step, **Task, **Phase]
match:
  has_step_evidence: '^- \[ \].*\(Source'
  min_3_steps: '^- \[( |x)\]'
```

- [ ] Create `apps/web/src/components/memo-content.tsx` exporting `MemoContent({ text }: { text: string })`: `text.split(/(\*\*[^*\n]+\*\*)/g).map((part, i) => bold ? <strong key={i}>` with ponytail comment naming ceiling + react-markdown upgrade path (Source: specs/P05-memo-bold-rendering-spec.md, decisions 1–3)
- [ ] Swap `memo-card.tsx:162` `{memo.content}` → `<MemoContent text={memo.content} />`, keep wrapping div classes unchanged (Source: apps/web/src/components/memo-card.tsx:162)
- [ ] Swap `App.tsx:509` `{share.memo.content}` → `<MemoContent text={share.memo.content} />` in the share view (Source: apps/web/src/App.tsx:509)
- [ ] Add `apps/web/src/components/memo-content.test.tsx` (vitest): bold converts, single `*` untouched, `<b>` injection stays escaped, math-pair behavior documented (Source: specs/P05-memo-bold-rendering-spec.md, decision 4)
- [ ] Run `pnpm --filter @flaremo/web test && pnpm --filter @flaremo/web check`, then inspect_triage + slop-scan on the diff (Source: Tools & Skills — inspect, slop-scan)

## Files to Modify

```spec
type: plan
max_chars: 100000
banned_words: [TODO, TBD, placeholder]
match:
  has_file_entry: '^- `[^`]+` — (CREATED|UPDATED|DELETED)'
```

- `apps/web/src/components/memo-content.tsx` — CREATED: shared bold renderer, ~15 lines
- `apps/web/src/components/memo-content.test.tsx` — CREATED: vitest coverage of the matcher
- `apps/web/src/components/memo-card.tsx` — UPDATED: line ~162, `{memo.content}` → `<MemoContent text={memo.content} />`
- `apps/web/src/App.tsx` — UPDATED: line ~509, share view `{share.memo.content}` → `<MemoContent text={share.memo.content} />`

## Reuse

```spec
type: plan
max_chars: 100000
banned_words: [None., N/A, Nothing to reuse, No reuse]
match:
  has_reuse_item: '^- .+:'
```

- React string-escaping: the XSS story — matches become elements, never HTML strings; nothing to sanitize.
- `whitespace-pre-wrap` wrappers in both call sites: kept as-is; newlines handling stays CSS, zero logic.
- Existing vitest setup (root `vitest.config.ts`, `apps/web` test script with `--passWithNoTests`): drop-in for the new test file.

## Evidence Pack

```spec
type: plan
max_chars: 100000
banned_words: [**Source**:, **Source:**]
match:
  has_evidence_claim: '^- Claim:'
  has_confidence: 'Confidence:'
```

- Claim: memo content renders raw at exactly two sites; no other `{*.content}` render paths exist for memos.
  Source: grep of apps/web/src — `memo-card.tsx:162` and `App.tsx:509` are the two `whitespace-pre-wrap` content divs; composer is a textarea.
  Confidence: 0.9
  Implication: one shared component + two call-site edits covers 100% of visible memo rendering.
- Claim: the regex `/\*\*([^*\n]+)\*\*/g` cannot inject HTML because matches are returned as React nodes, not strings spliced into markup.
  Source: jsx runtime semantics; `text.split(...)` output mapped to elements — strings stay escaped by React.
  Confidence: 0.95
  Implication: no sanitizer dependency needed; XSS surface is zero.
- Claim: `2 ** 3 = 8` matches the conservative regex (content has no `*`/`\n`) and will bold unexpectedly.
  Source: shaping decision 3 — accepted ceiling.
  Confidence: 1.0
  Implication: documented behavior; test asserts it so the trade-off is explicit, not discovered later.

### Gaps

- [verify] typography of `<strong>` visually distinct under Tailwind v4 preflight in both font-size contexts — confirmed by end-user eyeball in Verification Test 3, not provable from code alone.
- cx/ck tools genuinely absent from this machine; Tools & Skills entries marked No — related type-rule flags expected.

## Verification

```spec
type: plan
max_chars: 100000
banned_words: [TODO, TBD, placeholder]
match:
  has_verify_command: '^```bash'
  has_expected: '# Expected:'
  min_2_tests: '# Test \d'
  has_state_space: '(empty|zero|partial|intermediate|boundary|edge case|failure)'
```

State space of the matcher: zero markers (plain text), minimum (one bold pair), intermediate (multiple pairs + lone `*`), boundary (empty `****`, multiline inside markers), failure/hostile (HTML injection attempt).

```bash
# Test 1: unit coverage across state space (zero / minimum / intermediate / boundary / failure)
cd apps/web && pnpm vitest run src/components/memo-content.test.tsx
# Expected: all pass — "**bold**" → <strong>bold</strong>; "no markers" → unchanged; "a **b** c **d**" → two strongs; "****" and "**a\nb**" stay literal; "<img onerror>" text remains escaped, no <b>/<img> elements from raw input.
```

```bash
# Test 2: typecheck + existing suite regression (empty-suite guard)
pnpm --filter @flaremo/web check && pnpm --filter @flaremo/web test
# Expected: exit 0, no TS errors, no failing tests.
```

```bash
# Test 3: end-user check — run the app, open a memo containing "**bold**" and "2 ** 3 = 8"
pnpm dev
# Expected: card + share view show bold as bold text (no asterisks); math line bolds between pairs (documented boundary behavior); no console errors. [verify] claim from Approach visually confirmed by user.
```

```bash
# Test 4: diff hygiene before PR
slop-scan && node $(command -v inspect) 2>/dev/null; git diff --stat
# Expected: 4 files changed, ~60 lines added; inspect_triage shows no critical entities; no new dependencies in package.json diff (boundary: dependency file untouched).
```

## Bottom Line

```spec
type: plan
max_chars: 100000
banned_words: [TODO, TBD, placeholder]
match:
  has_recommendation: 'Recommendation:'
```

- Component creation: 0.95 confident — trivial, fully specified inline.
- Two call-site edits: 0.95 — mechanical, sites verified by grep.
- Test file: 0.9 — vitest + testing-library presence verified at build time; fallback is render-to-string assertion via react-dom/server if testing-library absent.
- Typecheck/test/slop-scan runs: 0.85 — pnpm store cold on this machine (slow network), commands may need retries.
- Average: ~0.91. Outliers: none blocking; network slowness is environmental.
- Key risk: `<strong>` visually indistinct under Tailwind preflight styling — gated by user eyeball (Test 3) rather than code.
- Gaps: cx/ck absent locally so two Tools & Skills match rules will flag; type rule question raised to user, not worked around.

Recommendation: proceed.
