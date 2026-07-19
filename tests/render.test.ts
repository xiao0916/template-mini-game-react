import assert from "node:assert/strict";
import test from "node:test";

import { clampPixelRatio } from "../src/utils/render.ts";

test("clampPixelRatio keeps rendering density between one and two", () => {
  assert.equal(clampPixelRatio(0.75), 1);
  assert.equal(clampPixelRatio(1.5), 1.5);
  assert.equal(clampPixelRatio(3), 2);
});
