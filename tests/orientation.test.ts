import assert from "node:assert/strict";
import test from "node:test";

import { getOrientationStageLayout } from "../src/utils/orientation.ts";

test("portrait touch viewport keeps its native stage", () => {
  const layout = getOrientationStageLayout({
    height: 844,
    isTouchDevice: true,
    target: "portrait",
    width: 390,
  });

  assert.deepEqual(layout, {
    height: "100dvh",
    rotation: 0,
    shouldRotate: false,
    safeArea: { bottom: "bottom", left: "left", right: "right", top: "top" },
    width: "100vw",
  });
});

test("portrait target rotates a landscape touch viewport and swaps stage dimensions", () => {
  const layout = getOrientationStageLayout({
    height: 390,
    isTouchDevice: true,
    target: "portrait",
    width: 844,
  });

  assert.equal(layout.shouldRotate, true);
  assert.equal(layout.width, "100dvh");
  assert.equal(layout.height, "100vw");
  assert.equal(layout.rotation, 90);
  assert.deepEqual(layout.safeArea, { bottom: "left", left: "top", right: "bottom", top: "right" });
});

test("landscape target rotates a portrait touch viewport", () => {
  const layout = getOrientationStageLayout({
    height: 844,
    isTouchDevice: true,
    target: "landscape",
    width: 390,
  });

  assert.equal(layout.shouldRotate, true);
  assert.equal(layout.width, "100dvh");
  assert.equal(layout.height, "100vw");
  assert.equal(layout.rotation, 90);
});

test("auto rotation follows screen angle and falls back to clockwise", () => {
  const input = { height: 390, isTouchDevice: true, target: "portrait" as const, width: 844 };

  assert.equal(getOrientationStageLayout({ ...input, screenAngle: 90 }).rotation, -90);
  assert.equal(getOrientationStageLayout({ ...input, screenAngle: 270 }).rotation, 90);
  assert.equal(getOrientationStageLayout(input).rotation, 90);
});
