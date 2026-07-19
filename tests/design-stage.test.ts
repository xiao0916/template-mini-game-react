import assert from "node:assert/strict";
import test from "node:test";

import { getContainedStageLayout, getDesignOrientation } from "../src/utils/design-stage.ts";

test("design dimensions determine the visual orientation", () => {
  assert.equal(getDesignOrientation({ height: 1080, width: 1920 }), "landscape");
  assert.equal(getDesignOrientation({ height: 1920, width: 1080 }), "portrait");
  assert.equal(getDesignOrientation({ height: 1080, width: 1080 }), "any");
});

test("a 16:9 design fits inside a square viewport with letterboxing", () => {
  const layout = getContainedStageLayout({
    design: { height: 1080, width: 1920 },
    devicePixelRatio: 1,
    height: 1000,
    width: 1000,
  });

  assert.equal(layout.height, 562.5);
  assert.ok(Math.abs(layout.width - 1000) < 0.000001);
  assert.equal(layout.scale, 0.5208333333333334);
  assert.equal(layout.pixelRatio, 0.5208333333333334);
});

test("a design stage keeps its ratio and caps scaled WebGL density", () => {
  const layout = getContainedStageLayout({
    design: { height: 1080, width: 1920 },
    devicePixelRatio: 2,
    height: 2160,
    width: 3840,
  });

  assert.deepEqual(layout, { height: 2160, pixelRatio: 2, scale: 2, width: 3840 });
});
