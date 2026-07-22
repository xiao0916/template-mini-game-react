import { expect, test } from "@playwright/test";

async function dragByMouse(page: import("@playwright/test").Page, sourceTestId: string, targetTestId: string) {
  const source = page.getByTestId(sourceTestId);
  const target = page.getByTestId(targetTestId);
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  if (!sourceBox || !targetBox) return;
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  await page.mouse.up();
}

async function dragCanvasByMouse(
  page: import("@playwright/test").Page,
  start = { x: 0.446, y: 0.65 },
  end = { x: 0.683, y: 0.65 },
) {
  const canvas = page.getByTestId("game-canvas").locator("canvas");
  await expect(page.getByTestId("game-canvas")).toHaveAttribute("data-canvas-ready", "true");
  const box = await canvas.boundingBox();

  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.move(box.x + box.width * start.x, box.y + box.height * start.y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * end.x, box.y + box.height * end.y, { steps: 8 });
  await page.mouse.up();
}

async function dragByTouch(locator: import("@playwright/test").Locator, start: { x: number; y: number }, end: { x: number; y: number }) {
  const pointer = { button: 0, buttons: 1, isPrimary: true, pointerId: 1, pointerType: "touch" };

  await locator.dispatchEvent("pointerdown", { ...pointer, clientX: start.x, clientY: start.y });
  await locator.dispatchEvent("pointermove", { ...pointer, clientX: end.x, clientY: end.y });
  await locator.dispatchEvent("pointerup", { ...pointer, buttons: 0, clientX: end.x, clientY: end.y });
}

async function dragCanvasByTouch(page: import("@playwright/test").Page, start: { x: number; y: number }, end: { x: number; y: number }) {
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", { touchPoints: [{ id: 1, x: start.x, y: start.y }], type: "touchStart" });
  await client.send("Input.dispatchTouchEvent", { touchPoints: [{ id: 1, x: end.x, y: end.y }], type: "touchMove" });
  await client.send("Input.dispatchTouchEvent", { touchPoints: [], type: "touchEnd" });
}

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
  await expect(page.getByTestId("loading-title")).toHaveText("资源同步中");
  await expect(page.getByTestId("loading-brief")).toBeVisible();
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
  await expect(page.getByTestId("game-canvas")).toHaveCount(0);
  await expect(page.getByTestId("h5-drag-stage")).toBeVisible();
  await expect(page.getByTestId("game-hud")).toBeVisible();
  await expect(page.getByTestId("game-canvas")).toHaveCount(0);
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
  await expect(page.getByTestId("game-canvas")).toHaveCount(0);
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

  const initialRootFontSize = await page.evaluate(() => document.documentElement.style.fontSize);
  expect(initialRootFontSize).toBe("37.5px");

  await page.setViewportSize({ height: 375, width: 667 });

  await expect(page.getByTestId("game-stage")).toHaveAttribute("data-rotation", "-90");
  await expect.poll(() => page.evaluate(() => document.documentElement.style.fontSize)).toBe(initialRootFontSize);
  await expect(page.getByTestId("game-canvas")).toHaveCount(0);
  await expect(page.getByTestId("h5-drag-stage")).toBeVisible();
  await context.close();
});

test("任务 HUD 在手机端保持信息可读和触控操作可见", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { height: 844, width: 390 },
  });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.getByTestId("mission-brief")).toBeVisible();
  await expect(page.getByTestId("mission-status")).toHaveText("资源已同步");

  for (const control of [page.getByTestId("audio-settings-control"), page.getByTestId("fullscreen-control")]) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect((box?.y ?? Number.POSITIVE_INFINITY) + (box?.height ?? 0)).toBeLessThanOrEqual(844);
  }

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
  await expect(page.getByTestId("game-hud")).toHaveClass(/inset-\[0px\]/);
  await expect(page.getByTestId("audio-settings-control")).toHaveClass(/px-\[18px\]/);

  await page.getByTestId("audio-settings-control").click();
  await expect(page.getByTestId("audio-settings-panel")).toHaveClass(/p-\[16px\]/);
  await expect(page.getByTestId("mission-status")).toHaveText("资源已同步");
  await expect(page.getByTestId("asset-readiness")).toHaveText("独立资源已就绪");
});

test("普通 H5 拖拽命中目标后可重置", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("drag-mode-h5").click();
  await dragByMouse(page, "h5-drag-item", "h5-drop-target");
  await expect(page.getByTestId("drag-status")).toHaveText("投放成功");

  await page.getByTestId("drag-reset-control").click();
  await expect(page.getByTestId("drag-status")).toHaveText("拖动信号核心至能量槽");
});

test("模式切换只挂载当前渲染舞台", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("h5-drag-stage")).toBeVisible();
  await expect(page.getByTestId("game-canvas")).toHaveCount(0);

  await page.getByTestId("drag-mode-canvas").click();
  await expect(page.getByTestId("h5-drag-stage")).toHaveCount(0);
  await expect(page.getByTestId("game-canvas").locator("canvas")).toHaveCount(1);
  await expect(page.getByTestId("game-canvas")).toHaveAttribute("data-canvas-ready", "true");
});

test("Canvas 拖拽成功后切换模式仍保留完成状态", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("drag-mode-canvas").click();
  await expect(page.getByTestId("drag-mode-canvas")).toHaveAttribute("aria-pressed", "true");
  await dragCanvasByMouse(page);
  await expect(page.getByTestId("drag-status")).toHaveText("投放成功");

  await page.getByTestId("drag-mode-h5").click();
  await page.getByTestId("drag-mode-canvas").click();
  await expect(page.getByTestId("drag-status")).toHaveText("投放成功");
});

test("普通 H5 成功后可从目标重新投放", async ({ page }) => {
  await page.goto("/");

  await dragByMouse(page, "h5-drag-item", "h5-drop-target");
  await expect(page.getByTestId("drag-status")).toHaveText("投放成功");

  const item = page.getByTestId("h5-drag-item");
  const stage = page.getByTestId("h5-drag-stage");
  const itemBox = await item.boundingBox();
  const stageBox = await stage.boundingBox();
  expect(itemBox).not.toBeNull();
  expect(stageBox).not.toBeNull();
  if (!itemBox || !stageBox) return;

  await page.mouse.move(itemBox.x + itemBox.width / 2, itemBox.y + itemBox.height / 2);
  await page.mouse.down();
  await expect(page.getByTestId("drag-status")).toHaveText("拖动信号核心至能量槽");
  await page.mouse.move(stageBox.x + stageBox.width * 0.42, stageBox.y + stageBox.height * 0.25, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("drag-status")).toHaveText("未命中目标，请重试");
});

test("Canvas 成功后可从目标重新投放", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("drag-mode-canvas").click();

  await dragCanvasByMouse(page);
  await expect(page.getByTestId("drag-status")).toHaveText("投放成功");

  await dragCanvasByMouse(page, { x: 0.683, y: 0.65 }, { x: 0.48, y: 0.32 });
  await expect(page.getByTestId("drag-status")).toHaveText("未命中目标，请重试");
});

test("Canvas 空白区域不会启动拖拽", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("drag-mode-canvas").click();
  const canvas = page.getByTestId("game-canvas").locator("canvas");
  await expect(page.getByTestId("game-canvas")).toHaveAttribute("data-canvas-ready", "true");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (box) await page.mouse.click(box.x + box.width * 0.05, box.y + box.height * 0.05);

  await expect(page.getByTestId("drag-status")).toHaveText("拖动信号核心至能量槽");
});

test("触摸 Pointer Event 可完成 H5 拖拽", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { height: 844, width: 390 } });
  const page = await context.newPage();
  await page.goto("/");

  const item = page.getByTestId("h5-drag-item");
  const target = page.getByTestId("h5-drop-target");
  const itemBox = await item.boundingBox();
  const targetBox = await target.boundingBox();
  expect(itemBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  if (itemBox && targetBox) {
    await dragByTouch(item, { x: itemBox.x + itemBox.width / 2, y: itemBox.y + itemBox.height / 2 }, { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 });
  }

  await expect(page.getByTestId("drag-status")).toHaveText("投放成功");
  await context.close();
});

test("触摸 Pointer Event 可完成 Canvas 拖拽", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { height: 720, width: 1280 } });
  const page = await context.newPage();
  await page.goto("/");

  await page.getByTestId("drag-mode-canvas").click();
  const canvas = page.getByTestId("game-canvas").locator("canvas");
  await expect(page.getByTestId("game-canvas")).toHaveAttribute("data-canvas-ready", "true");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    await dragCanvasByTouch(page, { x: box.x + box.width * 0.446, y: box.y + box.height * 0.65 }, { x: box.x + box.width * 0.683, y: box.y + box.height * 0.65 });
  }

  await expect(page.getByTestId("drag-status")).toHaveText("投放成功");
  await context.close();
});

test("横屏旋转舞台中 H5 元素跟随横向鼠标移动", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { height: 390, width: 844 },
  });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.getByTestId("game-stage")).toHaveAttribute("data-rotation", "-90");
  const item = page.getByTestId("h5-drag-item");
  const initialBox = await item.boundingBox();
  expect(initialBox).not.toBeNull();
  if (!initialBox) return;

  const start = { x: initialBox.x + initialBox.width / 2, y: initialBox.y + initialBox.height / 2 };
  const end = { x: start.x + 60, y: start.y };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });

  const movedBox = await item.boundingBox();
  expect(movedBox).not.toBeNull();
  if (movedBox) {
    const movedCenter = { x: movedBox.x + movedBox.width / 2, y: movedBox.y + movedBox.height / 2 };
    expect(Math.abs(movedCenter.x - end.x)).toBeLessThan(12);
    expect(Math.abs(movedCenter.y - end.y)).toBeLessThan(12);
  }

  await page.mouse.up();
  await context.close();
});

test("顺时针旋转舞台中 H5 元素跟随横向鼠标移动", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { height: 390, width: 844 },
  });
  const page = await context.newPage();
  await page.goto("/");

  await page.getByTestId("game-stage").evaluate((stage) => {
    stage.setAttribute("data-rotation", "90");
    (stage as HTMLElement).style.transform = "translate(-50%, -50%) rotate(90deg)";
  });
  const item = page.getByTestId("h5-drag-item");
  const initialBox = await item.boundingBox();
  expect(initialBox).not.toBeNull();
  if (!initialBox) return;

  const start = { x: initialBox.x + initialBox.width / 2, y: initialBox.y + initialBox.height / 2 };
  const end = { x: start.x + 60, y: start.y };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });

  const movedBox = await item.boundingBox();
  expect(movedBox).not.toBeNull();
  if (movedBox) {
    const movedCenter = { x: movedBox.x + movedBox.width / 2, y: movedBox.y + movedBox.height / 2 };
    expect(Math.abs(movedCenter.x - end.x)).toBeLessThan(12);
    expect(Math.abs(movedCenter.y - end.y)).toBeLessThan(12);
  }

  await page.mouse.up();
  await context.close();
});
