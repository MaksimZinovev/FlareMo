# Tag Panel Improvements — Suggestions

## What's happening now

- **348 tags**, all rendered at once in a wrapping button list (`flaremo-explorer.tsx:134`).
- **Sort: alphabetical** — `getAllTags` in `apps/web/src/lib/memo.ts` does `[...tags].sort((a, b) => a.localeCompare(b))`. Frequency is only shown as a badge, never used for ordering.
- **Tags come from GitHub repo `topics`** (author-assigned, no controlled vocabulary), imported verbatim by the weekly-post pipeline. That's the root cause of the inconsistency — FlareMo never normalizes them.

## Real duplication I can see in your 348 tags

These are concrete examples from the live panel, not speculation:

| Cluster | Variants present | Type of dup |
|---|---|---|
| date picker | `date-picker`, `datepicker` | hyphen vs no-hyphen |
| menu bar | `menu-bar`, `menubar` | hyphen vs no-hyphen |
| status bar | `status-bar`, `statusbar` | hyphen vs no-hyphen |
| open graph | `open-graph` (2), `opengraph` (2) | hyphen vs no-hyphen, split across repos |
| download manager | `download-manager`, `downloadmanager` | hyphen vs no-hyphen |
| shadcn | `shadcn`, `shadcn-ui`, `shadcnui` | 3 forms of same lib |
| vanilla js | `vanilla-javascript`, `vanilla-js` (2) | hyphen vs no-hyphen |
| ai agent | `ai-agent` (7), `ai-agents` (5) | singular vs plural (12 combined!) |
| skill | `skill`, `skills` (3) | singular vs plural |
| notes | `memo` (2), `memos`, `notes` (2), `note-taking` (2) | synonyms |
| typescript | `typescript` (10), `ts`, **`typescirpt`** | typo + acronym |
| mcp | `mcp` (8), `model-context-protocol` (2) | acronym expansion |
| twitter | `twitter` (4), `x` | rebrand synonym |
| self-host | `self-hosted` (4), `self-hosting` | same concept |
| transfer | `transfer-data`, `transferring-data` | same concept |
| noise | `from` (3) | leaked from "forked from" text — not a real topic |

---

## Suggestions — 2 per item

### 1. Make tags consistent / canonical

**Idea 1A — Alias map at read time (ponytail pick).** Add a small static `TAG_ALIASES` map in `apps/web/src/lib/memo.ts` and apply it inside `getAllTags` + `extractTags`. Lowercase + collapse the known variants to one canonical form. Fixes the whole UI in one place, no data migration.

```ts
const TAG_ALIASES: Record<string, string> = {
  typescirpt: "typescript",
  "ai-agents": "ai-agent",
  "date-picker": "datepicker",   // pick one form, merge
  "menu-bar": "menubar",
  "status-bar": "statusbar",
  "open-graph": "opengraph",
  "download-manager": "downloadmanager",
  "vanilla-javascript": "vanilla-js",
  "shadcn-ui": "shadcn",
  shadcnui: "shadcn",
  "model-context-protocol": "mcp",
  x: "twitter",
  "transferring-data": "transfer-data",
  "self-hosting": "self-hosted",
  // 'from' is noise — drop it
};
```

~15 lines, no new deps. Drops `from` (noise). This alone merges ~30 of the 348 into their canonical siblings. Mark the ceiling with `ponytail:`.

**Idea 1B — Canonical vocabulary at the source (the "do it properly" ceiling).** Instead of importing GitHub topics verbatim in `scripts/post.sh` / the weekly-post pipeline, define a canonical set of ~60 tags and map each repo's topics to the closest canonical tag at import time (rule-based or one LLM call per repo). Gives a stable, clean taxonomy forever — but it's heavier and belongs in the import pipeline, not the UI. Worth it only if 1A isn't enough. Defer with a `ponytail:` comment.

### 2. Better sorting — by frequency

**Idea 2A — Frequency desc, alpha tiebreak (ponytail pick).** Flip the sort in `getAllTags` from `a.localeCompare(b)` to `count(b) - count(a) || a.localeCompare(b)`. The counts already exist in `getStats().tagCounts` — either pass them into `getAllTags`, or (simpler) sort `allTags` in `App.tsx` where both `allTags` and `stats` already live. ~3 lines. Result: `typescript (10)`, `mcp (8)`, `ai-agent (7+)`, `open-source (7)` rise to the top; the count=1 long tail stays alphabetical among itself.

**Idea 2B — Two-tier sort / A-Z ⇄ By-use toggle (the ceiling).** Show top-N by frequency, then the rest alphabetical; or add a small toggle in the "Tags" header to switch between "A-Z" and "By use". Respects both browsing styles (scan-most-used vs find-by-name). More UI code — only worth it if users actually bounce between the two modes. Defer with `ponytail:`.

### 3. Progressive disclosure — don't show all 348 at once

**Idea 3A — Top-N + "Show all" expansion (ponytail pick).** Render only the top ~25 tags, then a `+323 more` button that expands the rest inline. After canonicalization (1A) + frequency sort (2A), ~25 tags cover most notes (80/20). Minimal: a `useState(showAllTags)` in `flaremo-explorer.tsx` + `tags.slice(0, 25)` when false. ~5 lines. The `25` is a `ponytail:` const.

**Idea 3B — Tag search/filter input (the ceiling).** Add a small text input above the tag cloud that filters the tag list live by substring. Scales to any tag count without a hard cap, and complements 3A (expand, then filter). Alternative form: a compact "top 10" preview that opens a popover/dialog with full search. More components — only worth it once tags grow beyond a few hundred or canonicalization can't keep up. Defer with `ponytail:`.

---

## Recommended path (lazy-first)

1A → 2A → 3A, in that order. Each is ~5-15 lines in 2 files (`memo.ts`, `flaremo-explorer.tsx`/`App.tsx`), each independently verifiable, and they compound: canonicalization makes frequency sort meaningful, frequency sort makes top-N disclosure useful. 1B/2B/3B are ceiling comments for later.
