import assert from "node:assert/strict";
import test from "node:test";

import { gameConfig } from "../src/game/config.ts";

test("game config keeps design and layout settings in one runtime entry", () => {
  assert.ok(gameConfig.design.width > 0);
  assert.ok(gameConfig.design.height > 0);

  if (gameConfig.layout.mode === "fullscreen") {
    assert.ok(["any", "portrait", "landscape"].includes(gameConfig.layout.orientation));
    return;
  }

  assert.equal("orientation" in gameConfig.layout, false);
});
