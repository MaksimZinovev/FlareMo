Ponytail review of PR #13 (top-N tag panel):

`flaremo-explorer.tsx:L7-9: shrink: 3-line TOP_N comment naming a speculative "Idea 3B" search input. 1 line — "top-N disclosure threshold; raise if long tail grows."`

`flaremo-explorer.tsx:L44-47: shrink: filter re-evaluates showAllTags for every tag. showAllTags ? tags : tags.filter((tag, i) => i < TOP_N || tag === activeTag) — same logic, no per-item branch when expanded.`

`memo.ts:L71: shrink: comment cites plan id "(3A)". Drop the parenthetical, keep "frequency desc with alpha tiebreak" — the why stands without the cross-reference.`

`memo.test.ts:L114-129: keep — two cases cover two contract behaviors (frequency order, alpha tiebreak); both are the ponytail minimum, not bloat.`

