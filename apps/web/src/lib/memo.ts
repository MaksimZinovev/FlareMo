import type { Memo } from "@/api";

// ponytail: canonical form per cluster — most-frequent wins; no-hyphen on tie
// (hyphen duplicates only); shortest base form when counts absent. Ties pinned
// in memo.test.ts. Add entries here when new duplicates appear; one const, one place.
// ponytail: no case-folding — imported GitHub topics are lowercase, so the issue's
// data is covered. Add toLowerCase() if hand-typed mixed-case tags (#DatePicker) appear.
const TAG_ALIASES: Record<string, string> = {
  typescirpt: "typescript",
  "ai-agents": "ai-agent",
  "model-context-protocol": "mcp",
  "date-picker": "datepicker",
  "menu-bar": "menubar",
  "status-bar": "statusbar",
  "open-graph": "opengraph",
  "download-manager": "downloadmanager",
  "self-hosting": "self-hosted",
  "shadcn-ui": "shadcn",
  shadcnui: "shadcn",
  "vanilla-javascript": "vanilla-js",
  "transferring-data": "transfer-data",
  skill: "skills",
};

// ponytail: denylist kept to `from` for this PR — conservative, reversible.
// add when confirmed: other noise candidates noted here, not added yet.
const TAG_DENYLIST = new Set(["from"]);

export function getMemoResourceId(memo: Memo) {
  return memo.name.replace(/^memos\//, "");
}

export function extractTags(content: string) {
  const tags = new Set<string>();
  for (const match of content.matchAll(/(^|\s)#([\p{L}\p{N}_-]+)/gu)) {
    tags.add(match[2]);
  }
  return [...tags];
}

export function normalizeTag(tag: string): string {
  if (TAG_DENYLIST.has(tag)) return "";
  return TAG_ALIASES[tag] ?? tag;
}

export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map(normalizeTag).filter(Boolean))] as string[];
}

export function getMemoTags(memo: Memo): string[] {
  return normalizeTags(memo.payload.tags ?? extractTags(memo.content));
}

export function formatMemoTime(value: string, locale?: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getAllTags(memos: Memo[]) {
  const tags = new Set<string>();
  for (const memo of memos) {
    for (const tag of getMemoTags(memo)) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}
