import assert from "node:assert/strict";
import test from "node:test";

import { getLayoutOrientation } from "../src/utils/game-layout.ts";

test("fullscreen mode does not rotate unless explicitly configured", () => {
  assert.equal(getLayoutOrientation({ fullscreenOrientation: "any", mode: "fullscreen" }), "any");
  assert.equal(getLayoutOrientation({ fullscreenOrientation: "portrait", mode: "fullscreen" }), "portrait");
});

test("fixed design mode derives orientation from its dimensions", () => {
  assert.equal(
    getLayoutOrientation({
      design: { height: 1080, width: 1920 },
      fullscreenOrientation: "any",
      mode: "fixed-design",
    }),
    "landscape",
  );
});
