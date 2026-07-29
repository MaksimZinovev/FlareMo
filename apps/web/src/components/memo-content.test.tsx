import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MemoContent } from "./memo-content";

const html = (text: string) =>
  renderToStaticMarkup(<MemoContent text={text} />);

describe("MemoContent", () => {
  it("zero markers: plain text unchanged", () => {
    expect(html("just a memo")).toBe("just a memo");
  });

  it("minimum: one bold pair becomes <strong>", () => {
    expect(html("say **hi** now")).toBe("say <strong>hi</strong> now");
  });

  it("intermediate: multiple pairs all convert", () => {
    expect(html("a **b** c **d**")).toBe(
      "a <strong>b</strong> c <strong>d</strong>",
    );
  });

  it("lone asterisks stay literal", () => {
    expect(html("2 * 3 * 4")).toBe("2 * 3 * 4");
  });

  it("boundary: empty pair and multiline bold stay literal", () => {
    expect(html("****")).toBe("****");
    expect(html("**a\nb**")).toBe("**a\nb**");
  });

  it("documented ceiling: math between two pairs bolds the middle", () => {
    expect(html("2 ** 3 = 8 and 5 ** 2 = 25")).toBe(
      "2 <strong> 3 = 8 and 5 </strong> 2 = 25",
    );
  });

  it("failure/hostile: injected HTML stays escaped", () => {
    const out = html('<img src=x onerror=alert(1)> and "**<b>x</b>**"');
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
    expect(out).toContain("<strong>&lt;b&gt;x&lt;/b&gt;</strong>");
  });
});
