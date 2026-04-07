import { expect, test } from "@playwright/test";

test("public discovery routes stay navigable from the shared shell", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Where Industry/i }),
  ).toBeVisible();

  await page.getByLabel("Browse Challenges").click();
  await expect(page).toHaveURL(/\/challenges$/);
  await expect(
    page.getByRole("heading", { name: "Browse Challenges" }),
  ).toBeVisible();

  await page.getByLabel("Solutions").click();
  await expect(page).toHaveURL(/\/solutions$/);
  await expect(
    page.getByRole("heading", { name: "Browse Solutions" }),
  ).toBeVisible();

  await page.getByLabel("AI Assistant").click();
  await expect(page).toHaveURL(/\/ai$/);
  await expect(
    page.getByRole("heading", { name: "AI Assistant" }),
  ).toBeVisible();

  await page.getByLabel("Analytics").click();
  await expect(page).toHaveURL(/\/analytics$/);
  await expect(
    page.getByRole("heading", { name: "Platform Analytics" }),
  ).toBeVisible();
});

test("the top-bar discovery search routes into challenge browse", async ({
  page,
}) => {
  await page.goto("/");

  const search = page.getByRole("searchbox", {
    name: "Search published challenges",
  });

  await search.fill("interoperability");
  await search.press("Enter");

  await expect(page).toHaveURL(/\/challenges\?q=interoperability/);
  await expect(
    page.getByRole("heading", { name: "Browse Challenges" }),
  ).toBeVisible();
});
