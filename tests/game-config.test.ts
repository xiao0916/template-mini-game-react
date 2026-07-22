import assert from "node:assert/strict";
import test from "node:test";

import { assertGameLayoutCssCompatibility, gameConfig } from "../src/game/config.ts";

test("game config keeps design and layout settings in one runtime entry", () => {
  assert.ok(gameConfig.design.width > 0);
  assert.ok(gameConfig.design.height > 0);

  if (gameConfig.layout.mode === "fullscreen") {
    assert.ok(["any", "portrait", "landscape"].includes(gameConfig.layout.orientation));
    return;
  }

  assert.equal("orientation" in gameConfig.layout, false);
});

test("fixed design mode requires px CSS units", () => {
  const layout = { mode: "fixed-design" } as const;

  assert.doesNotThrow(() => assertGameLayoutCssCompatibility(layout, "px"));
  assert.throws(() => assertGameLayoutCssCompatibility(layout, "rem"), /固定设计稿模式必须使用 px CSS 单位/);
  assert.throws(() => assertGameLayoutCssCompatibility(layout, "vw"), /固定设计稿模式必须使用 px CSS 单位/);
});
