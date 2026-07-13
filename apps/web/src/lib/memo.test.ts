import { describe, expect, it } from "vitest";

import type { Memo } from "@/api";

import {
  extractTags,
  getAllTags,
  getMemoTags,
  normalizeTag,
  normalizeTags,
} from "./memo";

function memoWith(content: string, tags?: string[]): Memo {
  return {
    name: "memos/x",
    content,
    payload: { tags },
  } as unknown as Memo;
}

describe("normalizeTag", () => {
  it("fixes the known typo", () => {
    expect(normalizeTag("typescirpt")).toBe("typescript");
  });

  it("merges plural to singular canonical (most-frequent wins)", () => {
    expect(normalizeTag("ai-agents")).toBe("ai-agent");
  });

  it("collapses acronym to most-used form, not hyphen-stripping", () => {
    expect(normalizeTag("model-context-protocol")).toBe("mcp");
  });

  it("drops denylisted noise", () => {
    expect(normalizeTag("from")).toBe("");
  });

  it("passes unknown tags through unchanged", () => {
    expect(normalizeTag("react")).toBe("react");
  });

  // ponytail: pinned tie — download-manager(1) vs downloadmanager(1), no-hyphen wins.
  it("pins the download-manager/downloadmanager tie to the no-hyphen form", () => {
    expect(normalizeTag("download-manager")).toBe("downloadmanager");
  });

  it("merges singular to plural canonical when plural is most-frequent", () => {
    expect(normalizeTag("skill")).toBe("skills");
  });
});

describe("normalizeTags", () => {
  it("merges and dedups variants to one canonical form", () => {
    expect(normalizeTags(["ai-agents", "ai-agent"])).toEqual(["ai-agent"]);
  });

  it("drops denylisted tags", () => {
    expect(normalizeTags(["from"])).toEqual([]);
  });

  it("returns empty for empty input", () => {
    expect(normalizeTags([])).toEqual([]);
  });

  it("passes unmatched tags through", () => {
    expect(normalizeTags(["react", "date-picker"])).toEqual([
      "react",
      "datepicker",
    ]);
  });

  // ponytail: pinned tie — open-graph(2) vs opengraph(2), no-hyphen wins per rule.
  it("pins the open-graph/opengraph tie to the no-hyphen form", () => {
    expect(normalizeTags(["open-graph", "opengraph"])).toEqual(["opengraph"]);
  });

  it("merges and dedups singular/plural (skill/skills)", () => {
    expect(normalizeTags(["skill", "skills"])).toEqual(["skills"]);
  });
});

describe("getMemoTags", () => {
  it("prefers payload.tags and normalizes them", () => {
    expect(
      getMemoTags(memoWith("#react #date-picker", ["ai-agents", "from"])),
    ).toEqual(["ai-agent"]);
  });

  it("falls back to extractTags when payload.tags is absent", () => {
    expect(getMemoTags(memoWith("#react #date-picker"))).toEqual([
      "react",
      "datepicker",
    ]);
  });

  it("keeps extractTags lossless (raw variants preserved at extraction)", () => {
    expect(extractTags("#date-picker #menubar")).toEqual([
      "date-picker",
      "menubar",
    ]);
  });
});

describe("getAllTags", () => {
  it("dedups across memos into a sorted canonical set", () => {
    const memos = [
      memoWith("#date-picker"),
      memoWith("#ignored", ["menubar"]),
      memoWith("#ai-agents"),
      memoWith("#dropped", ["from"]),
    ];
    expect(getAllTags(memos)).toEqual(["ai-agent", "datepicker", "menubar"]);
  });
});
