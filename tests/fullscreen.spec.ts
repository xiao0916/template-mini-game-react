import { expect, test } from "@playwright/test";

test("resources finish loading before the game HUD is mounted", async ({ page }) => {
  let releaseResources!: () => void;
  const resourcesReleased = new Promise<void>((resolve) => {
    releaseResources = resolve;
  });

  await page.route("**/resources/**", async (route) => {
    await resourcesReleased;
    await route.continue();
  });
  await page.goto("/");

  await expect(page.getByTestId("game-loading")).toBeVisible();
  await expect(page.getByTestId("game-hud")).toHaveCount(0);

  releaseResources();
  await expect(page.getByTestId("loading-progress")).toHaveAttribute("aria-valuenow", "100");
  await page.waitForTimeout(400);
  await expect(page.getByTestId("game-hud")).toHaveCount(0);
  await expect(page.getByTestId("game-hud")).toBeVisible();
});

test("the game shell fills a desktop viewport without document overflow", async ({ page }) => {
  await page.goto("/");

  const dimensions = await page.getByTestId("game-shell").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      height: rect.height,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      width: rect.width,
    };
  });

  expect(dimensions).toMatchObject({
    height: dimensions.viewportHeight,
    scrollHeight: dimensions.viewportHeight,
    scrollWidth: dimensions.viewportWidth,
    width: dimensions.viewportWidth,
  });
  await expect(page.getByTestId("game-stage")).toHaveAttribute("data-rotation", "0");
  await expect(page.getByTestId("game-canvas").locator("canvas")).toHaveCount(1);
  await expect(page.getByTestId("game-hud")).toBeVisible();
});

test("the template keeps its full-bleed shell on phone viewports", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByTestId("game-shell")).toHaveCSS("height", "844px");
  await expect(page.getByTestId("game-hud")).toBeVisible();
});

test("portrait fullscreen mode rotates a touch landscape viewport", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { height: 390, width: 844 },
  });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.getByTestId("game-shell")).toHaveCSS("height", "390px");
  await expect(page.getByTestId("game-stage")).toHaveAttribute("data-rotation", "-90");
  await expect(page.getByTestId("game-canvas").locator("canvas")).toHaveCount(1);
  await expect(page.getByTestId("game-hud")).toBeVisible();
  await expect(page.getByTestId("fullscreen-control")).toBeVisible();
  await context.close();
});

test("portrait fullscreen mode rotates after a phone orientation switch", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { height: 667, width: 375 },
  });
  const page = await context.newPage();
  await page.goto("/");

  await page.setViewportSize({ height: 375, width: 667 });

  await expect(page.getByTestId("game-stage")).toHaveAttribute("data-rotation", "-90");
  await expect(page.getByTestId("game-canvas").locator("canvas")).toHaveCount(1);
  await context.close();
});

test("the fullscreen control enters and exits browser fullscreen", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("fullscreen-control").click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);

  await page.getByTestId("fullscreen-control").click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
});

test("音频设置面板提供静音和分类音量控制", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("audio-settings-control").click();

  await expect(page.getByTestId("audio-settings-panel")).toBeVisible();
  await expect(page.getByTestId("audio-mute-control")).toBeVisible();
  await expect(page.getByTestId("bgm-volume-control")).toHaveValue("0.5");
  await expect(page.getByTestId("sfx-volume-control")).toHaveValue("0.8");
});

test("HUD 使用 spriteAtlas.get 方法预览图集中的小图", async ({ page }) => {
  await page.goto("/");

  const demo = page.getByTestId("sprite-atlas-demo");
  await expect(demo).toBeVisible();
  await expect(demo).toHaveClass(/bg-no-repeat/);
  await expect(demo).toHaveCSS("background-image", /sprite-atlas_[a-f0-9]{12}\.png/);
  await expect(page.getByTestId("sprite-atlas-miss")).toContainText("未合并");
});
