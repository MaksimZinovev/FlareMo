# Memo Bold Rendering — Shaping Decisions (Grilling Output)

**Status:** All 3 decisions locked via grilling interview. Shared understanding confirmed by user.
**Symptom:** Memo content renders raw — `**bold**` shows literal asterisks instead of styled text.
**Source research:** GitHub-stars search (graphjin-stars DB) for lightweight react-markdown alternatives — none found among starred repos (only `remarkjs/remark` + `unifiedjs/unified`, both heavier plugin architectures). Conclusion: no third door; custom regex or react-markdown.

---

## Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Syntax scope | **Bold only (`**text**`).** No italic, links, code, lists, headers. YAGNI: extend only when a real need appears; at block-level scope we switch to react-markdown instead. |
| 2 | Placement | **One shared component** — `apps/web/src/components/memo-content.tsx`, used at both raw-text render sites (`memo-card.tsx:162`, `App.tsx:509`). Fix-once root cause; no drift between copies. |
| 3 | Match strictness | **Conservative regex** `/\*\*([^*\n]+)\*\*/g`: non-empty content, no newlines, no `*` inside markers. Accepted ceiling: `2 ** 3 = 8` will match (harmless in memos). No multiline bold. |

## Implementation contract

1. `<MemoContent text={...} />` splits text on the bold regex; matches become `<strong>` elements, rest stays plain text nodes. **Zero XSS surface** — React escapes all strings; we only ever create `<strong>` elements, never inject HTML.
2. Existing `whitespace-pre-wrap` styling preserved (component accepts/passes through at both call sites).
3. **Zero new dependencies.**
4. One runnable check: small vitest covering — bold converts, `*` alone untouched, math `2 ** 3 = 8` behavior documented, `<b>`-injection attempt stays escaped.
5. `// ponytail:` comment in component naming the ceiling + upgrade path: *regex covers bold only; if italic/links/lists are needed → replace with react-markdown, do not extend regexes.*

## Not used (rejected options)

- **react-markdown** (~90KB gz) — safe and robust, but YAGNI for bold-only scope; keep as the upgrade path.
- **marked / markdown-it / snarkdown** — lighter, but output HTML strings → `dangerouslySetInnerHTML` + sanitization burden on user-authored content. Risk without payoff.
- **micromark / remark** (starred) — react-markdown's own internals; would mean rebuilding react-markdown by hand.

## Open implementation notes (verify at build time)

- `App.tsx:509` context: confirm it's memo content (not a preview/stream variant) before swapping.
- `<strong>` inherits surrounding classes — confirm bold weight renders distinctly on both `text-base leading-7` (App) and `text-[15px]` (memo-card) themes.
- Composer (`memo-composer.tsx`) untouched — plain textarea stays, no preview. Out of scope.
