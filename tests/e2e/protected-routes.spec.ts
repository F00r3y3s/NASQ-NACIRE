import { expect, test } from "@playwright/test";

const protectedRoutes = [
  "/submit",
  "/account/challenges",
  "/admin/moderation",
] as const;

for (const route of protectedRoutes) {
  test(`anonymous visitors are redirected away from ${route}`, async ({
    page,
  }) => {
    await page.goto(route);

    await expect(page).toHaveURL(new RegExp(`/auth\\?mode=signin&next=${encodeURIComponent(route)}`));
    await expect(
      page.getByRole("heading", { name: /Sign In to Continue|Create Your Account/i }),
    ).toBeVisible();
  });
}

test.describe("mobile shell", () => {
  test.use({
    viewport: { height: 844, width: 390 },
  });

  test("public AI route stays usable at a mobile viewport", async ({ page }) => {
    await page.goto("/ai");

    await expect(
      page.getByRole("heading", { name: "AI Assistant" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Prompt" }),
    ).toBeVisible();
    await expect(
      page.locator("#main-content").getByRole("link", { name: "Browse Challenges" }),
    ).toBeVisible();
  });
});
