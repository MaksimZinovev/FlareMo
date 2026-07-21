import { expect, test } from "@playwright/test";

const TAG_COUNT = 26;
const stamp = Date.now();

test.beforeAll(async ({ request }) => {
  for (let i = 0; i < TAG_COUNT; i++) {
    await request.post("/api/app/memos", {
      data: {
        content: `Tag panel test #tp${i}-${stamp}`,
        visibility: "private",
        payload: { tags: [`tp${i}-${stamp}`] },
      },
    });
  }
});

test("tag panel expands and collapses", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.getByRole("complementary");
  const expandBtn = sidebar.getByRole("button", { name: /more|更多/i });
  await expect(expandBtn).toBeVisible();

  const tagButtons = sidebar.locator("#tag-list > button:not([aria-controls])");
  const initialCount = await tagButtons.count();
  expect(initialCount).toBeGreaterThan(0);

  // Expand — more tags should appear.
  await expandBtn.click();
  const expandedCount = await tagButtons.count();
  expect(expandedCount).toBeGreaterThan(initialCount);

  // Collapse — back to initial count.
  const collapseBtn = sidebar.getByRole("button", { name: /show less|收起/i });
  await expect(collapseBtn).toBeVisible();
  await collapseBtn.click();
  const collapsedCount = await tagButtons.count();
  expect(collapsedCount).toBe(initialCount);
});
