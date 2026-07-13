# P03 Q&A (teammate: agent)

**Q1 Canonical-form rule?** Plan's "strip hyphens" vs "most-used wins" conflict.
**A1:** Most-frequent-wins per cluster (live counts). No-hyphen as tiebreaker on ties. `ai-agents`→`ai-agent` (7>5). Pin ties in tests.

**Q2 Denylist scope?** Plan drops only `from`.
**A2:** `from`-only. Conservative, reversible. Note other candidates with `ponytail:` comments, don't add yet.
